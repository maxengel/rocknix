# Issue #336: A libretro foundation under EmulationStation without RetroArch on top: a headless runner (minarch, rc_client, a control socket) measured by time to play, then the in-process bridge

Opened 2026-09-29T23:07:28Z

**Maintainer, 2026-09-29 (chat, D-QA-012), three messages:** *"For example, I actually hate how heavy RetroArch is and would love to explore marrying EmulationStation with something like https://github.com/shauninman/MinUI In terms of a much lighter-weight way of interacting with libretro, I don't think there are many great libretro UIs out there. We could either build on EmulationStation to see if we could build a live retro core bridge to connect EmulationStation to working games as a unified UI, which would be a much more compelling user experience."* -- *"I also really like this. https://ludo.libretro.com/"* -- *"Again, I don't want to totally reinvent the wheel here, and so I think part of it might actually be about how we might be able to enable EmulationStation to go further down and talk to an interfaceless libretro foundation that doesn't stitch RetroArch on top of it."*

The shape, as the last message puts it: **EmulationStation stays the interface; what changes is the thing under it** -- a libretro runner with no interface of its own, which ES launches, talks to and returns from, in place of RetroArch with its whole front end stitched underneath. Time to play is the fork's own measure for it (D-CLOUD-098): today on the VM a game's first frame is 1.05 s from the press, the next game's 2.03 s from the exit, with RetroArch existing at 0.58 s and drawing at 4.58 s of CPU.

## What the two named projects are (read 2026-09-29)

- **MinUI** (shauninman): *"a focused, custom launcher and libretro frontend for a variety of retro handhelds"* -- a launcher (`minui`) plus its own frontend, **minarch**: one C file of about 2,400 lines on SDL, which `dlopen`s a core in-process and gives it video (SDL surfaces, RGB565, four scalers: integer, aspect fit, full fit, cropped), audio (batched PCM), save states with auto-resume, fast-forward, per-core options and a five-item in-game menu. No rewind, no shaders, no netplay, no RetroAchievements, and no GL: a core that renders through `RETRO_HW_RENDER` (N64, PSP, Dreamcast, the hardware PS1 core) cannot run on it. The licence file is not at the path the repository lists; to be read from the tree before anything is taken.
- **Ludo** (libretro): *"a minimalist frontend for emulators"* that *"will stay smaller than RetroArch by only implementing the core features"*, in Go on OpenGL 2.1, GLFW 3.3 and OpenAL, with its own joypad-driven interface, scanning and thumbnails, quick save and load; *"able to launch most non GL libretro cores"*; Linux ARM builds exist. Its interface is the part the maintainer's shape does not want, and its authors say *"only bugfixes are really welcome"*. The tree already builds Go (`projects/ROCKNIX/packages/lang/go`, for the docker addons).

## What the fork's own work rests on in RetroArch today

