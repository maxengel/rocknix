# QA frames, 2026-09-12 -- the exit card's live line (#140)

GENERIC_X64 `a2ee7b9bb2` (EmulationStation `f93acc2a6`) on guest c at 640x480.
The NES probe was launched through EmulationStation's own launch path
(`POST /launch`, which is `ViewController::launch`, the same code as A on the
game) and ended the way the exit hotkey ends a game (`input_sense`'s
`execute_kill`); frames every half second from the moment the game ended.

| Frame | What it shows |
|---|---|
| `exit-card-nothing-sent-yet.png` | Against the QA endpoint's dead port: SYNCING SAVES TO THE CLOUD over **NOTHING SENT YET**. On `d94ca7b159` this line read `Elapsed time:        2.0sTransferred:            0 B / 0 B, -, 0 B/s` (the #140 frame). |
| `exit-card-dead-port-outcome.png` | The same run two seconds later: SYNC SAVES / COULDN'T FINISH - YOUR CLOUD STOPPED ANSWERING / DON'T WORRY, NOTHING CHANGED. IT'LL TRY AGAIN WHEN YOU EXIT A GAME. Unchanged from `d94ca7b159`. |
| `exit-card-completed.png` | Against the live endpoint: SYNC SAVES / COMPLETED with the bar full. The run takes under a second, so no live-line frame exists to catch; the strings the card would use (`%s OF %s`, `COMPARING SAVES`, `%d OF %d`) are in the binary and covered by the unit tests. |

The full half-second sequences are in the artifact directory
(`x64-all-20260912-a2ee7b9bb2/shots/640x480/{dead,live}/`). Nothing touched
a handheld.

## The offer on the transfer page (#145), `0f89c8f1d4` (ES `51639dd09`)

Guest c pointed at the SFTP QA endpoint (D-QA-018; its remotes are absolute
paths, which is why the folder names below are long -- on Dropbox or WebDAV
the same dialog reads `/ROCKNIX/Savez` and `/ROCKNIX/Saves`), with a `Savez`
folder beside a missing `Saves`. The walk: MANAGE CLOUD STORAGE > RESTORE
FROM THE CLOUD, SAVES ticked, CONTINUE.

| Frame | What it shows |
|---|---|
| `transfer-page-nothing-to-restore-completed.png` | RESTORING FROM THE CLOUD / COMPLETED, ELAPSED 0:07, PRESS ANY BUTTON TO CLOSE. Until #145 this was the end: the offer the card raises was parsed by the card alone. |
| `offer-on-transfer-page.png` | On dismissal: YOUR CLOUD HAS A .../Savez FOLDER BUT NO .../Saves FOLDER, SO THERE WAS NOTHING TO RESTORE. / IS THE FOLDER NAME RIGHT? with CHANGE FOLDER · CREATE ANYWAY · NOT NOW -- the same `CloudOffer::present` the card uses, in D-UI-045's short form (offered to the maintainer on #127; their wording replaces it if different). |
| `cloud-hub-after-offer.png` | NOT NOW returns to the hub. |
