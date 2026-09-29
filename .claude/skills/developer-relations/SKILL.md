---
name: developer-relations
description: "Write or revise a rocknix.org page (configure, play, contribute) in the site's own voice -- the maintainer's and the other contributors' -- so it reads as one of them wrote it. Use for every wiki page, and run tools/prose-check on the draft before it is shown to anyone."
license: GPL-2.0-or-later
metadata:
  version: 1.0.0
  origin: "Synthesized 2026-09-29 (#323, D-WORKFLOW-068) from the maintainer's estate: its devrel-copywriter skill (the voice triangle, banned openers and phrases, admonition and code-block rules, drawn from a ten-portal study) and its friendly-changelog skill; re-anchored on rocknix.org's own pages, which win wherever the two disagree."
---

# Writing for rocknix.org

A page on rocknix.org is read by someone holding a handheld, or a phone next
to it, who wants one thing done: get online, get their saves into the cloud,
get an achievement to count. They do not read to learn our design. They judge
the page by whether the thing worked, and they notice when a page sounds like
nobody in particular wrote it.

So the first rule is not a rule of ours. **The site already has a voice, and
the page joins it.** Before writing, read the samples in § The samples, then
write, then read the draft back against them (§ The loop). `tools/prose-check`
fails a draft on the tells in § Tells; it passes the maintainer's own page,
which is the bar.

## Who reads it

- A player with a ROCKNIX handheld and a phone or laptop on the same Wi-Fi.
  They know what a save is and what a ROM is. They do not know what rclone,
  a remote, a stanza or a manifest is, and they should not have to.
- The ROCKNIX team, reading a page to see whether a change was documented.
  They know everything; they want it short and right.

Write for the first. The second is served by the same page being right.

## The samples

Read these, in the site checkout (`~/Development/rocknix.org`, branch `main`),
before writing a page in their section:

| Sample | Who | What it shows |
| --- | --- | --- |
| `docs/configure/cloud-sync.md` § *Cloud Sync with rclone* | the maintainer (2026-07-24) | numbered steps with a bold label each (`1. **Enable Networking**:`), sub-bullets for the presses, menu names in backticks (`Network Settings`, `START`), a variable table with the name bold and one line each, a closing "share details in Discord" |
| `docs/play/update.md` | a contributor | `## Option 1: OTA Update` headings, `++"Start"++` for a controller button, `!!! info "..."` with the whole sentence as the title, `<details><summary>Screenshot: ...</summary>` for an image, `<details><summary>Snippet: ...</summary>` for a command |
| `docs/play/retro-achievements.md` | a contributor | a one-paragraph opener that says what the feature is and what it needs, `## Setup` as numbered presses, `## Additional Notes` as bullets with a recommended-settings list |
| `docs/play/add-games.md` | a contributor | the long form: an opener that says the options depend on the device, `## Storage Modes` before the options, a `### Troubleshooting` under a section, parenthetical asides, a screenshot per platform |
| `docs/configure/cloud-sync.md` § *Syncthing* | a contributor | the casual register at its widest: "Don't worry about notices about upgrading ... nothing you can do", "we'll come back to this shortly" |

What they have in common, and a new page keeps:

- **Second person, present tense, imperative in steps.** "Press `START` to
  open the Main Menu." "Select `Game Settings`."
- **A menu path is written as the reader sees it**: `Game Settings` →
  `Cloud Saves`, each name in backticks, the arrow between; a controller
  button as `++"START"++` in play pages (the site's key macro), or in
  backticks in configure pages as the maintainer does. Match the page's
  section.
- **Steps are numbered, presses are sub-bullets, one action per line.**
- **A screenshot sits inside `<details><summary>Screenshot: what it shows</summary>`**
  with the image under `docs/_inc/images/<page>/`, so a page reads without
  it and the reader opens it when they want to see the screen.
- **One admonition per section at most**, in the site's forms: `!!! note`,
  `!!! tip`, `!!! info`, `!!! warning`, the title in quotes carrying the
  sentence. Never two in a row.
- **Plain words, and the site's own.** *Saves* and *states* as RetroArch
  names them (a page may add "in-game saves" once); *settings*, *ROMs and
  BIOS*, *game content* as the interface's rows say (`es-player-text.md`'s
  four tiers); "Wi-Fi" with the hyphen; the cloud provider by its name
  (Dropbox, Google Drive) because that is what the player set up.
- **Short sentences, a little unevenness.** The site's pages have a typo or
  two and a parenthetical aside; they were written by people between other
  things. Do not polish a page until every sentence is the same length and
  shape -- that is the surest tell of all.
- **Where the reader ends up.** A how-to closes with what they should now
  see ("You should now see...") or where to go for help (Discord, the
  RetroAchievements docs), not with a summary of what they just read.

## Voice, in the site's register

From the estate's rules, kept because the site already does them:

