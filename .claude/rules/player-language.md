---
description: "Player-facing language is clear first, then as short as it can be while still clear, and sized to the space it is shown in. Applies to every label, dialog, card line and script sentence."
---

# Player language

*No `paths:` glob, so this file loads every session: half the strings a
player reads are printed by shell scripts and half by C++, and no glob covers
both without covering everything.*

Maintainer, 2026-09-12: *"In general, we should always go for clarity and
brevity to make sure our language is well-aligned, simple to understand, and
as short as it can be while still being clear and optimized for the space."*
D-UI-045. Beside least surprise (`least-surprise.md`) and time to play
(`time-to-play.md`), this is the test every string a player reads is held to.

This file is the principle. The words themselves -- the four tiers and the two
verbs, "back up" vs "backup", the serial comma, game save vs save state, Wi-Fi,
how much text a row may carry, and the outcome vocabulary a run ends with --
are `es-player-text.md`; the surfaces they are shown on are `es-native-ui.md`.

## The test, in order

1. **Clear.** A player who has never read our docs knows what happened and
   what to do next. Clarity is never traded for length.
2. **Brief.** Then as short as it can be while still clear. Every word whose
   removal changes nothing goes.
3. **Sized to the space.** The smallest panel is 640x480 at 3.5". A row is a
   label and at most one line under it (D-UI-023); a card carries one line
   under its title; a dialog is a sentence or two and a question. A string
   that needs more wants a page, not smaller text.
4. **Well-aligned.** One word for one thing everywhere (D-UI-022: *saves*,
   *settings*, *ROMs and BIOS*, *game content*; *back up*, *restore*, *sync*),
   and one shape for one kind of fact (`12 KB OF 40 KB`, `3 OF 7`,
   `LAST <date> - <outcome>`).

## How to apply

- **Write the long form, then cut.** "YOUR CLOUD HAS A FOLDER CALLED %s BUT
  NONE CALLED %s, SO THERE WAS NOTHING TO BRING BACK." became "YOUR CLOUD HAS
  A %s FOLDER BUT NO %s FOLDER, SO THERE WAS NOTHING TO RESTORE." -- shorter,
  and *restore* is the word the row used.
- **The canonical verb, never a paraphrase.** "Bring back" is longer than
  "restore" and a second word for one thing.
- **A tool's words never reach a player.** rclone's `0 B / 0 B, -, 0 B/s`, its
  banners and its per-file lines are written for a log (#140). The surface
  says the fact in the player's words or says nothing.
- **Present the short form for approval.** When strings go to the maintainer,
  they approve words, not paragraphs; a long draft is a draft that has not
  been cut yet.
- **A small item whose only open question is its words is built with the
  proposed words and put to the maintainer in the build, not deferred.**
  Maintainer, 2026-09-26, on the capture-failure toast left out of a cut
  because its sentence had not been approved: *"We shouldn't have left that
  out. It was a relatively quick fix, and I would have rather included it in
  the last build."* A deferral costs a build round and a device cycle; a
  wrong word costs one string. Propose the sentence, ship it in the cut,
  and let the approval change the word.
- **A decision is put in terms of what they would see.** The same test the
  strings are held to applies to how a choice is asked. On 2026-09-12 nine
  council proposals went up as "budget", "stage" and "P-4"; none of those
  meant anything until they were restated as what happens on the screen and
  how long the player waits, and the walk only moved once they were. Lead
  with the visible thing, and keep our internal names out of the question.
- **Brevity is not clipping.** A sentence cut mid-thought to fit is a failure
  of step 3, not a success of step 2 -- drop a whole clause or sentence
  (`outcomeCandidates`, D-UI-035), or move the detail to where it is read
  (the confirmation dialog, D-UI-023).
