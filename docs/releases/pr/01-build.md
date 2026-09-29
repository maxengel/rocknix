Title: build: recipes fetch nothing at configure, and no secret reaches the container

A package now fails to configure instead of cloning a dependency the tree does not carry. pango built its own cairo from git master for three months, over the pinned one, and every image shipped it unnoticed; mangohud and gamescope fetched Vulkan headers, glm and stb the same way. The build refuses meson's downloads, and the three packages carry those trees as pinned, hash-checked sources. The docker recipe forwards no environment variable that looks like a credential into the container, and writes its `.env` fresh and owner-only.

**What it carries.** `scripts/build` (`--wrap-mode=nodownload` on every meson configure), `scripts/get_env` and the `Makefile` (the environment filter and the `.env` handling), `tools/pkgcheck` (exits non-zero on any failed check), the mangohud and gamescope recipes with five source-only packages for their subprojects, and small recipe fixes found on the way: libyaml's host dependency on ccache, cairo 1.18.4, nvtop's backends gated on the drivers built, the aarch64 guards the upstream cleanup dropped on five standalone emulators, libsamplerate's x86_64 build, ppsspp-lr's aarch64-only flag stripped after its patches.

**How it was tested.** `tools/pkgcheck` on every recipe touched. mangohud and gamescope built on a cold SM8550 root with the guard on (`[DONE] install mangohud:target`, then gamescope alone, then in the image build). The download guard was seen to fire on the pango case before the fix and pass after. The secret filter was proven against a constructed variable in the environment that did not reach `.env`. Images built for H700, SM8550 and the x86_64 VM.

**What it does not touch.** No package version except cairo moves; no device options; nothing a player sees.

**Kernel, bootloader or device tree.** None.

**Depends on.** None; first in the series.