| Trait | Do | Don't |
| --- | --- | --- |
| Warm, not chummy | "Don't worry about the read-only notice; nothing you can do about it." | "Simply just ignore it -- easy!" |
| Crisp, not curt | "Enter the `root` password when prompted." | "At this point you'll want to go ahead and enter the root password." |
| Confident, not arrogant | "The update begins automatically after the reboot." | "The update should hopefully begin after the reboot." |
| Concrete | "Copy the `.tar` to `/storage/.update` and reboot." | "Transfer the update file to the appropriate location." |
| The reader's outcome first | "Get your saves onto every device you own." | "This page describes the cloud sync feature." (the maintainer's "This guide provides instructions on..." is the site's own and stays where it is; do not add new openers of that shape) |

Contractions are the site's ("you'll", "don't", "it'll"); use them where the
sentence wants one. "We" is the project when it does something ("we
recommend", "we'll come back to this"), never the reader.

## Tells

What makes a page read as machine-written. `tools/prose-check` fails on the
first group and warns on the second; the lists came from reading the samples
against drafts, and they grow the same way (§ The loop).

**Fail:**

- An em dash or a spaced en dash used as punctuation (the site uses commas,
  a colon, or a plain hyphen with spaces in the Syncthing section's style).
- "delve", "leverage", "robust", "seamless", "streamline", "utilize",
  "empower", "elevate", "unlock the power", "game-changer", "supercharge",
  "best-in-class", "world-class", "cutting-edge", "state-of-the-art".
- "It's worth noting", "It is important to note", "Note that" as a sentence
  opener, "Keep in mind that", "Remember that", "Please note".
- "Whether you're ... or ...", "not just X, but Y", "from X to Y" as a
  flourish.
- A rhetorical question, an exclamation mark in body text, "Let's".
- A closing summary: "In summary", "To sum up", "In conclusion", "Overall,",
  "That's it!", "You're all set!", "Happy gaming".

**Warn** (allowed once on a page, since the site's own writers use them, and
flagged so the writer chooses). Three of these began as fails and were moved
here by the samples on the day the check was written, which is the loop
working: the maintainer's "game saves, states, and screenshots" is a list of
three things with the serial comma (`es-player-text.md` asks for it), their
variable reference is eleven `**Name**: sentence` bullets, and the
RetroAchievements page says "in order to" twice.

- A three-item list in one sentence: three nouns are fine; three adjectives
  for rhythm ("fast, simple, and secure") are the tell.
- A bulleted list of more than five `**Label**: sentence` items where the
  page explains rather than lists a reference.
- "in order to", "due to the fact that", "a number of".

- "simply", "just", "easy", "easily", "quickly" in a step.
- "ensure", "ensure that".
- "please" outside a request for help.
- A sentence over 35 words.
- Two consecutive sentences starting with the same word.
- A heading that is a question.

## Page shapes the site uses

Match the section's existing pages rather than inventing a structure:

- **A feature page under `play/` or `configure/`**: the icon title
  (`# :material-cloud-sync: Cloud Sync`), one paragraph saying what the
  feature is and what it needs, `## Setup` (or `## Option 1: ...` when
  there are alternatives) as numbered presses, `## Additional Notes` or
  `### Things to Keep in Mind` as bullets, `### Troubleshooting` where
  things go wrong, a screenshot behind `<details>` where the screen matters.
- **A developer page under `contribute/`**: what it is and why, then the
  steps with commands in fenced blocks with a title (`bash title="..."`),
  `!!! tip` for the recommended path, a Troubleshooting section that names
  the misleading error and its real cause.

## The loop

Every page, in this order, and the fourth step is where the skill improves:

1. Read the section's sample page(s) top to bottom.
2. Draft the page as if continuing that page.
3. Run `tools/prose-check <page>`; fix every fail.
4. Read the draft aloud beside the sample. Anything that would make the
   sample's author pause -- a phrase they would not use, a sentence too
   even, a paragraph that explains what the reader will do before doing
   it -- is noted here, in § Tells, with the phrase, and in
   `tools/prose-check`'s list when a pattern can catch it. Then the next
   page starts from the longer list.
5. A page shared with other contributors is edited by section: their
   sections stay as they wrote them, and `tools/prose-check`'s fails on
   those lines are reported in the PR, never fixed in passing. On
   2026-09-29 the cloud-sync page's three fails were all in the Syncthing
   section (a contributor's "seamlessly", twice, and an exclamation mark);
   the rclone section, the one being written, had none.
6. The screenshots are captured on the VM at 640x480 by a walk step file
   kept beside the page's source (`tools/vm-walks/docs/<page>.steps`), never
   pasted from a session, so the picture can be retaken when the screen
   changes (`generic-x64-vm-testing.md`); a frame that shows an account's
   name goes through `tools/png-blackout` first. Two things the first
   capture taught (2026-09-29): a row is found by its reference frame or by
   reading the source, never by counting a montage (GAME SETTINGS' ACCOUNTS
   line is a heading, and two walks counted it as a row); and under a
   device build the guest draws late enough that `wait-for-change`'s
   re-send lands a key twice, so a docs walk waits 30 s per press and never
   re-sends (`wait-for-change 30 0`, one press per line).

## The check on this file

`tools/prose-check` fails this file, and should: § Tells quotes every phrase it
bans. The check is for pages; the skill is the list.

## What this skill is not for

Release notes and PR descriptions are `release-notes` (the estate's
friendly-changelog and commit-messages cards, adapted). Strings a player reads
on the device are `es-player-text.md`. This file is for pages people read in a
browser.
