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

## Where things live

Since 2026-09-04 the build tree is on serval's dedicated 4 TB volume, following
the fleet's `/workspace` convention (lorry `fleet/blueprints/build-box.yml`,
`docs/runbooks/00-workspace-disk.md`):

| Path | Holds |
|---|---|
| `/workspace/repos/rocknix` | primary checkout, stays on `next` |
| `/workspace/repos/rocknix.worktrees/<name>` | build worktrees, siblings of the primary |
| `/workspace/cache/rocknix-sources` | the shared download cache (`SOURCES_DIR`) |
| `/workspace/artifacts/rocknix-images` | published/kept images |

It used to be `~/Development/rocknix{,.worktrees}` on the 1 TB OS disk, which
four device build roots plus the cache had filled to 36 GB free.

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
D=/workspace/repos/rocknix.worktrees/devices
S=/workspace/cache/rocknix-sources          # shared download cache

cd "$D"
DOCKER_EXTRA_OPTS="-v /workspace/repos/rocknix/.git:/workspace/repos/rocknix/.git -v $S:$D/sources" \
  make docker-RK3566
```

- **The `.git` mount is mandatory from a worktree.** A worktree's `.git` is a
  pointer file, and `scripts/image` runs `git rev-parse`; without the main
  repo's real `.git` the image step fails.

- **The sources mount is an optimisation**, not a requirement — it reuses the
  ~38 GB download cache instead of re-fetching hundreds of tarballs into a fresh
  worktree. Safe because `sources/` is a content-addressed download cache; build
  sequentially rather than sharing it between concurrent builds.

  A native build needs no mount at all: `config/path` reads
  `SOURCES=${SOURCES_DIR:-$ROOT/sources}`, so pointing at the shared cache is
  one variable — `export SOURCES_DIR=/workspace/cache/rocknix-sources` — with
  no symlink inside each worktree.

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

## A metadata-only upstream change still rebuilds everything

`calculate_stamp` hashes the whole package directory, not the version in it.
So a sweep that adds `PKG_SHA256` to hundreds of recipes — changing no
version, no source, no flag — invalidates every one of their stamps.

The 2026-09-04 merge brought 446 changed `package.mk` files. Separating them
mattered:

- **220** changed *only* by upstream's checksum sweep
- **226** changed substantively

and the practical answer is the same for both, because all 446 rebuild. That
inverts the usual reasoning about a warm build root: the question is not "how
much is stale?" but "is anything still valid?", and after a sweep like that,
almost nothing is.

So when a rebase includes a repo-wide metadata pass, do not price an
incremental build against a wipe — they cost nearly the same, and the wipe
also buys the clean-tree condition that avoids the libtool class of failure
above. Check `df` first: on this machine four device roots plus the source
cache came to 598 GB against 37 GB free, which made "rebuild in place" the
option that could not actually run.

`sources/` is separate and worth carrying across; the build roots are not.

## Late binding bites hardest in a merge

`packages/readme.md` says toolchain and path variables exist only after a
package loads, so they belong inside functions. A merge is where a violation
surfaces, because the conflict makes you read code nobody has read since it
was written.

`ppsspp-lr` carried a fork patch that stripped an aarch64-only compiler flag
on x86_64. It sat at **file scope** and referenced `${PKG_BUILD}`, which is
empty there — so the `sed -i` edited `/CMakeLists.txt` and had never once done
its job. Nothing failed: the build succeeded, and the flag it was meant to
remove was simply never removed. It moved into `post_unpack()` during the
merge (`7650de7dd6`).

When resolving a conflict in a fork-added block, check the block was ever
correct before preserving it. A conflict is the cheapest opportunity to
notice, and `tools/pkgcheck` will not catch a variable that is merely empty.

## A killed build poisons every package that was in flight

Builds run packages in parallel, so a `Ctrl-C`, a SIGTERM or a machine
reboot does not interrupt *a* package — it interrupts however many were
compiling at that moment. Each is left with objects on disk and archives
built from an incomplete set of them.

The resumed build then fails at **link** time, with a message that points
nowhere near the cause:

```
undefined reference to `T11'          # while obj/emu/cpu/t11/t11.o sits right there
undefined reference to `cp_find_first_component(char const*)'
```

The object exists; it was archived out. Nothing rebuilds it, because as
far as make is concerned the archive is newer than the source.

**Do not fix these one at a time.** Each attempt burns a build phase to
discover the next casualty — 2026-09-02 went `mame2015-lr`, then `gdb`,
before anyone asked how many there were. There were four.

Enumerate them instead. The signature is a build directory that contains
compiled output but has no `build_*` stamp:

```bash
R=build.ROCKNIX-<DEVICE>.<ARCH>
cd $R/build && for d in */; do d=${d%/}; p=$d
  while [ ! -d "$R/.stamps/$p" ] && [ "${p%-*}" != "$p" ]; do p=${p%-*}; done
  [ -d "$R/.stamps/$p" ] || continue
  ls "$R/.stamps/$p" | grep -q '^build_' && continue
  [ -n "$(find "$d" -name '*.o' -o -name '*.a' | head -1)" ] && echo "POISONED $p ($d)"
