# Cloud vocabulary audit

Ordered by the maintainer, 2026-09-06, after two settings whose names suggested
different payloads turned out to be two directions of one transfer: *"We need to
be clear about the difference and get the vocabulary done. It would be good to do
a full audit of our vocabulary around this across the experience and then make a
decision once we have clarity into the different purposes."*

Everything below is read from the shipped tree and the EmulationStation source,
not from the docs, because the docs are one of the things being audited.

## 1. What actually moves

Four distinct things, three of them shipping today.

| Thing | What it actually contains | Where it lives | Is there a file? |
| --- | --- | --- | --- |
| **Settings** | emulator configuration (RetroArch, PPSSPP, Moonlight, ScummVM, idtech), ES settings, input config, per-theme settings, collections, user-installed themes, bezels, fan control, `system.cfg` | `/storage/.config/**`, plus `roms/bezels` and `roms/themes` | **Yes** — one dated `.tar.gz` |
| **Saves** | game saves, save states and their thumbnails, screenshots | `/storage/roms/**` matched by the allowlist | No — files copied in place |
| **Content** | ROMs and BIOS | `/storage/roms/<system>/`, `roms/bios` | No — files copied in place |
| **Previous versions** | copies replaced by a sync or chosen against in the wizard | cloud, beside the saves folder | No — files copied in place |

**The settings archive contains no saves, no ROMs and no operating system.** The
capture list is `backuptool`'s `DEFAULT` array, read above. This matters because
of what we call it.

## 2. What we call these today

Collected from `es-app/src/guis/GuiMenu.cpp`, `ThreadedCloudSync.cpp`, the rclone
scripts, `backuptool`, and `cloud_sync.conf`.

| Thing | Names in use |
| --- | --- |
| Settings | *system backup*, *SYSTEM SETTINGS*, *settings*, *configurations*, *BACKUP USER DATA*, *your data*, `<date>-<OS_NAME>_BACKUP.tar.gz` |
| Saves | *SAVE DATA*, *save data*, *saves*, *game saves, save states, and screenshots*, *save files* |
| Content | *ROMS AND BIOS*, *content*, *your cloud library* |
| The act of sending | *back up*, *upload*, *sync*, *match* |
| The act of receiving | *restore*, *download*, *sync*, *match* |

### The two collisions

**"Backup" names both an artifact and a direction.** The settings tier produces a
real file you could copy to a memory card. The saves and content tiers produce no
file at all — "backup" there means nothing but *upload*. So these two shipped
strings use one verb for two different mechanics:

- `BACK UP YOUR SETTINGS, GAME SAVES, SAVE STATES, AND SCREENSHOTS TO THE CLOUD?`
- `BACK UP YOUR SETTINGS TO /storage/roms/backup/?\n\nWI-FI AND ACCOUNT PASSWORDS ARE NOT INCLUDED. COPY THE FILE SOMEWHERE SAFE, OR ENABLE THE SYSTEM BACKUP OPTION IN CLOUD SYNC.`

The second calls one thing *settings* and *system backup* in a single dialog.

**"System backup" does not back up the system.** The OS is immutable and is
reflashed rather than restored, and the archive holds none of it. A player who
reads "system backup" and expects their games to be in it is reading the words
correctly and getting the wrong answer.

### A third collision, inside the wizard

`docs/conflict-wizard-ia.md` uses **discard** for two unrelated things: the copy
you chose against ("*keep discarded saves*"), and abandoning your decisions when
you quit ("interrupted runs discard their decisions"). Same page, same word.

### A fourth, in the config file only

`cloud_sync.conf` carries four similar names, and only two are about the same
tier: `BACKUPPATH` and `RESTOREPATH` are the local read and write ends of the
**saves** transfer, both shipping as `/storage/roms`; `BACKUPFOLDER` is where the
**settings archive** is written; `SYNCPATH_BACKUP` is where that archive goes in
the cloud. Only someone editing the file over a shell sees these, which lowers
the stakes but not the confusion.

## 3. What already holds, and should be kept

`.claude/rules/es-native-ui.md` settled three of these and they are working:

- **"back up" as a verb, "backup" as a noun.**
- **"game save" for a battery save, "save state" for a snapshot** — two words,
  never merged, whenever both appear.
- **Serial comma**, so "game saves, save states, and screenshots" cannot be
  misread as two things.

