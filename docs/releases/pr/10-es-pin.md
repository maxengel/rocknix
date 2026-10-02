Title: es: bump to the interface PR's commit; save-state config, a theme patch

This moves the EmulationStation pin to the commit the interface work lands as on this project's emulationstation-next, which carries the cloud pages, the save-state manager, the offline RetroAchievements pages, the Wi-Fi picker and the settings work the changes before this one back. The art-book-next theme's tools system always shows its image, and the save-state configuration names the contract the launcher reads.

It carries the EmulationStation package recipe (the pin and a runtime option for ScreenScraper's developer pair, so a build never has to carry a key) and the theme patch.

I built the image and ran it through my suites on the virtual machine (the menu map, the French strings, the vocabulary, the walks at 640x480) and played it on an RG35XX SP, an RG SP and a Retroid Pocket Nova. Nothing outside the interface package and the theme is touched. No kernel, bootloader or device tree changes. It depends on every change before it, and on the interface work being merged first; I will point the pin at that commit once it exists.
