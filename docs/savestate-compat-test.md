# Savestate compatibility — hardware test protocol (#19)

A ~1 hour protocol for the three devices, written to be run once and answer the
questions the conflict wizard and #10 both depend on. Device time is the scarce
resource here, so everything that can be prepared in advance is listed first.

**What this settles:**

1. Is **chipset** actually a compatibility axis, or is only **core version**?
2. Is failure **loud** (refuses to load) or **silent** (loads into a corrupt
   state)?

Question 2 matters even if 1 comes back clean: it decides how loudly the
"sync across cores / chipsets" toggles have to warn, and whether the wizard's
compatibility badge is a convenience or a safeguard.

## Why the answer could delete work

From the build config: RK3566 (cortex-a55), H700 (cortex-a53) and RK3326
(cortex-a35) are **all ARMv8-A, all built aarch64**, differing only in
`TARGET_CPU` tuning — and core versions are pinned globally, so the same core
commit is built for every device. `-mcpu` changes instruction selection, not
struct layout or word size, and `retro_serialize` writes the core's structures.

So the expectation is that savestates *are* portable across these three for the
same core version. If that holds, per-chipset namespacing (#10) is solving a
problem that does not exist, and a same-chipset-only rule would block syncs
that would have worked.

This protocol exists to confirm or kill that, on hardware, because the
GENERIC_X64 VM is x86_64 and cannot speak to aarch64-to-aarch64.

## No ROMs required

Use a **content-less core** — one that boots with no game file. Confirmed
present on the built image, with binaries not just `.info` files:

`atari800` · `b2` · `bk` · `bluemsx` · `cap32` · `dosbox_core` ·
`dosbox_pure` · `emuscv`

`cap32` (Amstrad CPC) or `atari800` boot to a BASIC prompt, which is ideal:
typing a distinctive line gives a **visually verifiable** state, so "did it
load correctly" is answerable by looking rather than by trusting a return code.
No game files to copy to three devices, and no licensing questions.

## Prepare before touching a device

- [ ] Flash all three from the **same build** — this is what isolates chipset
      from core version. Different builds confound the two axes.
- [ ] Same core on each, and record its version from
      `/tmp/cores/<core>.info`.
- [ ] Have the QA endpoint reachable, or a USB stick — the states have to move
      between devices somehow.

## Test A — chipset axis (same build, same core)

For each ordered pair among {RG353M, RG35xx SP, RG351M}:

1. On device X, boot the core, type something distinctive at the prompt
   (`10 PRINT "RG353M"`), save to slot 1.
2. Copy `.state1` **and** `.state1.png` to device Y.
3. On device Y, boot the same core with no content, load slot 1.
4. Record: **loads and shows the same screen** / **refuses** / **loads into
   something wrong**.

Six directed pairs. If all six load correctly, chipset is not an axis for this
core, and the conservative rule is over-restrictive.

> One core is evidence, not proof — a core with runtime CPU-feature branches
> could still differ. If the result is "portable", repeat with one more core
> before acting on it, ideally something heavier like `dosbox_pure`.

## Test B — core-version axis

Needs two ROCKNIX builds with different versions of one core. If a second build
is not available, note it and defer — but this is the axis the analysis expects
to matter, so it should not be dropped quietly.

1. Same device, save with core version A.
2. Update to the build carrying core version B.
3. Load the state.
4. Record loud / silent / fine.

## Test C — loud or silent (do this even if A and B pass)

The point is to characterise how a mismatch *presents*, since that is what the
UI has to compensate for.

1. Take a good savestate. Copy it aside.
2. **Truncate it by a few bytes**, load it. Expect refusal — a size mismatch
   against `retro_serialize_size()` should be caught.
3. **Flip bytes in the middle without changing the size**, load it.
   - Note `savestate_file_compression = "true"` ships enabled, so a flipped
     byte may be caught by the compressor rather than the core. If so, also
     test with compression off, which is closer to the real failure: a
     *validly formed* state whose contents mean something different.
4. Record for each: refuses / loads visibly wrong / loads and looks fine.

**If step 3 loads without complaint, the compatibility badge is a safeguard,
not a convenience** — the player has no way to detect the problem themselves,
and the cross-core / cross-chipset toggles need far stronger framing than
"experimental".

## Record

A table per test: source device, target device, core, core version, result,
and a photo of the screen where the result is visual. Attach to #19; it is the
evidence #20's schema and #10's existence both rest on.

## What each outcome means

| Result | Consequence |
|---|---|
| All chipset pairs load | #10 likely unnecessary; gate on core version only; wizard rarely warns |
| Some chipset pairs fail | chipset is real; keep the conservative default and the namespacing |
| Core-version mismatch fails | expected; core + version in the manifest is the gate |
| Failure is silent | badge becomes a safeguard; toggles need explicit destructive framing |
