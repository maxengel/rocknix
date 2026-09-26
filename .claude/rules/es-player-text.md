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
  RetroAchievements, so the sentence is OFFLINE ACHIEVEMENTS HAVE BEEN SENT,
  and TO RETROACHIEVEMENTS is the longer candidate a card line tries first
  where it has room (D-UI-035, longest first). Maintainer, 2026-09-26:
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
| `SKIPPED - <reason>` | only 69, 75, and the launch cancel | `SKIPPED - YOU'RE NOT ONLINE` / `SKIPPED - A SYNC IS ALREADY RUNNING` / `SKIPPED - A GAME WAS STARTED` | same | `SKIPPED, NO NETWORK` / `SKIPPED, ANOTHER SYNC WAS RUNNING` / `SKIPPED, A GAME WAS STARTED` |

The offline achievements' two cards (#292, #293; D-RA-030, D-UI-095) end in
the same three words: the send card `COMPLETED` with OFFLINE ACHIEVEMENTS HAVE
BEEN SENT (TO RETROACHIEVEMENTS where the line has room, D-UI-096) or
`COULDN'T FINISH - RETROACHIEVEMENTS STOPPED ANSWERING` with IT'LL TRY AGAIN
WHEN YOU'RE CONNECTED.; the top-up card `COMPLETED` with N GAMES ADDED FOR
OFFLINE PLAY. or YOUR OFFLINE ACHIEVEMENTS ARE UP TO DATE., or `COULDN'T FINISH
- <the ctl's why>` with IT'LL TRY AGAIN NEXT TIME YOU'RE CONNECTED. Their
running lines: SENDING OFFLINE ACHIEVEMENTS... / N TO SEND, and UPDATING
OFFLINE ACHIEVEMENTS... / N OF M. Their stamp is `last-sync-link`, in the
same shape.

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
#105 tranche A; reworded into everyday words 2026-09-10, #108); `backuptool`
prints its own on the console flows (`THERE'S NO SETTINGS BACKUP ON THIS
DEVICE YET`, `THIS DEVICE'S SETTINGS BACKUP IS DAMAGED`, `COULDN'T KEEP A COPY
OF YOUR CURRENT SETTINGS`, `THE RESTORE COULDN'T FINISH`, ...). **The stamp's
third field** is the why
sentence as one token, spaces as underscores
(`1789000000 5 YOUR_CLOUD_STOPPED_ANSWERING`), present only when the run did
not complete and was not a sentinel; a reader turns the underscores back into
spaces.

**In place**, one per verb, true because rclone renames on completion and the
content scripts never delete outside a match: back up `WHAT WAS SENT IS IN
YOUR CLOUD. THE REST IS STILL ON THIS DEVICE.` / `NOTHING WAS SENT. YOUR CLOUD
IS AS IT WAS.`; restore `WHAT ARRIVED IS ON THIS DEVICE. THE REST IS AS IT
WAS.` / `NOTHING ARRIVED. THIS DEVICE IS AS IT WAS.`; saves sync `THE SAVES
THAT MOVED ARE ON BOTH SIDES. THE REST ARE AS THEY WERE.` / `YOUR SAVES ARE AS
THEY WERE.`; match `N FILES WERE REMOVED FROM THIS DEVICE. YOUR CLOUD STILL HAS
THEM.` / `NOTHING WAS REMOVED.`

**Recover**: the page offers `TRY AGAIN` (A) beside `CLOSE` (B) on line 7 when
the run did not complete, re-running the same command; the card's action line
names the row (`TRY AGAIN: GAME SETTINGS > BACK UP SAVES TO THE CLOUD`), or for
an automatic sync when it runs again (`IT RUNS AGAIN WHEN YOU EXIT A GAME`);
no network `TRY AGAIN WHEN YOU'RE ONLINE.`; lock held `WAIT FOR IT TO FINISH,
THEN TRY AGAIN.`; a game started `YOUR SAVES ARE SENT WHEN YOU EXIT THE GAME.`
Measure every string at 640x480 in frames; if the card's action line clips,
drop the in-place clause first.

## Anti-patterns (observed, avoid)

- Developer/QA concepts in product text: no QEMU/VM/port-forward mentions, no
  "open this link on the device" (there is no browser). Console-first: player +
  handheld + phone companion is the only assumed environment.
- Dialog text promising behavior the backend doesn't do (pre-P1 backup dialogs).
