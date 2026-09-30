# Issue #340: A silent boot and shutdown: black, the splash, the interface, and nothing else on the panel

Opened 2026-09-30T02:07:40Z

**Maintainer, 2026-09-30 (chat, D-QA-012):** *"For the future, now that we have a bit more control over the OS, I'd also like to figure out how to have a silent boot and shutdown sequence."*

**The goal, in what a player sees:** from power on, a black panel, then the rasteratops splash, then the interface; nothing else -- no kernel lines, no cursor, no service text, no console. From choosing shut down or restart, the interface fades, the panel stays black (or shows the splash) until the device is off or the splash returns; never a scroll of text. Silence on the panel only: the journal stays complete and the serial console stays on for QA and for reading a device (`handheld-evidence.md`).

**What exists today** is in the first comment (the kernel command line the bootloaders write, where the splash runs and what may draw after it, what shutdown prints). Later, for the record: this is the fork's own item and never touches upstream.

Can this be done on the VM? **Yes** -- a boot and a shutdown on guest d with the frames captured through the whole sequence (`tools/vm-visual-qa` from the first frame QEMU hands us), every frame either black, the splash or the interface; a device after, on a yes, for the panel's own controller (some panels show a backlight flash or a vendor logo the OS does not own, which the fact's row records).

## Acceptance criteria

- [ ] A frame series of a full boot on guest d (from the first frame to the carousel) in which every frame is black, the splash or the interface -- a script that captures at intervals and a check that classifies each frame, its PASS line filed here with the series under `docs/qa-frames/`.
- [ ] The same for a shutdown and for a restart from the interface's menu.
- [ ] The journal of that boot is as complete as before (the same units, the same kernel lines), read after the boot; the serial console still answers `tools/vm-serial`.
- [ ] Physical fact (a device-facts row): on the RG35XX SP and the Nova the same sequence, with whatever the panel's own controller shows before the kernel named in the row.

