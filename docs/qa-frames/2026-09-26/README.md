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
