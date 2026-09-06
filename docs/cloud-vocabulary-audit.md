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

## 4. Proposal

One rule settles most of it: **name the tier, and let the verb say whether a file
exists.**

| Tier | Name | Verbs | Because |
| --- | --- | --- | --- |
| Settings | **settings** (never "system") | back up / restore | There is a file. You can copy it to a card. |
| Saves | **saves**, itemised as game saves, save states, and screenshots | upload / download | No file. Copies in place, both directions. |
| Content | **ROMs and BIOS** | upload / download | Concrete; "content" is our word, not a player's. |
| Previous versions | **previous versions** | restore a previous version | Not trash, not deleted, not an archive. |

Consequences, each a small edit:

- **"System backup" becomes "settings backup"** everywhere: the menu tick, the
  dialogs, the config comments, the docs. The archive filename can follow later;
  it is matched by glob and a rename needs the read side to accept both.
- **"SAVE DATA" becomes "SAVES."** "Data" adds nothing a player uses.
- **Bundle actions name their three parts** rather than saying "everything",
  because "everything" is what makes someone assume their ROMs are included.
- **"Discard" keeps one meaning** — abandoning decisions on quit. The copy you
  chose against is a **previous version**.
- **The config comments say which tier each path belongs to.** No renaming of
  keys; an upgraded device would silently lose its settings.

## 5. Decisions this needs

1. Adopt the tier names and the verb rule above, or amend them.
2. **"Settings backup" versus "settings archive"** for the artifact. *Backup* is
   what a player expects; *archive* is what it literally is and avoids the word
   entirely. One or the other, not both.
3. Whether the archive **filename** changes now or later. Later is safer: the
   restore side already reads two historical names.
4. Whether **"previous versions"** is the final term (see D-CLOUD-036).

## 6. Where the edits land

`es-app/src/guis/GuiMenu.cpp` (tier ticks, both bundle dialogs, the local backup
dialog), `ThreadedCloudSync.cpp` (progress and outcome lines), `backuptool`
(prompts and log lines), `cloud_sync.conf` and `.defaults` (comments only),
`docs/conflict-wizard-ia.md` (the *discard* collision, at rev 5),
`.claude/rules/es-native-ui.md` (the rule gains the tier names), and a follow-up
PR to `ROCKNIX/rocknix.org`'s cloud-sync page, which the hard gate in
`documentation-accuracy.md` requires anyway.
