Title: es: bump to the interface PR's commit; save-state config, a theme patch

The EmulationStation pin moves to the commit the interface PR lands as on ROCKNIX's master, which carries the cloud pages, the save-state manager, the offline RetroAchievements pages, the Wi-Fi picker and the settings work the PRs before this one back. The art-book-next theme's tools system always shows its image, and `es_savestates.cfg` names the save-state contract the launcher reads.

**What it carries.** `projects/ROCKNIX/packages/ui/emulationstation/package.mk` (the pin and the runtime developer-pair option for ScreenScraper), the theme patch.

**How it was tested.** The image built and run through the fork's suites on the x86_64 VM (the menu map, the French strings, the vocabulary, the walks at 640x480) and on an RG35XX SP.

**What it does not touch.** Anything outside the interface package and the theme.

**Kernel, bootloader or device tree.** None.

**Depends on.** Every PR before it, and the interface PR merged on `ROCKNIX/emulationstation-next` first; the pin is written to that commit when it exists.
