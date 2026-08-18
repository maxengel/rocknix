# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ROCKNIX is an **immutable Linux distribution for handheld gaming devices** (a JELOS fork
built on the LibreELEC/CoreELEC cross-compilation system). There is no app to run — this
repo is a *build system* that cross-compiles a complete OS image (kernel, bootloader,
emulators, userland) per device.

**Canonical deep-dive docs (this file summarizes; they are authoritative):**
- `.github/copilot-instructions.md` — full build/dev commands, architecture, `package.mk` conventions, commit style.
- `AGENTS.md` — fork workflow and non-obvious gotchas.
- `packages/readme.md` — the authoritative `package.mk` format reference.
- `.github/instructions/*.instructions.md` — scoped guides (each has an `applyTo` glob). Read the matching one **before** editing its area: fork workflow, worktrees, rclone cloud-sync, GENERIC_X64 VM QA, ES native UI, issue tracking, learning capture, doc accuracy, engineering practices.
- `.github/shared-copilot-knowledge/` is generic external content, **not** ROCKNIX-specific.

## Build & development commands

Builds are driven by `PROJECT` (default `ROCKNIX`), `DEVICE`, and `ARCH`. Per-device make
targets exist for: `RK3588`, `RK3576`, `RK3566`, `RK3326`, `RK3399`, `S922X`, `SM6115`,
`SM8250`, `SM8550`, `SM8650`, `SM8750`, `H700`, `AMD64` (see `Makefile`; most build both
`arm` and `aarch64`). `make world` builds the primary device set.

Docker is the recommended way to build:

```bash
make docker-image-pull                   # pull ghcr.io/rocknix/rocknix-build:latest
make docker-RK3588                       # full image build for a device
make docker-shell                        # interactive shell in the build container
PACKAGE=retroarch make docker-package    # build one package in the container
```

Native equivalents (run from a path **without spaces**, **never as root**):

```bash
make RK3588                              # device image build
./scripts/build <package>                # build ONE package
./scripts/clean <package>                # clean ONE package so it rebuilds
make kconfig-menuconfig-RK3588           # edit a device's kernel config
scripts/checkdeps                        # verify host build dependencies
```

Fast dev loop — rebuild one package, then remake the image instead of a full build:

```bash
make docker-shell                        # skip when building natively
export PROJECT=ROCKNIX DEVICE=RK3588 ARCH=aarch64
./scripts/clean <pkg> && ./scripts/build <pkg>
./scripts/install <pkg> && ./scripts/image mkimage   # needs OS_VERSION/BUILD_DATE exported
```

Images land in `target/` (`config/path` sets `TARGET_IMG=$ROOT/target`). Deploy to a
networked device by `scp`-ing the image tar to `root@<host>:~/.update` and rebooting
(preserves settings).

**Testing/lint:** there is **no unit-test suite**. `tools/pkgcheck <package>` is the only
lint — run it after every `package.mk` edit. The real test is that the package/image builds.
A first build needs ~200GB disk and hours; cached rebuilds take minutes.

## Architecture

**Layered config resolution** (`config/options`): options are sourced in order —
`distributions/<DISTRO>/options` → `projects/<PROJECT>/options` →
`projects/<PROJECT>/devices/<DEVICE>/options` → `config/arch.<ARCH>` — each layer
overriding the last. Device knobs (CPU flags, kernel target, bootloader, GPU family) live
in the device `options` file.

**Package override model:** every package is a directory with a `package.mk`. A
`package.mk` under `projects/<PROJECT>/packages/...` or
`projects/<PROJECT>/devices/<DEVICE>/...` overrides the generic one of the same name in
`packages/`. `DEVICE_ROOT` lets one device reuse another's build root.

**Directory roles:**
- `packages/` — generic cross-project package recipes, grouped by function.
- `projects/<PROJECT>/` — SoC/vendor families (`ROCKNIX`, `Rockchip`, `Qualcomm`, ...): device `options`, package overrides, `patches/`, `filesystem/` overlays, `bootloader/`.
- `distributions/ROCKNIX/` — distro identity (version, options, splash).
- `scripts/` — the build engine (`build_distro`, `build`, `clean`, `install`, `image`).
- `tools/` — dev helpers (`pkgcheck`, `distro-tool`, `adjust_kernel_config`).
- `build.*/`, `sources/`, `release/`, `target/` — gitignored build outputs.

