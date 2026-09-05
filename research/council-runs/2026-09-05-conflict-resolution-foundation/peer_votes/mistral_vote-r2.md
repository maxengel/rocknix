I vote for **kimi**.

## Reasoning

**kimi's plan is the safest and most buildable.** It is the only one that:

1. **Protects player progress unconditionally** — no silent overwrite anywhere in the system, no recency default, and every destructive step is recoverable via `--backup-dir` in both directions. The cardinal rule is satisfied by construction, not by hope. The other three plans each have at least one silent-overwrite path: `claude` in concurrent writers (the residual is stated but not closed), `gemini` in the same concurrent case (the archive-before-replace mechanism is not proven atomic), and `gpt` in the exit-upload-overwrites-cloud-head case (the one-way stopgap is destructive, and the plan does not close it).

2. **Is grounded in the corpus** — every claim about the shipped code, ES's helpers, rclone's behaviour, and the register's decisions is correct, and every hypothesis is labelled as such with a named experiment. `claude` and `gemini` both overclaim on `--backup-dir` (calling it "atomic-equivalent" or "zero extra round trips" without evidence), and `gpt` misreads the exit-upload behaviour (claiming the one-way stopgap is lossless when the corpus proves it overwrites the cloud head of a fork).

3. **Is actually implementable** on a busybox handheld within the stated budgets. `kimi` prices the exit path at 3–4 spawns on the changed path, measured on the maintainer's library, and never exceeds it; `claude` predicts "≤ 2 spawns" but does not measure, and `gpt` and `gemini` do not price the exit path at all. `kimi` also refuses machinery that cannot be built in bash (vector clocks, semantic merging, a shared database, a daemon), while `gpt` proposes a two-phase commit protocol that the exit budget cannot pay.

4. **Sequences the work so the cheap experiments run first.** `kimi` gates the expensive building behind nine hardware gates, each with a defined pass condition and a defined fallback; `claude` and `gemini` both defer the bisync spike until after the detector is built, and `gpt` does not sequence the spike at all. `kimi` also repairs the round-trip harness first (gate 0), so no experiment is run against a broken test channel.

5. **Is honest about what it does not know** — every unknown is named, every experiment is defined, and every decided row that needs reopening is cited. `claude` and `gemini` both treat bisync as a dependency before the spike runs, and `gpt` treats the protected-publication protocol as mandatory V1 before pricing it.

---

## What kimi's plan needs to satisfy the amendment

The maintainer's restatement — reversibility of a resolution is a first-class requirement, not a refinement — is already satisfied: *keep discarded saves* is on by default with a retention count, and the discard store lives outside the sync tree so no allowlist rule is needed. The only gap is **the done page must not imply the discard store is an undo control.** The wizard's done page currently says "what changed, per side"; it must say "what was discarded, per game" and make it clear that the discarded copies are for recovery, not for undoing the resolution. This is a documentation change, not a code change.

---

## Dissent — what the other plans have that kimi does not fully absorb

**From claude:**
- The manifest-last commit (kimi adopts it, but claude's framing — "the manifest is the commit" — is clearer).
- The reflash bootstrap (kimi adopts it, but claude's merge rule — pre-reflash entries are its own history — is more precise).
- The one-writer rule and moving the boot sync under ES's scheduling (kimi adopts it, but claude's acquisition-order requirement — lifecycle lock before cloud lock — is more explicit).

**From gpt:**
- The unit-level member-map classifier (kimi adopts it, but gpt's framing — "complete member maps, membership changes included" — is more precise).
- The D-CLOUD-030 clarification (kimi adopts it, but gpt's wording — "never collapses an auto resume point into a numbered slot" — is clearer).
- The `makeStateFilename` parent-derivation finding (kimi adopts it, but gpt's warning — a staged-in-/tmp state would merge into /tmp — is sharper).
- The lifecycle gate with a specified acquisition order (kimi adopts it, but gpt's scoping — "game launch is never blocked behind a long content transfer" — is more explicit).

**From gemini:**
- The `--backup-dir` retention seed (kimi adopts it, but gemini's framing — "dated siblings, capped per run" — is clearer).
- The #10 launch-behaviour rehearsal as a real-device pre-implementation gate (kimi adopts it, but gemini's framing — "before the config file ships" — is more precise).

---

## Remaining defect in kimi's plan

The **session-zombie reproducer** (gate 3) must pass before the lifecycle gate is justified to the maintainer. The corpus proves the race exists (`es/SaveState.cpp` + `autostart/102-cloud-saves`), but the fix — the lifecycle gate — is structural, not a timing hack, and the maintainer must see the shipped loss reproduced before accepting the gate. If the reproducer fails, the gate is not earned and the shipped race remains.

---

## Summary

**kimi's plan is the foundation to build on.** It is safe, grounded, implementable, sequenced, and honest. The amendment is satisfied by a documentation change, the dissent is absorbed, and the one remaining defect is a hardware gate, not a design flaw.