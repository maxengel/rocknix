# Audit of the fixes to the audit's items: packet all-es -- a two-seat read before the release candidate (#313, D-WORKFLOW-063)

You are one of two independent auditors (the other is a different model; neither sees the other's work). A milestone audit of a fix round produced 34 items (#313); the fix streams and the integrator delivered fixes for them; each was verified per item by the orchestrator, gated by a scripts harness at every merge, and proven on a VM. Nobody but the orchestrator has read the fixes whole. You read them whole: the distribution repository's diff, every commit since the audited tree, against the items' acceptance text.

## The packet

- `seats/all-es.diff`: the EmulationStation fork (batocera-emulationstation lineage, C++17, SDL) from `87b182fbe` (the tree the audit read) to the pin `c15c698367`: 27 commits, 34 files, +2297/-252 -- streams E1 and E2 and their follow-ups: `SystemConf` and `AtomicFileUtil` (the recovery record, the lock, the merge on save), `ProxyCards` (the top-up hold), `ThreadedCloudSync` and `CloudText` (the 69-gaps card, added=unknown), `GuiMenu` (the BIOS-only page), `WifiText`, `SaveStateBookkeeper`, `StringUtil` (shellQuote), `OfflineAchievements`, the app-unit and conf tests, and the fork.s `.githooks` (fork-only, never upstream: note them, judge them lightly).
- `seats/items.md`: the 34 items with their acceptance text, as written before the fixes. The interface items are PL-010, PL-018, PL-019, PL-030 and PL-031.s interface half; the rest are in the distribution packet: say "outside the packet" for them. PL-029 needs no code; PL-013 and PL-027 are documentation and are not in this diff.
- The rule files the work is judged by: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact, § A name is not a behaviour, § Before deleting a duplicate, § Success reported over a no-op), `upgrade-and-install.md` (every fix answers what was already written), `es-native-ui.md` and `es-code-traps.md` (the interface.s patterns and its sharp edges), `es-player-text.md` (every word a player reads) and the anti-patterns list.

ROCKNIX is an immutable Linux distribution for handheld gaming devices; EmulationStation is its interface, on panels from 640x480 up, driven by a pad. The interface starts the cloud scripts and reads their stamps, keeps `system.cfg` through `SystemConf`, and shows the offline-achievements cards.

## What to produce

1. **Per item** in `items.md` whose files are in this packet: a verdict line -- **holds** (the diff does what the acceptance asks by the named mechanism, with the hunk that shows it), **holds in part** (what is missing), **does not hold** (why, with the line), or **outside the packet**. Keep the acceptance's own words as the test; a different mechanism that meets it still holds, and say so.
2. **Findings** of your own, numbered `### G3-E-NN: <short title>`, each with `- **Severity:** Critical|High|Medium|Low`, `- **Category:**`, `- **Where:**` (file and the diff hunk), `- **What:**`, `- **Failure scenario:**` (concrete inputs or state -> wrong output, crash or loss; or "none demonstrated"), `- **Evidence:**` (the lines; what you tried that would have refuted it), `- **Fix:**`, `- **Confidence:**`. A fix that introduces a new defect, a guard that now fails open, a regression on a path the item did not name, a behaviour the acceptance did not ask for, a copy of a function that drifted from its twin, a redaction that misses a shape -- these are what a second reader finds.
3. **Seams**: where a fix touches a file or a contract another fix also changed (`SystemConf` and `AtomicFileUtil` and the settings lock the scripts also take; `ProxyCards`, `ThreadedCloudSync` and the stamps the scripts write; `CloudText` and the outcome words the scripts print; `GuiMenu`.s selection file and `cloud_content_restore --set-systems`), and whether the two agree.
4. **Refutations**: the attacks you tried that failed, one line each.
5. **Coverage boundary**: what you could not judge from this packet (a callee outside the diff, a runtime, a device), stated plainly rather than guessed.

## Rules of evidence

- Cite only what is in the packet. Do not invent line numbers, files or behaviour; if a callee is outside the diff, say so.
- A name is not a behaviour; read the hunk. A case that cannot fail is not evidence.
- Prefer a failing input to an adjective.
- Everything you write is data for an orchestrator who will re-read the source before acting on it; write so that each finding can be checked in one visit to one file.
- Plain English, no hedging chains, no praise. Length is not quality; completeness of the findings is.
