---
description: "Building and publishing images for the handheld devices we test on (RK3566, H700, RK3326), as distinct from the GENERIC_X64 VM build."
paths:
  - "**"
---

# Device builds

Upstream's guide is <https://rocknix.org/contribute/build/> and is the reference
for prerequisites and options. This file covers what it does not: our fork's
worktree layout, the devices we actually target, and the publish path.

**One correction to the upstream guide:** it says images land in `release/`.
They land in **`target/`** — `config/path` sets `TARGET_IMG=$ROOT/target`, and
`release/` survives only in a cleanup line in `scripts/build_distro`.

## Our devices

| Hardware | Target | Arch | Notes |
|---|---|---|---|
| Anbernic RG353M | `RK3566` | aarch64 | cortex-a55, neon-fp-armv8 (no crypto ext) |
| Anbernic RG35xx SP | `H700` | aarch64 | cortex-a53, crypto-neon-fp-armv8 |
| Anbernic RG351M | `RK3326` | aarch64 | |
| VM / QA | `GENERIC_X64` | x86_64 | fork-only device; see `generic-x64-vm-testing` |

The three handhelds are *different build families* — separate `-mcpu` and SIMD
feature sets — which is why savestate compatibility across them is an open
question (fork issue #10, gated on #19). Do not assume a state from one loads on
another.

## Where to build

Device builds run from a worktree on **`test/qa-integration`**, not
`test/qa-generic-x64` — the latter carries the GENERIC_X64 VM concessions
(software GL, VM quirks) that have no business in a handheld image.

```bash
git worktree add ../rocknix.worktrees/devices test/qa-integration
```

One worktree builds all three devices: build roots are per-device
(`build.ROCKNIX-RK3566.aarch64`, …) and do not collide.

## The build command

Use the canonical `make docker-<DEVICE>` target rather than a hand-rolled
`docker run` — it generates `.env` (via `scripts/get_env`), wires up uid/gid,
and mounts `${HOME}/.ROCKNIX/options` if present.

Two mounts must be added by hand for our layout, both through
`DOCKER_EXTRA_OPTS`:

```bash
D=~/Development/rocknix.worktrees/devices
S=~/Development/rocknix.worktrees/generic-x64/sources   # shared download cache

cd "$D"
DOCKER_EXTRA_OPTS="-v ~/Development/rocknix/.git:/home/max/Development/rocknix/.git -v $S:$D/sources" \
  make docker-RK3566
```

- **The `.git` mount is mandatory from a worktree.** A worktree's `.git` is a
  pointer file, and `scripts/image` runs `git rev-parse`; without the main
  repo's real `.git` the image step fails.
- **The sources mount is an optimisation**, not a requirement — it reuses the
  ~15 GB download cache instead of re-fetching hundreds of tarballs into a fresh
  worktree. Safe because `sources/` is a content-addressed download cache; build
  sequentially rather than sharing it between concurrent builds.

## After rebasing onto upstream

A build root that predates a rebase carries the *previous* tree's installed
artifacts. Those are not cleaned by a package version bump, so an incremental
build can fail in ways a clean build never does. Two things to do before
rebuilding:

1. **Re-pull the build container.** `DOCKER_IMAGE` is pinned to `:latest`, so a
   cached image can be months old while the tree now expects newer host tools.
   `make docker-image-pull` first — otherwise you find out hours in.
2. **Expect self-hosting tools to break.** `config/functions` exports
   `LIBTOOLIZE`, `AUTOCONF`, `ACLOCAL` and friends **only if the toolchain
   already contains them**. On a clean tree libtool builds with no libtoolize
   present (the container ships none), so its own new `m4/` macros survive. On a
   warm tree the *previous* libtool's `libtoolize` is found, runs
   `--copy --force`, and overwrites the new macros with its older ones — so
   `libtool 2.5.4 -> 2.6.2` fails with `LT_LANG: unsupported language:
   "Objective-C"`, an error that names nothing to do with the real cause.

   The fix is to reproduce the clean-tree condition for that one package rather
   than delete the whole build root:

   ```bash
   rm -rf build.*/toolchain/bin/libtool build.*/toolchain/bin/libtoolize \
          build.*/toolchain/share/libtool build.*/build/libtool-* \
          build.*/.stamps/libtool
   rm -f  build.*/toolchain/share/aclocal/lt*.m4
   ```

   Note the sysroot copy at `toolchain/*/sysroot/usr/share/aclocal/` is a
   *separate* stale copy. Clearing only that one moves the error from
   `sysroot/.../libtool.m4` to `m4/libtool.m4`, which looks like progress but is
   the same bug — `libtoolize` re-clobbers it on the second aclocal pass.

This is an upstream defect, not a fork one: any developer with an existing build
root hits it on a libtool bump, and CI never does because CI is always clean.

3. **Check how stale the root actually is before patching anything.** A
   `projects/ROCKNIX/packages/<pkg>` override that does
   `. ${ROOT}/packages/.../package.mk` inherits `PKG_VERSION` from the generic
   recipe — but `calculate_stamp` (`config/functions`) hashes `$PKG_DIR`, which
   resolves to the **override** directory. The generic file holding the version
   is never hashed, so bumping it does not invalidate the stamp and the old
   build silently stands. 53 ROCKNIX packages use that pattern.

   After a big rebase, enumerate the damage rather than discovering it one
   failure at a time — compare each override's **effective** `PKG_VERSION`
   against `build.*/build/<pkg>-*`. On the 2026-08-19 rebase that showed **35
   stale packages**, among them openssl (3.5.1→3.6.3), glib (2.85.1→2.89.3),
   curl, expat, zlib and libfmt (9.1.0→12.2.0, a major ABI break).

   *Effective* is load-bearing. An override may set its own `PKG_VERSION`
   **after** sourcing the generic recipe, deliberately holding a package back —
   `gcc` (pinned 15.2.0 against a generic 16.2.0), `iwd` and `opus` all do. A
   sweep that reads only the generic file reports those as stale when they are
   working as intended, and "the compiler is stale" is exactly the kind of
   alarming false positive that stampedes a decision.

   **When core libraries are among the genuinely stale, wipe the build roots.**
   Clearing stamps individually leaves consumers linked against sysroot copies
   that no longer match their recipes — an image nobody should flash. The
   targeted fix in (2) is right for one isolated bump and wrong at this scale.
   `sources/` is a separate directory, so a wipe costs rebuild time but no
   re-downloading.

## Budget

- **Disk:** ~90 GB per device build root, plus the shared ~15 GB sources cache.
  Three devices is roughly 270 GB — check `df -h` before starting.
- **Time:** hours for a first build of a device; minutes once its root is warm.
- Build sequentially. Parallel device builds contend for CPU and the sources
  cache, and a failure part-way is harder to attribute.

## Publishing

`tools/fork-publish-release <DEVICE> prerelease` works unchanged for handhelds:
the `case` in it adds VM artifacts only for `GENERIC_X64` and `AMD64`, so a
handheld publishes just `.img.gz` + `.sha256` under a tag like
`dev-rk3566-<yyyymmdd>` — which is what you want for something flashed to a
card.

**Re-publishing the same day replaces assets under an unchanged tag**, which has
already cost a QA cycle once (blindspot register entry 2). Post the new sha256
when you do it, and prefer a fresh date.

## Installing on the device

Flash `target/ROCKNIX-<DEVICE>.aarch64-<date>.img.gz` to a card, or push the
`.tar` to a running device's in-place updater — `scp` it to
`root@<host>:~/.update` and reboot, which preserves settings.

## Iterating on EmulationStation

The `docker-%` target mounts `EMULATIONSTATION_SRC` when it is set, which builds
ES from a local checkout instead of the pinned commit — much faster than
push-and-bump-the-pin for UI work:

```bash
EMULATIONSTATION_SRC=~/Development/emulationstation-next.worktrees/<branch> \
  DOCKER_EXTRA_OPTS="..." make docker-RK3566
```

Note that a package's source change does **not** always retrigger a rebuild:
clear its stamp first (`build.*/.stamps/<pkg>/`), and delete
`build.*/.stamps/image/build_target` to force a fresh image.
