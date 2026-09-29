Title: retroarch: readable notifications, and rotation tables from the source

RetroArch's on-screen notifications drew at a size no 3.5-inch panel could read. The face is now 13 px and the backdrop follows the font, the message queue keeps its floor and its place, and the font sizes are ones FreeType renders sharply. The rotation tables for the FBA and MAME cores are generated from the cores' own source at build time by two scripts that skip disabled code and strings and refuse to guess, so a vertical game turns the right way on every device instead of on the ones somebody had listed.

It carries four RetroArch patches, the two table generators, and the recipes of fbalpha2012, fbalpha2019, fbneo, mame2003-plus and mame2010, which run the generators and fail on their own failures.

I tested each notification shape with frames at 640x480 on the virtual machine against the previous build, launched vertical games there, and read the face at the panel's size on my RG35XX SP; the generators run at build and die rather than guess. RetroArch's version does not move and no core's code changes. No kernel, bootloader or device tree changes. It depends on the saves change, because the RetroArch patch series is one directory and the three patches that change carries come first in number.
