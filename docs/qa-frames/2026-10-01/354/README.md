# #354 cloud epic -- guest d (640x480) on GENERIC_X64 run 95 (`92c6cf25f1`), 2026-10-01

Frames from `epic-proof-d.sh` and `epic-proof-E.sh` (the session's scratch,
`/workspace/tmp/rocknix-session/`), read and filed the same afternoon. The
QA WebDAV on the host plays the cloud; no account or key is on screen.

| Frame | Shows | Decision |
| --- | --- | --- |
| 01 | the scan page: CHECKING YOUR CLOUD, SETTINGS BACKUPS, ITEM 2 OF 3, the approved line cut at the panel's width (fixed in ES `0741cd64a`: the clause drops whole) | D-CLOUD-156/167, D-CLOUD-164 strings 1-2 |
| 02 | the move dialog over the hub: MOVE / KEEP USING /ROCKNIX / NOT NOW | D-CLOUD-160, string 6 |
| 03 | the move page ended: COMPLETED, 6 FILES, the note (cut; one short sentence since `0741cd64a`), PRESS ANY BUTTON TO CONTINUE | D-CLOUD-167, strings 7-8 |
| 04 | the options page after the move: SETTINGS offered as GENERIC X64 with the date (the month missing; the system date shape since `0741cd64a`) | D-CLOUD-162, string 4 |
| 05 | the options page with only a foreign archive: SETTINGS dimmed, NO SETTINGS BACKUP FROM THIS DEVICE YET | D-CLOUD-162, string 3 |
| 06 | the content folder question: CHOOSE A FOLDER / NOT NOW | #352, string 9 |
| 07 | CHOOSE A CLOUD FOLDER: the cloud's root folders | #352, string 10 |
| 08 | the create offer: CREATE IT / CHOOSE A FOLDER / NOT NOW | D-CLOUD-161, string 5 |
| 09 | CREATING YOUR CLOUD FOLDER, running | D-CLOUD-167 |
| 10 | the startup card: SKIPPED - YOUR CLOUD FOLDER ISN'T SET UP YET, SET IT UP: GAME SETTINGS > MANAGE CLOUD STORAGE, no dialog | D-CLOUD-166, string 11 |
| 11 | the hub row under it: AT STARTUP - SKIPPED, YOUR CLOUD FOLDER ISN'T SET UP YET | D-CLOUD-166 |
| 12 | a scan the cloud refused (the dead port): COULDN'T FINISH, CLOUD FOLDER - YOUR CLOUD STOPPED ANSWERING, CLOSE and TRY AGAIN | D-UI-028 |
| 13 | BACK UP TO THE CLOUD's options after its own scan | D-CLOUD-167 |

Not framed here: the transfer verb's crash on this build (RESTORE after the
scan-opened page; the kept core named `Window::pushGui` with a misaligned
`Window*`), fixed in ES `0741cd64a` and proven on the next build.
