Title: docs: cloud sync on the device, the Wi-Fi picker, offline achievements

Players set up cloud storage on the device now, with the controller, and the cloud-sync page still teaches the SSH workflow that setup replaced. This rewrites the page's rclone section around what the device shows: the hub under `Game Settings` > `Manage Cloud Storage`, the provider list and the phone sign-in, the tick page behind `Back Up to the Cloud`, the saves rows and their toggles, and the one action that deletes. The networking page's setup steps follow the Wi-Fi picker, saved networks and `Manage Saved Networks`; the RetroAchievements page gains an Offline Achievements (Beta) section; the scraper page a note on the developer pair for builds without one built in.

**What it carries.** `docs/configure/cloud-sync.md` (the rclone section, rewritten; the Syncthing and NFS sections untouched), `docs/configure/networking.md` (the Setup section and a section on saved networks), `docs/play/retro-achievements.md` (an Offline Achievements section and two notes), `docs/configure/scraper.md` (one section appended), a new developer page `docs/contribute/cloud-sync-internals.md` in the nav (what runs beneath the two feature pages, script by script), and the screenshots under `docs/_inc/images/{cloud-sync,networking,retro-achievements}/`, each captured from the ROCKNIX image at 640x480.

**How it was checked.** Every menu name against the EmulationStation source strings and a frame of the screen; the pages read beside the site's existing pages for voice. The screenshots come from walk step files kept with the distribution's QA tools, so they can be retaken when a screen changes.

**What it does not touch.** The Syncthing and NFS sections of the cloud-sync page, whose wording is as their authors left it; the h700-installation page; the pages under `contribute/`.

**Depends on.** The distribution and EmulationStation changes these pages describe, submitted alongside; until those merge, the pages describe the release candidate's builds on the fork's releases page.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
