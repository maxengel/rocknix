---
description: "The running change log is written the day a player-visible change lands; a section is a set of claims checked against the build."
paths:
  - "projects/ROCKNIX/packages/**"
  - "docs/cloud-sync-changelog.md"
---

# The running change log is written the day the change lands

`docs/cloud-sync-changelog.md` is the fork's running change log: a claims
document that becomes the upstream PR body, the rocknix.org pass, and the
call for testers. It is the one place a reader can learn what a player sees
changed without reading ten work logs and the register.

**Write its section the day a player-visible change lands on `next`** — in
the same commit as the pin bump or the script change where that is
practical, and never later than the session that lands it. Maintainer,
2026-09-22, on #243: *"This is also a quality-of-life improvement. We should
make sure we add to our running change log."* The log had stopped at
2026-09-11 and ten days of shipped changes — the offline achievements pages,
the save state manager's tiles, the help bar, the scraper rows, the Wi-Fi
rows, the vocabulary sweep — were absent (#244). Filling a gap that size
means re-deriving from logs what the session that shipped each change knew
for nothing.

## What goes in

A change is change-log material when someone holding the device sees, reads,
or no longer has to do something: a page, a row, a sentence, a wait that is
gone, a picture drawn right. Tests, harnesses, build fixes, rules, QA tooling,
and library bumps are not, unless they change behaviour the player meets. A
fix found under a change goes in with it (a row that grew a screen tall).

## How a claim is written

- **A `## Title (date)` section**, a short lead, then bullets: the claim in
  bold first, the issue number and decision ID in parentheses, the
  maintainer's words in italics where the call was theirs.
- **On-screen words in backticks, exactly as the interface shows them.** A
  string that is not in the source is not quoted.
- **The vocabulary is D-UI-022's** (`es-native-ui.md` § Conventions): back
  up / restore, game saves / save states, settings, ROMs and BIOS, Wi-Fi.
- **Every claim is checked against the build before it is written**, the
  document's own rule since #57: the code on `next`, and a run where one
  exists (a frame, a suite row). A claim that describes what was intended
  rather than what the image does is the failure this document exists to
  prevent.
