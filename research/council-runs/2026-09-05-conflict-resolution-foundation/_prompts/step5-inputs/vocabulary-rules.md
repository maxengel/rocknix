- **Three tiers, two verbs, and the destination says where (D-UI-022).**
  The things cloud sync moves are **settings** (the archive `backuptool`
  writes: emulator and interface configuration, input mapping, themes,
  collections, bezels — no saves, no ROMs, no operating system), **saves**
  (game saves, save states, and screenshots), and **ROMs and BIOS**. The
  only verbs are *back up* and *restore*; nothing is "uploaded" or
  "archived" in a label, because a player has no way to tell those apart
  and the archive is uploaded too. The label says what and where: BACK UP
  SETTINGS TO THIS DEVICE, BACK UP SAVES TO THE CLOUD, RESTORE SETTINGS FROM
  THE CLOUD. **Never "system backup"** — it held people to expecting their
  games in it — and never "save data", "configurations", "everything", or
  "cloud library". *Sync* is reserved for the automatic two-way behaviour
  saves get after #22, where a player never picks a direction. The wizard's
  kept losers are **discarded saves**; *discard* means nothing else.

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