done
```

The object-file test matters: a package that is merely *unpacked* also has
a directory and no stamp, and cleaning it costs an unpack for nothing.
Only the ones with compiled output were mid-flight.

**Test for a configured build directory too.** A package killed during
`configure` has no object files yet, so the test above misses it, and it
fails on resume with a message that names nothing useful — meson says
"Directory already configured" and then cannot find its own `build.dat`
(`glu`, 2026-09-05, the second failure of a GENERIC_X64 cold build whose
first failure had killed 22 packages in flight). Add
`[ -d "$d/.<target-triple>" ]` to the condition — the per-target build
subdirectory (e.g. `.x86_64-rocknix-linux-gnu`) exists once configure has
started — and treat it as poisoned like compiled output.

Then `rm -rf $R/.stamps/<pkg> $R/build/<pkg>-*` for each and resume.

**If a resume fails the same way again after that sweep, stop clearing
packages and wipe the arch's build root.** At that point the state is not
enumerable and the rebuild is cheaper than the next three guesses —
`sources/` is a separate directory, so it costs time, not downloads.

Related but distinct: the libtool case above is a *stale* artifact from a
previous tree. This one is a *partial* artifact from an interrupted run.
Same class of symptom, different cause, same instinct — reproduce the
clean-tree condition for the affected packages rather than trusting an
incremental build to notice.

## Budget

- **Disk:** ~90 GB per device build root, plus the shared ~15 GB sources cache.
  Three devices is roughly 270 GB — check `df -h` before starting.
- **Time:** hours for a first build of a device; minutes once its root is warm.
- Build sequentially. Parallel device builds contend for CPU and the sources
  cache, and a failure part-way is harder to attribute.

## Build credentials

Four optional secrets are compiled **into the EmulationStation binary** when
present in the build environment: `SCREENSCRAPER_DEV_LOGIN`
(`devid=…&devpassword=…`, a developer pair ScreenScraper issues via its forum —
a member login is not accepted in its place), `CHEEVOS_DEV_LOGIN`
(`z=<user>&y=<web API key>`, per RetroAchievements account), `GAMESDB_APIKEY`,
`HFS_DEV_LOGIN`. Without them the matching scraper is not built — **except
ScreenScraper on fork builds**: since #64 (2026-09-05) the package sets
`SCREENSCRAPER_RUNTIME_DEV_LOGIN`, the scraper is always built, and the
developer pair is typed on the device under the scraper's OPTIONS beside the
account (DEVELOPER ID / DEVELOPER PASSWORD, held back from settings backups).
So the options file is for RetroAchievements, TheGamesDB and HfsDB only, and
a fork image never needs to carry a ScreenScraper key.

They live in **`~/.ROCKNIX/options`, mode 0600, as `export` lines** — the
Makefile includes that file on the host and in the container. Nothing else
needs to know them. The maintainer's rule (D-INFRA-006): builds are local, so a
value in a build log is tolerable; a value leaving through a build or through
git is not. The guards, each proven against a constructed violation:

- `scripts/get_env` forwards the environment into the container **minus
  anything secret-shaped**, except those four by name. It used to forward
  everything, which put the developer's shell tokens into a world-readable
  `.env` and every container. `.env` is now 0600 and removed when the
  container exits.
- The ES recipe logs `USING: <key> (set)`, never the value.
- `tools/fork-publish-release` looks at the build root's ES binary; if it
  contains `devpassword=` or an `&y=KEY`, it publishes only to a **private**
  repo and refuses a public or unknown one (D-INFRA-007). It cannot strip a
  key from a built binary; rebuild with the keys commented out.
  `FORK_ALLOW_EMBEDDED_CREDENTIALS=yes` overrides it, for accounts created for
  the fork and nothing else.
- `.githooks/pre-push` scans every pushed branch (`fork-workflow.md`).

The maintainer's rule, verbatim: *"if the build is only being generated on my
build server and only being played by me, the key can be in my build, but
beyond that, it needs to be stripped out."* So personal credentials in the
options file are fine for images that stay here and on your own devices;
anything anyone else can download is built without them.

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

**`EMULATIONSTATION_SRC` only mounts the directory — it does not build from it.**
The `docker-%` target turns it into a `-v` bind mount and nothing else;
`emulationstation/package.mk` never reads the variable, so the package still
fetches and builds `PKG_VERSION` from `PKG_GIT_CLONE_BRANCH`. Setting it and
assuming the local tree was compiled produces an image with none of your
changes and no error to say so — the build log still reports
`[DONE] build emulationstation:target`, because it did build, just not your
source. Verify with `strings <image>/usr/bin/emulationstation | grep "<a
string you added>"` rather than trusting the build to have used it.

To actually ship an ES change: push the branch, merge it into the branch named
by `PKG_GIT_CLONE_BRANCH` (`test/qa-integration`), and bump `PKG_VERSION` to
the new commit. The mount is still worth setting alongside:

```bash
EMULATIONSTATION_SRC=~/Development/emulationstation-next.worktrees/<branch> \
  DOCKER_EXTRA_OPTS="..." make docker-RK3566
```

Note that a package's source change does **not** always retrigger a rebuild:
clear its stamp first (`build.*/.stamps/<pkg>/`), and delete
`build.*/.stamps/image/build_target` to force a fresh image.