## 4. Proposal (revised after review, 2026-09-06)

The first draft split verbs by whether a file exists — *back up* for the
settings archive, *upload* for saves. The maintainer's objection stands: *"A
user won't understand the difference between an upload and an archive. Isn't
the archive uploaded too?"* It is. That distinction was ours, not a player's.

The axis a player actually has is **what** and **where**. So:

- **Two verbs, universal.** *Back up* sends something somewhere. *Restore*
  brings it back. Nothing is "uploaded" or "archived" in a label.
- **The noun says what.** *Settings.* *Saves* — itemised as game saves, save
  states, and screenshots wherever there is room. *ROMs and BIOS.*
- **The destination says where.** *To this device* or *to the cloud.* The
  settings archive can go to either; saves and ROMs only go to the cloud, and
  the label still says so, because saying it is what stops the "I thought my
  ROMs were in it" reading.
- **Sync** is reserved for the automatic two-way behaviour saves get after #22.
  A player never picks a direction for a sync; that is what makes it sync.

| Tier | Name | Player-facing shape |
| --- | --- | --- |
| Settings | **settings** (never "system") | BACK UP SETTINGS TO THIS DEVICE / TO THE CLOUD; RESTORE SETTINGS FROM … |
| Saves | **saves** | BACK UP SAVES TO THE CLOUD / RESTORE SAVES FROM THE CLOUD today; SYNC SAVES once #22 lands |
| Content | **ROMs and BIOS** | as today — the pages already name them and show sizes |
| Kept losers | **discarded saves** | KEEP COPIES OF DISCARDED SAVES, with a count |

On the last row: the first draft proposed *previous versions* to avoid the
document's double use of *discard*. The maintainer's phrasing — *"store copies
of your discarded saves"* — is what a player would say, so it wins, and the
document stops using *discard* for quitting the wizard instead. One residual:
a copy a sync replaced without anyone deciding is not "discarded" by anybody;
#25's restore tool labels those separately when it shows them.

Concrete rewrites, before and after:

```
SYSTEM SETTINGS                  ->  SETTINGS
SAVE DATA                        ->  SAVES
BACK UP EVERYTHING [NOW]         ->  BACK UP SETTINGS AND SAVES [NOW]
BACK UP CONFIGURATIONS TO DEVICE ->  BACK UP SETTINGS TO THIS DEVICE
UPLOAD SAVE DATA [TO THE CLOUD]  ->  BACK UP SAVES TO THE CLOUD
DOWNLOAD SAVE DATA [FROM …]      ->  RESTORE SAVES FROM THE CLOUD
UPLOADING / DOWNLOADING SAVE DATA -> BACKING UP SAVES / RESTORING SAVES
CHECKING YOUR CLOUD LIBRARY      ->  COMPARING YOUR ROMS AND BIOS FILES
                                     WITH THE CLOUD
MOVE SAVES AND BACKUPS INTO /ROCKNIX. NOTHING IS DELETED.
                                 ->  MOVE SAVES AND SETTINGS BACKUPS INTO
                                     /ROCKNIX. NOTHING IS DELETED.
KEEP DISCARDED SAVES             ->  KEEP COPIES OF DISCARDED SAVES

BACK UP YOUR SETTINGS, GAME SAVES, SAVE STATES, AND SCREENSHOTS TO THE CLOUD?
  ->  BACK UP SETTINGS AND SAVES TO THE CLOUD?
      GAME SAVES, SAVE STATES, AND SCREENSHOTS ARE INCLUDED.
      ROMS AND BIOS FILES ARE NOT.

… OR ENABLE THE SYSTEM BACKUP OPTION IN CLOUD SYNC.
  ->  … OR TURN ON SETTINGS BACKUP UNDER CLOUD SETTINGS.
```

Config keys, each read under the old name when the new one is absent, so an
upgraded device keeps its values:

```
BACKUPPATH       ->  SAVESPATH          local saves folder
RESTOREPATH      ->  removed            one folder; sync cannot split it
SYNCPATH         ->  SAVES_REMOTE       cloud folder for saves
BACKUPFOLDER     ->  SETTINGS_BACKUPS   local folder for settings backups
SYNCPATH_BACKUP  ->  SETTINGS_REMOTE    cloud folder for settings backups
CONTENTPATH      ->  CONTENT_REMOTE     cloud folder for ROMs and BIOS
```

