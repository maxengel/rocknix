# Audit of the fixes to the audit's items: packet all-distribution -- a two-seat read before the release candidate (#313, D-WORKFLOW-063)

You are one of two independent auditors (the other is a different model; neither sees the other's work). A milestone audit of a fix round produced 34 items (#313); the fix streams and the integrator delivered fixes for them; each was verified per item by the orchestrator, gated by a scripts harness at every merge, and proven on a VM. Nobody but the orchestrator has read the fixes whole. You read them whole: the distribution repository's diff, every commit since the audited tree, against the items' acceptance text.

## The packet

- `seats/all-distribution.diff`: the distribution repository from `1b0d233657` (the tree the audit read) to `02546235c1`, on the upstream-bound paths (`packages/`, `projects/`, `config/`, `scripts/`, `distributions/`): 41 files, +2240/-577. It carries the streams' merges (A, B, C and its follow-up, D, F2) and the integrator's commits, and two things that are not the fork's to judge but are in the range: an upstream merge (`4c291eec63`: RK3326/RK3566 batteryplus off, a kernel config line, the linux recipe's parallel-build fix, rocknix-abl's sha256, the image without initramfs) and the RetroAchievements proxy bumped to its author's head (`1b309ea8d3`: `package.mk`, the patches, the ctl). Note them; do not audit upstream's own code.
- `seats/items.md`: the 34 items with their acceptance text, as written before the fixes. The interface items (PL-010, PL-018, PL-019, PL-030, PL-031's interface half) are in the EmulationStation packet, not this one: say "outside the packet" for them. PL-029 needs no code; PL-013 and PL-027 are documentation and are not in this diff.
- The rule files the work is judged by: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact, § A name is not a behaviour, § Before deleting a duplicate, § Success reported over a no-op), `upgrade-and-install.md` (every fix answers what was already written), `rclone-cloud-sync.md` (the cloud scripts' contract) and the anti-patterns list.

ROCKNIX is an immutable Linux distribution for handheld gaming devices, built with a LibreELEC-family cross-compilation system; these scripts run under busybox on the device. The cloud sync moves a player's saves and settings with rclone; `backuptool` writes and restores the settings archive; `001-functions` is the shell library every script sources; the proxy serves RetroAchievements offline.

## What to produce

1. **Per item** in `items.md` whose files are in this packet: a verdict line -- **holds** (the diff does what the acceptance asks by the named mechanism, with the hunk that shows it), **holds in part** (what is missing), **does not hold** (why, with the line), or **outside the packet**. Keep the acceptance's own words as the test; a different mechanism that meets it still holds, and say so.
2. **Findings** of your own, numbered `### G3-D-NN: <short title>`, each with `- **Severity:** Critical|High|Medium|Low`, `- **Category:**`, `- **Where:**` (file and the diff hunk), `- **What:**`, `- **Failure scenario:**` (concrete inputs or state -> wrong output, crash or loss; or "none demonstrated"), `- **Evidence:**` (the lines; what you tried that would have refuted it), `- **Fix:**`, `- **Confidence:**`. A fix that introduces a new defect, a guard that now fails open, a regression on a path the item did not name, a behaviour the acceptance did not ask for, a copy of a function that drifted from its twin, a redaction that misses a shape -- these are what a second reader finds.
3. **Seams**: where a fix touches a file or a contract another fix also changed (`001-functions`'s redaction and its lock; `backuptool`'s lists, marks and archive checks; the rclone scripts' readers of `cloud_sync.conf` and their outcome words; the proxy's ctl and its stamps; `chksysconfig`'s mount check), and whether the two agree.
4. **Refutations**: the attacks you tried that failed, one line each.
5. **Coverage boundary**: what you could not judge from this packet (a callee outside the diff, a runtime, a device), stated plainly rather than guessed.

## Rules of evidence

- Cite only what is in the packet. Do not invent line numbers, files or behaviour; if a callee is outside the diff, say so.
- A name is not a behaviour; read the hunk. A case that cannot fail is not evidence.
- Prefer a failing input to an adjective.
- Everything you write is data for an orchestrator who will re-read the source before acting on it; write so that each finding can be checked in one visit to one file.
- Plain English, no hedging chains, no praise. Length is not quality; completeness of the findings is.