The offline achievements (rcheevos inside RetroArch, the proxy in front of it), the save-state manager (RetroArch's state files, the Auto slot and the launcher's state-file contract), the exit hotkey and the cards (RetroArch's exit and the stamps around it), the readable notifications (four RetroArch patches), the threaded video wrapper's posting, netplay, shaders and filters, the rich input remapping, and the GL cores. A runner that replaces RetroArch has to carry the first three or the fork's own features stop; the rest is what a lighter thing gives up on purpose.

## The shape that does not reinvent the wheel

1. **A headless runner from an existing frontend, for the 2D cores first.** minarch is the smallest thing that already does the job in the language ES and the OS are written in; stripped of its menu and launcher it is a runner. Two things added: `rc_client` from rcheevos (the library is built for frontends; the fork's proxy sits in front of it unchanged), and a control channel (a Unix socket: pause, save, load, screenshot, quit) that ES's pages and the exit hotkey talk to instead of RetroArch's config and kill. RetroArch stays the runner for the GL cores and for netplay; the choice is per core in the launcher, and ES does not know which ran.
2. **Measured, not argued**: `tools/time-to-play` on the VM, the same cores, the runner against RetroArch, the two numbers above; the RG35XX SP after, with a yes.
3. **Later, the in-process bridge**: ES already runs on SDL2 with a GL context, so a core can render into ES's own window and read ES's own input -- no second process, no display handover, which is where the 1.05 s goes. It is the compelling version and the risky one (a core's crash is ES's; ES's render loop yields to a 60 Hz game), and it is the second step, taken only if the first proves the runner.

Can this be done on the VM? **Yes**, all of the first two steps: the runner built for GENERIC_X64, the 2D cores launched through it, time-to-play measured beside RetroArch, save states and the exit hotkey walked; the panel's feel and the A53's launch cost are the device's, after.

## Acceptance criteria (the spike)

- [ ] A spike record under `docs/spikes/` with minarch's and Ludo's licences quoted from their trees and a line per feature the fork's work needs (achievements, states, exit, cards), saying which the runner has, gains or loses.
- [ ] A GENERIC_X64 build with the runner launching at least three 2D cores from ES through the launcher, save state and exit hotkey walked (frames filed), and `tools/time-to-play`'s two numbers for the runner beside RetroArch's on the same guest (the table filed here).
- [ ] The register row for the direction (D-WORKFLOW-081's home decides whether this is the fork's own work or an upstream offer), written the session the maintainer calls it.



---

## Comment by maxengel, 2026-09-29T23:07:50Z

**Maintainer, 2026-09-29, the experience behind the ask:** *"It has always felt disjointed to me that you're using EmulationStation to enter a game and then using libretro once you're inside the game, but have to maneuver it via RetroArch."*

That is the requirement in one sentence, and it is what the two steps above are for: the in-game menu a player meets (pause, save, load, quit, the achievements' cards) becomes EmulationStation's, drawn in its words and its look over the running game, and RetroArch's own interface is never entered. Step 1 gets there by a runner with no interface and a control socket ES drives; step 2 removes the second process altogether. Least surprise (D-UI-042) says the same thing from the other side: one interface, the same words in the game as outside it.



---

## Comment by maxengel, 2026-09-29T23:12:09Z

**Maintainer, 2026-09-29:** *"What do we do about 3D cores? Is MinArch the right foundation? Could it be extended to support 3D cores? How can we support GL cores and RetroAchievements and have that play? Would we create some version of something akin to MinArch, but do it in Rust or something more modern? Is there a way to do all of this while still benefiting from the work the ROCKNIX team is doing in terms of handheld support, or do we wind up abandoning that? Not very interested in dealing with hardware compliance timings, console optimizations, etc., so I'd like some foundation we can work on."*

**3D cores.** A libretro core that renders on the GPU asks the frontend for a GL or Vulkan context through `RETRO_ENVIRONMENT_SET_HW_RENDER`; the frontend gives it a framebuffer to draw into, a way to look up GL functions, and two callbacks for when the context is made and lost, then draws that framebuffer to the screen each frame. That is the whole of "3D support" on the frontend's side, and it is what RetroArch's GL and Vulkan video drivers do. On our handhelds the context is GLES through Mesa (panfrost on the H700, freedreno on the Nova) under sway. Every 3D core ROCKNIX ships that matters (N64, PSP, Dreamcast, the hardware PS1 core, the Saturn and 3DS ones) has a GLES path; the Vulkan interface is a second, larger piece that can wait until a core we want has no GLES path.

**Is minarch the foundation, and can it grow 3D?** minarch is the right *reference* for the 2D half and the shape of a runner (in-process core, states, options, the loop), not the thing to extend. It draws with SDL surfaces, software blits, and no GL context, so 3D would be a rewrite of its video path, and it carries MinUI's own platform layer. The 3D half already has a reference of its own: nanoarch, a one-file frontend of about a thousand lines that implements exactly the hardware-render handshake above. The foundation, then, is written fresh from both, on SDL2 with a GLES context (which is what EmulationStation itself runs on): a texture upload for software cores, the framebuffer handshake for hardware cores, minarch's state and option handling, and nothing else. Three to five thousand lines of C; every one of them glue between things that already exist.

**RetroAchievements.** rcheevos ships `rc_client`, an API made for frontends: the runner gives it a way to read the core's memory (the core exposes it), a way to send HTTP, and a call per frame; it does the sign-in, the game's hash, the achievements, leaderboards and hardcore rules. Our proxy sits at the HTTP layer, so it and the offline work carry over untouched -- the runner's HTTP goes to 127.0.0.1:8080 as RetroArch's does now. The part that gets *better*: an unlock is a message on the runner's socket, and EmulationStation draws the card in its own words and look, which is the unified interface you described.

**Rust, or something more modern.** The tree builds Rust already (cargo, bindgen), so it is available. The runner is glue to three C interfaces (libretro, rcheevos, GLES) and a candidate for living inside EmulationStation later, which is C++; Rust adds a boundary at exactly the places the risk is (the core's memory, the GL calls) without owning them. I would write the runner in C, and put the modern part in the architecture: EmulationStation owns every screen, the runner has no interface, and a small socket protocol joins them. If you want Rust for your own reasons, it is viable; it does not make the runner safer where it matters.

**Keeping ROCKNIX's hardware work.** Yes, and this is the good news. The runner is a package, a launcher rule and interface pages -- none of it touches a kernel, a bootloader, a device tree, a quirk or Mesa. The fork already merges `upstream/next` for all of that and would go on doing so; their handheld support arrives as it does today. What the fork owns grows in two files it already changes (the launcher and its EmulationStation pin) and shrinks in one it patches heavily (RetroArch). The one real divergence cost is the interface: the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge. Kept behind a per-core switch with RetroArch as the fallback, a merge that breaks the runner costs nothing a player sees.

**One honest alternative to measure against first.** RetroArch already has an interface-off configuration and a command interface (a UDP socket that takes pause, save, load, quit; `network_cmd_enable` is `false` in the shipped config). Turning its menu and notifications off and driving it from EmulationStation over that socket, with our pages drawn over the game, gives most of the *felt* unity in days and keeps every core, netplay and achievements. It does not give the lighter foundation -- RetroArch is still the process underneath, at its size and start-up cost -- which is the thing you asked for; but it is the cheapest baseline to measure the runner against, and the fallback the runner keeps.

**What I would build, in order.** (1) The runner in C on SDL2 and GLES: software cores, then the hardware handshake, states, options, `rc_client`, the socket; RetroArch's command interface wired up alongside as the baseline. (2) The launcher routes per core; EmulationStation's pause page and cards drive both over the socket. (3) `tools/time-to-play` on the VM for both, then the RG35XX SP with a yes. (4) Only then the in-process bridge. Every step on the VM first, and nothing in it depends on a hardware team we are not.



---

## Comment by maxengel, 2026-09-29T23:15:43Z

**Maintainer, 2026-09-29:** *"So, if we went with your recommendation, at what point would we get hardware cores? If we knew that hardware cores were a requirement for our version 1, what would that change in our approach? I'm fine if we can use the RetroArch existing interface for configuration. If we started there and then explored moving away from that, we could make that decision later, I assume."*

**When hardware cores arrive.** In the order above, inside step 1, not after it: the handshake is the second thing the runner's video path does, and I put software cores first only because they prove the loop with less on the table. Nothing structural waits for a later phase.

**What a version-1 requirement changes.** Three things, all early: the video path is designed as one thing from the first day -- a GLES context, with a software core's frame as the trivial case (a texture upload) and a hardware core's as the framebuffer handshake -- rather than a surface path that later grows GL; the first two cores through the runner are one of each (a SNES core and the N64 core), so the handshake is exercised from the first build; and the first proof runs on guest d, which draws GL through the host's GPU, so the hardware path is proven on the VM before a device sees it. Vulkan stays out of version 1: no core we ship that matters lacks a GLES path. The per-core routing's default becomes "the runner for everything with a GLES path, RetroArch for the rest and for netplay".

**Starting on RetroArch's existing configuration, and deciding later: yes, and it improves the plan.** Step 0 becomes: RetroArch with its menu and on-screen text turned off, driven from EmulationStation over its command socket (pause, save, load, quit, screenshot -- it exists, `network_cmd_enable` is off in the shipped config), with our pause page and cards drawn over the game. Every core including the hardware ones, achievements and netplay work on the first day of it, because nothing underneath changed; its configuration stays RetroArch's, written by the launcher as now, with the RetroArch menu kept reachable from one row for the settings we have no page for. The design move that makes the later decision cheap: EmulationStation speaks one small protocol, designed once against RetroArch's verbs; the runner, when it comes, implements the same protocol, so the interface does not change when the thing underneath does. The decision to move is then made on two measurements on the same guest -- time to play and resident memory -- and on how the launcher's fallback behaves, not on argument.

**The shape, then:** step 0, RetroArch under our interface, days; step 1, the runner with both core kinds, weeks, proven on the VM against step 0's numbers; the switch per core, and the in-process bridge only if the numbers say so.



---

## Comment by maxengel, 2026-09-29T23:25:02Z

**Licences of the parts, read from the repositories (2026-09-29):** nanoarch BSD-3-Clause (copyable with its notice); rcheevos MIT; RetroArch GPL-3.0; Ludo GPL-3.0; RAOfflineProxy GPL-3.0-only; EmulationStation's fork MIT at its root with GPL in the recipe; **MinUI has no licence file GitHub can find**, and code with no licence is all rights reserved by default -- so minarch is a reference to read, not code to copy, until its author states terms or is asked. The runner is written fresh either way, which the plan already says; this makes it a rule rather than a preference.