**Emulator naming:** libretro cores are `*-lr`; standalone emulators are `*-sa`
(`projects/ROCKNIX/packages/emulators/`).

## `package.mk` rules (see `packages/readme.md` for the full reference)

- **Late-binding (enforced by `pkgcheck`):** toolchain/path vars (`CC`, `CFLAGS`, `PKG_BUILD`, `TARGET_*`, ...) exist only *after* the package loads — reference them **only inside functions** (`configure_package`, `pre_configure_target`, ...), never at global scope.
- Customize via `pre_*`/`post_*` hook functions rather than replacing core build steps; branch per device with `case ${DEVICE} in ... esac`.
- Preserve upstream JELOS/LibreELEC copyright headers and add a ROCKNIX line — this is a fork; credits must be retained.
- Pin git sources with the **full** commit hash in `PKG_VERSION`.
- Patches in a package's `patches/` dir auto-apply after unpack; scope per device with `patches/<DEVICE>/`. Kernel patches live under `packages/linux/patches/<DEVICE>/`; hardware quirks under `projects/ROCKNIX/packages/hardware/quirks/`.

## Commit conventions

No Conventional Commits. Scope by package or device, matching history:
`azahar-sa - bump to ...`, `SM8250 - linux - enable ntsync`, `emulationstation: bump package`.
**Upstream PR commits are stricter** (CI-enforced): `package: text` title matching
`^[a-zA-Z0-9_*./-]+:[[:space:]].+$`, ≤72 chars, blank line before body, no merge commits.

## Fork workflow (this working copy is a fork)

`origin` = `maxengel/rocknix`, `upstream` = `ROCKNIX/distribution`. Full rules in
`fork-workflow.instructions.md` / `worktrees.instructions.md`; essentials:

- Branch `next` = `upstream/next` + a personal overlay (`.github/instructions/`, `docs/`, `plans/`, `.githooks/`, ...). **Never PR `next` upstream.**
- Feature work: branch `feature/<name>` from `next` in a worktree at `../rocknix.worktrees/<name>`; the primary checkout stays on `next`.
- Upstream PRs use a throwaway branch: `git rebase --onto upstream/next next pr/<name>` (excludes personal commits by construction); `.githooks/pre-push` guards `pr/*`.
- Issues go on the fork: always `gh --repo maxengel/rocknix` (upstream has Issues disabled).
- User-facing behavior changes need a follow-up docs PR to the separate `ROCKNIX/rocknix.org` repo.
- Durable lessons: consider an instruction file under `.github/instructions/` and append a timestamped entry to `docs/work-logs/<yyyy_mm>-work_logs/<yyyy_mm_dd>-work_log.md`.

## Non-obvious gotchas

- Script-only changes (e.g. `scripts/mkimage`) do **not** trigger an image rebuild — delete `build.*/.stamps/image/build_target` first.
- Building from a git worktree in Docker requires mounting the main repo's `.git`: `DOCKER_EXTRA_OPTS='-v <main-repo>/.git:<main-repo>/.git'`.
- A network/download failure during a build often surfaces as a **misleading, unrelated-looking build error** — check for failed downloads first.
- Before "fixing" apparently wrong code, verify design intent via `git log -S`/`git blame` — several dangerous-looking patterns are intentional (`engineering-practices.instructions.md`).
- `emulationstation` source lives in a separate git repo; see `projects/ROCKNIX/packages/ui/emulationstation/package.mk` for the extra build steps.
- **rclone cloud-sync** and **GENERIC_X64 VM QA** have sharp edges — read their instruction files before touching those areas (filter file is an allowlist; `--delete-excluded` is catastrophic; VM disk must be 16GB+ or first boot breaks in a way that looks like a graphics bug).
- **Read `.github/instructions/` from `next`, not from your feature worktree.** Feature branches cut from an older base silently lack instruction files added since — `es-native-ui.instructions.md` is absent from older worktrees, so ES work done there proceeds without the guidance it mandates.
- **Headless VM QA** (no desktop on the build host): the VM profile's `virtio-gpu-gl-pci` refuses `-display none`, so take `generic-x64-vm qemu-args`, swap in `virtio-gpu-pci`, and drive the guest over `-serial unix:` with `socat`. Keep socket paths short — a unix socket path over 108 bytes fails, which the long scratch directories exceed. SSH is disabled on a fresh image, so serial is the only way in.
