# QA frames, 2026-09-20 — the RC round for `77e7e97515` (#236)

Frames read from the GENERIC_X64 guests on the release-candidate image, for
the boxes in #236 section B. Each frame names its issue, what it shows, the
guest's resolution and the build.

- `160-retroachievements-game-page-1280x800-77e7e97515.png` — guest b, the QA
  RetroAchievements account, Böbl (set 4902, 12 achievements) through its
  gamelist `cheevosId`: the three header lines left-aligned with their values
  in one column, the bar and `0% complete` beside the block, the badge top
  right, the list starting below the header. No overlap (#160's 1280x800 box).
- `160-game-options-1280x800-77e7e97515.png` — the game options panel the page
  was opened from (VIEW THIS GAME'S ACHIEVEMENTS first, with the account on and
  no scraped media), for the record of the walk.
- `94-launch-over-sync-question-1280x800-77e7e97515.png` — guest a, from the
  vm-qa time-to-play run of 18:56 (`g1-exit-002`): a game launched while a
  saves sync is in flight is stopped by the gate — `YOUR SAVES ARE SYNCING WITH
  THE CLOUD. IF YOU STOP IT, THE NEXT SYNC FINISHES WHAT THIS ONE DID NOT.`
  with STOP IT AND PLAY / KEEP WAITING — and never runs alongside it (#94's VM
  box; the sync here is the exit sync, the same gate the startup sync uses).
