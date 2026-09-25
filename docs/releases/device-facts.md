# Standing device facts

The things only a handheld can show (`vm-first.md`, D-QA-007/033), one row each,
with when each was last seen and on which cut -- so "have we checked this?" is a
lookup here, not a search of five records (D-WORKFLOW-044, #267). Kept by hand:
a row is edited the day the fact is observed, with the evidence named. The cuts
themselves are [catalog.md](catalog.md), generated from the artifacts' RECORD.txt.
An open checkbox on an issue that asks for a device observation points at a row
here (`tools/box-check`, the checkbox checker, #268); a fact with no row is a fact
nobody is tracking.

| Fact | What only the device shows | Last seen | On cut | Evidence | Issue |
| --- | --- | --- | --- | --- | --- |
| H700 boot on the RG35XX SP (LPDDR4 unit) | the DDR4 bootloader and the RG35XX SP device tree; an in-place update through `/storage/.update` | 2026-09-25 01:46 UTC | `664ad9ac64` | RECORD.txt in `h700-all-20260924-664ad9ac64`; `tools/device-act` log (boot id changed, BUILD_ID read back) | #236 |
| H700 boot on the RG SP (LPDDR3 unit) | the DDR3 bootloader and the RG SP device tree | 2026-09-14 (RC-4 `c5c50a2d5f`); the unit still runs `b245fd12ac` | `b245fd12ac` | work log 2026-09-14 05:55; #200 | #200, #236 |
| Tailscale after a restart with the toggle on | the maintainer's tailnet; `tailscaled` up on its own after a boot | 2026-09-25 01:47 UTC (third data point; 2026-09-14 and 2026-09-23 before) | `664ad9ac64` | #174's closing comment; `journalctl -b -u tailscaled` read through `tools/device-act` | #174 (closed) |
| The Wi-Fi radio joining a network | a real radio and a real access point; the join, the reconnect after sleep | 2026-09-22 (the maintainer: *"I had to enable wifi after boot"*) | the cut then on the RG35XX SP | work log 2026-09-22 21:15 | #191, #201 |
| Hours of play offline, then Wi-Fi back (the soak) | a real radio, a real session; two achievement unlocks in one FBNeo session; the flush on reconnect | 2026-09-22 11:05-13:18 EDT (one interface crash, #246, fixed since) | the cut then on the RG35XX SP (before `aa8d525a8a`) | work log 2026-09-22 21:15 (the journal read that evening) | #236 § A (D-QA-036) |
| A phone hotspot | *not a fact of its own* -- a hotspot is a network like any other; a dropped link is the VM's | folded 2026-09-21 | -- | D-QA-036; #161 closed not planned 2026-09-25 | #161 (closed) |
| Two same-family units on one LAN by name | multicast on a real LAN; the router's view of two `.local` names | never | -- | needs both H700 units on a current image; a multicast socket netdev between two guests would move the name half to the VM (#120) | #50 |
| A real pad's hotkey and input | a physical controller (P-05's synthetic-input residual: the VM injects keys) | never recorded as an observation | -- | the load-state hotkey from the AUTO SAVE tile (#249), the pad in the sign-in window (#54): once, in the maintainer's own play | #249, #54 |
| A real panel's rendering | the 640x480 3.5" panel's scaling and gamma; the VM's 640x480 frame is the same pixels but not the same glass | continuous (the maintainer's use); last named 2026-09-21 (#251's banner sizes on the H700) | `443028ff7a` | #251 | #251, #255 |
| The Nova (SM8550) | a different board: the cold build, the flash, the first boot | never (no build yet) | -- | #150, D-QA-023 | #236 § D |
| The H700 watchdog, panic-on-hang and ramoops | the sunxi watchdog and a reserved-memory node in the device tree | never (a change to make, not a check) | -- | #104 | #104 |
| A device unreachable minutes after being put down | the panel's sleep and the radio's power state | 2026-09-13 | RC-11 | #161's third checkbox (a runbook note, not a fault) | #161 (closed) |
