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
