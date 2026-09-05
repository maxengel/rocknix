author:	maxengel
association:	owner
edited:	false
status:	none
--
**This issue now gates #10, #20 and #24.** The 2026-08-19 design session on #10 settled the mechanism but not the rule it enforces — every decision there is downstream of what this research measures.

The sharpened question: it is not "does CPU architecture matter". ROCKNIX compiles per device, so the interesting differences are within aarch64:

| Device | `-mcpu` | FPU / SIMD |
|---|---|---|
| H700 | cortex-a53 | crypto-neon-fp-armv8 |
| RK3566 | cortex-a55 | neon-fp-armv8 — no crypto |
| RK3588 | cortex-a76.cortex-a55 | crypto-neon-fp-armv8 |

**The decisive test is RK3566 vs RK3588** — same architecture, same crypto-neon FPU, different `-mcpu`. If a savestate written on one loads correctly on the other, the compatibility key is coarser than build family and the whole scheme fragments far less. If it does not, build family is the floor.

Worth establishing alongside it:
- Does **core version** dominate over build family? (Two devices in the same family on different core versions are the likelier real-world break.)
- Do failures present as a clean refusal or as **silent corruption**? This decides whether an incompatible state can be offered with a warning at all, or must be hard-blocked.
- Which cores serialize logical state (portable) versus raw memory (fragile)? The answer probably varies per core, which would make the output a per-core rules table rather than a single verdict.

Suggested method now that it is cheap: `tools/vm-visual-qa` drives a VM headlessly, and GENERIC_X64 gives one build family for free — pairing it with a real handheld build covers the cross-family case without needing two physical devices for every combination.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Direction: conservative by default, opened up behind explicit toggles

Settled approach for how compatibility is enforced, which also gives this research a clear target.

**Start strict.** A savestate is only offered where it is known to work: same **chipset** and same **emulator/core**. That is the conservative position, and it is the right default because the failure mode is a state that loads into garbage rather than refusing to load — the player finds out after trusting it.

