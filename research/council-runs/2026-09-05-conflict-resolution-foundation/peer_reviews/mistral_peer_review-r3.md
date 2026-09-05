I have reviewed the five revised approaches for the cloud-save conflict resolution foundation in ROCKNIX. Below is my analysis, focusing on the real disagreements, load-bearing claims, and what each plan uniquely offers.

---

## 1. Real Disagreements and How to Settle Them

### 1.1 Deletion Propagation
**Disagreement:** Whether deletions should propagate in V1, and if so, how.
- **`claude-revised_plan-r2.md` and `kimi-revised_plan-r2.md`:** Propagate only recorded deletions (ES deletions, renumbers, compactions, wizard choices) as moves into dated siblings. Unexplained absence fails closed.
- **`gemini-revised_plan-r2.md` and `mistral-revised_plan-r2.md`:** Never propagate deletions in V1; treat absence as a fail-closed anomaly.
- **`gpt-revised_plan-r2.md`:** Propagate only version-specific retirements with receipts, never deletions inferred from absence.

**Settlement:** The churn trace in `kimi-revised_plan-r2.md` (C1) proves that pure resurrection cannot terminate. The receipts-and-siblings mechanism is the minimal solution that converges. The fail-closed half of `gemini` and `mistral`'s argument is preserved: unexplained absence fails closed. The residual is bounded churn, which is annoying but never lossy.

**Experiment:** The churn-termination fixture (cloud-only `state5` onto `{0,1,2}`; download; launch and exit; sync twice; assert one copy per side, no churn, the retired cloud copy in the dated sibling).

---

### 1.2 Concurrency Contract
**Disagreement:** Whether `--backup-dir` in both directions is sufficient for recoverability, or if a protected-publication protocol is needed.
- **`claude`, `gemini`, `kimi`:** `--backup-dir` in both directions is sufficient for V1 under the one-player model.
- **`gpt`:** A protected-publication protocol is needed for linearizability.
- **`mistral`:** The pre-upload check alone cannot close the window.

**Settlement:** The one-player model does not earn a two-phase commit on a 5-second path. `--backup-dir` is the chosen mechanism, with the residual stated honestly: recoverability, not prevention. The race fixture (§11, gate 7) will prove whether `--backup-dir` preserves intervening heads on Dropbox and WebDAV.

**Experiment:** The two-H700 race fixture (interleave publications; kill after each destructive stage; assert both heads present, one canonical, one siblinged).

---

### 1.3 How C's Bytes Are Obtained
**Disagreement:** Whether to use a full staging mirror or candidate-scoped reads.
- **`kimi` and `claude`:** Candidate-scoped reads with the full stage as a hashless fallback.
- **`gpt`:** Full staging mirror as the default.
- **`mistral`:** Metadata-only detector.

