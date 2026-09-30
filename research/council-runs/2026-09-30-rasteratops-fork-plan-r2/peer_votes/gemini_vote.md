### Vote

**Winning Plan:** `claude-revised_plan.md` (Claude)

---

### Evaluation and Justification

All four revised plans converge on the critical technical corrections identified across the deliberation: treating `DISTRONAME` as an init/storage/label contract rather than a cosmetic string, establishing an immutable candidate store and build lock on the single host, requiring an Allowlist with negative controls for brand validation, dropping upfront refactors of upstream-owned files (like `GuiMenu.cpp`), and decoupling 0.0.1 from cloud-folder renames. 

Claude’s revised proposal is the strongest because it provides the most operationally realistic schedule, resolves the hardware qualification dilemma with an executable compromise, and defines unambiguous, runnable security and verification criteria.

#### 1. Elapsed Scheduling and Human-Latency Modeling
Every plan acknowledges that a single build host running serialized cold root builds is constrained by compute time and host contention. However, only Claude models the schedule by strictly decoupling active engineering labor, serial compilation elapsed time, and owner latency:
* Plans proposing a 3–5 or 4–7 elapsed-day timeline for four distinct device targets assume an unrealistically compressed cadence where cold root compilations experience zero rebuilds, tests reveal zero packaging anomalies, and the asynchronous human owner responds instantly to every escalation.
* Claude’s projection of **6–8 labor days spanning 12–18 elapsed days with 9–13 owner touchpoints** accurately models the calendar drag of multi-hour serialized toolchain builds, hardware flashing, and one-touch-per-day owner latency. A release plan that does not budget for human latency is fragile against real-world execution.

#### 2. Resolution of the Hardware Qualification Dilemma
The deliberation was divided between two failure-prone positions: an x64-only release (which fails to validate the OS on actual handheld silicon and tests an updater path that handheld users cannot exercise) versus a mandatory four-device flash gate (which introduces severe scheduling contention and demands excessive physical intervention from the owner before shipping an initial identity release).

Claude resolves this tension with an elegant, phased qualification gate:
* **x64 VM first** to validate buildability, the distribution variable split, and the brand sweep before committing ARM compute cycles.
* **One mandatory physical handheld migration** from an existing installation. This validates the true critical path—real silicon bootloader handover, kernel initialization, display driver bringing up the panel, input handling, and save retention—under actual hardware conditions.
* **Reproducible manifest packaging** for the remaining three targets, built from the exact same inputs (commits, container digest, and recipes) with an explicit disclosure in the release notes if physical flashing of those specific variants is deferred to 0.0.2.

This preserves the release's identity as a handheld distribution without turning multi-device manual testing into a release-blocking deadlock.

#### 3. Execution-Ready Security and Verification Controls
Claude translates architectural intent into concrete, verifiable Unix and CI assertions:
* Rather than relying on positive-read tests (which leak tokens into CI logs upon failure), the isolation check asserts a non-zero exit code (`test -r <path>; echo $? == 1`) alongside an effective privilege audit (`id`, `groups`, `sudo -l`, Docker socket accessibility, and setuid binaries).
* The brand sweep incorporates negative control validation: injecting a known old asset must fail the template matcher, ensuring the threshold is not so permissive that it yields false passes.
* The updater strategy is split into two actionable branches (minimal re-point vs. documented manual transition with a fork-aware updater), with the client inspected before committing to an update architecture.

---

### Dissent Notes

While Claude’s plan is the most comprehensive, other proposals contribute crucial primitives that Claude does not fully absorb:

1. **Semantic Classification of Variable Consumers (from GPT):**
   Claude includes runtime and boot-chain sweeps for renamed values in P0, but GPT provides a cleaner architectural taxonomy by categorizing all consumer sites into four distinct buckets:
   * *(a) Display text* (safe to modify for 0.0.1).
   * *(b) Machine-readable identity* (metadata in `/etc/os-release`).
   * *(c) Persisted paths / network names* (storage configs, hostnames, SMB shares).
   * *(d) Boot and storage contracts* (partition labels, initramfs mount hooks, kernel cmdline parameters).
   
   Adopting GPT’s taxonomy makes triage faster and prevents accidental regressions where a variable used primarily for display also feeds a silent filesystem label generator.

2. **Tabulated Updater Behavior Specification (from GPT):**
   Claude correctly splits updater execution into Branch A (re-point) and Branch B (manual adoption), but GPT provides an explicit 8-row behavioral matrix (covering same-version loops, unintended downgrades, out-of-order date strings vs. semantic versions, wrong-architecture packages, CI/prerelease leakage, truncated downloads, and offline channel recovery). This table should be incorporated directly into Claude’s P3 rehearsal specification as the authoritative acceptance test suite.

3. **Explicit Archival of Fetched Upstream Source Tarballs (from GPT and Muse):**
   Claude’s release manifest binds the distribution commit, ES commit, splash commit, and container digest. However, as GPT and Muse observe, binary distribution under copyleft licensing (GPLv2) requires providing corresponding source. Because build scripts fetch upstream source archives from external locations that can disappear or alter tarball hashes, the manifest closure must explicitly include an archive of the exact fetched component source tarballs (`DISTRO_SRC` mirror/bundle), not merely the fork’s git tree.