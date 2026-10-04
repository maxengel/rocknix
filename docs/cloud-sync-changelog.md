# Cloud sync, backup and restore — change summary

## 0.0.1 identity transition — 2026-10-04 (#409)

The next candidate is named **pixelelated**, always lowercase. New cloud
setups use `/pixelelated`; the existing folder-move workflow targets that
folder and preserves saves, backups, content and retry/recovery behavior.
ROCKNIX `/GAMES` and `/ROCKNIX` layouts remain supported migration sources;
custom folder choices remain intact. No fielded `/Rasteratops` systems exist.
Source changes are under validation; the new candidate image is not yet built.


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

**Base:** `upstream/next` as of 2026-09-04. rclone moves **1.71.0 → 1.75.1**
(S3 multipart streaming improvements, and the version our checksums pin).

---


## Preserve account discovery after the distribution rename (2026-10-03)

Source controls pass; packaged replacement qualification is pending under M7.P3.

- **Offline RetroAchievements finds the account saved in Rasteratops settings.**
  The current upstream proxy recognizes the renamed distribution's existing
  account layout; cache and queued awards keep their established paths (#408).

## Avoid an extra cloud-folder probe on game exit (2026-10-03)

A byte-verified VM source comparison passes; rebuilt-image proof remains pending.

- **Earlier cloud folders keep their absence check with less overhead.**
  Listing an explicitly named directory avoids WebDAV's file-type probe. The
  five-sample legacy/current timing difference falls from39ms to20ms in the
  controlled VM comparison, within the unchanged30ms criterion (#364).

## Name an explicitly selected cloud root (2026-10-03)

Source pointer-writer controls pass; rebuilt-image proof is pending under M7.P3.

- **Migration progress names the root of your cloud when that is the selected
  folder.** It no longer leaves the folder name blank. The stored selection
  and the ROMs/BIOS location remain unchanged (#407).

## Stop content transfers that stop progressing (2026-10-03)

Source and isolated full-script controls pass; rebuilt image qualification
under M7.P3 remains required.

- **ROMs, BIOS and game-content transfers stop after prolonged inactivity.**
  Provider retries follow the same progress-sensitive bound as saves and
  settings; large transfers can continue while making progress (#401,
  D-CLOUD-127). A failed copy does not start another game-list transfer.
- **A failed content scan reports an unfinished operation and offers retry.**
  The S3 interruption fixture now reaches this path; the result reads
  `Couldn't finish reading your cloud. Try again.` (#401/#402).

## Keep interface memory bounded between games (2026-10-03)

Diagnostic VM qualification under #310; the combined Rasteratops image still
needs its own M7.P3 checks. Renderer teardown releases Mesa's executable arena,
SDL display modes and an empty virgl cache. Input-device scans release their
lists, and glibc returns unused heap pages around a game. Software10/50-cycle
and accelerated10-cycle controls pass with no address-space growth; the long
sync-enabled run adds364KiB RSS and completes every exit sync. Renderer and
input functionality are preserved by the same actual launch/exit controls.

## Current offline proxy and saved LED brightness (2026-10-03)

Source and fixture qualification only; the combined image still needs M7.P3.

- **Offline preparation still covers the whole library.** The current upstream
  proxy keeps its queue budget for ordinary work; deliberate preparation opts
  out explicitly and waits for queued work. Old cached sign-in, base/subset
  awards and images survive the source upgrade controls (#361/#384).
- **Battery colors and low-charge blinking respect saved LED brightness.**
  The Nova scripts preserve min, mid and max across all eight RGB devices;
  explicit custom RGB tuples retain their own brightness (#332). Actual
  script fixture tests and guest reselection pass; physical illumination remains
  an open item to test.

## Recover earlier cloud moves and refuse unlinked transfers (2026-10-03)

Source changes with production-script host evidence; candidate VM qualification
remains required.

- **A move interrupted on an earlier build can finish its remaining folders.**
  Known old content and discarded saves use the recorded migration path,
  preserving independent content choices and conflicting progress (#391,
  D-CLOUD-165, D-CLOUD-168).
- **An empty cloud configuration cannot turn a local folder into the cloud.**
  Back up and restore refuse with the existing setup message before using a
  path when no remote is linked (#392).

## Keep newer settings during recovery (2026-10-03)

- **A newer settings write keeps its recovery copy.** ES rechecks the selected
  settings under the shared lock before recording them; a recovery that could
  not acquire the lock records nothing (#320). Both deterministic race controls
  failed before the fix and pass after it; the10-case suite has119 passing
  assertions. Candidate VM recovery qualification remains required.

## Retry interrupted cloud moves (2026-10-03)

Source implementation under #356/#365; host production-script controls and ES
compile evidence are retained. Candidate VM upgrade, provider and frame checks
remain required.

- **An interrupted move keeps its original paths for retry.** The local step1
  record survives pointer changes; copying, deletion and final marker failures
  retain a recoverable state, and the folder step offers `TRY AGAIN · NOT NOW`.
- **Unknown layout markers stop the folder transition.** Malformed or newer
  versions cannot authorize a merge, pointer change or setup marker overwrite.
- **Partial completion is reported accurately.** A failed marker upload no
  longer says the move completed; the page acknowledges files already moved.

## Rasteratops identity and manual updates (2026-10-02)

Source implementation under #337/#383. The cold image, upgrade rehearsal,
and VM frames are still required before these changes are qualified.

- **The operating system carries the Rasteratops name and wordmark.** Boot,
  the interface, and the default theme use the icon-free Tiny5 Duo wordmark.
  Persisted paths, partition labels, settings, and network names retain their
  RC2 identities (D-WORKFLOW-123/127/130).
- **Updates are manual in 0.0.1.** `MANUAL UPDATES` explains where to get the
  device's update. Inherited automatic and forced settings cannot contact the
  previous distribution's updater; its statistics entry point is inert and
  its timer masked (D-WORKFLOW-093/110). The adoption filename contains
  `-from-ROCKNIX` so RC2 can apply it (D-WORKFLOW-128).
- **Offline subset achievements keep their own game identity.** The upstream
  correction is supplied by the refreshed upstream proxy; its award-parity tests pass.
  Queue/flush verification on the image remains required (#384).


## Cloud-folder preparation and settings archive compatibility (2026-10-02)

Implementation under #383, with host production-script regressions passed.
The combined candidate's VM and device qualification is still pending; this
section does not claim that an image has passed those checks.

- **Settings backups remain discoverable after the identity change.** The
  cloud scan and restore use the same current, legacy and healed device-folder
  search. Existing ROCKNIX archives remain readable, including local recovery
  snapshots; new archives retain their persisted naming contract (#376/#381,
  D-WORKFLOW-123).
- **Moving save pointers preserves independent choices.** Populated settings
  backup folders remain reachable, and an explicit cloud-root choice for ROMs
  and BIOS stays at the root (#379/#380). Failed settlement makes no folders,
  and a failed bucket listing cannot produce a create-folder offer (#377).
- **Boot prepares the folder before transfers and waits for cards before
  opening setup.** Eligible legacy configurations run the existing folder scan
  first, bounded to30 seconds. The setup question follows the startup worker
  and the outcome card's fade (#363/#365, D-CLOUD-173). A setup README alone
  does not outrank actual saves in another earlier folder.
- **Exit backups retain the legacy-folder safety check.** The check uses one
  parent listing; a proved-absent old default is not recreated. Guest timing
  remains to be measured against #364's existing criterion (D-CLOUD-172).


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
- **After a whole-device restore**, the device offers `FINISH RESTORE PROCESS` to
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

## Credentials and rules (2026-09-11)

Maintainer's order: #116, #52, #71, #39, then #74 and #100, one build.

- `cloud_setup --info` no longer prints the root password; it says whether
  one is set, and EmulationStation reads the value in-process where the SSH
  page must show or pre-fill it (D-INFRA-010).
- `backuptool` holds `rclone.conf` back from every archive, outright; the
  post-restore CHECK CONNECTION tells a device with no cloud storage where to
  connect it, and the credential scanner knows rclone's key names
  (D-CLOUD-087). `last-good-scripts-test` case f proves both under bwrap.
- `cloud_backup` and `cloud_restore` apply the saves allowlist whether or
  not RCLONEOPTS names it (D-CLOUD-088); the leak was reproduced with the
  shipped script first.
- `cloud_migrate_layout --check` calls a chosen sibling layout current
  instead of offering to move it back to `/ROCKNIX` (D-CLOUD-089).
- The round-trip harness gains four steps -- a user's own rule stays above
  the catch-all and keeps its file off the cloud (#39); changing the cloud
  folder puts the settings folder beside it and the archive lands there
  (#74); a bare RCLONEOPTS keeps the allowlist (#71); an empty cloud offers
  and a wrong root fails (#100) -- 31 steps, PASSED against the new scripts.

## A skipped phase says so; two boot warnings gone (2026-09-11)

- **`cloud_backup`'s summary no longer says COMPLETED for a phase that did
  not run** (#126, D-CLOUD-090). A settings-only run with no archive on the
  device said "There's no settings backup on this device yet." and then
  `Settings backup: COMPLETED`, exit 0, and stamped the run as the last
  settings backup. Now the phase line reads "Skipped settings this time -
  there's no settings backup on this device to send yet.", the summary word
  is `SKIPPED - NOTHING TO SEND YET`, the exit stays 0 and the stamp keeps
  describing the last upload that happened. Under `--system-only` the saves
  line reads `SKIPPED - SETTINGS ONLY`, and under `--saves-only` the
  settings line `SKIPPED - SAVES ONLY`, instead of COMPLETED for work that
  was never asked for. An archive unchanged since its last upload is still
  COMPLETED -- the cloud is current. `tools/cloud-round-trip` asserts the
  phase line, both summary words and the unmoved stamp.
- **Two lines gone from every boot's journal.** `powerstate` logged an
  arithmetic error every two seconds on a device with no battery reading
  (#121); it now skips the battery checks for that pass. `vm.laptop_mode=5`
  drew a deprecation warning from systemd-sysctl on kernel 7.x (#122); the
  line is gone from the package, and post-update deletes it from the copy an
  upgraded device already holds under `/storage/.config/sysctl.d`
  (D-SYS-007). Neither changes what a handheld does; both change what a
  person reading a crash's evidence sees first (D-SYS-001).

## Field labels in the player's words; the offer knows a near miss (2026-09-11)

- **The provider forms say SERVER ADDRESS, USERNAME, PASSWORD, ACCESS
  TOKEN** where they said `URL`, `USER`, `PASS`, `BEARER_TOKEN` (#123,
  D-UI-038). A small map covers the fields the recommended providers ask
  for; anything rclone adds later shows its name in plain words (`SOME
  OPTION`), never an identifier. The rclone name still keys the value in
  `rclone.conf`.
- **The empty-cloud offer names a folder with a near name** (#127,
  D-CLOUD-091). With `/ROCKNIX/Savez` configured beside a real
  `/ROCKNIX/Saves`, the restore says "Your cloud has /ROCKNIX/Saves but no
  /ROCKNIX/Savez, so check the folder name." and the dialog offers CHANGE
  FOLDER first, then CREATE ANYWAY, then NOT NOW. It used to offer CREATE
  IT alone, which would have split the saves across two folders.
- **A saves folder at the cloud's root gets the offer too** (#127,
  D-CLOUD-092): the root the remote answers for is its parent. A missing
  root above a nested folder still fails.
- The words for all three are the ones proposed in the issues, built
  under discretion and framed for the maintainer's yes.
- **The S3 form's subtitle is AMAZON S3 AND COMPATIBLE**, not rclone's
  sixty-provider description in small text (#128). A short, list-free
  label is kept as it is; a paragraph becomes the words the provider was
  chosen by.

## The exit card says syncing; the card speaks in your words; FINISH RESTORE PROCESS; the automatic sync is bounded (2026-09-12)

The night after the council the maintainer walked its proposals one at a
time; what a player sees from that walk is below, the rest is design
(D-CLOUD-102..117).

- **The card after a game says `SYNC SAVES` / `SYNCING SAVES TO THE CLOUD`**,
  not BACKING UP SAVES, matching the startup card (#138, D-UI-040). *Back up*
  and *restore* stay the transfer page's words. Maintainer: *"save the word
  'backup' for when someone feels it's a longer, deliberate action."*
  - **The card's live line reads `12 KB OF 40 KB` and `COMPARING SAVES · 12 OF
  70`**, never rclone's units or two stats fields run together (#140).
  - **The relink page and both rows that open it are `FINISH RESTORE PROCESS`**
  (the hub said FINALIZE RESTORE, NETWORK SETTINGS said FINISH RESTORE SETUP)
  (#129, D-UI-046). Maintainer: *"make it both, say, 'finish restore process.'"*
  - **The empty-cloud dialogs in their short form** (#127, D-UI-045/047):
  `NOTHING TO RESTORE: YOUR CLOUD HAS Savez, NOT Saves.` / `IS THE NAME
  RIGHT?` with `CHANGE FOLDER` · `CREATE ANYWAY` · `NOT NOW`; a plain `YOUR
  CLOUD HAS NO SAVES FOLDER YET.` / `CREATE IT NOW?`. The transfer page raises
  the offer too, so a fresh handheld meets it (#145).
  - **Save state is two words everywhere, and the settings tier is settings**
  (#148, D-UI-049): fourteen inherited `SAVESTATE` labels read SAVE STATE, the
  restart dialog reads `RESTORE SETTINGS FIRST, THEN RESTART?`, the DATA
  MANAGEMENT row `RESTORE SETTINGS FROM THIS DEVICE`.
  - **The automatic sync -- at startup and after a game -- is bounded: 5 s to
  connect, 5 s with no bytes moving, 20 s in all, five retries, one transfer
  at a time** (D-CLOUD-118/121). Past the ceiling it ends `THE CLOUD TOOK TOO
  LONG - IT'LL TRY AGAIN NEXT TIME`; a stalled endpoint had held the exit
  card for 321 s. Maintainer: *"Five retries sounds like a good place to
  start as a baseline."*
  - **The startup sync no longer waits a minute on a network NetworkManager
  calls "limited"**: any connected state with a held route settles at once.
  The RG SP had logged `not settled after 60s` while Dropbox answered it.
  - **On a bucket cloud (S3 and compatibles) a mistyped saves folder fails as
  on Dropbox** instead of reporting `Game saves: COMPLETED` over nothing: a
  folder exists when its parent lists it, the wizard's S3 stanza turns
  directory markers on so an empty folder survives, and listings retry three
  times, not ten (#141, #143, D-CLOUD-120).
  
## Settings backups leave the image's files out; the device names itself; a missing folder is not a broken cloud (2026-09-13)

- **A settings backup carries your configuration and nothing the image
  ships** (#45, D-CLOUD-008): a file identical to the image's own copy is left
  out, and PPSSPP's `assets/` and shader cache never travel -- 17 MB became
  9 KB. A restore skips those two prefixes from any archive, old `.zip` ones
  included, so an older emulator's files no longer land under a newer one
  (D-CLOUD-124).
  - **Two units of one family no longer fight over one name on your network.**
  A device still called by its family (`H700`) names itself `H700-<four hex
  digits>` once, from its own hardware id; a name you typed is never touched,
  and one carried in by another device's settings restore is re-derived
  (#50, D-NET-002/004/005). **And it answers for `<name>.local`**: the mDNS
  responder is on again, after the device has its name (D-NET-003/006).
  Maintainer: *"We should turn back on the mDNS responder."*
  - **On FTP, a folder that is not there yet no longer reads as "Your cloud
  couldn't be read"**, and the content backup makes each folder before
  copying, so a first copy into a new folder lands whole (#142, D-CLOUD-123).
  - **A deliberate back up or restore ends when the cloud stops answering, on
  every provider**: ended once rclone has shown no progress for 36 s, saying
  `Couldn't finish: ...` on its own line, where on S3 the SDK re-dialled
  through the whole outage and then stamped success (#153, D-CLOUD-126/127).
  The summary ends on a sentence: `Completed.`, `Couldn't finish: <why>. Try
  again.`, `Skipped: <reason>.` Maintainer: *"It feels the most transparent."*
  - **The emulators' copies of your RetroAchievements token stay out of a
  settings backup** (#169, D-INFRA-010): PPSSPP's, Dolphin's, SkyEmu's and
  ARMSX2's token files are held back whole, four other emulators' settings
  travel with the token blanked, and an old archive does not land one.
  
## The save state manager fits its labels; ScreenScraper says which credential; the startup card names its half (2026-09-13)

- **`START NEW GAME` and `AUTO SAVE` read whole on a 640x480 panel**, and the
  manager draws its help bar there for the first time (`BACK / DELETE / COPY
  TO FREE SLOT / LAUNCH` on a slot) (#27, #149, D-UI-050). The tiles had been
  drawn a third larger than the menu's own small text since the page was
  written; the maintainer had picked the wrong tile because of it. After a
  delete the cursor lands on START NEW GAME and the bar follows (#93).
  - **A scrape that cannot sign in says which credential, in English**, not
  ScreenScraper's raw French blaming the account (#66): `SCREENSCRAPER
  REJECTED THE DEVELOPER ID OR PASSWORD. CHECK THEM UNDER SCRAPER >
  ACCOUNTS.`, `SCREENSCRAPER REJECTED YOUR USERNAME OR PASSWORD. ...`,
  `SCREENSCRAPER NEEDS YOUR ACCOUNT TO SCRAPE. ADD IT UNDER SCRAPER >
  ACCOUNTS.`, `COULDN'T REACH SCREENSCRAPER. TRY AGAIN.`, and a line per
  documented status. The developer pair lives under SCRAPER > ACCOUNTS
  beside the account (#151 PL-06/07/15).
  - **The fork's strings ship in French too**, keyed to SYSTEM SETTINGS >
  LANGUAGE (D-UI-051) -- the credential messages first, the rest on 09-17.
  Maintainer: *"we could at least support English and French."*
  - **The startup card names its half and the bar only moves forward** (#157,
  D-UI-052): `RECEIVING · COMPARING SAVES · 113 OF 113`, the bar filling 0-50
  while receiving and 50-100 while sending. The maintainer had seen "113 of
  113" twice with a still bar between: *"no indication that it is working
  correctly."*
  - **The RetroAchievements game page no longer draws its bar over the header
  at 640x480** (#160, #193): the header is left-aligned in both menu modes
  and the bar and its percentage share one row on a visible track.
  
## Offline achievements (BETA) (2026-09-13 to 2026-09-15)

The award the maintainer lost on a train -- unlocked offline, gone when the
game exited -- is what this is for (#162, #163). Built on RAOfflineProxy
(GPL-3, RetroAchievements-approved), packaged natively. Maintainer: *"someone
using RetroAchievements with offline achievements enabled doesn't have to
care whether they're connected or not."* (D-RA-008)

- **`OFFLINE ACHIEVEMENTS (BETA)` is a row under RETROACHIEVEMENTS SETTINGS
  that opens a page of its own**: the switch, `SCAN GAMES FOR OFFLINE
  ACHIEVEMENTS`, then one block of text -- `EARN CASUAL ACHIEVEMENTS WITHOUT A
  CONNECTION. THEY ARE SENT WHEN YOU'RE BACK ONLINE. CASUAL ACHIEVEMENTS ONLY,
  SO TURNING IT ON TURNS HARDCORE MODE OFF. '!RA!' IN A GAME'S CORNER MEANS AN
  ACHIEVEMENT HASN'T REACHED RETROACHIEVEMENTS YET.` (D-RA-001/002/003,
  D-UI-053/054/056). Maintainer: *"put the exclamation point, RA exclamation
  point, in between single quotes, so people know what that means."*
  - **Turning it on says so and offers the scan**: `THIS IS A BETA FEATURE. IT
  WORKS FOR CASUAL ACHIEVEMENTS ONLY, AND TURNING IT ON TURNS HARDCORE MODE
  OFF.` with `TURN ON` / `NOT NOW`, then `SCAN GAMES FOR OFFLINE ACHIEVEMENTS
  NOW?` with `SCAN NOW` / `LATER` (D-RA-012). Hardcore is put back when the
  switch goes off. Maintainer: *"otherwise, they may skip the scan process."*
  - **The scan caches every game on the console that has a set -- no cap** --
  from the interface's own index, without re-hashing; a top-up on connect
  adds what is new, and the page says `NEW GAMES ARE ADDED THE NEXT TIME
  YOU'RE CONNECTED.` (#179, #184, D-RA-010/013/014). The scan page counts
  `GAMES WITH ACHIEVEMENTS ADDED: N` and `NOT SAVED: N`; the row under it
  reads `N GAMES READY FOR OFFLINE PLAY`, or `SAVING GAMES FOR OFFLINE
  PLAY...` with its count while a top-up runs on its own (#189).
  Maintainer: *"I would want every game available for offline play."*
  - **With Wi-Fi off, the achievements pages still show your progress** from
  the store on the device (#180, D-RA-009/011/021): a game's page says
  `YOU'RE OFFLINE. SHOWING YOUR MOST RECENT PROGRESS.`, the summary `YOU'RE
  OFFLINE. SHOWING THE GAMES SAVED FOR OFFLINE PLAY.` Maintainer: *"I just
  turned off Wi-Fi and tried to view the achievements, and I couldn't."*
  - **The cards say what happens next, never that the link was down** (#173,
  D-RA-004/017): at exit `OFFLINE ACHIEVEMENTS WILL BE SENT NEXT TIME YOU'RE
  CONNECTED.` (or `... WILL BE SENT AND SAVES SYNCED NEXT TIME YOU'RE
  CONNECTED.`), on the next connected card `OFFLINE ACHIEVEMENTS HAVE BEEN
  SENT TO RETROACHIEVEMENTS.` Achievements are *sent*, saves are *synced*.
  - **The proxy's synthetic "Warning: Casual Only" achievement never reaches
  the emulator** (it was awarded with a toast at every launch), a game
  without a set reads as unknown rather than an outage, **a settings backup
  never carries the proxy's store**, and the proxy's automatic crash-log
  upload to its developer is off unless you turn it on (D-RA-003/005, #186).
  
## Four fixes found on the way to the release candidate (2026-09-14)

- **The RETROACHIEVEMENTS switch no longer turns itself off** after a boot
  whose sign-in ran before the network was up (#175). A refusal says
  `RETROACHIEVEMENTS DIDN'T ACCEPT YOUR SIGN-IN: <why>` and leaves the switch
  on; an unreachable server says `COULDN'T REACH RETROACHIEVEMENTS TO SIGN YOU
  IN. RETROACHIEVEMENTS STAYS ON. IT'LL SIGN IN WHEN YOU'RE ONLINE.`, and the
  sign-in is retried when the link comes up, nine times ten seconds apart,
  because a hotspot's DNS lags its address.
  - **Your RetroAchievements password is out of the launch log and out of a
  support bundle** (#176, #177, D-INFRA-011): with verbose logging, the
  image's default, `exec.log` had carried it on every launch and
  `rocknix-evidence` copied it. Every value now reads `<redacted>`.
  - **System logos are sharp on every system** (#181). FBNeo, NES and Game Boy
  read soft because one logo was shared between the carousel and a game
  list's header and whichever loaded first fixed its size. Maintainer, after
  a restart: they *"fixed themselves"* -- which is the cause exactly.
  - **Tailscale comes back after a restart when its switch is on** (#174,
  D-NET-010): the switch records your choice, not its seven-second probe's
  answer, which wrote `0` whenever the node still needed a sign-in.
  - **INDEX NEW GAMES AT STARTUP actually runs** (#183, D-RA-018). It had never
  once run on ROCKNIX: the index started only with the splash screen's
  window, and ROCKNIX starts the interface without a splash.
  
## Offline, the achievements pages answer; the login toast says so; save state times; Wi-Fi like a phone; a launch over a sync asks (2026-09-15)

- **RETROACHIEVEMENTS from the main menu answers in seconds with Wi-Fi off**
  (#190, D-RA-020). It hung on PLEASE WAIT: 247 games were 494 requests to a
  proxy that still believed it was online. The interface asks the proxy for
  its store only and reads the summary in one call. Maintainer: *"just gets
  stuck on 'Please Wait' while I'm offline."*
  - **RetroArch's login toast says `RetroAchievements: Logged in as "<account>"
  (offline).`** when the proxy answered from its store, and its backdrop
  covers the text at 640x480 (#194, D-RA-022).
  - **The SAVE STATE MANAGER's times follow SHOW CLOCK IN 12-HOUR FORMAT**:
  `09/15/2026 02:17 AM` with it on, `02:17` with it off, French with a
  literal AM/PM (#195, D-UI-058/066). A Sunday-morning `09:07` had read as
  9:07 pm on a Monday night. Maintainer: *"adding AM or PM to the save state
  time when the user chooses to use the 12-hour clock."*
  - **Playing from a slot loads that slot and keeps RetroArch's exit auto
  save** (#196, D-UI-057). The interface used to put the old auto save back
  over the one RetroArch had just written, so a session from a slot left no
  save state. ROCKNIX ships Batocera's `es_savestates.cfg` entry and the
  launcher turns the chosen file into RetroArch's entry slot. Maintainer:
  *"stay consistent with upstream Batocera game saves."*
  - **NETWORK SETTINGS shows the network you are on.** The `WI-FI NETWORK`
  row's value is the connection -- the name, `NOT CONNECTED`, or `COULDN'T
  CHECK` -- not the last one typed (#191, #201, D-UI-063/071). A opens
  `WI-FI NETWORKS`: the networks in range, the joined one first marked
  `CONNECTED`, remembered ones marked `SAVED`; a press on a saved one joins
  it with no key asked, any other asks the key; a refusal says `COULDN'T
  CONNECT TO <name>.` Switching between home and a phone's hotspot used to
  destroy the saved key. **`MANAGE SAVED NETWORKS`** lists what the device
  remembers, marks the one `IN USE`, and forgets one after `FORGET <name>?`
  (D-UI-062/064/068). Maintainer: *"This matches the paradigm on other
  operating systems, phones, etc."*
  - **Launching a game while saves sync is a question, not a refusal** (#203,
  D-CLOUD-129): `YOUR SAVES ARE SYNCING WITH THE CLOUD.` / `IF YOU STOP IT,
  THE NEXT SYNC FINISHES WHAT THIS ONE DID NOT.` with `STOP IT AND PLAY` /
  `KEEP WAITING`; over a back up or restore left running, `YOUR BACKUP TO
  THE CLOUD IS STILL RUNNING.` / `IF YOU STOP IT, WHAT IT HAS NOT MOVED YET
  WAITS FOR THE NEXT RUN.` A stopped run reads `SKIPPED - YOU STARTED A
  GAME` on the card and `SKIPPED, A GAME WAS STARTED` on its row.
  Maintainer: *"it told me it was stopping so I couldn't play. That seems
  less than ideal."*
  - **The manager's tile labels are a point smaller** (#202). Maintainer: *"the
  text could be a tiny bit smaller, maybe one point or so."*
  
## The automatic syncs ask too; slot numbers never change; the deletion is instant (2026-09-16)

- **The sync at startup and after a game asks the same question** -- `STOP IT
  AND PLAY` / `KEEP WAITING` -- and nothing is cancelled until you answer
  (D-CLOUD-130). Maintainer: *"we should have a consistent behavior."* The
  price, measured: about a second of your own press (D-CLOUD-131).
  - **A save state slot's number never changes**: no renumbering after a
  session or a deletion; gaps stay (D-UI-069). A renumber was a delete plus a
  new file to the sync -- a delete you never made.
  - **Deleting a save state is instant** (#205, D-UI-073): the tile goes the
  frame YES is pressed; the bookkeeping -- the retired row, then the files,
  one unit the script owns -- runs on a worker (D-CLOUD-132/133). It had
  taken a second on the RG SP. A reopened manager never lists a state whose
  file is gone. Maintainer: *"deletions show up quickly."*
  
## COPY TO FREE SLOT is recorded; no flash after a delete; COMPARING SAVES; French for every fork string (2026-09-17)

- **A copy made with COPY TO FREE SLOT is recorded for the sync and refused
  while a sync runs**, as a deletion is: `YOUR SAVES ARE SYNCING WITH THE
  CLOUD.` / `WAIT FOR IT TO FINISH BEFORE COPYING A SAVE STATE - THE
  NOTIFICATION AT THE TOP SAYS WHEN IT IS DONE.` (#206, D-CLOUD-134). The copy
  is as quick as before.
  - **Nothing on the page redraws after the tile goes** (#207, D-UI-074): the
  grid is rebuilt only when the disk disagrees with the page, now the one
  sign a deletion did not take. Maintainer: *"deletes worked as expected
  without the screen redraw issue."*
  - **The sync card's live line says `COMPARING SAVES` while rclone lists and
  compares** -- never `NOTHING SENT YET` between the stages of a sync (#208,
  D-UI-075). A half with nothing to move still ends on its outcome line.
  Maintainer: *"in general, we just want to communicate progress."*
  - **The transfer page says `COMPARING 3 OF 40 FILES`** for the phase the card
  calls COMPARING SAVES; it said CHECKING (#157). **And a transfer stopped
  for a game reads `SKIPPED, A GAME WAS STARTED` on every row it touched**,
  not COULDN'T FINISH (#203).
  - **Every string the fork adds is in French** (#152, D-UI-072): 492 more
  entries, the cloud hub's line shortened so it keeps to two lines at 640x480,
  two English typos in the menu gone. Maintainer: *"we can stick with French."*
  - **ARMSX2 no longer adds a `Token =` line to its `secrets.ini` at every
  launch** (#170); its device check waits for a PS2-capable handheld.
  
## The help bar promises only what the buttons do; badges cached with achievements; a RetroArch crash fixed (2026-09-18 and 2026-09-19)

- **SAVE STATES is offered only where it can happen**, so SCREENSHOTS, TOOLS
  and a PICO-8 list no longer promise it, and **the bar is centred on what it
  draws** (#210) -- it had been centred on a box that included the prompt it
  dropped, 138 px off on a French list. Maintainer: *"this menu doesn't seem
  to appear centered on every playlist."*
  - **A game's badge images are cached with its achievements** (#212,
  D-RA-027): the pass runs at the end of a scan and of a top-up, resumes
  where it stopped, and an image is proved whole before it is kept (#213,
  D-RA-024). The RG SP had 956 images missing across 123 cached games, so
  badges were blank offline. Fetches reuse one connection, several times
  faster (#217). Maintainer: *"whenever we cache the achievements, we cache
  the images for the achievements."*
  - **A RetroArch crash in its video thread is fixed** (#211, #225): a posted
  command could run twice when a frame arrived in the same window -- a dead
  stack frame, or a double free. Read from a core dump off the RG SP: SIGSEGV
  loading a texture while an achievement was being evaluated.
  
## The transfer page's words on a cut run (2026-09-21)

- **A back up cut by the network reads `COULDN'T FINISH` / `DON'T WORRY,
  NOTHING CHANGED.`**, not SKIPPED - YOU'RE NOT ONLINE over WHAT MADE IT IS
  IN YOUR CLOUD (#153). *Skipped* is nothing attempted; the page had called a
  run that moved nine megabytes skipped and claimed a file had landed when
  none had. The note counts files that completed, and the SETTINGS / SAVES
  header and the failed item's name are French on the French page.

## Long work is a page with CANCEL; offline achievements answer at once; thumbnails at the system's shape (2026-09-22)

The maintainer's round on the RG35XX SP (#236) produced three changes in
one night, all three built as one candidate and proven on the VM before
the handheld took them.

- **The offline-achievements scan, the cloud back up / restore page and the
  scraper run on a page that owns the screen until the work ends** (#241,
  D-UI-078). The only way out while any of them runs is CANCEL: a
  confirmation that says what cancelling means -- `GAMES ALREADY SAVED
  STAY SAVED. THE NEXT SCAN CARRIES ON FROM THERE.`, `WHAT'S ALREADY IN
  PLACE STAYS. THE NEXT BACKUP OR RESTORE FINISHES WHAT THIS ONE DIDN'T.`,
  `WHAT'S SCRAPED SO FAR IS KEPT. UPDATE GAMELISTS TO APPLY IT.` -- then
  the stop, and the page ends `SKIPPED - YOU CANCELLED IT` with what the
  run had done. Nothing can be sent to the background any more: the
  earlier "press B to keep it running" left a job with no end signal and an
  outcome on a row the player had to go and find. The scraper's corner card
  and its toast are gone with it. Backgrounding stays for work that is
  fast -- the startup and exit save sync. Maintainer, at the scan page:
  *"we should only allow things to run in the background when they're
  fast."*

- **Found under it and fixed: a refreshed two-line row kept growing.** The
  OFFLINE ACHIEVEMENTS page came back with its scan row drawn a screen
  tall after a long scan, on this candidate and the one before it -- every
  refresh of the row's line moved its split by ten percent. Measured from
  the fonts now; a row refreshed a thousand times keeps its height.

- **Offline, the achievements pages answer in seconds** (#242). With
  OFFLINE ACHIEVEMENTS on and the Wi-Fi off, VIEW THIS GAME'S ACHIEVEMENTS
  ended `An error occurred. Timeout was reached.` and a game's launch
  showed no achievements for half a minute: the proxy on the device gave
  the resolver its full twenty seconds on every request while the
  interface stayed up with a route and no DNS, which is how a handheld goes
  offline as often as not. A name lookup now gets three seconds, before the
  proxy's probe and before every attempt at RetroAchievements, and the
  interface no longer asks the web when offline and the store did not
  answer -- it says `THE OFFLINE ACHIEVEMENTS SERVICE DIDN'T ANSWER. TRY
  AGAIN IN A MOMENT.` instead. Confirmed by the maintainer on the RG35XX
  SP: the page, the offline sign-in toast, the badges.

- **The interface no longer dies after a game in which an achievement was
  unlocked** (#246). Every unlock writes a screenshot, and the folder rescan
  that follows a game exit deleted the SCREENSHOTS entries and then reloaded
  a view still pointing at one of them -- freed memory, which held together
  seventeen times on the VM and not the eighteenth, and on the RG35XX SP
  went at the second exit of the maintainer's offline session. The rescan
  now takes the view down before the files go and remakes it after. And
  when the interface does die, its log carries a backtrace and the crash
  keeper, once armed, keeps the fault itself rather than the teardown.

- **Save-state thumbnails and screenshots are drawn at the shape of the
  system that made them** (#243, D-UI-080). RetroArch writes both at the
  core's native size, which for the NES and the SNES is the pixel grid and
  not the 4:3 picture the game showed, so the SAVE STATE MANAGER's tiles
  and the SCREENSHOTS entry's pictures were a fifth narrower than the game.
  The interface now fits them at the system's display aspect -- 4:3 for
  the consoles and computers whose pixels are not square; the Game Boy,
  GBA and the other square-pixel handhelds as they are. RetroArch's
  capture is left alone. Maintainer: *"It's odd to see certain things
  stretched out of aspect ratio."*

## The round goes on: upright arcade captures, the AUTO SAVE tile, the arrows, a frame gate, DO NOT INCREMENT, the device password, the core note (2026-09-23)

The maintainer's device round on the sixteenth and seventeenth candidates; each
landed on `next` on the 23rd and every one was proven on the VM before the
RG35XX SP took it. (Written under the 22nd's heading until audit #258 PL-024
moved them to the day they landed.)

- **A vertical arcade game's thumbnails and screenshots are upright** (#245,
  D-UI-081). RetroArch turns such a game's frame for the display and its
  capture does not, so the SAVE STATE MANAGER's tiles and the SCREENSHOTS
  entries came out a quarter turn off. The interface now learns each game's
  rotation at the end of its session and turns that game's captures by it
  wherever it draws them: the manager's tiles, the SCREENSHOTS list and its
  grid style, and the full-screen viewer. A game played before this build
  has no session record yet, so the interface takes its turn from the
  core's own driver table, installed with FBNeo, FB Alpha 2012 and 2019,
  MAME 2003-plus and MAME 2010 (#248): every existing thumbnail and
  screenshot is right the moment the build is, with nothing to replay. The
  screenshot RetroArch takes at an achievement unlock is recognised too. The files stay as RetroArch wrote them. Maintainer: *"I think
  we do it on our side."*

- **A game started from the SAVE STATE MANAGER's AUTO SAVE tile runs on
  RetroArch's Auto slot** (#249): the quick menu says `Auto` and the load
  hotkey reloads the auto save the game started from, as it reloads a
  numbered slot's state for a numbered tile. It had stayed on slot 0, so
  the hotkey loaded a different file. Maintainer: *"it doesn't reload the
  autosave."*

- **The SAVE STATE MANAGER's arrow tiles are as they always were** (#250).
  The transform that fits a thumbnail to its system's shape (#243) and
  turns a vertical game's (#245) had been applied to every tile of the
  manager, so the arrow on START NEW GAME and START NEW AUTO SAVE was
  fitted at 4:3 on an NES game and pointed down on a vertical arcade one.
  It now applies only to a tile that shows a capture, and the arrow tiles
  are pixel-identical to a build from before either change. Maintainer:
  *"the arrows should all remain exactly how they were. It's just the
  screenshot itself."*

- **The VM now checks that a build changed only what it meant to** (#252,
  D-QA-038). Every screen the QA walks reach is compared, pixel for pixel,
  with the same screen on the last build accepted on a handheld; a change
  no issue claims fails the run. The arrow in the SAVE STATE MANAGER had
  been wrong for ten builds because each check measured only the
  thumbnail it was about. Three walks of the manager itself (a NES game, a
  Game Boy game, a vertical arcade game) are the first added under it.
  Maintainer: *"I think your recommendation for 252 is a strong
  recommendation, and so we should roll that out as well."*

- **DO NOT INCREMENT now means it** (#209, D-UI-083). With INCREMENTAL SAVE
  STATES set to DO NOT INCREMENT, the save-state hotkey writes the slot the
  game was started from; it had kept making new slots, because the launcher
  read the setting's second spelling as "on". INCREMENT PER SAVE is
  unchanged: a new slot on every save, the launched one untouched, which is
  what the row promises and what Batocera does. A device that still held
  the old "0" now shows DO NOT INCREMENT, which is what it was doing.

- **A device password with a space, a `$` or a quote is set as typed** (#198).
  The interface handed it to the shell unquoted, so it was cut at the space
  or misread; it is quoted now, as the Wi-Fi key already was, and the script
  passes it to the file-sharing password whole.

- **A core dump cut at the keeper's cap says so** (#247). The note compared
  the compressed size to the cap and called a truncated dump whole; it now
  reads the raw count, and the interface's core, mostly texture memory, gets
  a larger cap before its stacks are lost. Only for troubleshooting; the
  keeper stays off on a release candidate (D-QA-029).

## RetroArch's notifications get a floor (2026-09-24)

- **RetroArch's notifications are readable on small panels** (#251,
  D-UI-084). The message queue -- the sign-in banner, "saved state", the
  scan and sync notices -- was drawn at 10 pixels on a 640x480 handheld and
  at the 9-pixel floor on a 480x320 one, where no stroke of the font owns
  a whole pixel; it now has a floor of 14 pixels, where the strokes do.
  Panels at 720p and above are unchanged. Maintainer: *"It just isn't
  nearly as easy to read that text overlay as it is, say, the top-left
  achievement banner."*

## The audit's punch list, fixed before the candidate is called one (2026-09-24)

The milestone audit of the round (#258: 352 boxes re-derived -- the headline read 347 until the second opinion's G-11 -- thirty
findings, none critical or high) was the maintainer's condition for a
release candidate -- *"a full code audit using the code auditor's skill and
being very rigorous"* -- and its punch list was fixed at every severity in
one cut, proven on the VM first. What a player would notice:

- **A fresh device and an updated one land in the same place** (#258
  PL-001). The save-state layout file the OS manages was copied onto a
  freshly flashed device where an updated one has a link, so a later change
  to the shipped file would have reached the second and not the first; the
  first boot now leaves it out of its copy and links it, as every update
  does. `tools/vm-qa`'s new `fresh` suite reads the first-boot state on
  every image.
- **Deleting a save state never removes a file outside the saves folder**
  (#258 PL-002, D-CLOUD-135). The deletion's script refused to record such a
  path and then removed it anyway; it now refuses both.
- **A crash restarts the interface instead of hanging it** (#258 PL-003,
  D-SYS-009). The crash handler wrote to the log under a lock a faulting
  thread could be holding; it writes the signal's name and the frames
  straight to the journal now, and the interface is back in two seconds.
- **The offline RETROACHIEVEMENTS page never waits on the web** (#258
  PL-028, D-RA-028). Offline with nothing cached yet, it said PLEASE WAIT
  for a bounded web request; it says `THE OFFLINE ACHIEVEMENTS SERVICE
  DIDN'T ANSWER. TRY AGAIN IN A MOMENT.`, as the game page has since #242.
- **A screenshot turns the moment its game's rotation is known** (#258
  PL-019). A vertical game's screenshot viewed before its first session kept
  the wrong turn until the interface restarted; the turn is read from the
  record on every look. The grid's looping tiles (the copies drawn at the
  far end of a wrapped SCREENSHOTS list) take the same turn and shape as
  their originals (PL-017).
- **RetroArch's message queue floor and the rest of the round stand**: the
  build carries the seventeenth cut's changes unchanged; this cut is the
  audit's corrections, the ES pin at `4fd019f04`.

Under the surface: the offline-achievements ctl's `refresh` exits 64 on a
bad argument instead of 0 and its `images` and `refresh` verbs can be
stopped by `disable` (PL-012, PL-013); the five arcade rotation tables fail
the build when empty (PL-018); the proxy pin says why it stays (PL-014,
#259); thirty-two comments describe the code as it is (PL-006, PL-009,
PL-010, PL-011, PL-026, PL-027); six tools are sharper and each was seen to
fail once first (PL-004, PL-005, PL-015, PL-020, PL-021, PL-022, PL-030);
and the record -- fourteen issue bodies, the change log's dates, the manifest
schema, the menu map, the rocknix.org draft -- says what the tracker and the
code say (PL-007, PL-008, PL-023, PL-024, PL-029).

### The device round's cut (2026-09-26, `a8175c6193`)

Five things the maintainer met on the RG35XX SP in one evening's soak of the candidate, each read on the device and fixed the same night; every claim below is what the VM showed on the image (vm-qa run 41, the four proofs, `docs/qa-frames/2026-09-26/`).

- **A save state's picture is never turned by another game's rotation** (#280, D-LAUNCH-004). The launcher writes one launch's output to the launch log whatever the log level, and the interface reads a game's rotation only from that launch. Dr. Mario's, F-Zero's and Aladdin's tiles had been turned a quarter turn by Ms. Pac-Man's line at the end of a two-week log; a wrong record heals the next time that game is played.
- **NETWORK SETTINGS > IP ADDRESS reads NOT CONNECTED when the device has no link, even with a tunnel holding an address** (#279, D-UI-092). A tunnel's address is listed and named behind the row, never counted as a connection -- by the offline-achievements check, netplay and the carousel's RetroAchievements action too. The `(+)` beside the first address is upstream's shape and stays until the maintainer chooses words for it.
- **The load-state hotkey reloads the auto save a game was launched from** (#249, D-LAUNCH-005). RetroArch reset the slot to 0 at every content load, from its scan and from its runtime log's memory; a configured Auto slot now survives both.
- **A saves sync after hours offline gets 90 s, not 20** (#282, D-CLOUD-137), and a device on the old number is moved to the new one. One file at a time stays, for Dropbox's lock; why Dropbox is slow (a round trip per file, re-uploads to set a time it cannot set) is on #284 with the faster backends.
- **One pop-up at a time** (#283, D-UI-093): a toast waits while a progress card is up and shows after it for its full time; a card created while a toast is up takes its place and the toast returns after. The SENT toast no longer draws over the sync card.

Under the surface: the QA proofs for these live beside the runner and cost five harness lessons (a fresh guest's Vulkan driver, busybox's `pgrep -x`, the walks' open page, the exit sync's toggle read at start, and the suite launched as a background job), all in the rules and the work log; the QA WebDAV backend refuses a same-name replace of a large file with a 405 (#286).

### The record's provenance cut (2026-09-26, `3f93dc4683`)

One fix, from the maintainer's first look at `a8175c6193` on the RG35XX SP
(*"the existing autosaves from before the upgrade for Doctor Mario and
F-Zero remain rotated clockwise by 90°"*); every claim is what the VM showed
on the image (vm-qa run 42, the #288 proof on two guests, rehearsal run 31,
`docs/qa-frames/2026-09-26/288-*`).

- **A save state's picture and a screenshot made before the fix are drawn
  upright without the game being played again** (#288, D-UI-094). A rotation
  record now says its turn came from the game's own launch; a record written
  by the old reader, which could carry another game's turn (#280), is not
  trusted, and the core's own table stands in until the game's next exit
  rewrites it. Dr. Mario's, F-Zero's and Aladdin's captures read right the
  moment the build boots; a vertical arcade game keeps its turn from the
  table. Nothing is migrated or deleted, and the cloud's copies heal as the
  rewritten record is newer.

Under the surface: the record is two lines (`turns=N`, `from=own-launch`);
`tools/vm-qa`'s manager fixture writes it; and the process change the case
produced -- every fix answers what the old code had already written, as an
`Already written` line of its code trace, checked by `rc-preflight`
(D-WORKFLOW-050, #289) -- changes no image.

### The exit path's cut (2026-09-26, `86dc949300`)

One change, from the maintainer's first evening on `3f93dc4683` (*"It took a
long time to exit from RetroArch"*; no crash -- the device's own timeline
read nine seconds with nothing on screen before the sync card); every claim
is what the VM showed on the image (vm-qa run 43, the #290 proof on two
guests with the capture slowed to the handheld's seconds, rehearsal run 32,
`docs/qa-frames/2026-09-26/290-*`).

- **Leaving a game, the interface is back on screen at once** (#290,
  D-LAUNCH-006). The record of what the session saved, which used to run
  before the window came back and cost the RG35XX SP three blank seconds,
  now runs behind the carousel, and the sync card follows it as before. A
  game started in those seconds goes straight ahead; its own exit then
  syncs both sessions' saves.

Under the surface: the capture and the exit sync's start moved to a worker
thread in `FileData::launchGame` (ES `e563e0024`), with a generation counter
so a game launched and left in between owns the outcome; nothing about what
is synced, or when the card asks STOP IT AND PLAY, changed.

### The offline achievements' own cards (2026-09-26, `64a0934a5d`)

Two asks from the maintainer's play-testing of `86dc949300`, the same evening: the offline achievements' send is
invisible (*"I didn't see the RetroAchievements sync card actually displayed at any point"*, and no record says whether
it ever was, #292), and every automatic process in the saves and achievements lanes should be shown and gated like a
sync (*"if there's activity happening in the background around RetroAchievements or save management, etc., we want
to make sure we're showing the user what's going on"*, #293). Every claim is what the VM showed on the image
(`proof-292-cards-v3` on guest d at 640x480, 23 of 25 checks, the two failures the harness's own; run 1's frames of
the top-up card; `docs/qa-frames/2026-09-26/292-*` and `293-*`).

- **When the device comes back online with achievements waiting, a card says so** (#292, D-RA-030): SENDING OFFLINE
  ACHIEVEMENTS... with the count (1 TO SEND), then COMPLETED and OFFLINE ACHIEVEMENTS HAVE BEEN SENT (TO
  RETROACHIEVEMENTS where the line has room, D-UI-096). When RetroAchievements does not answer within 45 seconds the
  card says COULDN'T FINISH - RETROACHIEVEMENTS STOPPED ANSWERING and IT'LL TRY AGAIN WHEN YOU'RE CONNECTED; the
  proxy keeps the awards and sends them on its next connection, as before. The card's outcome is stamped
  (`/storage/.cache/cloud_sync/last-sync-link`), so "was it shown?" is a read on the device.
- **The exit sync that was skipped for want of a network now runs when the network returns**, with its own SYNC SAVES
  card, after the send card. "SAVES WILL BE SYNCED NEXT TIME YOU'RE CONNECTED" on the exit card had no mechanism
  behind it until now.
- **Nothing about achievements is said when leaving a game.** The exit card says what happened to the saves and
  nothing else; the awards' sentences (WILL BE SENT NEXT TIME..., HAVE BEEN SENT..., the two-part "awards and saves"
  line, the toast after a failed sync) are gone from it, as the maintainer asked.
- **The top-up of achievement data for recently played games is shown while it runs** (#293, D-UI-095): UPDATING
  OFFLINE ACHIEVEMENTS... with N OF M, then COMPLETED and N GAMES ADDED FOR OFFLINE PLAY. (or YOUR OFFLINE
  ACHIEVEMENTS ARE UP TO DATE.). A run with nothing to do shows nothing.
- **A game launched over either asks, in the same shape as over a sync** (D-UI-096): OFFLINE ACHIEVEMENTS ARE BEING
  SENT. IT'LL BE A MOMENT. with PLAY NOW (the send goes on behind the game) and KEEP WAITING; YOUR OFFLINE
  ACHIEVEMENTS ARE BEING UPDATED. IF YOU STOP IT, IT'LL TRY AGAIN NEXT TIME YOU'RE CONNECTED. with STOP IT AND PLAY
  and KEEP WAITING. The safe verb is last, where the back button lands.
- **Alerts come one at a time, in order** (D-UI-093, #283; the maintainer on the device, 2026-09-26: *"I just saw the
  new stacked alerts. Those were nice ... That's an elegant solution to the problem."*). A toast waits while a card
  is up; a card made while a toast is up takes its place and puts the toast's words back on the queue to show after
  it; the send card waits for a sync card to finish, and an automatic sync that reached the network asks for it as it
  ends. So a reconnect reads as a sequence -- SYNC SAVES, then SEND OFFLINE ACHIEVEMENTS, then the top-up's card --
  and a capture that could not record says so after the sync card, never over it (`292-*`, `293-capture-failed-*`).

Under the surface: a new `ProxyCards` unit in EmulationStation (ES `0ade9086b` to `6e6643687`); the send card follows
the proxy's own queue (`raofflineproxy-ctl pending`) and takes its flush stamp; the top-up card reads the ctl's
progress file, and STOP IT AND PLAY signals the run through the pid in the ctl's lock. Two findings of the proof were
fixed before the cut: a sync that found no network no longer asks for the send card at its end (the link's return
does), and PLAY NOW launches once instead of asking again. RAOfflineProxy stays at `0711f0b` for this cut
(D-RA-031: upstream's same-day commit is spruce and Onion platform work). Not yet proven end to end: an award
earned offline going up at the link with the card saying so -- the QA account's one routed achievement is spent
(earned 2026-09-25 16:22 UTC), so the proof shims the proxy's count and the real-award run waits for the account's
reset.

### A capture that could not record says so; the proxy at upstream main (2026-09-26, `d72084ccad`)

The maintainer approved the copy of `64a0934a5d` and then asked for #293's last item to be in the build (*"It was a
relatively quick fix, and I would have rather included it in the last build"*), so the copy was held and the candidate
cut again. Every claim is what the VM showed on the image (`proof-293-toast-v2` on guest d, 8 of 8;
`docs/qa-frames/2026-09-26/293-capture-failed-*`).

- **A capture that could not record says so, once.** The record of what a session saved (`cloud_capture`, the
  bookkeeping behind the save manifest) used to fail into a log line nobody sees. Now, after the sync card has
  gone, a toast says COULDN'T RECORD THIS SESSION'S SAVES. THEY'RE STILL ON THIS DEVICE. -- what did not happen and
  what is in place, in the player's words. The sync card runs first and still runs. After the startup game the
  same sentence is said once the interface is up. A session whose capture recorded shows nothing.
- **RAOfflineProxy moves to upstream main** (`c1bd3724d1`, 2026-09-26; D-RA-032): spruce and Onion platform work
  upstream, nothing the ROCKNIX image runs changed, every fork patch unchanged; taken once the maintainer reset the
  QA account so the proxy's own proof could run on the image (the cut's record names the run).

### Six changes of the round this log had not named (written 2026-09-26, #294)

The maintainer asked for the running log to be fully up to date. Checked against every fork issue closed as
completed since 2026-09-24: thirty were not named here by number; twenty-four are process, harness or older work the
log already describes in words; these six changed what a player sees and had no entry. Each is a claim its issue
closed on, against the cut named.

- **The RetroAchievements pages open on fork builds.** RETROACHIEVEMENTS from the main menu and a game's context
  menu answered 401 on every fork image, because the web API key is a build-time secret the fork does not carry;
  the key is now entered on the device beside the account, as the ScreenScraper pair is (#68; frames on
  `77e7e97515`, on the RG35XX SP since `664ad9ac64`).
- **Screenshots taken during a session appear in the image viewer when the game ends**, not after UPDATE
  GAMELISTS (#82; *"It is a bit bizarre that it takes an update to see it"*; frames on `664ad9ac64`).
- **Rows that cannot run yet are drawn dimmed**, as the style guide always said: the menu recoloured every row
  every frame, so a row dimmed once was normal by the first frame (#182; RC-11 build 2 `a6d032bf5e`, 640x480).
- **An offline top-up that finished is COMPLETED**, even when the badge downloads after it outlive the bound; RC-7
  stamped a run whose worker had reported DONE as TOOK TOO LONG (#188; the RG35XX SP's first full scan on the
  fix, 238 games, COMPLETED).
- **The offline achievements summary answers at once.** A game whose icon was not cached stalled the proxy about
  34 s per image and the page waited behind it; images from the device path are store-only and an offline miss
  answers immediately (#199; RC-11 build 2 `a6d032bf5e`, a 200-game list).
- **A settings backup no longer carries the IGDB scraper's client secret** (`backuptool` strips it beside the two
  ScreenScraper passwords; the strip has a test for the first time) (#274; `c939df737a`, the scripts suite).

### The milestone audit's fixes, and the audit of the fixes (2026-09-28, #307/#308/#309)

The audit's punch list (#307) and the seats' remaining findings (#308) were worked through by eight streams in one day
(D-WORKFLOW-054, D-WORKFLOW-055/056), built once as `4234be0b6b`, audited by two seats (D-WORKFLOW-057; 165 findings,
every one fixed with a case first or withdrawn with its refuting line the same day, #309 for the six carried), and
built again with the follow-ups as `1b0d233657`. What a player would notice, by where they meet it, each item with its
stream. Words marked proposed are built in and wait on the maintainer's approval (D-UI-112, D-UI-115).

#### The cloud pages

- **A content match removes only what its preview showed** (PL-001, stream A, D-CLOUD-141): YES carries out the
  preview's plan, and a system not in it, or whose count grew, is refused with `SOMETHING CHANGED SINCE YOU CHECKED`.
  Before, YES counted again, and a system whose cloud listing failed read as absent and had its games deleted.
- **A match never deletes N64 `.fla` saves** (PL-079, #308 gpt F-CS-02, stream A), and the done page's `REMOVED N
  FILES FROM THIS DEVICE` counts what rclone deleted, not the plan (#308 gpt F-CS-26).
- **Restoring all ROMs and BIOS brings the BIOS too** (PL-012, stream A), where it brought the ROMs alone and let
  through images the media filter should have kept out. BIOS picked alone is a selection (#308 gpt F-ES-10, streams E2
  and A), and an empty cloud ends `Nothing to restore` as a completed run, where it exited 3.
- **Content runs end with the outcome that happened** (stream A): nothing to back up is `COMPLETED`, not a failure
  (#308 claude F-CS-15); a game list that did not move fails its system (PL-066); a restore the network cut after
  files moved is `COULDN'T FINISH` with `YOU WENT OFFLINE PART-WAY THROUGH`, not a skip (#308 claude F-CS-24).
- **A saves folder at the top of the cloud is refused where it is typed** (PL-015, streams C and A): `Your saves
  folder needs to sit inside another folder, so your settings backups and games can go beside it.` `Try /GAMES/Saves.`
  Before, they went inside it (`/GAMES/Backups`, `/GAMES/Content`).
- **A cloud folder name with `&` or `|` works, and one with `"`, `$`, a backtick, or `\` is refused where it is
  typed** (PL-051, streams C and A, D-CLOUD-142), where `/R&D/Saves` garbled the config. A config holding a command no
  longer runs it: the run ends `COULDN'T FINISH` with `YOUR CLOUD SYNC SETTINGS COULDN'T BE READ`.
- **Moving the cloud to the new layout copies, checks, and only then deletes** (PL-025/026/027/053/071, stream A,
  D-CLOUD-143): the backups go first and never into `Saves`, a listing that fails stops it, and a failed move ends
  `THE NEW FOLDER ALREADY HAS FILES IN IT` or `SOME FILES DIDN'T FINISH`, where it said `Done.`
- **Cloud setup writes a README only into a folder that has none** (PL-047, stream C): a failed check overwrote the
  owner's own README with ours, and a bucket got none.
- **A dim cloud row works as soon as setup is done** (PL-062, stream E2), where it offered setup again and stayed dim.
  After CHANGE CLOUD FOLDER succeeds, the hub reopens with the new folder (#308 claude F-ES-03/F-ES-27).
- **After a folder change the hub comes back on CHANGE CLOUD FOLDER** (the fix audit's G-E2-O1, stream E2): the
  reopened page put the cursor on its first row with the changed row off the screen; the walk found it.
- **The match's done page counts what it removed, and its retry is the row that checks again** (#308 gpt F-CS-26,
  stream E2): `N FILES WERE REMOVED FROM THIS DEVICE.` alone -- `YOUR CLOUD STILL HAS THEM` said the opposite of what a
  match does (D-CLOUD-023) -- and line 7 reads `TRY AGAIN: MATCH THIS DEVICE TO THE CLOUD`, since a bare apply is
  refused: `CHECK WHAT WOULD CHANGE FIRST` (fix audit G-A-O2, stream A), in French too.
- **A filter file the player names is used as written** (fix audit G-A-O1, stream A): the catch-all check applies to
  the managed rules file only; a player's own `--filter-from` without `- /**` no longer stops the saves backup.
- **A saves folder named like its own sibling is refused where it is typed** (fix audit gpt G-C-01, stream C):
  `/Mine/Backups` put the saves and the settings backups in one folder; now `Try /Mine/Saves.` The masked box's
  can't-type warning gives a count, not the characters (gpt G-C-05), and every refusal says "cloud folder", the
  row's own name (claude G-C-03).
- **A saves folder at the top of the cloud keeps no copy of what it replaces, and says so** (fix audit gpt G-A-09,
  stream A, D-CLOUD-146): rclone cannot keep the set-aside folder inside the folder it writes; the console and the
  Completed line say it. Moving the folder inside another brings the copy back.
- **Moving the cloud to the new layout checks exactly, and stops before it deletes** (fix audit gpt G-A-01/02, stream
  A): the check must exit 0 with zero differences (ten differences once read as none and deleted ten saves), and a
  pointer that did not land -- `YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED` -- stops the run with both copies kept.
- **The CONNECTED page says whether saves already sync** (#308 gpt F-ES-19, stream E2) and no longer says ROMs and
  BIOS are never included. WITH MY PHONE's and CHANGE CLOUD FOLDER's descriptions fit one line again (#308 claude
  F-ES-14), and the sync row's confirmation explains the run the row shows (#308 gpt F-ES-16).
- **Why a run failed is in French in a French interface** (#308 gpt F-CS-31, streams E1 and E2), on the sync card, the
  cloud rows, and the transfer page's done line; the maintenance dialogs still show it in English.
- **The long-job pages name no button letters and draw their own help bar** (#308 claude F-RA-14, F-CS-07, F-ES-05,
  stream E2): the transfer, scan, and scraper pages; no line is cut inside a character (#308 gpt F-RA-23).
- **CANCEL stops a transfer even before its script starts** (#308 claude F-CS-26, stream E2), a completed run is not
  called stopped, and a backup cancelled before it began keeps the row's last run (#308 claude F-CS-05).

#### The saves sync

- **A sync that moved saves and then lost the link says what moved** (PL-072, stream E1): the card still reads SKIPPED
  and now keeps `THE SAVES THAT MADE IT ARE ON BOTH SIDES. NOTHING ELSE CHANGED.`, where it had no in-place clause.
- **The automatic sync ends inside its ceiling** (#308 gpt F-CS-34, stream A), its probe included (31 s became 3 s in
  the harness), and a long cloud listing is no longer ended as a stall (PL-080).
- **Saves in a folder at the root of the remote back up** (#308 claude F-CS-25, stream A), without the set-aside copy
  rclone cannot keep inside the folder it writes; before, rclone refused the whole run (exit 7).
- **A run whose settings part failed reads `COULDN'T FINISH`** (PL-028, stream A), not `Completed.`; a sync that could
  not record its saves' card ends `COULDN'T RECORD WHICH CARD YOUR SAVES ARE ON` (#308 gpt F-CS-20).
- **Save-state DELETE and COPY wait for a cloud transfer, not just the interface's sync** (PL-068, streams E1 and E2):
  refused with `A SYNC IS ALREADY RUNNING.` `WAIT FOR IT TO FINISH, THEN TRY AGAIN.`, and a queued deletion waits.

#### Backup and restore of settings

- **A settings backup that finds a sign-in is refused before it is written** (PL-005, PL-006, stream B, D-CLOUD-144):
  `A SIGN-IN WAS FOUND IN THE BACKUP, SO IT WASN'T KEPT. YOUR LAST BACKUP IS UNCHANGED.` (proposed words, for the
  maintainer's approval). Before, the scan warned and the archive was kept and published, and it missed `Password=`.
- **A backup list's problems are said for what they are** (PL-038, PL-035, #308 claude F-BR-17, stream B): `YOUR OWN
  BACKUP LIST NAMES A FOLDER A BACKUP CAN'T CARRY, SO NOTHING WAS WRITTEN. YOUR LAST BACKUP IS UNCHANGED.` where a
  folder outside `/storage` was dropped silently; `YOUR OWN BACKUP LIST IS EMPTY, SO THE STANDARD ONE WAS USED.`;
  `THERE'S NOTHING TO BACK UP YET. YOUR LAST BACKUP IS UNCHANGED.` where it said `THE BACKUP COULDN'T FINISH WHILE
  GATHERING YOUR SETTINGS` (proposed words, for the maintainer's approval).
- **A backup carries every listed folder, never earlier backups** (PL-004, PL-008, stream B): a folder whose name had
  a space was dropped, and a list with `/storage/roms` nested earlier backups, sign-ins and all, in the new one.
- **One settings backup or restore at a time** (PL-077, #308 claude F-BR-15, stream B): a second is refused with `A
  SETTINGS BACKUP OR RESTORE IS ALREADY RUNNING. WAIT FOR IT TO FINISH, THEN TRY AGAIN.` (proposed words, for the
  maintainer's approval), where two in the same second took one archive's name.
- **A restore keeps this device's cloud sign-in and name** (PL-010, stream B), which restoring a legacy archive
  replaced, and an undated legacy archive in the cloud no longer outranks a dated one (#308 gpt F-CS-35, stream A).
- **A restore that stops part-way puts the device back as it was** (PL-007, PL-009, PL-039, PL-045, stream B,
  D-CLOUD-144): the first copy covers every file the archive replaces and records the ones it creates, a copy or mark
  that cannot be written stops the restore, and a revert is not skipped when the copy's card is not yet mounted.
- **A restore resets a file the backup left out as the image's own** (PL-037, stream B), and a tar archive no longer
  replaces a file the system provides as a link (#308 gpt F-BR-13): `KEEPING N FILE(S) THE SYSTEM PROVIDES THAT THIS
  BACKUP WOULD HAVE REPLACED.` (proposed words, for the maintainer's approval).
- **The backup's messages say why in the player's words** (#308 claude F-BR-12, stream B; claude F-ES-13, stream E2):
  `THIS DEVICE'S SETTINGS BACKUP IS DAMAGED. NOTHING WAS CHANGED. RESTORE SETTINGS FROM THE CLOUD AGAIN, OR BACK UP
  SETTINGS TO REPLACE IT.`, `THIS DEVICE CAN'T RESTORE SETTINGS. SOMETHING IT NEEDS IS MISSING FROM THIS BUILD.`, and
  the note `COPY IT SOMEWHERE SAFE, OR BACK UP SETTINGS TO THE CLOUD UNDER GAME SETTINGS > MANAGE CLOUD STORAGE.`
  (proposed words, for the maintainer's approval), where a dialog read `tar: short read`.
- **Nothing waits on a console nobody reads** (#308 claude F-BR-19, F-CS-04, streams B and A), and old
  `ARCHIVED_ROCKNIX_BACKUP-*.zip` files go to `archive/`, not to the cloud with every backup (#308 claude F-BR-07).
- **The settings-first restore restores what was ticked** (PL-029, stream E2, D-UI-113): after the restart it restores
  the ticked tiers alone, where it also ran `cloud_content_restore --all`. FINISH RESTORE PROCESS's RetroAchievements,
  ScreenScraper, and netplay passwords now reach the disk (a restart lost them).
- **Settings survive two writers and a cut write** (PL-024, PL-063, PL-064, streams E1 and B, D-CLOUD-145): a save
  that cannot take the lock writes nothing and keeps the change for the next save, and a whole `system.cfg.tmp` left
  by a cut write is loaded, not replaced by the defaults.
- **A restore cut off on a one-card device is put back at the next boot** (fix audit gpt G-B-05/08/10 and B's own
  reading, stream B): the boot's revert reads the mount table, where busybox `mountpoint` never saw `/storage/roms`
  (a bind on the same card) as mounted and deferred the revert for ever -- the VM proof of PL-045 on `4234be0b6b`
  found exactly that. Old `ARCHIVED_ROCKNIX_BACKUP-*.zip` files go to `archive/upstream-era/`, trimmed by nothing and
  uploaded by nothing (D-CLOUD-148).
- **A settings backup refuses, rather than guesses, when it cannot check itself** (fix audit gpt G-B-01..07, stream
  B): a listing that fails is a failed check, a sign-in scan that cannot finish stops the backup with nothing written,
  and the last-good copies beside a stripped file (`.backup`, `.bak`, `.tmp`, `.old`) are held back with it
  (D-CLOUD-147). A cut `system.cfg` that is the start of its record loads the record (fix audit claude G-E1-02,
  stream E1), and the Wi-Fi picker keeps a refused save's changes until the join rewrites them (gpt G-03).
- **A restore whose record of what was ticked cannot be written does not start** (fix audit gpt G-E2-01/02, stream
  E2): `COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED.` (proposed words, D-UI-115).
- **A factory reset that cannot clear a folder stops before copying** (PL-044, stream B), with `THE DEFAULT SETTINGS
  COULDN'T BE PUT BACK.`, where it copied the defaults into the folder it had not cleared.

#### The RetroAchievements cards and pages

- **The send card says the awards are on the account only when the service says so** (PL-054, stream E2): with the
  queue empty and no flush stamp it reads `COMPLETED` alone, not `WHAT YOU EARNED OFFLINE IS NOW ON YOUR ACCOUNT.`
- **A top-up stopped for a game says so** (#308 claude F-RA-09, gpt F-RA-17, stream E2): `SKIPPED - YOU STARTED A
  GAME`, with a why from this run's stamp only, and `SOME GAMES COULDN'T BE SAVED` without the scan's instruction. Two
  top-ups asked for at once run one after the other, where they shared one progress file (PL-056, D-UI-113).
- **The scan and the top-up say when achievement images could not be saved** (PL-060, streams D and E2, D-UI-112):
  `SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED. TRY THE SCAN AGAIN.` and `SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED`
  (proposed words, for the maintainer's approval). A badge the server lacks is absent, not a failure (D-RA-039).
- **A scan's outcome is what its passes did** (fix audit, stream D, D-RA-042): the image pass runs whenever the scan
  worked through its jobs, and a scan whose images still fail ends with the sentence above rather than COMPLETED; a
  pass with no time left, a library that could not be listed, or a cursor that could not be kept each end as a
  failure with its own why. A badge the server lacks is asked for again after a day (D-RA-041), and CANCEL during
  the image pass is proven at 0.02 s where the old scripts took 20 s.
- **Closing the RetroAchievements settings page offline no longer waits on a sign-in** (#308 claude F-RA-19, stream
  E2), and a top-up stopped for a game holds its queued run until that game has ended (fix audit claude G-E2-02).
- **A PSP game reaches the offline proxy only over an address PPSSPP can use** (fix audit gpt G-D-02, streams D and
  F2, D-RA-043): a listener on `::1` alone no longer counts as the proxy.
- **The offline summary lists games that were only launched, and says when progress could not be read** (PL-057,
  streams D and E2, D-UI-112): `YOUR PROGRESS COULDN'T BE READ` with no bar (proposed words, for the maintainer's
  approval), where an unreadable count showed as none unlocked.
- **CANCEL during the scan's image pass ends the scan at once** (PL-013, stream D): 0.02 s in the harness, where every
  queued download ran first (20 s). Turning offline achievements off keeps the hardcore setting (#308 gpt F-RA-18).
- **A big library's scan walks on from where the last one stopped** (PL-059, stream D), and the page says when a scan
  was cut short; the same first files held the front of every walk.
- **A PSP game counts as played for the top-up at the link's return** (#308 gpt F-RA-13, stream D): the wake check
  reads `ppsspp.ini`, where a PPSSPP session read as nothing played.
- **An offline game index toasts nothing** (#308 claude F-RA-05, stream E2), where it said `INDEXING COMPLETED. UPDATE
  GAMELISTS TO APPLY CHANGES.`; its retry at a link's return runs at most once in ten minutes (#308 claude F-ES-09).
- **With offline achievements on, the interface waits for the service to be listening** (#308 gpt F-RA-26, stream D,
  D-RA-040), so a first launch no longer races it; boot to the carousel is measured on the next cut.

#### Wi-Fi and the cloud sign-in

- **A saved network's password is stored as typed** (PL-003, #308 claude F-WF-02, stream B), where one with `:` or `\`
  was stored escaped (`ab\:cd\\ef12345`). Forgetting a network forgets the settings' copy of its name and password
  (#308 claude F-WF-01), and a join writes the network's SSID, not its profile's name (#308 claude F-WF-12).
- **The connected row joins by its SSID, not its profile's name** (#308 claude F-WF-12 / gpt F-WF-03, stream E2),
  and `wifictl saved --ssid` gives the picker the SSID beside the name for the next round (fix audit gpt G-B-11).
- **The scan shows names with `:` as they are** (#308 claude F-WF-05, stream B), a saved name with a tab can be joined
  and forgotten (#308 claude F-WF-06), and a join is judged on this device's adapter (PL-031).
- **The picker tells "could not ask" from "none"** (#308 claude F-WF-03, streams E1 and E2) and offers `CHECK AGAIN
  NOW?`; a failed join says `THE WI-FI SERVICE DIDN'T ANSWER. TRY AGAIN IN A MOMENT.` when it did not answer.
- **Joined reads CONNECTED everywhere** (#308 gpt F-WF-08, stream E1; claude F-WF-11, stream E2): the toast is
  `<glyph> <name> : CONNECTED`, and MANAGE SAVED NETWORKS says CONNECTED where it said IN USE.
- **Signing in on the device works with offline achievements on** (#308 claude F-RS-18, stream C): both wanted port
  8080 and every on-device sign-in failed; the sign-in now listens on the LAN address.
- **What is typed on the phone arrives, and Back deletes what the box shows** (PL-016, PL-017, stream C): text typed
  before the window opened is sent when the page opens, where the field stayed empty, and `abc`, Back, `d` no longer
  gives `abd` in the field and `abcd` in the box.
- **The phone page masks the box and says keystrokes cross the network unencrypted** (#308 gpt F-RS-14, stream C;
  D-NET-012 open), names the characters the handheld cannot type (#308 claude F-RS-16), and has a Close page key (#308
  gpt F-RS-16). The on-screen keyboard gains a symbols layout, `#+=` (#308 gpt F-RS-12).
- **After a sign-in the pad is handed back before the interface is told** (PL-018, stream C), so the menu moves
  without a restart. Leaving the page cancels the sign-in and closes its window (#308 gpt F-ES-17, stream E2; PL-049),
  and a sign-in that died reads failed rather than waiting (PL-050).

#### The game launch and the game lists

- **A game started while the last one's saves are being recorded waits for them** (PL-061, stream E2): unseen for 300
  ms, then up to 10 s behind `RECORDING YOUR LAST GAME'S SAVES...`, and then the game starts anyway.
- **At the ten-second bound the launch is refused, not let through over an unfinished record** (fix audit gpt
  G-E2-03, stream E2): `YOUR LAST GAME'S SAVES ARE STILL BEING RECORDED. TRY AGAIN IN A MOMENT.` (proposed words,
  D-UI-115); a capture older than two minutes is treated as hung and stops holding launches.
- **A game's rotation record is trusted only when the launch it came from was checked** (fix audit gpt G-E2-06,
  stream E2, D-UI-114): records an earlier build stamped from a failed or empty launch fall back to the core's own
  table until the game's next exit rewrites them.
- **A kept guest's N64 controls are repaired at the next launch** (fix audit claude G-F2-08, stream F2): the six
  pasted Control1 lines are removed from an existing copy, on GENERIC_X64 only, with the player's other settings kept.
- **START NEW GAME no longer lands on the Auto slot because a `-1` was saved in RetroArch's main config** (#308 claude
  F-RW-05, stream F2): patch 0018 keeps Auto only when this launch's own configuration asks for it.
- **A launch reads its platform right when a netplay nickname has `-P` in it** (#308 claude F-ES-20, streams B and
  E2): `My-Player` after `-Psnes` made the launcher read `layer'`.
- **A folder rescan keeps the games still on disk** (PL-014, stream E2, D-UI-113), merging where it cleared and
  reloaded while the collections still pointed at the old entries.

#### GENERIC_X64, the developers' harness (D-QA-053)

- **A guest's boot writes nothing into the image** (PL-019, PL-042, PL-022, stream F1): the quirk scripts behind 51
  `Read-only file system` lines a boot are gone, and the 20 files they left in `/storage` are removed by name. A guest
  whose local filesystems fail now stops at the emergency target, as every other device does.
- **The serial root shell starts only on a virtual machine** (PL-023, stream F1), and the bootloader updater that
  copied nothing is gone (PL-073).
- **RetroArch on a guest follows the guest's mode and draws with `gl`** (PL-034, #308 claude F-VM-10/F-VM-11, stream
  F1), keeping a size set by hand; a config on `vulkan` moves to `gl` while the image has no Vulkan driver.
- **`generic-x64-vm qemu-args` prints and touches nothing** (PL-033, stream F1), where it removed the sockets, and a
  disk passed as `--monitor`; a fresh guest's N64 Control1 mappings are live (#308 claude F-VM-09, stream F2).

Under the surface: the cloud scripts install a rules file only whole (PL-020), spare the set-aside folder and archive
a run just wrote when they prune (PL-021), commit a capture under a lock of its own (PL-067), and log no rclone
arguments or `pass=` (PL-074); backuptool stages on the storage card, not in RAM (#308 claude F-BR-09); the offline
service keeps its index marker until a listing succeeds (PL-055, D-RA-040); a sync no longer leaks about 8 MiB of
thread stack (PL-069). Patch 0017's font tables now apply to the faces they were measured for, and the face every
shipped profile draws has none, so nothing changes on screen (PL-032, D-UI-110). Where a test could reach a fix, it
came with a case seen to fail first, in `tools/last-good-scripts-test` or the EmulationStation unit suites.

Checked on `1b0d233657`: vm-qa run 69 (`qa-1b0d233657-webdav-a-20260928-0622`, 06:22-06:47 UTC) -- the scripts harness
(844+ checks, the cancel checks included), the round trip with its two changed steps (the player's own filter file honoured,
the match checked before it applies), the exit test, time to play 0.58 s to a game's first frame and 1.01 s game to game, the
walks, and frame-diff against the d72084ccad baseline with twelve claimed boxes and none unclaimed (the hub reopened on CHANGE
CLOUD FOLDER after a folder change, the PICO-8 row, the footer without a console letter, the folder row's new line); the
French and vocabulary suites clean. The streams' named proofs on guest d: run 2 on guest d rebuilt from the image (`docs/qa-frames/2026-09-28/proofs-307/run2.md`), 38 rows: 32 PASS,
1 FAIL (the launch/exit cycle's 10 MiB of address space a game, #310, the same with the sync off), 4 that this guest cannot
run (no Wi-Fi adapter for the join and the second adapter; the rehearsal takes the QA pair; frame-diff frames no RetroArch
widget), 3 with no script yet (E1's follow-up, three of E2's, the migration on WebDAV). Among the passes on this cut: the
one-card revert after a cut restore (7 PASS, where the first cut deferred it for ever), the launch refused at the capture
gate's ten-second bound with its sentence on the frame, the hub reopened on CHANGE CLOUD FOLDER, the truncated scan's page
and its kept cursor, an unrecorded RetroArch size left alone, the auto slot kept and a saved -1 not sticking, the settings
lock's refused save landing after the join. proof-298 on the same guest: 35 PASS, 0 FAIL. Some passes rest on named
stand-ins (a provider bound over rclone authorize, a uinput pad, a delayed capture, a black-holed media host); each is
named in the run's row, and a stand-in keeps its checkbox open until the real input has been seen once (audit #258, P-05).

### The cloud scans first, the folder is /Rasteratops, and the dialogs come where you are (2026-10-01, `1acdaf2cce`, #354)

The cloud epic for 0.0.1 (#349, #350, #351, #352, #353), proven on guest d
at 640x480 and on the guest pair before any device. What a player notices:

- **BACK UP TO THE CLOUD and RESTORE FROM THE CLOUD open on a page that
  checks the cloud first** -- CHECKING YOUR CLOUD, three items, a few
  seconds -- and the options page after it offers only what the cloud
  holds for this device (D-CLOUD-156/167). A check that could not finish
  stays on its page with its why and TRY AGAIN beside CLOSE; CANCEL is the
  way out while it runs. The comparison that used to run as a loader over
  the options page is gone (the pop-up over a pop-up, #350).
- **SETTINGS is offered only from this device's own backup.** With one in
  the cloud the row says which device and when; with none, or only another
  device's, it is dimmed with NO SETTINGS BACKUP FROM THIS DEVICE YET
  (D-CLOUD-162, #349).
- **The default cloud folder is /Rasteratops** (D-CLOUD-158): saves,
  settings backups and game content under it. A device whose cloud holds
  the earlier /ROCKNIX, or upstream's /GAMES, is asked once, at the check
  -- YOUR CLOUD HAS A /ROCKNIX FOLDER FROM AN EARLIER VERSION. MOVE IT TO
  /Rasteratops? YOUR OTHER DEVICES WILL FOLLOW. -- with MOVE first, KEEP
  USING /ROCKNIX and NOT NOW (D-CLOUD-160). MOVE copies, checks the copy,
  then removes the old folder, on a page of its own (MOVING YOUR CLOUD
  FOLDER), and carries the set-aside of discarded saves with it
  (D-CLOUD-165). A device with no current folder is offered one -- CREATE
  IT, WITH FOLDERS FOR SAVES, SETTINGS BACKUPS, AND GAME CONTENT? -- or
  CHOOSE A FOLDER (D-CLOUD-161); a carried /GAMES setting counts as no
  folder at all.
- **The other devices follow.** A device still on the old folder with
  nothing in it is re-pointed at the fleet's new one without a question;
  one that kept playing on an older build, and so has saves under the old
  name, merges into the fleet's folder when it moves: the newer copy of
  each save is kept, every version that differs is set aside first under
  Saves-replaced, and the old folder goes only once every file is in the
  new one (D-CLOUD-168; the mixed-installation test on `tools/vm-pair`).
- **The startup and exit syncs ask nothing.** With no saves folder in the
  cloud the card reads SKIPPED - YOUR CLOUD FOLDER ISN'T SET UP YET with
  SET IT UP: GAME SETTINGS > MANAGE CLOUD STORAGE, and the row under SYNC
  SAVES DURING STARTUP says the same; the question the Nova met at startup
  is asked at the cloud setup and on the transfer pages instead
  (D-CLOUD-166).
- **CONTENT TO RESTORE lists only what is ours.** The listing shows ROM
  systems, BIOS and known content folders, never the rest of a cloud's
  root (#352); where the configured content root holds nothing of ours and
  the cloud root's Content folder does, that folder is used; where nothing
  is found, YOUR CLOUD HAS NO ROMS OR BIOS AT <folder>. CHOOSE THE FOLDER
  WHERE YOUR GAMES ARE? opens CHOOSE A CLOUD FOLDER with the cloud's root
  folders.
- **The phone keyboard page's Close asks once**, from the bottom of the
  page under the note: Close the sign-in page on your handheld? with Keep
  and Close (D-CLOUD-163); the line between the heading and the field has
  room; the handheld's finishing page reads Connected / Finishing up on
  your handheld... in the page's own style; the sign-in window tells a
  provider it is a handset, so Dropbox's pages arrive in their touch layout
  (D-NET-016, #351).
- **Fixed on the way**: the transfer verb read a freed pointer after
  closing its page and crashed on the scan-opened page (read from a kept
  core); the approved scan line and the move's note drop a clause at 640
  px rather than clipping; the move's summary says MOVED.

Every new string ships with its French (D-UI-051). `docs/es-menu-map.md`
carries the five new screens; `tools/es-menu-map-check` reads 0 missing.

- **TIDY UP YOUR CLOUD FOLDERS says what it would move and where** -- MOVE
  SAVES AND SETTINGS BACKUPS INTO /Rasteratops. NOTHING IS DELETED., or the
  content folder alone when that is all the check plans, and no row at all
  when only a setting would change. The line had named /ROCKNIX, an earlier
  build's folder, whatever the check planned (run 96's hub frames; ES
  `1d05f558f`, D-CLOUD-156). The MOVE THEM? preview now lists the content
  move it makes beside the saves and the backups.

- **On the phone keyboard page, Close page shows its question only when
  pressed** -- the first build of the two-step Close drew the question
  beside a squeezed button from the start, because a class rule's
  `display` won over the `hidden` attribute (run 97's 390 px render,
  `docs/qa-frames/2026-10-01/351/`). And **RESTORE FROM THE CLOUD's dimmed
  SETTINGS row lines up with the rows above it** (ES `551c5a762`); it sat
  flush with the panel's left edge.

- **A new handheld set up on a cloud your other handhelds already use sees
  your saves at once** -- when they are still in the earlier `/ROCKNIX`
  folder (or in upstream's `/GAMES`), the setup joins that folder instead of
  making an empty `/Rasteratops` beside it, and the move is offered on the
  first transfer page as on the others (D-CLOUD-169). A handheld that came
  from stock ROCKNIX no longer gets a `/GAMES` folder made by the setup, and
  KEEP USING /ROCKNIX keeps `/ROCKNIX` on it. A cloud that cannot be read is
  no longer mistaken for an empty one by the folder check.

### The phone keyboard page works again, and says when it cannot reach the handheld (2026-09-29, `69e6039f8f`, #330)

Found by the maintainer pairing Dropbox on the Retroid Pocket Nova with the phone keyboard page: `Checking…` under the title for as long as the page was open, taps on the pointer pad doing nothing, the Show button off the right edge of the screen. The page's script had declared the window's state as `up` over the pad's `up(e)` handler (the fix round's change), so it died at load on every browser before it polled or bound the tap and mouse handlers -- drags still moved the pointer, because that handler was bound before the throw. The state is renamed (D-NET-014); the page now puts a dead script on its state line with the browser's words, says `Your phone can't reach your handheld. Both need to be on the same Wi-Fi, and a VPN on your phone can get in the way.` after five failed probes in a row while it keeps trying, and its five-button row shares the width of a phone's screen. Reproduced and proven on the VM with the guest's own WebKit playing the phone and headless Firefox at 390 px (`docs/qa-frames/2026-09-29/330/`); the script harness now loads the page's script under node and refuses a var that shares a function's name, both of which fail against RC1's page. Not in RC1's images; RC2 carries it.

### SELECT + START leaves the sign-in window on the Retroid Pocket Nova (2026-09-29, `69e6039f8f`, #331)

On the Nova the sign-in window's gamepad bridge took the first pad the kernel lists, the physical *AYN Odin2 Gamepad*, whose device node InputPlumber hides behind its virtual controller; the open failed, the window ran with no pad, and SELECT + START could not leave it (the phone page's *Close page* was the only way out, and #330 had that too). The bridge passes over a listed pad whose node cannot be opened and takes the next, naming which and why in the log, and says "reading" only once the node is open (D-NET-015). The rule is proven by the script harness against RC1's script; that the next candidate on the Nova is the virtual controller and that SELECT + START then leaves the window is a device fact for RC2 on the Nova (`docs/releases/device-facts.md`). Not in RC1's images; RC2 carries it.

### A scan with nothing to look at completes, and the sign-in comes before the scan (2026-09-29, `b38d6fdadc`, #329)

Found on the Retroid Pocket Nova's first evening: SCAN GAMES FOR OFFLINE ACHIEVEMENTS on a device with no game read COULDN'T FINISH, and the maintainer's reading was that there had just been nothing to scan. The device's journal showed the earlier of two cases -- the offer's SCAN NOW pressed four seconds after the switch went on, before any sign-in -- and the VM showed both (`docs/qa-frames/2026-09-29/329/before-*`). Two changes, D-RA-045 and D-RA-046: `raofflineproxy-ctl scan` (`e78aa8e9fc`) now completes an empty library with rc 0 and `note=NO_GAMES` in its stamp, and the page (EmulationStation `c0cb9925e`) reads COMPLETED, NO GAMES TO SCAN YET, ADD GAMES, THEN SCAN AGAIN., the row under SCAN GAMES `LAST <date> - COMPLETED · NO GAMES TO SCAN YET`; and the sign-in is asked for before the scan is offered or started, in the row's words -- the row reads SIGN IN TO RETROACHIEVEMENTS FIRST. and dims without an account, a press on it says so, and turning the switch on with no account says it and the order of things instead of offering the scan. The page also writes `system.cfg` before the ctl reads it, so an account typed on the page below is not refused while it is still on the screen. Proven on guest d rebuilt from `b38d6fdadc` (`docs/qa-frames/2026-09-29/329/after-*`); a scan of one game still reads 1 GAME READY FOR OFFLINE PLAY. A stamp the old ctl wrote for an empty library keeps reading COULDN'T FINISH under the row until the next scan, which completes. Not in RC1's images; the next cut carries it.

### The offline achievements page's explanation is two paragraphs (2026-09-29, `b38d6fdadc`, #327)

Maintainer, play-testing RC1 on the RG SP: *"just looks odd in all caps, the rows aren't separated, and the general readability isn't great."* The block of six upper-case lines in the row font under the two rows is two paragraphs in sentence case at the description size, a row of air under the SCAN row and half a line between them (EmulationStation `c0cb9925e`, D-UI-119): what turning it on does, then what the scan does and what the player will see -- five sentences for six, nothing said twice, the sentence about games added later still shown only while INDEX NEW GAMES AT STARTUP is on. French in the same commit. The frames before and after are under `docs/qa-frames/2026-09-29/327/`; the words are the maintainer's to approve on the device, and whether explanatory prose on the other fork pages follows is D-UI-120, open.

### Up from the MAIN MENU's first row lands on BACK (2026-09-29, `83298993d6`, #325)

Found while writing the documentation walks: from the MAIN MENU's first row, the first press up highlighted nothing, the second BACK, the third QUIT. A diagnostic build logging every grid cursor move showed the cursor landing on the tab strip's cell, which every menu carries (`tabbedUI` defaults to true) and which #65 made a focus stop, with no tab on it. EmulationStation `f1ae6bc25`: the strip's cell is entered non-focusable and re-entered focusable by the first tab, so a tabbed page keeps its stop and a plain menu wraps in two presses. Proven on guest d booted from `83298993d6`: the frames under `docs/qa-frames/2026-09-29/325/` (before: nothing, BACK, QUIT; after: BACK, QUIT, SYSTEM SETTINGS). The docs walks' MAIN MENU counts dropped by one with it. Not in RC1's images (`8dd6765af0`), which keep the three-press wrap; the next cut carries it.

### The release candidate's cut (2026-09-29, `8dd6765af0`)

The whole fix round for #307/#308 was audited before the candidate (D-WORKFLOW-060; #313, 34 items, two seats over ten whole-branch packets, then a blind and a refuting second opinion), its fixes audited in turn (#319: three whole packets to two seats, 48 findings, 17 fixed with a case each, D-WORKFLOW-062), and the candidate built once after both (D-WORKFLOW-063) from step 0's rebase (upstream/next `6b344ab54d`, ROCKNIX's EmulationStation `cada856d8`). Every claim below is what the VM shows on `8dd6765af0` unless a line says otherwise: vm-qa run 72 (fourteen suites; the round trip's #315 step in run 72b), the proofs' run 5 and the upgrade rehearsal -- proofs run 5 (37 scripts, the guest rebooted before each) with its 5b and 5c re-runs after four harness faults were found and fixed: every script green but E1-pl069 and its control (#310, D-QA-055) and one line of F2-widgets (a first widget setup at the previous launch's scale, a lead); the upgrade rehearsal from `d39ccdfff3` RESULT PASS; the offline-achievements test 31 of 32 on its second run, the one red the flush stamp read after the interface's own card had taken it (#305's design).

- **A cloud folder spelled with a trailing slash, no leading slash, `//`, `/./` or `..` no longer deletes the folder it names** (#313 PL-001, D-CLOUD-152). TIDY UP YOUR CLOUD FOLDERS compared the pointers as strings, copied a tier onto itself, verified it clean and deleted it. The pointers are compared as folders now, a folder is never copied onto itself, and a pointer with `..` is refused with the folder it meant.
- **A cloud sync setting a player edited by hand keeps working** (PL-015): bash's own escapes inside double quotes are read as bash reads them, in every reader; a carriage return before a `#`, which the grammar used to let through and bash used to run, is refused with any other control character (PL-002); a key written twice means its first line, to every reader alike (PL-021, D-CLOUD-149).
- **A failed safety copy is never restored over a good configuration** (PL-004): the duplicate cleanup keeps its copy only when the copy is whole and valid.
- **A settings backup with a member outside `storage/` is refused before anything is extracted** (PL-028, D-UI-117), a restore never lets an archive overwrite its own recovery marker (PL-007), a damaged stored member in an old ZIP is caught by its CRC (PL-022), a quoted password that begins with a blank is caught before an archive is published (PL-008), a failed worklist refuses the restore instead of reading as "nothing to protect" (PL-006), and two archives of one name survive the upstream-era move (PL-017).
- **A saves folder with an empty, `.` or `..` part is refused** with the folder it would have meant (PL-009).
- **The cloud sign-in's state only moves forward** (PL-032, D-CLOUD-150): a late success from an attempt the player closed removes the remote it made and writes no marker.
- **Passwords earlier builds wrote to the persistent cloud log and the interface's log are masked on the first boot of this build, once** (PL-014, D-SYS-001), and the shell's redaction knows a password given as a flag, a key named `key`, an S3 access key id and a passphrase (PL-005, D-SYS-013).
- **When only BIOS files are there to move, the content page opens like any other and waits for the verb** (PL-019, D-UI-116); the selection is read back before the run continues, and a write that fails says `COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS BACKED UP.` with the page kept.
- **A saves sync the network cut after files moved reads `COULDN'T FINISH - YOU WENT OFFLINE PART-WAY THROUGH` on its card**, never `SKIPPED`, and is still owed when the link returns (A's lead, ES `bf5d70834`).
- **The top-up card never shows a count it did not measure** (PL-031): a run whose readiness could not be read says how many games are ready.
- **A masked credential in the interface's log is masked whole** even when the value carries an escaped quote inside a quoted command (PL-010), and the connected Wi-Fi row names the profile in use, not an inactive namesake (E2's lead, ES `5f044cc52`).
- **The recovery fallback never loads a settings backup that is not whole** (PL-018): a whole temporary recovers, and with none the defaults answer.
- **An exit capture that has run past 100 s commits nothing** (PL-034, D-CLOUD-151), so a launch the gate released cannot have its saves recorded by the capture it left behind.
- **A rotation table row is never read from a dead `#elif` arm** (PL-020); the five shipped tables are byte-identical.
- **RetroArch's Auto save slot answer comes from the configuration load itself** (D-LAUNCH-007), never from a second read of the files.
- **An interrupted restore's revert waits when the mount table cannot be read, and knows whether the ROMs folder was ever a mount** (PL-016, D-SYS-010); the Wi-Fi pair is written as one or not at all (D-SYS-012); a cut `system.cfg` is never completed or recorded as whole by a shell writer (D-SYS-011).

- **The Wi-Fi settings and the picker, as ROCKNIX's own saved-network work and the fork's agree they should be** (#318, D-UI-118). NETWORK SETTINGS no longer has a WI-FI KEY row: a key is typed where the network is named, on the picker's WI-FI KEY page for that network or the restore wizard's WI-FI PASSWORD page. A press on a SAVED network the device is not on asks `CONNECT WITH ITS SAVED KEY, OR FORGET IT?` with CONNECT, FORGET and CANCEL (B lands on CANCEL); FORGET is the same confirmation and outcome as MANAGE SAVED NETWORKS' (`FORGET <name>? THIS DEVICE WON'T JOIN IT AGAIN ON ITS OWN.`), and the picker rebuilds without the mark. The connected network's press still rejoins it at once. Underneath, the ENABLE WI-FI switch and the restore wizard bring a saved network's profile up as it is instead of deleting and rebuilding it, and a key typed for a network is stored in its profile. The frames are `X-wifi-forget` on guest d (run 5); the scripts, the harness (three cases); the strings, French too.
- **The fixes the audit of the fixes made, where a player would meet them** (#319): a cloud sync setting that names a variable the shell owns (`RANDOM=`, `SECONDS=`, `PATH=`), an escaped dollar before a bracket, or a NUL byte is refused instead of run or half-read (three copies of the grammar); the settings sorter never installs a truncated copy of `system.cfg` when its producer fails part-way; a password spliced with quotes into a command is masked whole in the interface's log; TIDY UP YOUR CLOUD FOLDERS reads a single-quoted or bare folder pointer as its value, and refuses with its why rather than reading the whole line; the top-up card's pending marker is never removed by an older acknowledgement; the cloud sign-in's clean-up says a remote was removed only when it was; an interrupted restore's revert waits while the ROMs folder is a mount, however it started; a cut-short line in the persistent cloud log is masked to its end, quoted value included; the content page's BIOS-only path refuses on a selection it could not read back instead of treating it as empty; the interface keeps its pending settings changes when a reload finds the file damaged; a ZIP whose listing shows no checksum column is refused before a member is trusted; a cloud folder typed with a trailing slash is checked as the migration reads it.

Under the surface: the harness counts what it skipped and exits 3 when something did not run (PL-023); the commit and push guards in both repositories fail closed, judge a line after its path and exempt no path (PL-011, PL-012, PL-026); the upgrade rehearsal waits on this boot's autostart, not a line the previous boot wrote (PL-024); the audit lint fails on a confirmed verdict that reached neither an item nor a lead (blindspot 68). The proofs on this cut: vm-qa run 70, proof-298, the proofs' run 3, the upgrade rehearsal from `d39ccdfff3` (PL-029).
- **On a WebDAV server that keeps neither modtimes nor hashes, a save whose bytes changed but whose size did not now reaches the cloud, and the other device** (#315, D-CLOUD-153/154). Such a server (any WebDAV vendor but Nextcloud, ownCloud, Infinite Scale or Fastmail) compares files by size, so a battery save -- the same size every time it is written -- never moved again after its first upload while the cards said COMPLETED, in every image before this one. Every saves pass on such a server now compares the save's time on the device with its upload time. Two things to know: a save written while the device's clock was wrong is not sent, and after this update the first startup can bring back the cloud's older copy of such a save (the replaced copy is kept under `.cache/cloud_sync/replaced` for one cycle). Nothing changes on Dropbox, Google Drive, OneDrive, Nextcloud, S3, SFTP or SMB.

### The offline achievements' cards, after a night's play (2026-09-27, #298)

The maintainer on the RG35XX SP: *"Everything's generally looking solid. A couple of minor UI notes."* Three, all in
the cards of #292/#293 (D-UI-101):

- **The top-up card says `N GAMES READY FOR OFFLINE PLAY` when it only refreshed**, and `N GAMES ADDED FOR OFFLINE
  PLAY` only when games are new to the store (*"You should only really say the games are added"*). The proxy's
  control script counts what was added; a stamp from before it is read as before.
- **When the link returns, the RetroAchievements cards come together and the saves sync after them**: the send card,
  the top-up and its outcome, then SYNCING SAVES TO THE CLOUD. Before, the saves card came between the achievements'
  cards (*"they should be batched"*).
- **Waking the console asks one question and usually does nothing** (#299, D-RA-035, D-UI-103): at the link's return
  the offline achievements' check runs only when a game was played since the last check, and then only over the games
  played, with its card reading `UPDATING YOUR OFFLINE ACHIEVEMENTS...`; with no game played it exits in a moment and
  shows nothing. Finding new games in the library is the index's job: at startup as before, and now also when
  UPDATE GAMELISTS runs with INDEX NEW GAMES AT STARTUP on, where the achievements' card stacks under the game list
  update's (*"a two-pronged approach"*).
- **A game list updated offline says what happens to the new games** (#299, D-UI-104, D-RA-036): with offline
  achievements on, a card reads `RETROACHIEVEMENTS (OFFLINE)` over `NEWLY ADDED GAMES WILL BE ENABLED ONCE YOU
  RECONNECT.` within about forty seconds of the update (D-UI-106, the maintainer's shape and words; two one-line
  toasts before it, one of which clipped at 640x480), and the next link's return lists the library once for them,
  whether or not the half hour since the last check has passed (*"if that's a promise we can keep"* -- it is).
- **A game list update with the Wi-Fi down no longer holds the interface until the link returns** (#299, #300,
  D-RA-036): the RetroAchievements library fetch that the index starts with ends after thirty seconds without a
  byte. Before, on a connection the interface had used while online, it waited for the link -- twelve minutes on
  the VM -- with the screen frozen, and the toast above never showed.
- **Every card's title names the thing and its line says what happened, with no word said twice** (#303, D-UI-107,
  the maintainer's rule): the send card is titled RETROACHIEVEMENTS (`SENDING 3 EARNED OFFLINE...`, then `WHAT YOU
  EARNED OFFLINE IS NOW ON YOUR ACCOUNT.`), the top-up card RETROACHIEVEMENTS (OFFLINE) (`GETTING GAME 2 OF 5
  READY...`, then `3 MORE GAMES ARE READY.` or `EVERYTHING'S UP TO DATE.`), and the sync cards' offline lines read
  `THEY'LL GO UP NEXT TIME YOU'RE CONNECTED(, WITH YOUR ACHIEVEMENTS).` under their unchanged titles. Before: SEND
  OFFLINE ACHIEVEMENTS over OFFLINE ACHIEVEMENTS HAVE BEEN SENT TO RETROACHIEVEMENTS, UPDATE OFFLINE ACHIEVEMENTS
  over YOUR OFFLINE ACHIEVEMENTS ARE UP TO DATE.
- **The sync card says which file is moving and how much of it** (#304, D-UI-108, the maintainer's principle:
  *"show both the progress bar and that progress is happening, and situate the user about how much is being sent"*):
  the line under SYNCING SAVES TO THE CLOUD reads `TRANSFERRING FILE 1 OF 2 (24.0 MB OF 24.0 MB)` -- `SENDING` or
  `RECEIVING` where the sync has halves -- and drops to `FILE 1 OF 2 (...)`, then the sizes alone, where the panel is
  too narrow. Before, the line was rclone's `24.0 MB / 24.0 MB` with nothing to say what or how many.
- **At the link's return the saves go first, then the RetroAchievements cards together, and the send is reported
  once** (#305, D-UI-109; the maintainer, on the device: *"To have it go RetroAchievements, saves, RetroAchievements
  is confusing to a user"*): the owed saves sync runs and shows SYNC SAVES / COMPLETED, then the send card and the
  top-up card follow as one batch. The send card waits up to ten seconds for the offline service's own "flushed"
  stamp before saying COMPLETED, so a device no longer shows the send twice (the stamp lands a few seconds after the
  queue empties).
- **The top-up at the link's return runs on a device again** (#306, D-RA-038): the wake check read a history file
  at a path RetroArch 1.22 never writes (`content_history_path` in the config), so on a handheld it always answered
  "nothing played since the last check" and skipped. It now reads the newest of RetroArch's own
  `playlists/builtin/content_history.lpl` and the configured path.
- **Exiting a game offline with achievements earned, the card says so**: `SAVES WILL BE SYNCED AND ACHIEVEMENTS
  SENT NEXT TIME YOU'RE CONNECTED.` in place of the saves-only line, one card (*"game saves and Retro Achievements
  will be sent when you're next online"*).

Checked on `7911c53bb4`: `proof-298` on guest d (35 PASS, 0 FAIL: the exit card's line offline with a pending award, the send card then the
top-up card then the owed saves in the interface's log, the top-up's READY after a refresh, no card at a wake with nothing played, the index under
UPDATE GAMELISTS with its top-up, and the offline update's toast within a minute with the marker listed at the link's return) and vm-qa run 67 (all 15 suites).

### The notification face at 13 px, its box following it, the stack's foot at its side margin (2026-09-27)

The sixth cut's stack read wrong on the RG35XX SP: the maintainer, *"the save state load seems to come up and then be
moved when the RetroAchievements alert comes up, and they're stacked directly on top of each other without any space
between them."* Four builds were run side by side on the VM at the device's widget scale (#296,
`docs/qa-frames/2026-09-27/`), and the cut that followed is what they chose: *"Option 2 with the lower floor"*, then
*"I'm interested to see what it looks like if we try 13 pixels. I'm also curious if we can just have the boxes sit lower."*

- **RetroArch's notifications are drawn at 13 px** where a panel would put them smaller (#296, D-UI-098; 14 px since
  #251). Thirteen lands the face's stems on whole pixels as 14 does, and it is the smallest size that does.
- **A message's box is sized by its text again** (36 px around the 13 px face on a 640x480 panel), as RetroArch draws it
  (#296, D-UI-099). The sixth cut had shrunk the box to the old proportion around the larger face.
- **The stack sits lower, and its foot is its side: 12 px of screen under the bottom box**, the same as the box's
  distance from the left edge, on a 640x480 panel where the build before the readable-size floor left 42 and the sixth
  cut 45 (#296, D-UI-100; the maintainer, from the mock-ups: *"It makes it look more uniform in terms of space from the
  left edge and space from the bottom edge."*).
- **The save-state line no longer lands low and jumps when the sign-in arrives** (#296): RetroArch lays its widgets out
  twice at a launch, and the sixth cut's reference differed between the passes; the placement reference is now 11 px,
  which both passes clamp to.
- **Two stacked messages keep a one-row seam** (#296): the sixth cut's rounding closed it and the first placement cut
  overlapped the boxes by four rows; every box now sits one divider above the one below.
- **The order of the two lines is RetroArch's own and unchanged**: a save or load line is a task and sits at the bottom;
  the sign-in is a regular message and sits above it, on every build since 2026-09-10.

Checked on `7fd4864597` (the seventh cut, 21 px under the box): vm-qa run 53 all fifteen suites; `diag-296-flows-v2` on
guest d at the H700's widget scale (drawn 13 px, box 423..458, stack 386..421 over 423..458, no jump). The eighth cut
(`9a64a4ad8f`, 12 px, the left margin's number): vm-qa run 54 all 15 suites; `diag-296-flows-v2` on guest d at the H700's widget scale,
RetroArch's own log `drawn 13.00 px`, `left 12, under the bottom box 12`, the stack 395..430 over 432..467 with a one-row seam.

### The notifications sit where they did, at the readable size (2026-09-26, `6f0a974765`)

From the maintainer's play-testing of `d72084ccad` (*"do the RetroAchievements login and save state load leave an extra
row below them? They seem to be a bit higher up the screen than they previously used to be"*, and *"'Press again to
quit' also seemed like a row up"*; #295). Every claim is what the VM showed on the image (`diag-295-osd` on guest d at
640x480, `docs/qa-frames/2026-09-26/295-*`).

- **RetroArch's notifications sit where they did before the readable-size change, at the readable size** (D-UI-097).
  The floor that made the message text readable on small panels (2026-09-24) had scaled the whole message queue with
  the font, and the stack of notifications -- the save-state load, the sign-in line, "Press again to quit" -- sat a text
  line higher, with an empty row under it. The lowest message's text is now centred 50 px above the panel's bottom on a
  640x480 panel, where the build before the floor drew it (78 on the cut that raised the size), in a box one pixel
  taller than that build's, and the text keeps the readable size.

Under the surface: RetroArch patch `0019` places the queue, and sizes each message's box, with the padding, spacing and
height a 9 px queue font (RetroArch's own floor, the size the queue was drawn at before the fork's) would have given,
while the text is drawn at the floored size; two log lines print the sizes and the placement at every layout. It took
six cuts, each measured on the VM: four of them matched the box's bottom edge, which is not what the eye reads. Nothing
else changed.

### The second opinion, and the twentieth cut (2026-09-24, #260)

The maintainer asked whether the audit had an adversarial phase by default;
it had not, and now does. The council's GPT seat read the whole audit and
its items, and nine of its findings held against the tree (PL-031..PL-039).
What a player would notice, in the twentieth cut `c041be7e98`:

- **The crash keeper never fills the card** (PL-033). It kept a core dump
  after checking for 512 MB free, and the dump itself could be up to the
  cap, so a card with just over the floor ended under it. It now needs the
  floor plus the cap before it writes, and says both when it refuses.
- **A cached achievement badge is whole or it is not served** (PL-031). The
  offline proxy checked a badge's signature and header; it now checks every
  chunk and inflates the image, so a torn download is treated as a miss
  rather than shown broken.
- **A dead run's progress line does not linger** (PL-037). A `running` file
  left by a killed image or refresh run is removed by the next run that
  takes the lock.
- **A core of exactly the cap is not called truncated** (PL-035), and a
  screenshot's game is looked up from an index built once rather than a
  walk of the whole library per new screenshot (PL-034).

### The twenty-second cut (2026-09-24, `664ad9ac64`)

One change over the twenty-first, made on the maintainer's word before the
copy, and proven the same way (vm-qa run 28, rehearsal run 23):

- **A save state tile says the day and the time in one breath** (#195,
  D-UI-089). The second line reads `TODAY at 09:07`, `YESTERDAY at 14:03`, or
  `09/01/26 at 12:00`: the day word or a two-digit-year date, a lowercase
  *at*, then the time. In French: AUJOURD'HUI, HIER, and *à*. The 12-hour
  switch still decides the time's form. The two-digit year is what made room
  for the word on a 640x480 tile.

The twenty-first cut was never staged; this one replaces it as the candidate.

### The twenty-first cut (2026-09-24, `d27858eb70`)

What a player would notice, each proven on the VM first (vm-qa run 27, rehearsal run 22):

- **A save state tile says when in the player's terms** (#195, D-UI-087). A save
  from today shows its time alone; one from yesterday reads YESTERDAY (HIER in
  French) and the time; anything older shows the date and the time. The 12-hour
  switch still decides the time's form.
- **The startup card can say it is waiting for a network** (#192, D-CLOUD-136).
  When Wi-Fi is still joining at boot, the card's first step reads WAITING FOR A
  NETWORK, UP TO 60 SECONDS... until the route arrives or the wait ends; with the
  radio off it still skips at once, so a boot on the plane costs nothing. A game
  launched during the wait cancels the sync rather than waiting on it.
- **The achievement banner and the sign-in toast are drawn at sizes whose stems
  land on the pixel grid** (#255, D-UI-088): 18 px and 15 px on a 640x480 panel,
  chosen from a table measured on the image's own FreeType, never smaller than
  before. On 1280x800 and 1080p panels nothing moves.

Under the surface: the QA guest's RetroArch draws at the panel's size (#263), so
frames of RetroArch text taken on a guest are now what a device draws, and the QA
runner refuses a run whose RetroArch surface was smaller than the screen.
webkitgtk stays 2.52.6 (D-WORKFLOW-041); the 2.54 bump is the next candidate's
first work (D-WORKFLOW-042).

