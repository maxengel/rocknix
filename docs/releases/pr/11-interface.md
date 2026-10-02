Title: cloud sync, the save-state manager, offline achievements, Wi-Fi

Everything the distribution series backs, seen from the screen. Cloud storage is set up on the device and everything cloud lives under GAME SETTINGS > MANAGE CLOUD STORAGE: back up, restore, the saves toggles and the storage setup, each row saying how it last went; a long transfer runs on a page that is sat in, with CANCEL. Saves sync on their own with a card that says how it ended. The save-state manager deletes and copies under the transfer lock and records every deletion. Offline achievements have a toggle, a scan page and three cards. The Wi-Fi picker lists what is around, marks the saved and the connected, and a saved network is joined or forgotten in place. Settings are written through a temporary and recovered from the last good copy, and no credential reaches a log. Every fork string ships in English and French.

**What it carries.** 207 files against `master` (+42,056 / -1,142), read by bucket in the review guide below: A cloud, B saves and the manager, C RetroAchievements offline, D Wi-Fi, E settings and credentials, F the scraper's developer pair and BIOS, G the interface mechanics every bucket stands on. Eighteen unit-test files (doctest), the app-unit suite and the AddressSanitizer page tests are in the tree, with a README on running them.

**How it was tested.** The unit and page tests on the host; on the x86_64 VM every candidate's fourteen suites, with the walks at 640x480 diffed against the last accepted cut and the menu map checked against every screen title in the binary; on an RG35XX SP the maintainer's play through each of the buckets. The words a player reads follow one vocabulary (four tiers, two verbs, sync for the automatic behaviour) checked mechanically.

**What it does not touch.** The upstream cards outside these lanes (the game index, the content installer, the OS update, the Bluetooth scan) keep their shape (D-UI-079).

**Depends on.** The distribution series for the scripts the pages run; each page gates on the script's presence and dims, never hides, when it is absent.

Review guide: `docs/pr-series/es-review-guide.md` on the fork, carried in the PR body.
