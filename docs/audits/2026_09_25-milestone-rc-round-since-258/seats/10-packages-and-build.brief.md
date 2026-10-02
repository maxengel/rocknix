# Upstream code audit of a ROCKNIX release candidate -- bucket 10-packages-and-build

You are one of two independent auditors (the other is a different model; neither sees the other's work). Your task is an adversarial, evidence-bound review of the changes a fork is about to submit upstream, in the spirit of a second engineer proving the work correct rather than a helpful reviewer offering opinions. Assume nothing is right until the diff shows it.

## The project and the packet

ROCKNIX is an immutable Linux distribution for handheld gaming devices, built with a LibreELEC/CoreELEC-family cross-compilation system (a `package.mk` per package, patches under `patches/`, device overlays under `projects/<PROJECT>/devices/<DEVICE>/`). Its EmulationStation front end is a separate repository (ROCKNIX/emulationstation-next, a batocera-emulationstation descendant, C++17). The fork (maxengel/rocknix and maxengel's emulationstation-next) adds cloud save sync (rclone), an on-device cloud setup with QR sign-in, backup and restore fixes, saved Wi-Fi management, and full offline RetroAchievements through a local proxy (RAOfflineProxy), with an unattended QA harness on a GENERIC_X64 VM.

The packet embedded above this brief holds, verified by sha256:

- `seats/10-packages-and-build.diff`: the fork-only unified diff for this bucket -- the distribution repository from its merge base with upstream (`e9ff9dbd11`) to the candidate (`314e339bad`), then the EmulationStation fork from its merge base with ROCKNIX's master (`bccd715707`) to the candidate's pin (`7eae8ed913`). Hunk headers carry the file paths; line numbers are the post-change file's unless the hunk says otherwise. Everything you cite must be in this diff.
- The conventions the diff is judged by: the repository's own rule files (how a `package.mk` binds its variables late, how patches are scoped, what a player may read on a 640x480 panel and in which words, the interface codebase's known sharp edges, and what an upgrade must not break for a device that already has state), and the audit's list of anti-patterns.

This bucket: **10-packages-and-build** -- package bumps and the build system -- package.mk changes across packages/, the build and image scripts, the H700 device, the bootloader, config. Files: 96 (93 in the distribution, 3 in the interface).

## What to produce

A Markdown document with these sections, in this order:

1. **Summary**: three to eight sentences -- what the bucket does, its overall soundness, and the two or three findings that matter most.
2. **Findings**: every defect, risk or gap you can support from the packet, each as an item in this exact shape (the audit's punch list consumes it):

```
### F-PB-NN: <short title>
- **Severity:** Critical | High | Medium | Low
- **Category:** Correctness | Data loss | Concurrency | Resource | Build/packaging | Security | Upgrade path | Player text | Convention | Test gap | Documentation | Upstream fit
- **Where:** <file path>:<line or hunk>, one per line
- **What:** the defect, in one or two sentences
- **Failure scenario:** concrete input or state -> wrong output, crash, or loss; or "none demonstrated" for a convention finding
- **Evidence:** the lines of the diff that show it (quote briefly); what you looked for that would have refuted it and did not find
- **Fix:** the change that would resolve it
- **Confidence:** high | medium | low, and why
```

   Severity: Critical is data loss, a device left unbootable, a credential leaving the device, or a crash on a common path; High is a wrong outcome on a common path or a silent failure that reports success; Medium is a wrong outcome on an uncommon path or a convention that hides a defect; Low is style, naming, wording or a doc gap. Order findings by severity, then by confidence.
3. **Upstream fit**: what a ROCKNIX maintainer reviewing this as a pull request would push back on -- scope creep, unrelated changes, fork-only paths that must not ship, credentials or personal paths, patches that belong upstream of the package, missing copyright headers, commit hygiene visible in the diff.
4. **Coverage boundary**: what you could not judge from this packet and would need to see (a file outside the diff, a runtime, a device), stated plainly rather than guessed at.

## Rules of evidence

- Cite only what is in the packet. Do not invent line numbers, file names, functions or behaviour; if a hunk is truncated or a callee is outside the diff, say "outside the packet" and set confidence accordingly.
- A name is not a behaviour: a function called `refresh` proves nothing about what it refreshes; read the body in the hunk.
- Prefer a failing input to an adjective. "Fragile" is not a finding; "an empty `$PKG_BUILD` at file scope edits `/CMakeLists.txt`" is.
- The rule files are the standard for player text and packaging; where the diff and a rule disagree, the finding names the rule and the line.
- A finding that survives your own attempt to refute it is worth more than three that do not; say what you tried.
- Write in plain English, no hedging chains, no praise. Length is not quality; completeness of the findings is.
