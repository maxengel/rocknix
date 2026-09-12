---
description: "Time to play -- from the interface to a game's first frame, and from one game's exit to the next -- is a first-class goal that weighs on every cloud, sync and interface decision."
---

# Time to play

Maintainer, 2026-09-11: *"a key metric being the time to play, meaning how long does it
take for someone to go from being in the UI to starting a game, or from exiting a game
to starting another game ... We need to balance our goal of having a rigorous backup and
sync engine with a player's goal of wanting to actually enjoy playing a game as quickly as
possible."* And: *"It's a good goal for us always to be cognizant of and to rally around,
because it can help guide our decision-making."* D-CLOUD-098, #135.

## What it means when designing

- **Two numbers, on every image:** interface → a game's first frame; a game's exit → the
  next game's first frame. The runner measures both (#135) and writes them into
  `docs/vm-qa-log.md`. **One budget is a register row today** -- the exit sync's 3 s
  (D-CLOUD-119) -- and `tools/time-to-play` fails a run whose exit-sync median exceeds
  it. The launch and game-to-game numbers *report* until a row bounds them (#135's own
  acceptance note); proposing those two rows from the measurement is an Open decision,
  D-CLOUD-122. A cell that produced no number at all is never a pass either
  (`headline_missing`, blindspot 39).
- **Nothing we add sits on the launch path unless it must.** A sync, a capture, a
  retention write, a check -- each is asked: does the player wait for this? If yes, why,
  for how long, and does the screen say so? A sync that gates a launch (D-CLOUD-038) is
  bounded and visible. **What ships today** still cancels an automatic sync at launch
  (D-CLOUD-076; the card reads `SKIPPED - A GAME WAS STARTED`). **D-CLOUD-109 replaces
  that** with a bounded wait -- see the bullet below; until it lands, both sentences are
  true of different builds, and a design written against D-CLOUD-076 is written against
  a decision that has been superseded.
- **Rigour is spent where the player is not waiting.** Retain-before-publish, hashing,
  manifests and verification belong after the game has started or after the card has
  said the player may go, not between the press and the frame.
- **A setting that trades speed for safety says its price** in seconds, where it is
  turned on.
- **A sync the player can see is never cancelled by a launch; it is bounded instead**
  (D-CLOUD-109). The launch waits; the sync gets a budget of a few seconds set from
  measurement, checks connectivity first, and past the budget ends with an outcome the
  player can act on. A sync never takes minutes. Maintainer, 2026-09-12: "If they think a
  sync is happening, they think a sync is happening."
- **The offline benchmark** (D-CLOUD-112): sync-on-exit stays on, on the subway and on the
  plane; with no connectivity the sync must reach its outcome in about the time a
  successful sync of the same change would have taken. Size every connect timeout and
  probe to that, and measure the offline exit beside the online one.
- **Two contracts, never one budget** (D-CLOUD-113): a deliberate back up or restore may
  take time and says so on its page; an automatic sync on exit or at startup is quick,
  bounded, and waited for. Do not size one by the other.
- **Retros and plans name it.** Every phase retro asks what the phase did to time to
  play; every plan for a cloud or interface change states its effect on the two numbers
  before it is built.
