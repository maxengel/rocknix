# #329: SCAN GAMES FOR OFFLINE ACHIEVEMENTS with nothing to scan

`before-*`: `83298993d6` (EmulationStation `f1ae6bc25`), guest d, 2026-09-29 21:11-21:18 UTC, `proofs-307/scan-empty.sh` and `scan-empty-a.sh`.

- `before-a-*`: no RetroAchievements account signed in (the account cleared and the guest rebooted), the OFFLINE ACHIEVEMENTS (BETA) switch turned on through its dialog; the page offers the scan at once (D-RA-012), and SCAN NOW on the offer ends `COULDN'T FINISH` over `NO GAMES READY FOR OFFLINE PLAY YET` and `SIGN IN TO RETROACHIEVEMENTS FIRST.` The Retroid Pocket Nova's journal shows the same sequence on RC1: `raofflineproxy-ctl enable` at 16:50:20 of its clock, `scan: refused, no RetroAchievements account is signed in` at 16:50:24, no stamp written.
- `before-b-*`: the account back, the switch on, every ROM folder emptied (`/storage/roms` moved aside, `bios/` kept); the SCAN row's dialog, then `COULDN'T FINISH` over `NO GAMES READY FOR OFFLINE PLAY YET` and `NO GAMES WERE FOUND ON THIS CONSOLE`; the stamp read `1790716370 1 scan cached=0 skipped=0 ready=0 limit=0 indexed=0 errors=0 added=0 why=NO_GAMES_FOUND`.

`after-*`: the cut carrying the fix (the pin after `f1ae6bc25`), the same two walks: the switch's turn-on with no account says `SIGN IN TO RETROACHIEVEMENTS FIRST. THEN SCAN GAMES FOR OFFLINE ACHIEVEMENTS, ...` instead of offering the scan; the empty library ends `COMPLETED`, `NO GAMES TO SCAN YET`, `ADD GAMES, THEN SCAN AGAIN.`, and the row reads `LAST <date> - COMPLETED · NO GAMES TO SCAN YET`.

The RETROACHIEVEMENTS SETTINGS frames, which carry the QA account's name, are not filed; no account name is on these frames.
