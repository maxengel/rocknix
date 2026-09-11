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
- **Sync at startup**, run by EmulationStation with the toggle on and shown
  on the same progress card as the game-exit sync (since 2026-09-09, #94;
  it used to run headless from the boot autostart, waiting for the network
  and then saying nothing).
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

## The settings phase is one item, named SETTINGS (2026-09-09)

- `cloud_backup` and `cloud_restore` announce the settings-archive phase as
  `>>> unit SETTINGS||`; it read `SETTINGS BACKUP`. EmulationStation now
  announces the same label itself before `backuptool` writes the archive, and
  the transfer page folds a repeated identical label into one item, so the
  archive's write and its transfer read as one item, named with the D-UI-022
  tier word (#95). The saves phase is still `>>> unit SAVES||`; the content
  scripts' `>>> unit <system>|i|n` are unchanged.
- **The scripts can announce units the picker did not list.** Under
  `--selected`, `cloud_content_backup` adds `bios` whenever the tier moves ROMs
  and the device has a BIOS folder, and drops a selected system this device has
  no content for; `cloud_content_restore --selected` adds `bios` whenever the
  cloud has one. Game content is never a unit of its own — the scraper's
  folders and the game list move inside the system's unit. So the page's
  ITEM i OF n starts from the picker's count and is refined from the scripts'
  own `n` (#95).
- **Every announced `n` is the number of announcements the run makes.** The
  match flow (`cloud_content_restore --match --apply`) numbered its items
  across every chosen system but announced only the ones with work, so a run
  over three systems ended on ITEM 2 OF 3. It now announces every chosen
  system, before its own dry run, and says "Nothing to remove from X: it
  already matches the cloud" for one with nothing to do — that is the item's
  outcome, not a reason to hide it, and counting the work first would have
  held the page on WORKING with no item through one dry run per system. The
  `--selected` loops in both content scripts announce every unit they were
  built from and skip none. `tools/cloud-round-trip` now checks the protocol
  on each of those three runs — one `n`, equal to the number of markers, `i`
  running 1..n — and runs a match with a system that exists nowhere to see it
  announced.
- Verified: the label by grep over the tree (nothing in `tools/` or `docs/`
  parsed the old one); the page's behaviour is the EmulationStation half of
  #95, checked on the VM with it.

## The startup sync is EmulationStation's, and visible (2026-09-09)

- `autostart/102-cloud-saves` no longer runs the boot pair. With SYNC SAVES
  DURING STARTUP on, EmulationStation runs `cloud_restore --yes --method=copy
  --update --saves-only` and then `cloud_backup` the same way, through the
  progress card the game-exit sync uses, so a player sees it run and how it
  ended, and a game cannot launch alongside it (the gate that already ships,
  D-CLOUD-038). The autostart's headless copy — a ping loop against
  `google.com`, then both scripts with their output discarded — left no sign on
  screen and sat outside that gate; kept, it would only have raced the visible
  run for the transfer lock and reported SKIPPED into `/dev/null` (#94).
- The `cloud_capture --full` pass still runs from the autostart, gated on a
  cloud-saves toggle and detached, exactly as before (D-CLOUD-064).
- **Upgrade**: nothing to migrate. The toggle key is unchanged; a device with it
  on gets the visible sync at its next boot. What changes for a player: the
  sync starts a few seconds later (after EmulationStation is up, when the
  network is likelier to be there), and it shows.
- Verified: the autostart statically (CAP10 (d) still finds the `--full` gate);
  the EmulationStation half is #94's, checked on the VM with it.

## `last-capture` keeps one line per mode (2026-09-09)

- `cloud_capture`'s durable stamp `/storage/.cache/cloud_sync/last-capture`
  held one line, rewritten on every run, so the boot `--full` pass wrote over
  the record of the last game exit (RG SP, 2026-09-09: an exit at 08:19Z,
  `full - emu-exit=? -/-` in its place after the evening's boot). It now holds
  **one line per mode** — `exit`, `rescan`, `full`, `retire`, and `usage` for
  a bad invocation — each replaced only by a run of the same mode
  (D-CLOUD-070, #94). The fields are unchanged; a reader picks its line by the
  third field with any `!card` marker stripped, and finds the latest run of
  any mode by the largest first field. The file is assembled in a temp file
  and moved into place, so a reader never sees a torn stamp, and lines with
  fewer than three fields are dropped, so it can never grow past one line per
  mode.
- **Upgrade**: a stamp from an older build is a single line and is read as its
  mode's line; the first run of another mode adds a line beside it rather than
  replacing it. Nothing to migrate.
- Verified: `tools/cloud-capture-stamp-test` lifts `finish()` out of the
  script and runs the sequence with no device — 15 PASS against this build, 8
  FAIL against the previous `finish()` (one line, overwritten); the harness's
  CAP12 asserts the same on the VM (not yet run at the time of writing).

## The VM runs at a handheld's panel size (2026-09-09)

- `generic-x64-vm run --res WxH` (and `qemu-args`) appends `xres=W,yres=H` to
  the virtio-gpu device — `virtio-gpu-gl-pci` on a desktop, `virtio-gpu-pci`
  under `--headless` — so the guest's preferred mode is the panel's and
  EmulationStation renders at it. Without the flag the guest is QEMU's
  1280×800 as before; `--res 640` and `--res 0x480` are refused before QEMU
  starts (#97).
- Consequence for QA (D-QA-007): the "640×480 look" boxes on #85, #94 and
  #95 are VM checks first and a handheld confirmation second;
  `tools/vm-visual-qa` and the walks need no change, a `screendump` comes back
  at the guest's size.
- Verified: `qemu-args --headless --res 640x480` prints `-device
  virtio-gpu-pci,xres=640,yres=480`; a boot at that size is the next VM cycle's.

## A phase failure leaves the scripts as 1, never as rclone's 3 or 4 (#99)

`cloud_backup`, `cloud_restore`, `cloud_content_backup` and `cloud_content_restore`
exit 3 when another cloud sync holds the lock and 4 when there is no network,
and EmulationStation names those (`SKIPPED - ANOTHER CLOUD SYNC IS RUNNING`,
`SKIPPED - NO NETWORK CONNECTION`). A failed phase used to carry rclone's own
exit code up to the script's exit, and rclone's 3 is "directory not found":
on the VM a restore against a cloud whose Saves folder did not exist yet ended
`SKIPPED - ANOTHER CLOUD SYNC IS RUNNING` over `5 FILES RESTORED`. Both
sentinels are raised by plain exits before any phase runs, so a 3 or 4 that
reaches the final exit is rclone's and now leaves as 1 (a failure), with a WARN
line in the log. The proper fix -- sentinel codes rclone never uses, changed in
the scripts, EmulationStation, the autostart and the harness together -- is
#99. Harness: the single-device suite now restores against the empty endpoint
first and asserts exit 1. Player-facing: a run that could not reach a folder
says FAILED, not that a sync was running.

## The transfer page names the item first; the picker says what is not yet on the far side (2026-09-09)

On BACKING UP TO THE CLOUD and RESTORING FROM THE CLOUD the four rows under the
title now read, in every phase alike: the item (`BIOS`, `NES`, `SAVES`,
`SETTINGS`), `ITEM i OF n` counted across the whole run rather than per script,
what it is doing on that item (`TRANSFERRING <file>` with its progress where the
line has room, `CHECKING 120 OF 400 FILES`, and `WRITING THE SETTINGS
ARCHIVE...` while backuptool works, where the settings item used to sit on
PREPARING... over a spinner), and that item's files and bytes. The bar, elapsed
time, notice and the done page are as before (#95, D-UI-026). EmulationStation
announces the settings item before backuptool runs and emits a `>>> doing
archive` marker; the scripts' label for that phase is `SETTINGS` to match. The
page counts items itself: a repeated identical label is the same item, `n`
starts from the picker's selection plus the saves and settings phases and is
refined from the content script's own count (BIOS coming along on a restore
turned `ITEM 1 OF 3` into `ITEM 3 OF 4`), and never reads `i > n`. Every size
and speed rclone prints is re-rendered at `sizeLabel`'s precision (`16.5 MB OF
16.5 MB · 100% · 520 KB/S`), which is what lets row 4 fit a 640×480 panel; and
`LEFT` is finally appended to the time left, which a four-byte separator had
kept off the page since the row existed.

On CONTENT TO BACK UP / CONTENT TO RESTORE each system's line quantifies only
what this run would move -- `2.9 MB NOT YET IN YOUR CLOUD · 1 FILE`, or `NOTHING
NEW TO BACK UP`; the restore page reads `NOT YET ON THIS DEVICE` / `NOTHING NEW
TO RESTORE` -- with no total anywhere on the row, since a size beside a system
read as an amount about to move (#85 item 1 second pass, D-UI-027).

Verified on the GENERIC_X64 VM at 1280×800 and 640×480 (frames under
`x64-all-20260909-d8bc358248/shots/`); ES `test/qa-integration` `41b7b8f10`;
ships in H700 `ef43f2ce4b`. rocknix.org: the cloud-sync page still owes the
whole native flow (#42).

## `wait_lock` clears a stale settings lock and names a long holder (#98)

Every `get_setting` and `set_setting` on the device, and with them
`runemu.sh`, `backuptool`, the autostarts and the cloud scripts, take
`/tmp/.system.cfg.lock` through `wait_lock()` in `001-functions`. #90 made
*release* reliable for a holder that ends normally; a holder that is
SIGKILLed, OOM-killed or dies with its terminal cannot run its trap, and
`wait_lock` retried the create every second forever without reading the pid
the file carries. On the VM a File Manager chain killed from outside left the
file behind and one `set_setting cloudsaves.startup 1` took 4 min 43 s to
return, stalling the `systemctl restart emustation` behind it; nothing named
the holder, because nothing read it.

- When the create fails, `wait_lock` now reads the pid in the file. A pid
  `kill -0` rejects, an empty file or one that is not a number is stale: the
  file is removed -- only if a re-read just before the `rm` still shows the
  same content, which shrinks the race with a holder that released and a
  newcomer that took it in between, without closing it -- one line goes to
  the system log (`logger -t wait_lock "removed stale lock ... held by pid
  N"`; stderr if an image ever lacks `logger`), and the create is retried at
  once. A live holder is waited on as before and never displaced; after 30
  polls of the same holder its pid is logged once, so `journalctl -t
  wait_lock` names what to look at. The noclobber create and the #90 trap are
  untouched, and nothing in it is bash-only.
- Residuals, accepted: a dead holder's pid reused by an unrelated live
  process is waited on until that process exits (the 30 s line names it); a
  holder SIGKILLed but not yet reaped is a zombie, which `kill -0` counts as
  alive until its parent collects it; and a holder's own create is an empty
  file for a few microseconds between open and write, which the re-read is
  the only thing standing between and a theft.
- **Upgrade**: nothing to migrate. `/tmp` is tmpfs and an update reboots, so
  no stale lock crosses over; the first build to carry this clears one the
  moment any caller meets it.
- Verified: `tools/wait-lock-test` (fork-only, registered in the pre-push
  guard) lifts the function out of any copy of `001-functions` and runs six
  cases in a fresh bash under `timeout` -- a dead pid, a releasing live holder
  (never stolen, waited out), a holder SIGKILLed mid-wait (taken within a poll,
  logged with its pid), an empty file with no `logger` on PATH, garbage
  content, and the 30 s line exactly once. Against `next`'s copy it fails 13
  checks, every stale case hanging to the timeout; against this one all 21
  pass. The VM and the handhelds see it in the next build.

## The lock and no-network sentinels are 75 and 69, codes rclone cannot return (#99)

The stopgap above (`28cc392b41`) remapped a 3 or 4 reaching the four scripts'
final exit to 1. The proper fix moves the sentinels out of rclone's range:
`take_cloud_lock` exits **75** (`EX_TEMPFAIL`, `EXIT_LOCK_HELD`) in
`cloud_backup`, `cloud_restore`, `cloud_content_backup` and
`cloud_content_restore`, and `cloud_backup`'s `check_network_link` exits **69**
(`EX_UNAVAILABLE`, `EXIT_NO_NETWORK`). Both come from `sysexits.h`, sit above
everything rclone returns (0-9) and below the `128+signal` range, and are
defined once near the top of each script and used by name. The messages
beside them are unchanged.

- The remap is gone from all four scripts (`clean_exit`'s `case` in the two
  saves scripts, the `case "${STATUS}"` before the final `exit` in the two
  content scripts), so a phase failure passes rclone's code through as it did
  before the stopgap -- and can no longer collide. `report_rclone_error` still
  names rclone's 3 and 4 with rclone's meanings, which is what they now
  always are.
- Readers changed together: the four scripts; EmulationStation's exit-code
  maps (`GuiCloudTransfer::update`, `ThreadedCloudSync::run`) and its own
  startup-sync command, which exits 69 where it exited 4 -- the ES half, in
  the ES repo, done in parallel; `tools/cloud-round-trip`, whose lock fixture
  expects 75, whose no-route fixture expects 69, and whose restore against
  the empty endpoint now asserts an exit that is not 0, 75 or 69 ("fails with
  its own code, not as a sentinel"); `rclone-cloud-sync.md` and
  `docs/es-menu-map.md`. `autostart/102-cloud-saves` never named a code, and
  the harness's `WRITERS`/`BOOT_PAIR` name commands, not codes -- nothing to
  change in either. The register rows and blindspot 33 keep the history as
  written.
- **Upgrade**: scripts and EmulationStation ship in one image, so no device
  ever runs one side new and the other old; the codes change together at the
  reboot that applies the update. The one mixed state is a development one:
  scripts staged onto a running device by hand ahead of an image, as the QA
  protocol does, against an ES that still reads 3 and 4 -- a lock skip then
  shows FAILED rather than SKIPPED, and the converse for the other order.
  Stamps: the scripts write no last-run stamp for a sentinel, so no
  `last-backup`/`last-restore` anywhere holds a 3 or 4 that meant "skipped";
  one holding rclone's 3 or 4 from a build before the stopgap was a real
  failure and reads as FAILED, correctly. The ES-written `last-sync-<cause>`
  stamps (D-CLOUD-072) can hold an rc of 3 or 4 from a sync the previous build
  skipped; how the new ES renders those until the next sync replaces the
  stamp is the ES side's to decide.
- Still open from #99: whether a missing remote Saves folder on a device that
  has never backed up is a warning rather than a failure (a misconfigured
  folder name must still fail loudly).
- Verified: on the host, `take_cloud_lock` lifted out of `cloud_backup` and
  `cloud_content_restore` exits 75 with the lock held by another shell, and
  `check_network_link` exits 69 with an `ip` that lists no routes and 0 with
  the host's; `bash -n` on the four scripts; the harness compiles and lists.
  The single-device suite on the VM, and the page's SKIPPED/FAILED wording
  against the new ES, are the next build's checks.

## Every rclone run is bounded, and a run the network took away says so (#103)

The RG SP left the LAN a minute into its first startup sync on `d574edf975`,
and the card sat at `COMPARING SAVE FILES WITH THE CLOUD 113 / 113` with the
launch gate held (#101, #102). The scripts' *probes* had always run with
`--contimeout 10s --timeout 20s --low-level-retries 1 --retries 1`; every
real `rclone copy`/`sync`/`lsf` ran with `RCLONEOPTS`, which sets none of
those, so rclone's defaults applied -- a 60 s connect timeout, a 5 minute
idle timeout, 10 low-level retries, 3 whole-run retries -- and a link that
dropped mid-run held the process for well over ten minutes.

- **The bound.** A new config option, `RCLONE_NET_OPTS`, in both
  `cloud_sync.conf` and `cloud_sync.conf.defaults` (`DEFAULT_RCLONE_NET_OPTS`),
  shipped as `--contimeout 15s --timeout 30s --low-level-retries 2 --retries 1`.
  `--timeout` is rclone's *idle* timeout -- it fires when no byte has moved for
  that long, so a 1.4 GiB content restore that is moving is unaffected; it is
  sized for a stalled link, not a slow one. The retry counts are low on
  purpose: a run that fails on a transient blip is retried by the exit sync or
  the next boot, and a manual run is rerun by the player, while ten low-level
  retries on a dead link is what produced #102. On a dead link one operation
  now gives up in about a minute (two 30 s stalls, or two 15 s connects) and
  the run is not repeated. The bound is per operation: a run with several
  operations still outstanding when the link goes ends after however many of
  those rclone runs concurrently, which the LINK fixtures measure.
- **Where it goes.** Every rclone command in `cloud_backup`, `cloud_restore`,
  `cloud_content_backup` and `cloud_content_restore` that opens a socket
  carries `"${RCLONE_NET_OPTS_ARRAY[@]}"` on its command line -- the saves
  transfers (`execute_rclone_with_error_handling`), the settings archive's
  `mkdir`, `copyto`, `device.json`, retention `lsf`/`deletefile` and its
  post-upload `size` check, restore's `lsd`/`ls`/`lsf`/`copyto`, the `rmdirs`
  tidy, and in the content scripts the transfer loops and their gamelist
  passes, `exists_remote`, `resolve_src`, `sizes_under`, `cloud_root_populated`,
  the match flow's `lsf`, dry-run `sync` and real `sync`, `--scan`'s two
  listings and `--list`'s three. It goes **after** `RCLONEOPTS`, so a timeout
  somebody once put there does not outrank it. The probes keep their own
  tighter bound, now the one array `RCLONE_PROBE_OPTS`. Not carried, because
  they open no socket: `rclone listremotes` (reads `rclone.conf`), `rclone
  help`, and the match flow's `rclone size`/`rclone delete` on a local folder.
- **A missing line is not a switched-off guard.** Each script falls back to
  the same shipped values when `RCLONE_NET_OPTS` is unset or blank
  (`RCLONE_NET_OPTS_FALLBACK`, kept equal to the default), because the content
  scripts read the config without running `cloud_sync_helper` and a device's
  first run after the update may reach one before the helper has.
- **A failed run says why.** After any transfer or listing fails,
  `network_lost_during_run` (saves scripts) / `network_gone` (content scripts)
  asks the three questions `check_internet` asks before a run: is there a
  default route; does the remote answer a bounded probe now; does anything
  answer at all. **No route, or a route nothing gets through, exits 69**
  (`EXIT_NO_NETWORK`) -- through `clean_exit`, so `last-backup`,
  `last-restore`, `last-settings-*` and `last-content-*` record a run that did
  not complete (never 0: a 0 would let the next `--recent` pass skip what this
  one never sent). No second phase or further unit is attempted against the
  same dead link. The remote answering again, or the internet answering while
  the remote does not, is rclone's failure to report and **rclone's own code
  passes through unchanged** -- "no network" is not what happened, and saying
  so would be the phantom sentinel #99 removed. EmulationStation already names
  69 on the card (`SKIPPED - NO NETWORK CONNECTION`) and on the rows
  (`SKIPPED, NO NETWORK`); the ES side may want a wording for a run that was
  cut rather than never started.
- **The upload marker was already right.** `settings-backup.uploaded` is
  written only after `rclone size` confirms the cloud holds a file of the
  bytes sent; a `copyto` that fails, or a size check that gets nothing back,
  leaves it unwritten and the next run sends the archive again. What was
  wrong was the **exit code**: both saves scripts exited with the saves
  phase's status alone, so a failed settings upload exited 0, and under
  `--system-only` -- where the saves phase is skipped and reports 0 -- every
  failure did: the card said `COMPLETED SUCCESSFULLY` and
  `last-settings-backup` recorded 0 for an archive that never arrived. A run
  now exits 0 only when every phase it ran did, else with the first failing
  phase's code.
- **Before a run, two more honest answers.** `check_internet`'s "not connected
  to the internet" branch (route present, remote and 1.1.1.1/8.8.8.8 all
  silent) exits 69 without a stamp, as `check_network_link` does, where it
  exited 1 and read as FAILED; and `cloud_restore` now runs
  `check_network_link` first, as `cloud_backup` has since #99 -- an offline
  restore is a skip, not a failure. `cloud_content_restore --match` refuses
  as before when the content root lists nothing, and exits 69 when the reason
  is the network; `--scan` exits 69 with no lines rather than handing the page
  an empty cloud that would read as "nothing of yours is in the cloud yet"
  (the page ignores the code today; a future reader can use it).
- **`cloud_net_ready [--wait N]`** (new, installed by `package.mk`): what the
  startup sync should ask before it runs the pair, in place of `ping
  google.com`. Exit 0 once NetworkManager reports `connected` (and
  `CONNECTIVITY` `full` -- or `unknown`, on a build that checks and has not
  yet -- the image's NetworkManager is built `-Dconcheck=false` and reports
  `full` behind a default route without probing anything) **and** that has
  held for a 3 s grace with a default route throughout; exit 69 at once when
  there is no default route (D-CLOUD-072: no route means no wait); otherwise
  poll each second up to N (default 60, plus at most the grace) and exit 69 on
  expiry. Prints `>>> doing network` once when it starts waiting, the grace
  included, so the card reads `WAITING FOR THE NETWORK...` and a launch during
  it cancels the sync. `nmcli` is bounded by `timeout 5`; where it is absent
  or NetworkManager does not answer, the route test plus a carrier on some
  interface stands in and the log says so. Time from `/proc/uptime`, not the
  wall clock, which NTP moves at boot. POSIX `sh`; runs under the image's
  busybox `ash`. The ES-side command that calls it is the ES repo's change.
- **Upgrade.** `cloud_sync_helper` appends `RCLONE_NET_OPTS` to an existing
  `cloud_sync.conf` on the first run after the update (`post-update` runs it,
  and so does every `cloud_backup`/`cloud_restore`), leaving customised keys
  alone; a fresh device gets it from the defaults. Until the helper has run,
  the in-script fallback gives the same bound. Nothing else changes shape: no
  stamp format, no marker, no menu entry. The one visible difference on an
  upgraded device is a run that used to end FAILED after ten minutes now
  ending `SKIPPED - NO NETWORK CONNECTION` within about one.
- **Verified on the host** (the VM's LINK fixtures are the harness agent's, for
  the next image): `bash -n` on the four scripts under the host's bash and the
  image's `bash 5.3`; `tools/pkgcheck` clean; a grep over the four scripts
  finds no rclone invocation without `NET_OPTS`/`PROBE_OPTS` beyond the
  socket-less ones named above; `cloud_sync_helper`, pointed at a sandbox
  holding the previous build's `cloud_sync.conf`, appends the key once and is
  idempotent; the fallback equals the default in all four scripts; the lifted
  `network_lost_during_run`/`network_gone`, with stubbed `ip`/`rclone`/`ping`,
  give 69/69 for no route and nothing-answers and pass-through for
  remote-answers and internet-only, in both saves scripts and both content
  scripts; `cloud_net_ready` with stubbed `nmcli`/`ip`, under `sh` and the
  image's busybox `ash`: connected at once → 0 after the grace, no route → 69
  in 0.0 s, connecting then connected at 5 s → 0 after the grace, never
  settled → 69 at the deadline, `connected`+`portal` → 69 at the deadline, no
  `nmcli` → 0 by route and carrier, a flap mid-grace restarts the grace,
  `--wait abc` → 64, and the marker printed exactly once whenever it waited,
  with nothing on stderr.

## The interface never waits on the network; a launch cancels an automatic sync (2026-09-09)

EmulationStation's interface thread made network-dependent calls in a dozen
places, the worst of them on pages a player opens when the network is already
misbehaving: NETWORK SETTINGS pinged three times and read the address before it
drew (six seconds routed-but-offline, unbounded with a wedged driver), the
Wi-Fi list ran a rescan in its constructor, ENABLE WI-FI and the save-on-close
ran `wifictl connect` for up to two minutes with the screen frozen, the CLOUD
page probed the remote for the legacy-layout check, and the wizard's done step
seeded eight cloud folders inside a callback. All of those now run on a worker
or behind a spinner and are time-boxed (`timeout` around every shell call);
NETWORK SETTINGS opens at once with `CHECKING...` and fills in; the TIDY row on
CLOUD appears at the end of the page once the check answers, on legacy-layout
devices only. Still synchronous but bounded: the adapter and channel queries
that build the Wi-Fi option rows (10 s / 5 s) and `cloud_setup --info` (10 s).
Found and left for its own change: the RetroAchievements account test in that
page's save function is an HTTPS request with no total timeout (#103, D-CLOUD-075).

The startup sync now waits for a *settled* connection instead of the first
`ping google.com`: `cloud_net_ready --wait 60` exits 0 once NetworkManager has
reported `connected` for three seconds with a default route, 69 at once with no
route, 69 at the deadline; the card reads `WAITING FOR THE NETWORK...` from its
one marker line. An image without the helper falls back to the old probe.

**A game launch cancels an automatic saves sync in any phase** — startup or
exit; a sync the player started by hand is still refused (`YOUR SAVES ARE
SYNCING WITH THE CLOUD...`). The kill completes before the game starts: SIGTERM
to the sync's process group, a wait of up to two seconds for the run to end,
SIGKILL at one and a half, because rclone renames a temporary file into place
at the end of each copy and a rename landing on a save the game has just
written would lose it. The card ends `SKIPPED - A GAME WAS STARTED` and the
stamp records the stop. Every command `ThreadedCloudSync` runs is now wrapped
in `setsid` with its pid announced, so the exit sync can be signalled too — it
used to run bare (#101, D-CLOUD-076). ES `test/qa-integration` `e46093354`.

## The harness cuts the link mid-run: LINK1-LINK7 (2026-09-10)

`tools/cloud-round-trip` gained a fault-injection family. Each cell starts a
cloud operation detached over SSH, watches its output for the phase it wants
(compare, transfer, mid-upload, mid-scan), cuts the guest's link over the
serial console, restores it forty seconds later, and asserts: the run ends
within ninety seconds with the no-network code or a plain failure, never 0 and
never the lock sentinel; the receiving side holds no `*.partial` and every
file present is whole by content; the settings-upload marker is untouched when
the archive did not complete; the stamps record the failure; a plain re-run
completes. Seven cells: saves restore (compare), saves backup, content backup,
content restore, settings archive upload, the exit sync, the picker scan.
Against `d574edf975` every cell FAILED -- the unbounded runs rode the outage
out and reported 0 some 46-81 s after the cut (the frozen-card shape needs a
longer outage: at 120 s they overshoot the bound at 130-156 s); against
`12fd47e341` every cell PASSED, each run ending about 30 s after the cut with
exit 69 and a stamp of 69. Off by default; `--link` or `--only LINKn` runs
them, and they skip with a line when no serial socket is given, which is every
handheld. The one thing the WebDAV guest cannot prove is same-name re-upload
idempotency for the settings archive (a slirp/`rclone serve` lock artifact,
`423 Locked`); that criterion wants MinIO or a device (#103).

## EmulationStation keeps the last good settings file and speaks the outcome vocabulary (2026-09-10)

Both settings files EmulationStation writes -- `es_settings.cfg` and
`system.cfg` -- now go through a temporary file, an fsync, and a rename (the
system file used to write a good temporary and then copy it over the live file
in place; the ES settings file was rewritten in place), under the same
`/tmp/.system.cfg.lock` the shell's `set_setting` takes. After every good save
and every good parse at startup the file is copied to `<name>.backup`, the one
last-known-good record (D-CLOUD-079). A startup that finds the live file
missing, empty, or unparsable loads the backup, writes it back, and says once
`YOUR SETTINGS FILE WAS DAMAGED. THE LAST GOOD COPY WAS RESTORED.`; defaults are
the last resort, never written over a damaged file before that attempt. A host
kill test (500 rounds, SIGKILL at random points) left the live file and the
backup complete every time.

The sync card, the transfer page, and the rows under the toggles speak
D-UI-028: `COMPLETED`, `COMPLETED WITH GAPS - <what>`, `COULDN'T FINISH -
<why>`, `SKIPPED - <reason>`. The why comes from a `>>> why <sentence>` line the
scripts print at the failure point, else from a small table; the card's action
row carries what is in place and how to recover (`TRY AGAIN: GAME SETTINGS >
BACK UP SAVES TO THE CLOUD`, `IT RUNS AGAIN WHEN YOU EXIT A GAME`, ...), the
card's token filter is gone, and `FAILED - SEE /var/log/cloud_sync.log` with it.
The transfer page learns each tier's exit from a `>>> tier <label>|<rc>` line
the run composition now echoes after every part, so a run with one failed part
reads `COMPLETED WITH GAPS`, names the items that did not finish and why, says
what is in place, and offers `A TRY AGAIN  B CLOSE`, which re-runs the same
command; game lists are rescanned when any tier succeeded. A match cut after
deletions reads the same way over `N FILES WERE REMOVED FROM THIS DEVICE. YOUR
CLOUD STILL HAS THEM.` Stamps gain a third field, the why token, additively.
The picker reads the scan's exit code (`COULDN'T REACH YOUR CLOUD. TRY AGAIN
WHEN YOU'RE ONLINE.` instead of an empty cloud); the journey marker is set by
`backuptool restore --then-cloud` after a verified extract and consumed on YES
or LATER, not on display; the match preview no longer says a device with no
selection already matches; the seed-folders page shows `MISSING` rows; TIDY
never offers MOVE over a refusal; deleting a save state is refused while a sync
runs (D-CLOUD-053). Retired from every screen: `COMPLETED SUCCESSFULLY`,
`SUCCEEDED`, `FAILED`, `STOPPED`, `BOTH WAYS. NOTHING IS DELETED.`
ES `test/qa-integration` `81d35668e`.
## The last known good state, kept: system.cfg (2026-09-10)

`chksysconfig` treats `system.cfg.backup` as the record of the last
`system.cfg` known to be good (D-CLOUD-078, D-CLOUD-079, #105, #102). `backup`
copies only a file that passes `valid()` -- non-empty, text, carrying
`system.hostname=`, every non-blank line `key=value` -- by temp-and-rename, and
now runs at boot after `verify` and `sort_settings` as well as at shutdown, so
a device that is only ever powered off still has a fresh good copy. `verify`
restores from the record for every invalid case (empty, truncated, no hostname
line, binary) and reseeds the image's `system.cfg` only when the record is
unusable too, logging which it took (`logger -t chksysconfig`). The blanket
`rsync -a /usr/config/ /storage/.config` that replaced every differing config
file whenever one retroarch file was missing is scoped to files actually
missing (`--ignore-existing`; an empty retroarch file is removed first so it is
reseeded like a missing one). The file keeps its name, so an upgraded device
has one record and nothing to migrate; its existing `.backup`, if it is a
default copy (the RG SP's case), is replaced at the first boot the live file
is valid. `set_setting` deletes and re-adds a key in one `sed -i` under one
lock hold -- one rename, where it was a rename and then an append with the
lock released in between; `sort_settings` refuses to replace the file when the
sorted copy is empty or has no hostname line. Proven by
`tools/last-good-scripts-test` (a, c), which fails the same checks against the
scripts before the change.

## Settings archives: written whole, rotated after, restored with a way back (2026-09-10)

`backuptool backup` writes `<name>.partial`, lists it back, renames it, and
only then rotates the previous archive into `archive/`. Killed mid-tar it
leaves the previous archive as the only `*.tar.gz` at the root and a
`.partial` no reader matches; it used to leave a truncated archive under the
newest name (which `cloud_backup` sent to the cloud and `restore` refused) or,
killed during the rotation that ran first, no archive at the root at all.
`restore` archives the current settings into
`archive/<stamp>-PRE_RESTORE-<label>-ROCKNIX_SETTINGS.tar.gz` (passwords kept:
it never leaves the device) before extracting, and a failed extraction puts
that snapshot back and says so; the snapshots count toward `archive/`'s bound
of three. `restore --then-cloud` leaves `.cloud-journey-pending` after a
verified extract, so the menu no longer sets it before the restore has run.
Every message is a sentence for a screen -- no paths, no `logger`, no codes --
and the zip check falls back to `unzip -l` because busybox `unzip` has no
`-t`, which had every legacy `.zip` reading as damaged. `cloud_backup` lists
each archive before uploading it and skips a damaged one, runs cloud
retention only after the size verification has passed, writes `device.json`
by temp-and-rename and reads its upload's result. Proven by the test's (b).

## Saves: what a transfer replaces is kept for one cycle (2026-09-10)

The saves restore passes `--backup-dir /storage/.cache/cloud_sync/replaced/<stamp>`,
so a local save the cloud copy overwrites is moved aside rather than lost;
the saves backup passes `--backup-dir <SAVES_REMOTE>-replaced/<stamp>` in copy
mode as well as sync mode. After a run that completed, every stamp folder but
the newest is removed on that side (the remote's only on a full pass, never
on the game-exit `--recent` run), so one record is at rest. The `-replaced`
folder is shared by every device on the saves folder, so "one cycle" is one
cycle of whichever device ran last. After each saves transfer and after the
settings archive download, rclone's `<name>.<8 chars>.partial` litter under
the tree is removed. Verified with the image's rclone 1.75 that `--backup-dir`
works under `copy` with `--no-traverse`/`--max-age` and with `--update`.

## Every stamp and record written whole (2026-09-10)

A `write_stamp()` per script (there is no shared library), the shape of
`ThreadedCloudSync::recordOutcome`: the line goes to a temp beside the stamp
and is renamed over it. Applied to every `last-*` stamp in the five transfer
scripts, the `settings-backup.uploaded` marker, `device.json`, the
`content-systems` selection (where an empty file is a different valid answer),
the saves-root record, and the device id. `cloud_saves_root check` refuses when
the record exists and is empty instead of passing unchecked; `cloud_device_id`
with an empty id file and no adapter returns nothing rather than a new
identity derived from `machine-id`. `cloud_capture` sweeps `.last-capture.<pid>`
litter with the rest. **Stamps gain a third field**: when a run did not
complete and a `>>> why` line was printed, the sentence follows the exit code
with its spaces as underscores (`1789000000 5 YOUR_CLOUD_STOPPED_ANSWERING`),
one token for a reader that splits on spaces; nothing is added for 0, 9, 69
or 75. Proven by the test's (d).

## Failures say why, in the player's words (2026-09-10)

Every failure point prints one `>>> why <SENTENCE>` protocol line from the
vocabulary table in `es-native-ui.md` (D-UI-028): rclone 3/4 `YOUR CLOUD
FOLDER WASN'T FOUND`, 5 `YOUR CLOUD STOPPED ANSWERING`, 6 `SOME FILES DIDN'T
FINISH`, 7/8 `YOUR CLOUD REFUSED THE TRANSFER`, the sign-in probe `YOUR CLOUD
DIDN'T ANSWER. ITS SIGN-IN MAY HAVE EXPIRED`, the saves-root guard `THE SAVES
FOLDER IS ON A DIFFERENT CARD`, and the script-side additions `YOUR CLOUD
STORAGE ISN'T SET UP`, `THE SAVES FOLDER WASN'T FOUND ON THIS DEVICE`, `THE
SETTINGS ARCHIVE ON THIS DEVICE IS DAMAGED`, `THE COPY IN YOUR CLOUD DIDN'T
MATCH WHAT WAS SENT`, `YOUR CLOUD SYNC SETTINGS COULDN'T BE READ`, `AN OLD
RESTORE-FOLDER SETTING IS STILL SET`, `THE SAVES FOLDER'S CARD COULDN'T BE
CHECKED`, `THE SAVES FOLDER CHANGED CARDS DURING THE TRANSFER`. One per phase
in the saves scripts, one per failing unit in the content scripts. Nothing a
screen can show carries an exit code, `rc=`, a log path, `logger`, `rclone`, a
script name or a `--flag`: rclone's taxonomy and codes go to the log half of
`log_message`, `Log file: /var/log/cloud_sync.log` is log-only, the summaries
say `COMPLETED` (0 or 9) or `COULDN'T FINISH` (`SUCCESS` and `COMPLETED WITH
ERRORS` retire), `rclone config` and `cloud_setup --accept-saves-root` leave
the screen (the latter goes to the system log; no menu row offers it yet), and
the menu path named is the current `GAME SETTINGS > MANAGE CLOUD STORAGE`. A
match cut by link loss prints its running `>>> removed` totals before the 69
exit so the page can report `COMPLETED WITH GAPS`. The harness's FORBIDDEN
regex over every screen line of the six scripts is clean (the test's (e)).

## The cloud sync configuration is never half-written (2026-09-10)

`cloud_sync_helper` builds the merged rules beside the file and renames them
over it (they were built under `/tmp` and moved across filesystems -- a copy
and an unlink, with the allowlist's catch-all the first line to go from a cut
copy); takes `cloud_sync-rules.txt.bak` only from a file carrying `- /**` and
`cloud_sync.conf.bak` only from a conf that is whole (`bash -n`, and every line
blank, a comment, `KEY=value` with balanced quotes, or a continuation), so a
torn file never replaces the last good copy; refuses to merge onto a conf that
is not whole; appends new keys to a same-directory copy installed by one rename
once it validates; and carries a backslash-continued default (`RCLONEOPTS`)
whole -- it used to append only the first line, leaving an open quote in any
conf that lacked the key. `cloud_backup` and `cloud_restore` validate the conf
before `source`, fall back to the `.bak`, and otherwise refuse with `>>> why
YOUR CLOUD SYNC SETTINGS COULDN'T BE READ`; they ran on with whatever a torn
file yielded before. After a run that completed they remove
`cloud_sync.conf.bak`, `cloud_sync-rules.txt.bak` and
`cloud_sync.conf.pre-copy-default` (D-CLOUD-079); the next run takes fresh
copies before it touches anything. No config option was added or renamed.
`rocknix-update` downloads under `.part` names and renames after the checksum
matches, so a cut download is never picked up as an update at the next boot.

## The picker's scan: a cloud that refused is not an empty one (2026-09-10)

`cloud_content_restore --scan` exited 69 when its listing failed with the
network gone and 0 -- an empty cloud -- for every other failed listing, on
the reasoning that a missing ROMs folder (rclone's 3) is an empty cloud. It
is; a refused connection (5), a rejected sign-in or any other error is not,
and with the cloud pointed at a dead port the page listed every system on the
device as `NOT YET IN YOUR CLOUD` and offered the whole of it for upload. A
listing that fails with the network up now exits with rclone's own code
unless that code is 3, prints no system lines, and says on stderr that the
cloud could not be read; the picker already turns any code other than 0 and
69 into `COULDN'T READ YOUR CLOUD'S CONTENT. TRY AGAIN.` The BIOS listing's
code no longer overwrites a ROMs listing's that said more. `tools/cloud-round-trip`
gains the case (the stanza's endpoint moved to a closed port on the same
host). `2266c73245`.

## system.cfg's last good copy: a text test busybox understands, verified before the hostname is read (2026-09-10)

`chksysconfig valid()` asked `tr` to delete `[:print:][:space:]\200-\377`;
busybox tr reads `[:print:]` as eight characters, so every real `system.cfg`
was "not text", the backups at boot and shutdown were refused, and a damaged
live file was reseeded from the image defaults with the record then
overwritten by EmulationStation's next save (guest d, `c15050c897`). The set
is now byte ranges (tab, newline, carriage return, printable ASCII, and
everything above 0x7F for UTF-8). `tools/last-good-scripts-test` runs every
busybox-applet command through the image's busybox and carries the image's
own `system.cfg` and a UTF-8 value as fixtures (`BASE_REF=c15050c897 ... --old`
shows seven FAILs against the shipped script). New
`rocknix-sysconfig.service` runs `chksysconfig verify` at sysinit, before
`network-base.service` reads `system.hostname` at about 1.7 s; the autostart
chain's verify ran seconds later and a damaged file gave the device
`localhost` -- or, reseeded, the image's name (#102's `H700`) -- for the whole
boot (D-CLOUD-080). `f907e7f526`.

## Cloud rows in one line; the why in the dialog; the card's action row (2026-09-10)

EmulationStation `0a725b2dc` (pinned `b2173652b4`): the line under a cloud row
is `LAST <date>  -  <outcome>` and nothing more -- the scripts' why sentence
made it three lines at 1280 px, against D-UI-023 -- and the three manual
rows' confirmation dialogs carry `LAST TIME IT COULDN'T FINISH: <why>.` as a
second paragraph when the last run did not finish (D-UI-029). The cloud card
is created with its action row (`createAsyncNotificationComponent(true)`; the
default is two rows), so the recovery clause of D-CLOUD-077 -- what is in
place, and `TRY AGAIN: GAME SETTINGS > ...` -- is drawn; tranche A composed it
and had no row to draw it on.

## Cloud stamps and rclone.conf are read uncached (2026-09-10)

EmulationStation `28631cf77` (pinned `d3f2431034`): the cloud rows' stamp
reader and the rows' gate on `rclone.conf` pass `enableCache=false` to
`Utils::FileSystem::exists`. The file cache (`UseFileCache`, on by default)
remembers a miss until a game launch or a restart, so a GAME SETTINGS page
opened once before a run read `NOT DONE ON THIS DEVICE YET` after the run had
written its stamp, and the confirmation dialog's `LAST TIME` paragraph never
appeared; a cloud set up in the wizard could likewise stay "not set up" on
the rows for the session. Found on guest d against `854989a639` with stamps
planted by hand.

## The manual stamp is the sync row's (2026-09-10)

EmulationStation `ad861363d` (pinned `ea65ac9bf5`): `last-sync-manual` is
written only when the manual run was SYNC SAVES WITH THE CLOUD. A manual
backup or restore is stamped by its script (`last-backup`, `last-restore`),
which the BACK UP and RESTORE rows read; writing the manual stamp for those
too put a backup's outcome under the sync row (`LAST 00:48 - COULDN'T
FINISH` on a row nobody had pressed, guest d).

## set_setting keeps a key on the last line; a cut-off restore is undone at boot; rotation trims by name (2026-09-10)

Three findings from the KILL cells against tranche A's scripts (`90e18fdb0d`,
`18eb6ecdd5`):

- `set_setting` was one `sed -i` with `/^k=/d` and `$a k=v`; when the key's
  line is the file's last -- which a key just appended always is -- `d` ends
  the cycle before `$a` runs, so the key was deleted and never re-added and
  read as its default from then on. It is now one awk into `system.cfg.tmp`
  and a rename over `system.cfg`, under the one lock hold; the key is
  matched literally and the value crosses through the environment.
  `chksysconfig verify` sweeps a `system.cfg.tmp` a kill left.
  `tools/last-good-scripts-test` carries the last-line, one-line and
  literal-key fixtures (`BASE_REF=c15050c897 ... --old` fails 12 checks).
- `backuptool restore` writes `.restore-in-progress` naming the copy it took
  aside before extracting and removes it after; `chksysconfig verify` puts
  the copy back at the next boot when the marker is still there and leaves
  `.restore-reverted` for EmulationStation to say once (D-CLOUD-081;
  ES `5a3759cde`, pin `520357fa52`: `YOUR SETTINGS RESTORE WAS INTERRUPTED.
  YOUR PREVIOUS SETTINGS WERE PUT BACK. TRY THE RESTORE AGAIN.`).
- `trim_archive` kept "the newest" by mtime; it sorts by the date in the
  name now, dateless names last, so a downloaded older archive no longer
  outlives a newer one.

The harness follows: KILL3 for the write-then-rotate flow (its watcher's
`ls root/*.tar.gz root/*.zip` failed whenever no `.zip` matched and fired on
any state), KILL10 shims awk, KILL11 asserts old-or-new, KILL18 runs
`chksysconfig verify` as the boot would and its snapshot covers the tree it
restores; the settings-archive step plants a real tar.gz pair of equal size
(the planted bytes were "damaged" to the new `cloud_backup`); the litter scan
accepts D-UI-028's stamp shape and judges a `.bak` against the newest
completed run rather than flagging it wherever it sits.

## The restore revert waits for /storage/roms (2026-09-10)

`chksysconfig finish_restore` leaves the `.restore-in-progress` marker alone
when the copy's folder does not exist yet -- `/storage/roms` is bound by
`rocknix-automount` at about 2.5 s, after the sysinit verify at 1.7 s -- so
the autostart chain's verify, after the mounts, puts the copy back
(D-CLOUD-082). The first `9847876563` boot with a marker declared the revert
failed at sysinit and EmulationStation said `COULDN'T BE UNDONE` while the
copy sat on the folder that was about to be bound. `61024a4d76`; fixture in
`tools/last-good-scripts-test`.

## Handhelds keep their evidence: persistent logs, a watchdog, a crash store (2026-09-10)

`/var/log` is now a bind mount of `/storage/.cache/log` on every device --
upstream's own `var-log.mount`, switched on (D-SYS-001) -- so the journal,
EmulationStation's log and `cloud_sync.log` survive a power cut. The journal
gets 64M and a one-minute sync; `cloud_sync_helper` trims `cloud_sync.log` to
its last 512 KiB once it passes 1 MiB, since nothing ever rotated it.
`/storage/.cache/volatile-log` opts a device out.

systemd arms the hardware watchdog at 15 s (the Allwinner ceiling is 16) and
leaves the shutdown watchdog off (D-SYS-002). A soft lockup or a hung task
panics and the device reboots ten seconds later, leaving its trace in
ramoops -- 1 MiB at `0x4F000000` on every H700 board (D-SYS-003, D-SYS-004)
-- which `systemd-pstore` copies into `/storage/.cache/log/pstore/` at the
next boot, and the first evidence snapshot after boot archives anything the
boot-time service did not see (on UEFI the dump appears a little late). H700 gains `PSTORE_RAM`, `PSTORE_CONSOLE`, `WATCHDOG_SYSFS` and
the two detectors; the VM gains pstore over UEFI variables and QEMU's
watchdog so it can prove all of this first.

`rocknix-evidence snapshot` writes a page of device state every five minutes
into a ring of five; `rocknix-evidence collect` bundles the previous boot's
journal, any pstore dump, the logs and the snapshots into one archive and is
the first thing to run on a device that has misbehaved (D-SYS-005). The
config-file half of #104 had already landed: `chksysconfig` keeps the last
known good `system.cfg` and both EmulationStation writers go through a
temporary, a sync and a rename (D-CLOUD-078/079).

Upgrade: nothing to migrate. The mount, the sysctl and the timer are all
image-level; a device already carrying `/storage/.cache/log` from a past
debugging session simply starts using it. Rule: `handheld-evidence.md`.

## The last two console hops, six small-panel fixes, and a missing password noticed (2026-09-10)

**#114.** The journey continuation (YOUR SETTINGS WERE RESTORED. DOWNLOAD YOUR
GAMES, BIOS FILES, AND SAVES...?) and the settings restore (RESTORE SYSTEM
SETTINGS FIRST, THEN RESTART?) ran in a fullscreen console. Both run on
`GuiCloudTransfer` now, composed the way the transfer page composes every
other run (`>>> tier <label>|<rc>` per part, status accumulated rather than
taken from the last part -- so unreachable ROMs no longer skip the saves).
The settings restore's page owns the restart (D-UI-033): `backuptool
restore --no-restart` is new and opt-in, the page reloads the settings it
holds in memory and reboots on any button once the player has read the
outcome. `/usr/bin/run`'s failure branch re-ran the whole command line as one
word on every failure (`...: not found` flashed over the real error); it now
only does so for a single path with spaces, which is the case it was for.
Left for #119: `run` exits 0 on failure.

**#115.** Every message box read `OK CHOOSE CHOOSE` (D-UI-034); the card's
reason line clipped mid-word at 640x480 and now has short forms (D-UI-035);
CHANGE CLOUD FOLDER says `THE FOLDER IN YOUR CLOUD THAT HOLDS YOUR SAVES.`;
the launch gate says WAIT only when the player started the sync, and `IT'S
STOPPING SO YOU CAN PLAY - TRY AGAIN IN A MOMENT.` when a cancel is still
finishing; and #48's overlapping OK button is measured at the width the text
is drawn at (`GuiMsgBox` measured at the box width and drew at the padded
one, 5% narrower on 640x480, so one line in twenty was never budgeted). The
wizard's 33 "remote" strings are #118.

**#109.** At startup, a RetroAchievements username with neither password nor
token gets `YOUR RETROACHIEVEMENTS PASSWORD IS MISSING, SO YOU'RE SIGNED
OUT. ENTER IT NOW?` once per boot, YES opening the same re-entry page the
restore marker opens; NOT NOW asks again next boot. `docs/backup-contents.md`
says what a hand restore must do.

EmulationStation `5443c8f95`; ROCKNIX `073929659d`. Frames follow the build.

## The wizard stops saying "remote"; the exit hotkey has a test (2026-09-10)

**#118.** Thirty-four strings across the rclone wizard, the SSH hub and the
post-restore check said "remote". Under D-UI-036 they now say *cloud storage*
(`NO CLOUD STORAGE IS SET UP ON THIS DEVICE YET. SET IT UP NOW?`, `YOUR CLOUD
STORAGE IS READY`), *connection* (`CONNECTION NAME`, `WHICH CONNECTION?`,
`REPAIR A CONNECTION`, `ADD ANOTHER CONNECTION`), *provider*, and "your cloud
is answering" for a check that passed. The three numbered steps that walk a
player through `rclone config` in a terminal keep rclone's word, because that
is what the terminal shows, and step 2 says once what it means. The CHECK
CLOUD REMOTE row after a restore is CHECK CONNECTION, the same label as the
hub's. No behaviour changed.

**#117.** `tools/emulator-exit-test` proves, against the shipped
`input_sense`, that the exit hotkey ends a game once with the save written,
that a held combo does the same, and that the debounce window closes; with
the debounce stripped it fails in two places. The first automated test of the
launch path, and the first cell of #120.

## The harness gate is the default, and it found six lines (2026-09-10)

`tools/cloud-round-trip` asserts the three outcome words on every run's last
player-facing line by default now (`--no-vocabulary` for an older image),
and `COMPLETED WITH GAPS` is gone from what it accepts (D-UI-030). Its first
default run over the link-loss cells caught "Lost the network during ..."
in LINK1-6; the scripts say "Couldn't finish: lost the network ..." now.
`tools/vm-qa` runs every automated check against one image and writes one
report; `--link` adds the seven link cells.

## Unit tests for the pure cloud code; `d2eabe879c` (2026-09-11)

The pure text of the cloud surfaces -- the network name derived from a typed
device name, the provider label, the stamp-line parser, the origin label,
the outcome line's shorter forms, the `>>> ` protocol-line classifier, and
the "longest candidate that fits" rule -- lives in `es-app/src/CloudText.{h,cpp}`
now, with no window, font or file behind it, and `es-app/tests/unit/` builds
`es-unit-tests` against it: 19 cases, 162 assertions, four milliseconds,
proven to fail on three deliberate mutations (#120). Behaviour unchanged;
`d2eabe879c` carries the extraction and passes `tools/vm-qa`.

## Standalone N64 saves join the allowlist (2026-09-10, noted 2026-09-11)

Every shipped `mupen64plus.cfg` writes `.eep`, `.mpk`, `.sra` and `.fla`
beside the ROM, and the allowlist's `/n64/save/*` lines never matched them,
so a standalone-N64 player's saves were never backed up. Four `+ /**/*.ext`
lines in both rule files (D-CLOUD-086, #89); the ROM beside them stays out,
and the harness plants both layouts.