**Settlement:** The full staging mirror is blind to same-size changes on hashless backends (the #53 shape). Candidate-scoped reads are the correct default, with the full stage as a fallback for backends offering neither hash nor modtime. The shadow census (§11, gate 8) will measure the cost of the fallback mode.

**Experiment:** The same-size WebDAV fixture (change a cloud SRAM preserving size; the classifier must not conclude "cloud unchanged").

---

### 1.4 Bisync's Role
**Disagreement:** Whether bisync should be the detector or a candidate transfer engine.
- **`claude` and `kimi`:** Bisync is a candidate transfer engine pending the spike.
- **`gpt` and `gemini`:** Bisync is demoted; the classifier is ours regardless.
- **`mistral`:** Bisync is the detector.

**Settlement:** The problem statement listed bisync-as-detector as the approach under judgement, but no register row made it binding. The spike (§11, gate 2) will decide whether bisync earns the bulk-transfer role for non-conflicting units. The classifier is ours regardless.

**Experiment:** The bisync spike matrix (§11, gate 2).

---

### 1.5 #10's Per-Core Directories
**Disagreement:** Whether #10 should be deferred.
- **`kimi` and `gpt`:** Defer #10 to its own futro, with proof obligations and a real-device rehearsal as gates.
- **`claude` and `gemini`:** Keep #10 in the drop, sequenced last.
- **`mistral`:** #10 is unnecessary.

**Settlement:** Shipping `es_savestates.cfg` is a launch-behaviour migration, not a config change. The wizard does not need the directory, but the flat layout's local cross-core overwrite is pre-existing shipped behaviour. #10 gets its own futro, and the rehearsal gate ensures the launch behaviour is preserved.

**Experiment:** The #10 launch-behaviour rehearsal (§11, gate 5).

---

### 1.6 Wizard Trigger, Retention Default, Cancellation, Auto KEEP BOTH, Kid Mode
**Settlement:** Queue-and-badge trigger (IA rev 5); retention ON with count 3 (register row); gpt's precise cancellation sentence; the resume-side sub-choice for auto KEEP BOTH; gpt's kid/kiosk rule over mistral's reachability requirement.

---

## 2. Load-Bearing Claims That Need Testing

| Claim | Experiment | Outcome |
|---|---|---|
| `--backup-dir` preserves the intervening head under a two-writer race | Race fixture (§11, gate 7) | If pass: ship as designed. If fail: adopt gpt's protected-publication protocol before multi-device ships. |
| The exit upload overwrites the cloud head of a fork | Cheap counterexample (§11, gate 1) | Corpus-settled; no experiment needed. |
| The session-zombie resume-point loss | H700 reproducer (§11, gate 3) | Corpus-traced; the lifecycle gate is the fix. |
| Foreign-manifest republication | Round-trip fixture (§11, gate 1) | Corpus-settled; the fixture verifies the hazard. |
| Auto states are the commonest conflict | Shadow census (§11, gate 8) | The wizard treats `kind: auto` as a resume-point decision regardless. |
| 480×320 thumbnails are recognizable | RG351M recognition test (§11, gate 9) | If fail: single-column compare as fallback. |
| `--filter` vs `--filter-from` ordering | Dry run (§11, gate 0) | If `--filter` cannot be ordered ahead, use `--exclude`/`--include`. |
| `rclone hashsum <backend>` computes backend-native hashes locally | Device experiment | Not a dependency; the exit path can defer to the next full pass. |

---

## 3. What Each Plan Uniquely Offers

### `claude-revised_plan-r2.md`
- **Intent-recorded deletion receipts propagated as moves into dated siblings.** This is the minimal mechanism that terminates D-CLOUD-030's compaction.
- **The reflash bootstrap.** A reflashed device regenerates the same `cloud_device_id` and seeds from its own previous manifest before its first capture republishes.
- **The lifecycle gate with fixed acquisition order.** This closes the boot-sync vs gameplay race structurally.

### `gemini-revised_plan-r2.md`
- **The `--backup-dir` retention seed.** This is the recoverability mechanism adopted by `claude` and `kimi`.
- **The #10 launch-behaviour rehearsal as a real-device pre-implementation gate.** This ensures the launch behaviour is preserved after shipping `es_savestates.cfg`.
- **The one-sentence D-CLOUD-029 confirmation.** "The stopgap merely moves the clobber from game-exit to boot."

### `gpt-revised_plan-r2.md`
- **The unit-level member-map classifier.** This is the correction to `kimi`'s per-file aggregation (C6).
- **The D-CLOUD-030 clarification.** Compaction concerns numbered states in one game/core repository, idle, after verified copies; never collapses an auto resume point into a numbered slot.
- **The `makeStateFilename` parent-derivation finding.** A staged-in-/tmp state would merge into /tmp — stage in the real save directory under a temp name.
- **The eight #24 acceptance criteria.** Especially "standalone-emulator states never allocate" (`isEnabled` requires `retroarch`).

### `kimi-revised_plan-r2.md`
- **The ops journal + receipts.** This makes `replaces` correct across the rename-then-edit sequence.
- **The discard store outside the sync tree.** This avoids sync-tree contamination and requires no allowlist exclusions.
- **The shadow census.** This measures fork rate per kind, verdict distribution, unknown rate, and the exit-path cost in spawns, round trips, and seconds.
- **The ordered hardware gates with a defined shadow census.** This ensures the foundation is proven before it is built.

### `mistral-revised_plan-r2.md`
- **The out-of-scope fence.** This is a builder needs it as much as the plan.
- **The IA-text corrections for rev 5.** The "checked, not assumed" paragraph is wrong about `getNextFreeSlot()` for the auto-only case.
- **Move observation as a first-class mechanism.** This is the correction to `gpt`'s reconstruction-after approach.

---

## 4. What Should Not Be Built

- **A protected-publication protocol in V1.** The one-player model does not earn it on a 5-second path.
- **A separate apply journal beyond the frozen plan with per-unit status.** The frozen plan is the journal.
- **The full staging mirror as a default mode.** It is blind to same-size changes on hashless backends.
- **Semantic binary merging, vector clocks, a shared database, a SQLite history index, a daemon.** These are out of scope for V1.
- **A 99-slot product cap to work around the allocator defect.** The allocator defect is fixed in the adapter.
- **Permanent loser memory as automatic authority.** A deliberately restored file is a new version, not a stigmatized one.
- **Tombstones for hypothetical external writers.** Receipts cover our recorded operations only.
- **A kid/kiosk-mode resolver.** A kid resolving save conflicts destructively is what kid mode exists to prevent.
- **Progress heuristics that select a winner.** The cardinal rule forbids it.

---

## 5. The Plan I Would Build From

I would build from `kimi-revised_plan-r2.md`, with the following additions from the other plans:

1. **From `claude-revised_plan-r2.md`:**
   - The reflash bootstrap.
   - The lifecycle gate with fixed acquisition order.
   - The in-spawn manifest transport filters.

2. **From `gpt-revised_plan-r2.md`:**
   - The unit-level member-map classifier.
   - The D-CLOUD-030 clarification.
   - The `makeStateFilename` parent-derivation finding.
   - The eight #24 acceptance criteria.

3. **From `gemini-revised_plan-r2.md`:**
   - The `--backup-dir` retention seed.
   - The #10 launch-behaviour rehearsal as a real-device pre-implementation gate.

4. **From `mistral-revised_plan-r2.md`:**
   - The out-of-scope fence.
   - The IA-text corrections for rev 5.

---

## 6. What Would Change My Mind

- **The race fixture (§11, gate 7):** If `--backup-dir` does not preserve intervening heads on Dropbox or WebDAV, gpt's protected-publication protocol becomes load-bearing before multi-device ships.
- **The shadow census (§11, gate 8):** If the decision-scoped download set is large on the maintainer's library, the full-stage fallback is priced and accepted for hashless backends only.
- **The bisync spike (§11, gate 2):** If bisync satisfies the contract and materially simplifies full-pass transport, it earns the bulk-transfer role for non-conflicting units.
- **The #10 rehearsal (§11, gate 5):** If the XML path cannot preserve launch behaviour, the appropriate resolver/configuration behaviour is changed deliberately; the naive config is not shipped.

---

## 7. Final Recommendation

Build from `kimi-revised_plan-r2.md` with the additions above. It is the most complete, safest, and most thoroughly tested foundation for cloud-save conflict resolution in ROCKNIX. The ordered hardware gates ensure the foundation is proven before it is built, and the shadow census ensures the design is tuned to the maintainer's real library. The receipts-and-siblings mechanism is the minimal solution that terminates D-CLOUD-030's compaction, and the lifecycle gate closes the boot-sync vs gameplay race structurally. The wizard's queue-and-badge trigger is the correct console-first design, and the discard store outside the sync tree avoids sync-tree contamination.