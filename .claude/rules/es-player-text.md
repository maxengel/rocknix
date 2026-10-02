---
description: "Every word a player reads: the four tiers and the two verbs, the naming conventions, how much text a row may carry, and the outcome vocabulary every cloud run ends with. Read before writing any string an ES screen or a script shows."
paths:
  # ES source lives in the separate `ROCKNIX/emulationstation-next` repo, so no
  # glob written here can name `es-app/**`. `**` is the widest a repo-relative
  # glob reaches; a session working only in the ES checkout still loads none of
  # these (#147 § 9).
  - "**"
---

# What a player reads

The words themselves, and how much of them a row may carry. Split out of
`es-native-ui.md` on 2026-09-12 (#147) -- maintainer: *"let's split up the
native UI into parts"* (D-WORKFLOW-008) -- so that somebody writing a string in
a shell script reads the same rules as somebody writing one in C++, without
500 lines of ES internals in between. Half of these strings are printed by the
cloud scripts, not by EmulationStation.

Above this file: `player-language.md` (clear, then brief, then sized to the
space, D-UI-045) and `least-surprise.md` (same thing, same place, same words).
Beside it: `es-native-ui.md` (the surfaces the words go on),
`es-ui-style-guide.md` (how a screen looks), `es-code-traps.md`.

## Conventions

- Every label through `_( )` (localized, UPPERCASE by convention).
- **Clear, then brief, then sized to the space** (`player-language.md`,
  D-UI-045). Cut every word whose removal changes nothing; a string that
  needs more room wants a page, not smaller text.
- **"back up" vs "backup"**: two words as a verb ("BACK UP SETTINGS TO THE CLOUD",
  "back up your settings"), one word as a noun/adjective ("RESTORE FROM BACKUP",
  "backup file"). Applies to menu labels, dialogs, script output, and docs.
  The old example here, "BACK UP CONFIGURATIONS TO CLOUD", broke the tier rule
  below while demonstrating the verb rule; *configurations* is banned.
  Checked mechanically: `tools/vocabulary-check` reads every `_("")` string
  and every sentence the scripts print, and `tools/vm-qa` runs it as the
  `vocabulary` suite on every image (maintainer, 2026-09-12: "we should make
  sure we're consistent ... whether it is one word or two, or how we're using
  it as a noun versus verb"). A string that is right and still trips a
  heuristic goes in the tool's allowlist with its reason.
- **Serial comma, always.** "Game saves, save states, and screenshots" — never
  "…states and screenshots". Without it the last two items read as one thing,
  which in a list of what a backup carries is exactly the ambiguity that
  matters.
- **"game save" vs "save state".** A battery save is a **game save**; a
  snapshot of the running machine is a **save state** (two words — the
  directory is `savestates`, the label is not). They are different files with
  different failure modes, and a player who has lost one needs to know which.
  Bare "saves" is fine as a collective where nothing contrasts with it
  ("games, BIOS files, and saves"); the moment both appear, name them apart.
- **Four tiers, two verbs, and the destination says where (D-UI-022,
  D-CLOUD-050).** The things cloud sync moves are **settings** (the archive
  `backuptool` writes: emulator and interface configuration, input mapping,
  themes, collections, bezels — no saves, no ROMs, no operating system),
  **saves** (game saves, save states, and screenshots), **ROMs and BIOS**,
  and **game content** (what the scraper made: artwork, videos, manuals, and
  the game lists — D-CLOUD-049 puts `gamelist.xml` here, not with ROMs). The
  only verbs are *back up* and *restore*; nothing is "uploaded" or
  "archived" in a label, because a player has no way to tell those apart
  and the archive is uploaded too. The label says what and where: BACK UP
  SETTINGS TO THIS DEVICE, BACK UP SAVES TO THE CLOUD, RESTORE SETTINGS FROM
  THE CLOUD. **Never "system backup"** — it held people to expecting their
  games in it — and never "save data", "configurations", "everything", or
  "cloud library". *Sync* is reserved for the automatic two-way behaviour
  saves get after #22, where a player never picks a direction. The
  automatic cards already speak it: SYNCING SAVES AT STARTUP, SYNCING SAVES TO THE
  CLOUD after a game (D-UI-040); *back up* is the deliberate, possibly long action
  on the transfer page (D-CLOUD-113). The wizard's
  kept losers are **discarded saves**; *discard* means nothing else.
- **"Wi-Fi", hyphenated**, in every user-visible string. The settings keys stay
  `wifi.key` / `wifi.ssid` — an identifier is not a reason to spell the label
  after it.
- **A destination is named only when there is more than one it could be
  (D-UI-096).** Saves go to this device or to the cloud, so the label says
  which: BACK UP SAVES TO THE CLOUD. Achievements go nowhere but
  RetroAchievements, so the card's title says RETROACHIEVEMENTS and its line
  says only what happened -- WHAT YOU EARNED OFFLINE IS NOW ON YOUR ACCOUNT.,
  short NOW ON YOUR ACCOUNT. (D-UI-107; the longer candidate first, D-UI-035).
  It read OFFLINE ACHIEVEMENTS HAVE BEEN SENT (TO RETROACHIEVEMENTS) under
  SEND OFFLINE ACHIEVEMENTS until 2026-09-27. Maintainer, 2026-09-26:
  *"since there's nowhere else that achievements could go but
  RetroAchievements, I think it's implied what the destination is."* The
  service is still named where it is the actor or the account
  (RETROACHIEVEMENTS STOPPED ANSWERING, SIGN IN TO RETROACHIEVEMENTS FIRST).
- **A question over a running job is a statement, one consequence, and two
  verbs** (D-CLOUD-130, D-UI-096). What is happening, in the present:
  YOUR SAVES ARE SYNCING WITH THE CLOUD. / OFFLINE ACHIEVEMENTS ARE BEING
  SENT. Then what the choice costs or how long it is: IF YOU STOP IT, THE
  NEXT SYNC FINISHES WHAT THIS ONE DID NOT. / IT'LL BE A MOMENT. Then the
  two buttons, each a verb the player does: STOP IT AND PLAY / KEEP WAITING
  when the job is ours to stop, PLAY NOW / KEEP WAITING when it is not (the
  proxy's own send). The safe verb goes last, where the back button lands
  (`es-ui-style-guide.md` § Confirmations).

- **A card's title names the thing; its line says what happened, and no
  word twice (D-UI-107).** Maintainer, 2026-09-27: *"make sure it's not
  duplicative in terms of what the title says and what the body text is
  across the board"* -- and *"crisp, clear, and not too cold"*. The
  offline achievements' cards (D-UI-095/096, D-UI-101, D-UI-103 reworded by
  D-UI-107): the send card is titled RETROACHIEVEMENTS, reads `SENDING N
  EARNED OFFLINE...` while it runs, then COMPLETED with `WHAT YOU EARNED
  OFFLINE IS NOW ON YOUR ACCOUNT.` (short `NOW ON YOUR ACCOUNT.`), or
  COULDN'T FINISH - IT STOPPED ANSWERING / THIS DEVICE'S OFFLINE SERVICE
  DIDN'T ANSWER. The top-up card is titled RETROACHIEVEMENTS (OFFLINE),
  reads `GETTING GAME I OF N READY...`, then COMPLETED with `N MORE GAMES ARE
  READY.` **only of games new to the store**; a run that re-read what was
  there says `N GAMES ARE READY.` (maintainer, 2026-09-27: *"You should only
  really say the games are added"*), and nothing new says `EVERYTHING'S UP
  TO DATE.` The exit card offline keeps its title (SYNCING SAVES TO THE
  CLOUD, D-UI-040) and its line stops repeating it: `THEY'LL GO UP NEXT TIME
  YOU'RE CONNECTED.`, with awards waiting `THEY'LL GO UP NEXT TIME YOU'RE
  CONNECTED, WITH YOUR ACHIEVEMENTS.` (short `THEY GO UP WITH YOUR
  ACHIEVEMENTS WHEN YOU'RE BACK.`); a launch over the exit sync: `THEY GO UP
  WHEN YOU EXIT THE GAME.`
- **A transfer says that it is one, which file of how many, and how much
  (D-UI-108).** While bytes move the sync card's line reads `TRANSFERRING
  FILE 4 OF 7 (12 KB OF 40 KB)` -- `SENDING` / `RECEIVING` for the verb where
  the sync has halves -- falling back to `FILE 4 OF 7 (12 KB OF 40 KB)` and
  then `12 KB OF 40 KB` where the line does not fit, with the bar drawing the
  bytes. The file named is the one moving (rclone counts files done). Before
  rclone has counted: `TRANSFERRING 12 KB OF 40 KB`. Maintainer, 2026-09-27:
  *"show both the progress bar and that progress is happening, and situate
  the user about how much is being sent or done in general."*
  A game list updated offline, with offline achievements on: a card, not a
  toast -- `RETROACHIEVEMENTS (OFFLINE)` behind the trophy, with `NEWLY
  ADDED GAMES WILL BE ENABLED ONCE YOU RECONNECT.` under it, five seconds
  (D-UI-106, the maintainer's shape and words; D-UI-104's and D-UI-105's
  one-line sentences before it), shown by the index itself the moment the
  library fails to come, a promise the control script keeps (D-RA-036).
  A toast is one line at 0.9 of the screen and ends in an ellipsis past
  it, and none wraps: a notice that needs a title and a line is a card,
  and the body does not repeat the title (#303, the maintainer's rule for
  every card). Measure a toast against the frame, or with the font
  (`measure-toast.py` in the session's tools until it is promoted, #278).

## Every fork string ships in English and French (D-UI-051)

The language is `system.language` (SYSTEM SETTINGS > LANGUAGE); every
`_("")` string is keyed to it through the `.po` files under
`locale/lang/<lang>/LC_MESSAGES/emulationstation2.po`. The build runs
xgettext over the sources and msgmerge into each file, so a new msgid reaches
every language untranslated and falls through to English -- which is where
the fork's strings stood until 2026-09-13. Maintainer: *"we could at least
support English and French, and other people could add other error messages
for other languages if they choose."*

So a string added here gets its French written into `locale/lang/fr/...`
in the same commit, in that file's own style: accented capitals (RÉSULTAT,
SYSTÈME), the typographic apostrophe (D’UTILISATEUR), a space before `?`
and `:`, and the tabs and pages by the names the file already gives them
(SCRAPEUR / OPTIONS / COMPTES, PARAMÈTRES RETROACHIEVEMENTS). The msgid must
match the source string byte for byte, `\n` included; the first thirteen
were written by a script that read the msgids out of the sources rather
than retyping them. The cloud pages and the rest of the fork's strings
since 2026-08 have no French yet and are a follow-up. Other languages are
whoever reads them.

## A row that leads somewhere is a label, not a paragraph

Maintainer, 2026-09-06: *"adding a fuller description isn't necessarily always
better. We're dealing with the 3.5- or 4-inch screen here sometimes, so we
don't want to have lots of tiny text. If necessary, sometimes it's better to
have the user click into the menu, where they can have some options or at
least breathing room. If there's more than one action that can be taken, this
likely makes sense within our menu structures, so the user has room to choose
what to do."*

So:

- **A row that opens a page with more than one action is a submenu.** Its
  label carries the verb (MANAGE CLOUD STORAGE, MANAGE GAME SAVE RESTORES AND
  CONFLICTS); the page inside carries the choices, with room. Do not make up
  for a hub label with a description that lists everything behind it — that is
  the tiny text nobody reads, on the panel where it is smallest.
- **A description, where one is needed, is one short line.** The three section
  headings the player will see inside (`BACKUP AND RESTORE, SAVE MANAGEMENT,
  CLOUD STORAGE SETUP.`) is a description; a sentence naming every action is
  not.
- **When a row genuinely needs explaining, that is a signal it wants a page**,
  not a longer line under it.

**Two lines per row, never three (D-UI-023).** Maintainer, the same day, on
the cloud settings rows that carried a label, what they move, and how they
last went: *"when we risk having an extra line, if the description can be
moved into the confirmation dialog and it serves an additive function, that's
the best-case scenario in principle (because it allows us to keep it to two
lines max)."* So a row is a label and at most one line under it. When a second
line wants in, ask what the confirmation dialog already says — the itemisation
of what moves belongs there, where it is read at the moment of deciding — and
what the page's job is: on a page that launches a job, the line under the row
is how it last went; on a page that chooses what moves, it is what the row
carries. A row with no confirmation has nowhere to move a line to, so it
keeps the line that serves the page's job and drops the other.

The case: the cloud hub row briefly carried "BACK UP OR RESTORE, CHOOSE ROMS AND
BIOS, SET WHEN SAVES SYNC, AND CONNECT OR REPAIR YOUR CLOUD STORAGE." — accurate,
and wrong, replaced the same hour.

## Outcome words, and the register they are written in

A cloud run **passes or fails**. `COMPLETED`, or `COULDN'T FINISH - <why>`,
or `SKIPPED - <reason>` for the two sentinels and the launch cancel. There is
no middle word: `COMPLETED WITH GAPS` existed for a day and the maintainer's
verdict on meeting one was that a half-outcome nobody can act on costs more
trust than either plain answer (D-UI-030). A run whose parts disagree is a
failure that still says truthfully what moved.

The words themselves are **everyday, not formal** (D-UI-031). The test is
whether a person would say it out loud:

| Not this | This |
| --- | --- |
| `NOTHING WAS SENT. YOUR CLOUD IS AS IT WAS.` | `DON'T WORRY, NOTHING CHANGED.` |
| `NO NETWORK CONNECTION` | `YOU'RE NOT ONLINE` |
| `ANOTHER CLOUD SYNC IS RUNNING` | `A SYNC IS ALREADY RUNNING` |
| `YOUR CLOUD REFUSED THE TRANSFER` | `YOUR CLOUD WOULDN'T TAKE THE FILES` |
| `WRITING THE SETTINGS ARCHIVE...` | `PACKING UP YOUR SETTINGS...` |
| `IT RUNS AGAIN AT THE NEXT STARTUP.` | `IT'LL TRY AGAIN NEXT STARTUP.` |

Unchanged by that pass, because they are vocabulary rather than register: the
four tiers, the two verbs, `Wi-Fi`, the serial comma, two lines per row, and
the outcome words above.

## Outcome vocabulary (D-UI-028)

Every cloud surface -- the sync card, the transfer page, the rows under the
toggles -- ends a run with one of **three** words, then a why, what is in
place, and how to recover. Nothing else: no `FAILED`, no `SUCCEEDED`, no log
path, no exit code, no `rclone`. D-UI-028 set four; **D-UI-030 removed the
middle one** -- a run passes or fails, and a run whose parts disagree reads
`COULDN'T FINISH - <why>` with the failing part's why while still saying
truthfully what moved. The stamps keep the `gaps` token so a log can tell a
partial run from a total one; no screen ever shows it.

| Word | When | Card (line 2) | Page (line 1) | Row token |
|---|---|---|---|---|
| `COMPLETED` | every part of the run succeeded (rclone 9 counts as success) | `COMPLETED` | `COMPLETED` | `COMPLETED` |
| `COULDN'T FINISH - <why>` | nothing succeeded and it is not a sentinel | `COULDN'T FINISH - YOUR CLOUD STOPPED ANSWERING` | `COULDN'T FINISH` | `COULDN'T FINISH, YOUR CLOUD STOPPED ANSWERING` |
| `SKIPPED - <reason>` | only 69, 75, and the launch cancel | `SKIPPED - YOU'RE NOT ONLINE` / `SKIPPED - A SYNC IS ALREADY RUNNING` / `SKIPPED - YOU STARTED A GAME` | same | `SKIPPED, NO NETWORK` / `SKIPPED, ANOTHER SYNC WAS RUNNING` / `SKIPPED, A GAME WAS STARTED` |

The offline achievements' two cards (#292, #293; D-RA-030, D-UI-095) end in
the same three words: the send card `COMPLETED` with OFFLINE ACHIEVEMENTS HAVE
BEEN SENT until D-UI-107 reworded it to WHAT YOU EARNED OFFLINE IS NOW ON
YOUR ACCOUNT. under the title RETROACHIEVEMENTS) or `COULDN'T FINISH - IT
STOPPED ANSWERING` with IT'LL TRY AGAIN WHEN YOU'RE CONNECTED.; the top-up
card `COMPLETED` with N MORE GAMES ARE READY. or EVERYTHING'S UP TO DATE., or
`COULDN'T FINISH - <the ctl's why>` with IT'LL TRY AGAIN NEXT TIME YOU'RE
CONNECTED. Their running lines: RETROACHIEVEMENTS / SENDING N EARNED
OFFLINE..., and RETROACHIEVEMENTS (OFFLINE) / GETTING GAME N OF M READY...
Their stamp is `last-sync-link`, in the
same shape. And a capture that could not record after a game says, once,
as a toast after the sync card (D-UI-093): COULDN'T RECORD THIS SESSION'S
SAVES. THEY'RE STILL ON THIS DEVICE. -- what did not happen and what is in
place, no log path (#293 item 3; the maintainer would rather a proposed
sentence ship in the cut than wait, `player-language.md`).

**Why** comes from a `>>> why <sentence>` line the scripts print at the point
of failure (rclone's own taxonomy stays in the log), else from rc: rclone 3/4
`YOUR CLOUD FOLDER WASN'T FOUND`; 5 `YOUR CLOUD STOPPED ANSWERING`; 7/8 `YOUR
CLOUD REFUSED THE TRANSFER`; the sign-in check `COULDN'T REACH YOUR CLOUD. YOU
MAY NEED TO SIGN IN AGAIN`; the saves-root guard `YOUR SAVES ARE ON A
DIFFERENT CARD`; a 130 that was not a launch cancel `IT WAS STOPPED`; anything
else `SOMETHING WENT WRONG`. The six rc-keyed sentences are duplicated
verbatim in `ThreadedCloudSync`'s own fallback map, so they change on both
sides or on neither -- the plain-language pass (#108) deliberately left them
alone for that reason.

The scripts also print, where the table has no entry: `YOUR CLOUD STORAGE
ISN'T SET UP YET`, `YOUR SAVES FOLDER ISN'T ON THIS DEVICE`, `THIS DEVICE'S
SETTINGS BACKUP IS DAMAGED`, `THE COPY IN YOUR CLOUD ISN'T COMPLETE`, `YOUR
CLOUD SYNC SETTINGS COULDN'T BE READ`, `AN OLD FOLDER SETTING IS IN THE WAY`,
`COULDN'T TELL WHICH CARD YOUR SAVES ARE ON`, `YOUR SAVES CHANGED CARDS
PART-WAY THROUGH`, and `SOME FILES DIDN'T FINISH` for rclone 6 (2026-09-10,
#105 tranche A; reworded into everyday words 2026-09-10, #108); since the
audit's fixes (2026-09-28, #307): `SOMETHING CHANGED SINCE YOU CHECKED` (a match
refused because the cloud no longer matches the preview), `COULDN'T RECORD WHICH
CARD YOUR SAVES ARE ON`, `THE NEW FOLDER ALREADY HAS FILES IN IT` (the layout
migration's refusal), the stamp why `YOU WENT OFFLINE PART-WAY THROUGH` (a run the
network cut after files moved, stamped `69 gaps`), `SOME ACHIEVEMENT IMAGES
COULDN'T BE SAVED` (the scan page adds `TRY THE SCAN AGAIN.`), `CHECK WHAT WOULD
CHANGE FIRST` (`cloud_content_restore`: a match applied without its preview),
`YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED` (`cloud_migrate_layout`: a pointer
that could not be written), and `backuptool`'s
`A SIGN-IN WAS FOUND IN THE BACKUP`, `THIS BACKUP HOLDS FILES A RESTORE CAN'T PUT
BACK, SO NOTHING WAS CHANGED. RESTORE SETTINGS FROM THE CLOUD AGAIN, OR BACK UP
SETTINGS TO REPLACE IT.` (proposed, D-UI-117), `THERE'S NOTHING TO BACK UP YET`, `A SETTINGS
BACKUP OR RESTORE IS ALREADY RUNNING`, `YOUR OWN BACKUP LIST NAMES A FOLDER A BACKUP
CAN'T CARRY`, `THIS DEVICE CAN'T RESTORE SETTINGS. SOMETHING IT NEEDS IS MISSING FROM
THIS BUILD.` -- proposed by the fix streams, built with the proposed words, and put
to the maintainer (D-UI-112); `backuptool`
prints its own on the console flows (`THERE'S NO SETTINGS BACKUP ON THIS
DEVICE YET`, `THIS DEVICE'S SETTINGS BACKUP IS DAMAGED`, `COULDN'T KEEP A COPY
OF YOUR CURRENT SETTINGS`, `THE RESTORE COULDN'T FINISH`, ...). **The stamp's
third field** is the why
sentence as one token, spaces as underscores
(`1789000000 5 YOUR_CLOUD_STOPPED_ANSWERING`), present only when the run did
not complete and was not a sentinel; a reader turns the underscores back into
spaces.

**In place**, one per verb, true because rclone renames on completion and the
content scripts never delete outside a match: back up `WHAT MADE IT IS IN
YOUR CLOUD. THE REST IS STILL HERE.` / `DON'T WORRY, NOTHING CHANGED.`; restore
`WHAT MADE IT IS ON THIS DEVICE. NOTHING ELSE CHANGED.` / `DON'T WORRY, NOTHING
CHANGED.`; saves sync `THE SAVES THAT MADE IT ARE ON BOTH SIDES. NOTHING ELSE
CHANGED.` / `DON'T WORRY, NOTHING CHANGED.` (the shipped strings,
`ThreadedCloudSync.cpp:135-137`, since the plain-language pass #108; this
paragraph carried the pre-#108 wording until 2026-09-28, when stream E1 found
the drift while reusing the sync clause for a run the network cut part-way); match `N FILES WERE REMOVED FROM THIS DEVICE.` / `NOTHING WAS REMOVED FROM THIS DEVICE.` -- the
count only: a match removes what the cloud does *not* have (D-CLOUD-023), so
the old second sentence, YOUR CLOUD STILL HAS THEM, said the opposite of the
truth (#308, E2's third pass, 2026-09-28)

**Recover**: the page offers `TRY AGAIN` (the confirm button, south) beside `CLOSE` (the back button, east; buttons by position, never by letter -- `es-ui-style-guide.md` § Interaction rules) on the page's help bar when
the run did not complete, re-running the same command -- except a match, whose
apply used up its preview's plan (PL-001, D-CLOUD-141): the same command again
is always refused, so the page offers no TRY AGAIN for a match and line 7 points
at the row that checks again, `TRY AGAIN: MATCH THIS DEVICE TO THE CLOUD`; the card's action line
names the row (`TRY AGAIN: GAME SETTINGS > BACK UP SAVES TO THE CLOUD`), or for
an automatic sync when it runs again (`IT RUNS AGAIN WHEN YOU EXIT A GAME`);
no network `TRY AGAIN WHEN YOU'RE ONLINE.`; lock held `WAIT FOR IT TO FINISH,
THEN TRY AGAIN.`; a game started `YOUR SAVES ARE SENT WHEN YOU EXIT THE GAME.`
Measure every string at 640x480 in frames; if the card's action line clips,
drop the in-place clause first.

## Anti-patterns (observed, avoid)

- Developer/QA concepts in product text: no QEMU/VM/port-forward mentions, no
  "open this link on the device" (the sign-in window is the only browser, and it opens only a provider's sign-in page). Console-first: player +
  handheld + phone companion is the only assumed environment.
- Dialog text promising behavior the backend doesn't do (pre-P1 backup dialogs).