**Open it up deliberately, not silently.** Once saves are organised by chipset (#10), two toggles let a player go further:

- Sync savestates across **cores** — yes/no
- Sync savestates across **chipsets** — yes/no

Both default off, and both are framed as what they are — an *Experimental* or *Potentially destructive* area rather than ordinary settings. That keeps the safe path safe while not permanently deciding on the player's behalf.

## What this research now has to produce

Not a general compatibility matrix — just the rule the UI enforces:

1. Does a savestate from the same core but a **different chipset** load correctly? (RK3566 vs H700 vs RK3326 — three build families now have published images.)
2. Does a savestate from a **different core version**, same chipset, load correctly?
3. Is failure **loud** (refuses to load) or **silent** (loads into a corrupt state)? This is the one that matters most: if failure is silent, the badge has to be conservative, because the player cannot detect the problem themselves.

Newly cheap to answer: there are published images for all three families, and `tools/cloud-round-trip` can move a savestate between devices through the QA endpoint. The test is same core, same game, state written on one family and loaded on another.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Preliminary analysis from the build config — chipset may be the wrong axis

Not a test result. This is what the tree says, and it suggests the conservative design may be restricting the wrong thing.

**All three target devices are the same ABI.** Cortex-A35 (RK3326), A53 (H700) and A55 (RK3566) are all ARMv8-A, all built `aarch64`. They differ only in `TARGET_CPU` tuning:

| Device | TARGET_CPU |
|---|---|
| RK3566 | `cortex-a55` |
| H700 | `cortex-a53` |
| RK3326 | `cortex-a35` |

**And core versions are pinned globally, not per device.** The same core commit is built for each — e.g. `a5200-lr-526404072821bb2021fab16f8c5dbbca300512c8` appears identically in all three build roots.

`-mcpu` changes instruction selection and scheduling. It does not change struct layout, word size or endianness, and `retro_serialize` writes the core's data structures. So for the *same core version* on these devices, the expectation is that savestates are **portable**, and that chipset is not the axis at all.

If that holds, two consequences:

1. **The conservative rule blocks syncs that would have worked.** Same-chipset-only would stop an RG353M save loading on an RG35xx SP even though both are aarch64 running the identical core build.
2. **#10 (per-chipset namespacing) may be unnecessary** — a whole feature that exists to solve a problem that might not exist. Worth settling before building it.

## The axis that probably does matter: core version

Since cores are pinned per ROCKNIX build, two devices on the **same** build have identical cores and should interoperate. Two devices on **different** ROCKNIX builds may have different core versions — and that is where serialization formats genuinely change, because upstream cores alter their state structures between releases.

So the useful metadata is likely **core name + version**, which #20 already captures, rather than chipset.

## What the test still has to answer

The above is inference from build flags and needs confirming on hardware — the VM is x86_64 and cannot speak to aarch64-to-aarch64:

1. Same core version, different chipset (RG353M ↔ RG35xx SP ↔ RG351M): does a savestate load correctly?
2. Different core version, same chipset: does it?
3. **Is failure loud or silent?** The one that most shapes the UI. If a mismatched state refuses to load, a warning is a convenience. If it loads into a corrupt state, the player discovers it hours later having built on a broken save — and the toggles to sync across cores/chipsets need to be framed far more strongly than "experimental".

Question 3 is worth answering even if 1 and 2 come back clean, because it sets how much the opt-in toggles have to shout.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
Test protocol ready for the hardware session: [`docs/savestate-compat-test.md`](https://github.com/maxengel/rocknix/blob/next/docs/savestate-compat-test.md).

Two things that make it cheaper than expected:

**No ROMs needed.** Eight content-less cores ship with binaries present on the built image — `atari800`, `b2`, `bk`, `bluemsx`, `cap32`, `dosbox_core`, `dosbox_pure`, `emuscv`. `cap32` or `atari800` boot to a BASIC prompt, so typing a distinctive line gives a **visually verifiable** state — "did it load correctly" is answerable by looking, rather than by trusting an exit code. Nothing to copy to three devices, and no licensing questions.

**The confound to avoid:** all three devices must be on the **same build**, or chipset and core version cannot be told apart — which would waste the session and produce a result that looks conclusive and is not.

The protocol covers the chipset axis (six directed pairs), the core-version axis, and — separately, to be run even if the first two pass — whether failure is loud or silent, since that is what decides whether the compatibility badge is a convenience or a safeguard.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Evidence for the device-identity task, and a control case we didn't have

A second H700 handheld (Anbernic **RG-SP**) arrives this week alongside the existing **RG35xx SP**. That changes what this issue can establish, in two ways.

### 1. `HW_DEVICE` is the SoC family, not the model — the third task is a live defect

`scripts/image:163` writes `HW_DEVICE="${DEVICE}"`, i.e. the *build target*. Twelve distinct Anbernic handhelds share `DEVICE=H700`:

```
Anbernic RG28XX · RG34XX · RG34XX-SP · RG35XX Pro
RG40XX H · RG40XX V · RG CubeXX · RG-SP  (+ RG35XX SP variants)
```

So both devices here will report `HW_DEVICE=H700` and be **indistinguishable in anything keyed on it**.

That directly undercuts #23: `docs/conflict-wizard-ia.md` specifies `device + model` on each side of the comparison (line 92, and the metadata row at 111). Two identical `H700` rows tell the player nothing about which handheld a save came from — which is the information the wizard exists to convey. It also affects #20: a manifest recording `H700` as provenance cannot distinguish the two.

The real model string exists in the device tree — `model = "Anbernic RG-SP"` — and reading it is already precedent in-tree:

- `projects/ROCKNIX/packages/network/ap6611s/autostart/008-ap6611s` reads `/proc/device-tree/model`
- H700's own `bootloader/update.sh` reads `/proc/device-tree/rocknix-dt-id`

So this is wiring up something already present, not inventing an identity scheme.

### 2. Two devices on one chipset is the control this matrix was missing

The current set is three *different* build families — RK3566 (cortex-a55), H700 (cortex-a53), RK3326. If a savestate fails to move between them, the experiment can't separate chipset from core version from anything else.

Two H700s hold everything constant:

- **State transfers** → chipset is isolated as the real variable, and the cross-chipset matrix is worth building.
- **State does not transfer** → the problem was never chipset, and #10's per-chipset namespacing is aimed at the wrong thing.

Either outcome is decisive, and it is much cheaper than the full matrix. **Run the same-chipset control before the cross-chipset work.**

### Suggested sequencing

1. Confirm both devices report `HW_DEVICE=H700` and *different* `/proc/device-tree/model` — the identity gap, evidenced in one command.
2. Same-chipset savestate transfer (the control).
3. Only then, cross-chipset against RK3566 / RK3326.

### Proposed AC addition

- [ ] Device identity resolves to a **model**, not a build target: two handhelds sharing `DEVICE=H700` report distinct identities, verified on the RG35xx SP and RG-SP pair.
- [ ] The same-chipset control is run and recorded before the cross-chipset matrix, since its result determines whether the matrix is measuring what it claims to.

Related: #44 (nothing tells a downloader whether an H700 board is DDR3 or DDR4) — same underlying theme, that the OS and its artifacts know less about *which* handheld this is than they need to.

--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Reframed (D-CLOUD-025, retro on #26, 2026-09-04):** this is no longer research — the protocol is written at `docs/savestate-compat-test.md` (~1 hour) and the bench now holds every family it names: H700 ×2 (RG35XX SP, RG SP), RK3326 (RG351M), RK3566 (RG353M), plus SM8550 (Retroid Pocket Nova). Run it before #23's compatibility badge is designed: all three handheld families are ARMv8-A aarch64 with globally pinned core versions, so the answer may make the badge a convenience rather than a safeguard.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Pre-futro audit — 2026-09-05.** Live state: bench holds H700 ×2, RK3326, RK3566, SM8550; protocol at `docs/savestate-compat-test.md`; device identity gap confirmed on the RG35XX SP (`/proc/device-tree/model` = *Anbernic RG35XX SP*, `HW_DEVICE=H700`; `cloud_device_id --label` already yields *Anbernic-RG35XX-SP*). ACs verifiable as written. Dependency: none. Scope unchanged. **Post-futro audit — 2026-09-05.** No body edit needed; the futro on #11 makes this run the gate for #23's badge only, not for #20/#21/#24. Green light to schedule the bench session.
--
