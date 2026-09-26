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
