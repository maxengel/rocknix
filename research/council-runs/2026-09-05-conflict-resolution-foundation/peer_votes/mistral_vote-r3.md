I vote for **kimi**.

## Reasoning

**kimi's plan is the safest and most buildable foundation.** It protects player progress rigorously, grounds every claim in the embedded corpus, and sequences the work so cheap experiments run before expensive building. The other three plans fall short in critical ways:

- **claude** builds a retention store that cannot drive the later picker (a stamp-keyed path mirror), and its exit-path evidence-read is not gated by the budget — it may silently overwrite an unread head if the read is too expensive. The discard store's design violates the maintainer's requirement that the V1 store must be readable by the future "time machine" tool.
- **gemini** refuses to propagate ordinary deletions, abandoning a capability the maintainer explicitly preserved. Its ping probe repeats the liveness category error the rule file names, and its manifest-last publication is not a commit point — an interrupted or concurrent writer can still corrupt state.
- **gpt** over-scopes with a protected-publication protocol in V1, which is not earned on a five-second path under a one-player model. Its cached-manifest exit overwrite misses the primary offline-fork scenario, and its retention store is not proven to survive the amendment's reader test.

**kimi's plan needs only one change to satisfy the amendments:** the discard store's `operation.json` must include the screenshot's sha256 and path, so the future picker can render it without consulting any manifest or log. The plan already says the PNG travels with the state; this is a small schema addition, not a design change.

## What kimi needs

- Add `screenshot_sha256` and `screenshot_path` to `operation.json` (the PNG's hash and its sync-root-relative path).
- Keep the retention count at 3 per unit (the maintainer accepted "bounded by a count").
- The deterministic auto KEEP BOTH rule (this device keeps `.state.auto`; the cloud copy becomes a numbered slot) is already aligned with the maintainer's "get the user going as quickly as possible."

## Dissent — what the losing plans have that kimi does not fully absorb

- **claude's equality-writes-agreement** (schema §3.1): kimi adopts it, but claude's schema refinement (D-CLOUD-032) is sharper — it explicitly binds agreement to the sync context and makes equality a first-class agreement writer. This is a register row, not a design gap, and it should be adopted as written.
- **gpt's split-root import distinction** (§2.7): kimi preserves the one-way import into `RESTOREPATH` as a separate operation, but gpt's wording is clearer — "two-way reconciliation refuses a split-root configuration as a two-way sync; an explicit download to the separate restore root remains a one-way import." This should be carried into the final synthesis.
- **gemini's churn trace as a convergence gate** (§3.5): kimi's cloud-side compaction terminates the renumber-churn loop, but gemini's three-pass fixture is a stronger proof. The fixture should be kept as the acceptance test for D-CLOUD-030's compaction claim.

## Remaining defect in kimi's plan

The lifecycle gate's acquisition order (§3.2) must be proven to survive ES dying while the emulator lives. The corpus does not show whether ES's `ProcessStartInfo` closes inherited fds; if it does, the gate must be held by a wrapper that survives ES's death. This is Gate 3's zombie-auto reproducer, and it must pass before the gate is built.