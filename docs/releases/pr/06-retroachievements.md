Title: raofflineproxy: RetroAchievements offline, casual-only, as a system-wide toggle

With OFFLINE ACHIEVEMENTS (BETA) on, a device caches each game's achievement set and badges, records what is earned without a connection, and sends it to the player's account the next time it is online. The backend is RAOfflineProxy packaged natively: a loopback proxy on 127.0.0.1:8080 that the launch scripts point RetroArch and PPSSPP at while the toggle is on. It is casual-only, so turning it on turns hardcore mode off, with the sentence on screen. Nothing of upstream's bundle ships but the service: the OS owns the launch-time configuration.

**What it carries.** The `raofflineproxy` package (pinned to the author's `248ce5acae`), its two submodule packages (`raofflineproxy-rcheevos`, `raofflineproxy-libchdr`, compiled into the hashing library), fifteen patches (a 4xx passed through, no synthetic casual-only achievement, a flush stamp, no cap on cached games, a refresh thread that survives a failed pass, the cached sign-in, log upload opt-in, unique image temp names, a store-only header, an offline login header, offline image misses answered at once, a cached image validated, one connection per thread for images, a bounded name lookup, a download that says what became of it), the service unit that counts as started only once it listens, `raofflineproxy-ctl` (enable, disable, status, pending, flushed, scan, listening), the scan and image helpers, the daemon fragment, RetroArch patch 0013 (the login toast says offline when the proxy answered), the cheevos scripts for armsx2, dolphin, melonds and ppsspp, and `setsettings.sh`, which wires RetroArch to the proxy and also carries the save-state contract the saves PR uses (one file).

**How it was tested.** `tools/ra-offline-test` on the x86_64 VM: a QA account earns an achievement with the link cut, and the award reaches retroachievements.org when the link returns (31 of 32 steps on the candidate; the one red read a stamp the interface's own card had already taken, by design). A night's play on an RG35XX SP offline, then Wi-Fi back (#298). What the fork changed in RAOfflineProxy goes back to its author as PRs.

**What it does not touch.** Hardcore play while offline (refused by design); the RetroAchievements pages themselves, which are the interface PR's.

**Kernel, bootloader or device tree.** None.

**Depends on.** PR 4 (`system.cfg` carries the toggle's keys).
