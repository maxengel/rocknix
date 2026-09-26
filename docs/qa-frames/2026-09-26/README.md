# QA frames, 2026-09-26

Guest b of `tools/vm-pair` (1280x800) on `8db9042afa` (EmulationStation `0cc13be61`), `proof-279-tunnel.sh`: a
point-to-point tunnel `tun9` held open by a reader (UP, LOWER_UP, POINTOPOINT) with the fixed address `100.64.0.9`,
as `tailscale0` is on a handheld.

| Frame | What it shows |
| --- | --- |
| `279-network-settings-eth0-and-tun9-8db9042afa.png` | eth0 up beside the tunnel: IP ADDRESS `10.0.2.15 (+)`, INTERNET STATUS CONNECTED |
| `279-ip-list-eth0-and-tun9-8db9042afa.png` | A on the row: AVAILABLE IP ADDRESSES lists `10.0.2.15  eth0` and `100.64.0.9  tun9` |
| `279-network-settings-tun9-only-8db9042afa.png` | eth0 down, the tunnel still holding its address: IP ADDRESS `NOT CONNECTED`, INTERNET STATUS NOT CONNECTED |
| `279-ip-list-tun9-only-8db9042afa.png` | the list then names the tunnel alone, `100.64.0.9  tun9` |

Before ES `0cc13be61` (the ROCKNIX merge's `bccd71570`), the third frame read the tunnel's address alone on the row --
the maintainer's observation on the RG35XX SP with Wi-Fi off (#279).

## #283, before the change (the control)

Guest d (640x480) on `8db9042afa`, `proof-283-surfaces.sh` case B: a toast (`ONE SURFACE TEST: TOAST B`) fired through
the interface's API half a second before a game exit, then the exit sync of a ~5 MiB payload. The toast never shows: it
was drawn under the card and its ten seconds ran out there.

| Frame | What it shows |
| --- | --- |
| `283-before-card-syncing-toast-queued-8db9042afa.png` | +0.5 s: SYNCING SAVES TO THE CLOUD, 1020 KB OF 5.2 MB -- no toast, although one is queued |
| `283-before-card-outcome-8db9042afa.png` | +3.5 s: the card's outcome (COULDN'T FINISH here: the QA backend's 405 on a same-name replace, #286) |
| `283-before-carousel-no-toast-8db9042afa.png` | +5 s: the carousel, and the toast never appears |

## #283, after the change

Guest d (640x480) on `a8175c6193` (EmulationStation `c1c0d6ddc`), the same case B, thirty seconds of frames.

| Frame | What it shows |
| --- | --- |
| `283-after-card-syncing-toast-waiting-a8175c6193.png` | +14 s: SYNCING SAVES TO THE CLOUD, 12.4 MB OF 14.6 MB -- the queued toast is not drawn |
| `283-after-card-outcome-a8175c6193.png` | +17.5 s: the card's outcome (COULDN'T FINISH here, the QA backend again, #286) |
| `283-after-toast-after-the-card-a8175c6193.png` | +20 s: the toast, alone, once the card has gone -- it waited |

## #288, the defect reproduced (the control)

Guest d (640x480) on `a8175c6193` -- the build on the RG35XX SP -- `proof-288-stale-record.sh`: the probe ROM as `Bobl`,
the walk fixture `nes-256x240-right.png` (its green mark is the picture's right edge) as its auto-save capture, and beside
it the record every build before ES `5644752aa` wrote, `turns=3` with no `from=own-launch` line -- the maintainer's Dr.
Mario, F-Zero and Aladdin. The mark's side is measured against the picture (the one blue thing on the page).

| Frame | What it shows |
| --- | --- |
| `288-before-old-record-turned-a8175c6193.png` | the SAVE STATE MANAGER with the old record in place: the tile turned three quarter turns counter-clockwise (portrait, 83x111), the mark on the **bottom** -- what the maintainer saw |
| `288-exit-capture-upright-a8175c6193.png` | after the game was launched through the API and left through the exit hotkey: RetroArch's own capture of the exit, drawn upright (131x98), the record rewritten `turns=0` -- the old reader's heal by play, and #280's exit-capture criterion |
| `288-after-heal-by-play-a8175c6193.png` | the fixture picture put back over that capture, the healed record: the mark on the **right** (unturned) |

## #288, the fix

Guest d (640x480) rebuilt from `3f93dc4683` (EmulationStation `5644752aa`), the same seed, `proof-288-stale-record.sh` at
03:45 UTC (`proof-288-d2`); the same on guest a at 1280x800 in the chain (`proof-288`, 03:29 UTC).

| Frame | What it shows |
| --- | --- |
| `288-fixed-old-record-unturned-3f93dc4683.png` | the old record (`turns=3`, no line) still on disk and not trusted: the tile upright (131x98), the mark on the **right**, before any play |
| `288-fixed-record-rewritten-3f93dc4683.png` | after the launch and the exit: the record reads `turns=0` and `from=own-launch`; the tile as before |
| `288-fixed-arcade-table-over-old-record-3f93dc4683.png` | the table case (`proof-288-fbn.sh`): an old record of `turns=1` beside `mspacman`, whose fixture `arcade-vertical-raw-left.png` has its mark on the picture's left; the mark on the **top** is `fbneo.txt`'s 3, not the record's 1 (which would have put it on the bottom) and not no turn (the left) |

The maintainer's Dr. Mario, F-Zero and Aladdin on the RG35XX SP are the first row: their records are unmarked `turns=3`,
and this build draws them upright the moment it boots.

## #290, the exit path's order

`proof-290-exit-order.sh`: the probe ROM launched through the API and left through the exit hotkey, with
`/usr/bin/cloud_capture` shadowed by a wrapper that sleeps three seconds first (P-05's named substitute for the RG35XX SP's
own seconds; a bind mount over the read-only image, gone at the next boot). Frames about a second apart with host times;
the emulator's going and the capture's start and end polled over ssh on the same clock.

| Frame | What it shows |
| --- | --- |
| `290-before-black-3s-after-exit-3f93dc4683.png` | guest d (640x480) on `3f93dc4683`, 3.3 s after the press: still black -- the capture (0.3 s to 3.4 s) ran before the window came back |
| `290-before-carousel-after-capture-3f93dc4683.png` | the same run at 4.4 s: the carousel, only once the capture had ended -- the maintainer's "long exit" |
| `290-after-carousel-during-capture-86dc949300.png` | guest a (1280x800) on `86dc949300`, 1.2 s after the press: the carousel back while the capture still runs (0.6 s to 3.6 s) |

## #293, the top-up's card and the launch question over it

`proof-292-cards.sh` (session directory), run 1 on guest d (640x480, GL) on `88ee7de862` (ES `0ade9086b`): frames over VNC
every half second (`vnc-grab.py`, a signature per frame so a card at the top or a dialog in the middle is found by number).
The link cut on the monitor and restored; the ctl's scan started over ssh for the question.

| Frame | What it shows |
| --- | --- |
| `293-topup-card-starting.png` | the link back: the ctl's top-up has work (one recently played game not yet cached), so the card is up -- UPDATING OFFLINE ACHIEVEMENTS... / STARTING... (D-UI-095) |
| `293-topup-card-completed.png` | eight seconds later: UPDATE OFFLINE ACHIEVEMENTS / COMPLETED / 1 GAME ADDED FOR OFFLINE PLAY., the bar full; the ctl's stamp read `cached=1` |
| `293-launch-over-topup-question.png` | a launch through the API while the scan runs: YOUR OFFLINE ACHIEVEMENTS ARE BEING UPDATED. / IF YOU STOP IT, IT'LL TRY AGAIN NEXT TIME YOU'RE CONNECTED. / STOP IT AND PLAY, KEEP WAITING -- the safe verb last, where back lands (D-UI-096) |

Run 1's other phases were the harness's, not the interface's: the proof pressed `ret` for A where the image maps `x`
(§ Driving EmulationStation from the monitor), wrote the exit-sync toggle after the interface had loaded its settings
(§ A settings change made from the shell is invisible to the running interface), and drove Tobu's route to an
achievement the QA account had already earned. Run 2 (`proof-292-cards-v2.sh`) is the send card's proof.

## #292, the send card, the question over it, and the exit card without the achievements

`proof-292-cards-v3.sh` (session directory) on guest d (640x480, GL) on `64a0934a5d` (ES `6e6643687`): the proxy's
`pending` answer shimmed by a wrapper bind-mounted over the ctl (the QA account's one routed achievement is spent, so no
real award could be queued -- a synthetic input, named), the link cut and restored on the monitor, frames over VNC every
half second.

| Frame | What it shows |
| --- | --- |
| `292-exit-card-offline.png` | a game exited with the link down: SYNC SAVES / SKIPPED - YOU'RE NOT ONLINE / SAVES WILL BE SYNCED NEXT TIME YOU'RE CONNECTED. -- and nothing about achievements, as the maintainer asked (D-RA-030) |
| `292-send-card-to-send.png` | the link back with an award waiting: SENDING OFFLINE ACHIEVEMENTS... / 1 TO SEND |
| `292-launch-over-send-question.png` | a launch through the API while it runs: OFFLINE ACHIEVEMENTS ARE BEING SENT. / IT'LL BE A MOMENT. / PLAY NOW, KEEP WAITING (D-UI-096) |
| `292-send-card-couldnt-finish.png` | 45 s on with the queue still at 1: SEND OFFLINE ACHIEVEMENTS / COULDN'T FINISH - RETROACHIEVEMENTS STOPPED ANSWERING / IT'LL TRY AGAIN WHEN YOU'RE CONNECTED.; the stamp reads `5 not-sent`; the SYNC SAVES card that was owed followed it (`last-sync-exit` went from `69 no-network` to `0 completed`) |
| `292-send-card-completed.png` | the link back with the proxy's flush stamp in place: SEND OFFLINE ACHIEVEMENTS / COMPLETED / OFFLINE ACHIEVEMENTS HAVE BEEN SENT TO RETROACHIEVEMENTS. (the longer candidate fits at 640x480); the stamp reads `0 sent` |

## #293 item 3, a capture that could not record says so once

`proof-293-toast-v2.sh` (session directory) on guest d (640x480, GL) on `d72084ccad` (ES `d3ba4edca`): `/usr/bin/cloud_capture`
shadowed by a wrapper that exits 1 (a bind mount over the read-only image, gone at the next boot -- P-05's named substitute
for a real failure), exit sync on, Ninoid launched through the API and left through the exit hotkey, frames over VNC every
half second; then the wrapper lifted and a control exit (no toast, no warning). 8 of 8.

| Frame | What it shows |
| --- | --- |
| `293-capture-failed-sync-card-first.png` | 1.5 s after the exit: SYNC SAVES / COMPLETED -- the sync card runs first and still runs (`last-sync-exit` `0 completed`) |
| `293-capture-failed-toast.png` | 7.5 s after the exit, once the card has gone: COULDN'T RECORD THIS SESSION'S SAVES. THEY'RE STILL ON THIS DEVICE. -- said once, as a toast, the card's words put back on the queue by D-UI-093; the interface's log carries the `cloud_capture exited 1` line |

## #295, RetroArch's notifications a row higher since the readable-size floor

`diag-295-osd.sh` (session directory): Ninoid launched through the API on two 640x480 guests, frames over VNC every quarter
second, the message boxes measured by their background rows at x=15 (the box colour, `#161616`).

| Frame | What it shows |
| --- | --- |
| `295-notifications-d72084ccad-640x480.png` | the current build: the save-state message (box y 383..422) under the account message (302..381), the 15 px queue font -- 57 px of screen under the lowest box |
| `295-notifications-e5ed60f3df-640x480.png` | the 2026-09-10 build, before `0016`/`0017`: one message at the 10 px font (box y 418..441) -- 38 px under it; the QA account's name painted out |

A one-line box is 40 px tall where it was 24, and the margin under the stack 57 px where it was 38: RetroArch sizes the
queue's box and its spacing from the queue font's line height, so the 14 px floor (D-UI-084) moved the whole stack up
by about a text line (19 px). "Press again to quit" rides the same queue.
