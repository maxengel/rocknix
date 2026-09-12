---
description: "Surprise the player as little as possible: things work as they expect and the same way every time. The tie-breaker for interface and sync decisions."
---

# Least surprise

Maintainer, 2026-09-12: *"Ultimately, our goal needs to be to surprise the user as
little as possible. This means things should work as expected and as much the same
as possible."* D-UI-042. With time to play (`time-to-play.md`) this is the pair of
principles every interface and sync decision is weighed against.

## What it decided today, so the shape is clear

- A sync the player can see is never cancelled by a launch; it finishes or fails
  with a reason (D-CLOUD-109). "If they think a sync is happening, they think a
  sync is happening."
- The automatic cards say *sync*; the deliberate page says *back up* and *restore*
  (D-UI-040, D-CLOUD-113). Quick things read as quick; long things read as long.
- A sync that could not run says why and what it means, and the count of games
  waiting stays visible until they have gone (D-UI-041).
- The wizard's columns never swap sides (D-CLOUD-041, D-CLOUD-104); the cursor
  opens on the newer version, but the choice is a press the player makes.
- One console at a time; conflict resolution assumes the two versions were made in
  serial by one person (D-CLOUD-102/103); no lock babysits the player.

## How to apply

- **Ask what the player expects to happen**, from what the screen has told them,
  before asking what is safe or fast. Safety and speed then decide *how*, not
  *whether*.
- **Same thing, same place, same words.** A row that does one thing in one menu
  does the same thing everywhere it appears; a word means one thing (D-UI-022).
- **No silent outcomes.** Anything that did not happen as the screen implied it
  would is said, once, with the consequence and the way forward.
- **Precedent over invention.** Where Steam, the consoles or ROCKNIX's own menus
  already set an expectation, match it unless there is a stated reason not to.