## 5. Decisions this needs

1. Adopt the two-verb rule and tier names above, or amend them.
2. Whether the settings archive **filename** changes now or later. Later is
   safer: the restore side already accepts three historical names (§7).
3. Confirm **discarded saves** as the term, with the residual noted.

## 6. Where the edits land

`es-app/src/guis/GuiMenu.cpp` (tier ticks, both bundle dialogs, the local backup
dialog), `ThreadedCloudSync.cpp` (progress and outcome lines), `backuptool`
(prompts and log lines), `cloud_sync.conf` and `.defaults` (comments only),
`docs/conflict-wizard-ia.md` (the *discard* collision, at rev 5),
`.claude/rules/es-native-ui.md` (the rule gains the tier names), and a follow-up
PR to `ROCKNIX/rocknix.org`'s cloud-sync page, which the hard gate in
`documentation-accuracy.md` requires anyway.

## 7. Every backup artifact that has ever shipped

Requested because older versions left clutter, and a vocabulary has to cover
what is already on people's cards and in their cloud folders, not only what we
write next. Read from `backuptool`, `cloud_backup`, `cloud_restore`,
`cloud_migrate_layout` and the allowlist.

### Settings archives, on the device

| Path | Era | Still read? |
| --- | --- | --- |
| `/storage/roms/backup/<OS>_BACKUP.zip` | first: fixed name, zip | yes — `LEGACY_BACKUPFILE` |
| `/storage/roms/backup/<date>-<OS>_BACKUP.tar.gz` | current: dated, tar | yes — `newest_backup()` picks by date |
| `/storage/roms/backup/archive/` | rotation of the previous three | yes — the rotation glob also matches `ARCHIVED_*.zip`, a **third** historical name |

### Settings archives, in the cloud

| Path | Era | Notes |
| --- | --- | --- |
| `/GAMES/backup/` | first layout | nested inside the saves folder, so a `sync` backup could delete it; moved by TIDY UP YOUR CLOUD FOLDERS, offered never automatic |
| `/ROCKNIX/Backups/*.{zip,tar.gz}` | second: archive at the folder root | the restore filter once looked for `backup/*.zip` here and matched nothing — four images shipped that way (#53's neighbour) |
| `/ROCKNIX/Backups/<device-folder>/` | current: one subfolder per device | restore reads its own folder, then falls back to the root for archives older than the per-device layout |

### Saves, in the cloud

| Path | What |
| --- | --- |
| `/GAMES/` | first layout's saves root |
| `/ROCKNIX/Saves/` | current saves root |
| `/ROCKNIX/Saves-replaced/<date>/` | `--backup-dir` sibling, written only under `BACKUPMETHOD=sync`; the safety net for a mirror's deletions |
| `… conflicted copy …` files inside Saves | written by the Dropbox desktop client on a write race; admitted by the allowlist, never excluded by the saves scripts (#71's neighbour) |
| `<rom>.state.auto.bak` | EmulationStation's own backup of the resume point; matched by `*.state*`, so it syncs and is invisible in the savestate manager |

### ROMs and BIOS, in the cloud

| Path | Era |
| --- | --- |
| remote root, one folder per system | before `CONTENTPATH` existed: system folders scattered among whatever else lived there |
| `/ROCKNIX/Content/{<system>,bios}/` | current |

### New in this milestone

| Path | What |
| --- | --- |
| `/ROCKNIX/SaveVersions/` | discarded saves and sync-replaced copies, the cloud as source of truth (D-CLOUD-036); replaces the `-replaced/` sibling's role for anything a player can restore |
| `savestates/.rocknix/manifest-<device-id>.json` | the per-device manifests (D-CLOUD-031) |
| `savestates/.snapshots/` | #25's local snapshots — needs its allowlist exclusion as a command-line flag, not a defaults rule |

### What this means for the vocabulary

Three names for one artifact on the card, three cloud locations for it across
three layouts, and a mirror-mode sibling and a desktop client both writing
things beside the saves that look like saves. A term has to be readable
against all of it — which is the argument for *settings backup* over *system
backup* (every one of those files is settings and nothing else), and for a
single **SaveVersions** folder over spreading discarded copies across siblings
the way `-replaced/` already does.
