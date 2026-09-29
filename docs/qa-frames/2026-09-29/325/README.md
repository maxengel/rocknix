# #325: up from the MAIN MENU's first row

`before-*`: `8dd6765af0` (EmulationStation `014f82685`), guest d signed out, 2026-09-29 08:05 UTC: the first press lands on nothing (the empty tab strip), the second on BACK, the third on QUIT.

`after-*`: `83298993d6` (EmulationStation `f1ae6bc25`), guest d signed in, 16:16 UTC: the first press lands on BACK, the second on QUIT, the third on SYSTEM SETTINGS.

Walk: `tools/vm-walks/docs/main-menu-up-probe.steps` with the menu open (`proofs-307/probe-d13.steps` opens it with START first). No account name is on these frames.
