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
