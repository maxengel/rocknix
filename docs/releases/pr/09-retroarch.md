Title: retroarch: notifications readable at a handheld's size, and rotation tables read from the source

RetroArch's on-screen notifications drew at a size no 3.5-inch panel could read: the face is now 13 px and the backdrop follows the font, the message queue keeps its floor and its place, and the font sizes are sharp on FreeType. The rotation tables for the FBA and MAME cores are generated from the cores' own source at build time by two scripts that skip `#if 0` and strings and refuse to guess, so a vertical game turns the right way on every device.

**What it carries.** RetroArch patches 0014, 0016, 0017 and 0019; `rotation-table-fba.py` and `rotation-table-mame.py`; the recipes of fbalpha2012, fbalpha2019, fbneo, mame2003-plus and mame2010, which run the generators and die on their own failures.

**How it was tested.** Frames at 640x480 on the x86_64 VM of each notification shape against the previous cut; the generators run on the cores' source at build and die on their own failures; TATE games launched on the VM; the RG35XX SP for the face at the panel's size.

**What it does not touch.** RetroArch's version; any core's code.

**Kernel, bootloader or device tree.** None.

**Depends on.** PR 8 (the RetroArch patch series is one directory; the three patches PR 8 carries come first in number).
