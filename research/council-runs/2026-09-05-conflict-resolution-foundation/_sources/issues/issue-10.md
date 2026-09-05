author:	maxengel
association:	owner
edited:	false
status:	none
--
Now in the *Visual Conflict Resolution* milestone (2026-08-18) — cross-device savestate isolation is a prerequisite for that milestone's end goal ("pick up on one device, sync, resume on another"), not just a nice-to-have.

Decision input from today: key isolation on **core × arch** (drop the chipset variant unless #19's compatibility research finds a same-arch incompatibility in practice). The core **version** dimension is handled by #20's manifest (recorded per save/state, judged at restore/conflict time) rather than by directory namespacing — versioned directories would fragment states on every core bump.

Suggested acceptance criteria:
- [ ] Savestates written on device A (arch X, core C) are never offered for load into a different core, and cross-arch states surface as warn-gated, not silent (driven by #19's rules table + #20's manifest).
- [ ] Namespacing scheme documented (path layout: per-core subfolders via RetroArch's own options; arch recorded in the #20 manifest rather than the path, unless #19 dictates otherwise).
- [ ] Migration for existing flat-namespace states (one-time, no data loss, logged).
- [ ] Sync filter rules updated so the namespaced layout still matches the allowlist.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Design direction (2026-08-19) — gated on #19

Working session on how to keep savestates from corrupting each other across devices. **Settled shape below; the rule that drives it is deliberately open** until #19 measures real compatibility.

### The key is build family, not CPU architecture

"aarch64 vs x86_64" is far too coarse. ROCKNIX compiles per device, and the ARM devices differ in ways that plausibly change serialized state:

| Device | `-mcpu` | FPU / SIMD |
|---|---|---|
| H700 | cortex-a53 | crypto-neon-fp-armv8 |
| RK3566 | cortex-a55 | neon-fp-armv8 — **no crypto** |
| RK3588 | cortex-a76.cortex-a55 | crypto-neon-fp-armv8 |

Runtime identifier is `HW_DEVICE` (already used by `usbgadget` and `rocknix-memory-manager`). It should be adjusted for `DEVICE_ROOT`: devices reusing another's build root are binary-identical and must share a namespace rather than fragment. No device sets it today, but `build_distro` supports it, so the image should record its *effective build root*.

### Game saves are excluded

SRM, memory cards and battery saves are emulated-hardware state and are portable across every build. They must stay shared and unfiltered — namespacing them would break the exact cross-device scenario this program exists for, and they are the files whose loss hurts most. **Only savestates** (`.state`, `.stateN`, `.state.auto`, and their `.png` thumbnails) carry the key.

### Local filenames must stay canonical

Verified, not assumed. `SaveStateConfigFile.cpp` builds discovery regexes from templates:

```
file          = "{{romfilename}}.state{{slot}}"
autosave_file = "{{romfilename}}.state.auto"
```
with `{{romfilename}}` compiled to a greedy `(.*)`. A local file named `game.h700.state1` therefore reads as a state belonging to a ROM called `game.h700` — invisible under `game`, and RetroArch would not find it either.

So any suffixing lives on the **remote only**, with the sync script mapping on upload and reversing on download. The device never sees a suffixed name.

### Three mechanisms considered

1. **Directory namespacing + migrate on toggle** — rejected. It freezes today's compatibility guess into the filesystem (revising it means migrating again), a per-device toggle over shared storage produces divergent layouts in one namespace (device B reads `x86_64/`, finds nothing, and its saves appear to have vanished), and migrating existing flat files would stamp them with an architecture we never verified — manufacturing authoritative-looking wrong data.
2. **Metadata sidecar only** — most flexible, since compatibility *rules* can evolve without touching stored data. But rclone filters on paths, not contents, so "sync only compatible" would need a manifest-reading pre-pass; and it needs write-time stamping to avoid the same false-attribution trap.
3. **Filename suffix on the remote** (`game.h700.state1`), sync maps to/from canonical — the coarse key lands where rclone can already filter it, with zero disruption on the device.

Current lean: **3 as the transport key, 2 as the later fine-grained record** (core, core version, OS version don't fit comfortably in a filename). Which is right depends on #19.

### Materialization is additive, never a replace

Copy-and-replace at sync was considered and rejected: it is a recency overwrite, which this subsystem's own guardrail forbids — *"a newer file can hold less progress than an older one from another device… never auto-delete the conflict loser."* The player would also have no idea it happened until they loaded the slot.

The non-destructive form of the same idea: an incoming state from another family lands in the **next free slot**, badged with its origin, and the player chooses from the savestate manager's existing grid of thumbnails. That is #24's territory, including the fallback for cores with a fixed slot count.

Once #25's pre-change snapshots exist, a "replace with newest" option becomes defensible because it is reversible. Replace *without* snapshots is the combination to avoid.

### The setting

**"Only show compatible savestates"**, default on:
- *on* — pull only your build family's states
- *off* — pull others too, into free slots, badged by origin

Both are pure additions.

### Open, and gating

- **#19 must measure what actually breaks a state.** RK3566 vs RK3588 (same arch, both crypto-neon, different `-mcpu`) is the decisive test: if states survive there, the key is coarser than device and fragmentation shrinks a lot.
- Provenance across a round trip — with the permissive setting, a state pulled from another family and later re-uploaded must not be re-stamped as ours.
- Incidental find worth using either way: `{{core}}` and `{{emulator}}` are already valid in the savestate *directory* template, so per-core separation is a config change rather than new code. RetroArch's own `sort_savestates_enable` is `"false"` on all 13 device configs today.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Open question resolved: key on core, carry the version as data

Maintainer's call, 2026-09-01, and it is better than keying on core+version.

**Directories by core only.** A directory tree is structure, and structure
churns permanently -- keying on the build would split the library on every
core update, including splitting a device from its own earlier states.

**The core build goes in a manifest inside the directory**, as data. Data can
be compared, explained and acted on at reconciliation time; a directory can
only be split. It also makes the version usable for something better than
segregation: telling somebody their device is behind before it syncs.

So the answer to "arch, chipset, or device?" is **none of those** -- key on
the core, because that is what a savestate is a dump of. Two handhelds on the
same core merge because they should; one handheld that updated its core is
flagged because it should be.

### What the version is, concretely

Not available from RetroArch's `.info` files -- ROCKNIX ships none. The
core's own string is inconsistent (`snes9x_libretro.so` reports
`1.63 c351acdf3e`, `mgba_libretro.so` reports nothing). The reliable source
is our own build pin: `packages/emulation/libretro-*/package.mk`
`PKG_VERSION`, e.g. `libretro-snes9x2010` -> `d9cba8a41b34…`. Same string on
every device built from the same tree, known at build time, nothing to
discover.

### Three things that make it correct

1. **One manifest per device, not one shared file.** Several handhelds write
   this folder; a single manifest is a write conflict by construction.
   `savestates/.rocknix/states-<device-id>.json` -- each device writes only
   its own, readers take the union. `<device-id>` already exists
   (`cloud_device_id`, D-CLOUD-009).
2. **Existing states are `unknown`, and consumers must handle it.** Everything
   already in somebody's cloud has no manifest entry. Per
   `upgrade-and-install.md`: do not stamp existing data with metadata that has
   not been verified -- inventing authoritative-looking wrong data is worse
   than leaving it unknown.
3. **Warn, do not block.** "Upgrade before syncing" as a hard gate strands
   somebody who cannot upgrade right now. Sync anyway (copy is
   non-destructive), and surface the mismatch where it matters -- at
   reconciliation, and before a state from a different core build is handed to
   a core that may not read it.

The manifest is already inside the sync allowlist: `+ /savestates/**` covers
it, so nothing needs adding to the filter.

### Not affected

Save files -- `.srm`, `.sav`, memcards -- are the game's own battery save and
stay one shared pool across every device. That is the part that makes several
handhelds feel like one library.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Pre-futro audit — 2026-09-05.** Drift found: title and open question superseded by D-CLOUD-017 (blindspot 27); layout on the device still flat per system, so decided-not-built; shipped `es_savestates.cfg` not at either expected path. **Post-futro audit — 2026-09-05.** Retitled; superseded note and two open items added. Green light after the config-location check.
--
