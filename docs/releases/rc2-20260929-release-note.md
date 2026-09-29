The second release candidate of the fork's cloud sync, offline achievements and Wi-Fi work, for anyone with an RG35XX SP, an RG SP, a Retroid Pocket Nova or an RG353M. It is RC1 with the five things I found play-testing RC1 fixed, built for all three devices from one tree.

### What's fixed

- Pairing a cloud provider with your phone as the keyboard works again: the page's own script died as it loaded, so it read `Checking…` for as long as it was open and taps did nothing. It now says `Connected.` once the sign-in page is up, tells you when it can't reach your handheld, and fits a phone's screen.
- On the Retroid Pocket Nova, SELECT + START leaves the sign-in window; before, the window could not see the pad at all.
- Scanning games for offline achievements on a device with no games yet ends `Completed` with `No games to scan yet`, not `Couldn't finish`; and if you haven't signed in to RetroAchievements, the page says so before offering the scan.
- The explanation under the offline achievements switch is two short paragraphs instead of a block of capitals.
- Pressing up from the top of the main menu lands on `Back`, then `Quit`; before, the first press landed on nothing.

### What to know

- An in-place update from RC1 keeps your settings, saves and cloud setup; nothing you set up on RC1 needs doing again.
- Turning offline achievements on turns hardcore mode off; it's casual achievements only while the beta lasts.

### Devices and how to install

- **RG35XX SP and RG SP (H700)**: flash `ROCKNIX-H700.aarch64-20260929-DDR4.img.gz` for an RG35XX SP and `-DDR3.img.gz` for an RG SP (those are the two I have; if yours doesn't boot on one, it's the other), then copy your device tree as the [H700 page](https://rocknix.org/devices/h700/) says; or, from RC1, copy `ROCKNIX-H700.aarch64-20260929.tar` into `/storage/.update` and reboot.
- **Retroid Pocket Nova (SM8550)**: `ROCKNIX-SM8550.aarch64-20260929.img.gz`, or the `.tar` in `/storage/.update`.
- **RG353M (RK3566)**: flash `ROCKNIX-RK3566.aarch64-20260929-Generic.img.gz` (its bootloader detects the RG353 boards; the `-Specific` image names a device tree for boards it cannot detect), or the `.tar` in `/storage/.update`.

Each file has a `.sha256` beside it. The file names carry the date and are the same as RC1's; check the sha256 to tell them apart.

<details><summary>Built from, tested on</summary>

One head: every image is build `69e6039f8f` (fork `next` at that commit; EmulationStation `c0cb9925e`; upstream `next` at `049765fba0` and ROCKNIX's EmulationStation master at `cada856d8` underneath). The four images were built in eleven minutes on warm roots, GENERIC_X64 first, then SM8550, H700 and RK3566.

What was run on `69e6039f8f`, on the GENERIC_X64 VM: vm-qa run 73 (fifteen suites; thirteen PASS, the script suite's thirteen reds were the test harness's own page stub and pass in run 75 after it was fixed, and three frame boxes on the transfer page were the page still running at five seconds under three concurrent device builds, rerun as run 74 on a quiet box), the upgrade rehearsal from RC1's x64 image (PASS, every piece of a player's state kept), and the walks that took the frames on the fork's issues #327, #329 and #330. On the devices: the Retroid Pocket Nova, the RG35XX SP and the RG SP updated in place from RC1 the evening it was built.

Issues: #236 (the round), #325, #327, #329, #330, #331 (the five fixes), #333 (the upstream series). The change log is `docs/cloud-sync-changelog.md` on the fork.

</details>
