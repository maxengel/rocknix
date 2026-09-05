I have reviewed the four revised approaches. Here is my analysis of the remaining substantive disagreements, the load-bearing claims that must be verified, and the elements each plan uniquely contributes.

---

## 1. Real disagreements and how to settle them

### 1.1 Bisync's role

**Disagreement:**
- `claude-revised_plan.md` and `kimi-revised_plan.md` demote bisync to a diagnostic tool or candidate transfer engine, pending the spike.
- `gemini-revised_plan.md` does not address bisync's role explicitly.
- `gpt-revised_plan.md` does not commit to bisync as the primary detector, but treats it as a required conformance experiment.

**Settlement path:**
The spike is the arbiter. The corpus does not establish bisync's behaviour under `--conflict-resolve none` (does it rename, skip, or error?), nor whether it can accept external resolution decisions without `--resync`. The spike must run against both WebDAV and Dropbox with these fixtures:
- compressed state + PNG
- equal-size SRAM mutation
- preserved-mtime mutation
- rename
- deletion
- genuine fork
- first run
- filter change
- interrupted run
- external equalization after a manual apply

**Prediction:** bisync will fail at least one of the following: hashless backends, external resolution without `--resync`, or the exit budget. The manifest test is the only detector that satisfies the corpus's constraints.

---

### 1.2 Deletion propagation

**Disagreement:**
- `claude-revised_plan.md` and `kimi-revised_plan.md` require explicit tombstones for deletion propagation, with mass-deletion guards.
- `gpt-revised_plan.md` treats absence as deletion intent only with a verified tombstone.
- `gemini-revised_plan.md` does not address deletion propagation explicitly.

**Settlement path:**
The cardinal rule ("preserve player progress") forbids inferring deletion from absence. The corpus shows absence is not intent (interrupted layout change, unmounted storage, emulator temp rename, external client). The only safe V1 posture is **no deletion propagation**. Tombstones and mass-deletion guards are additive in V2.

---

### 1.3 Concurrency contract

**Disagreement:**
- `claude-revised_plan.md` and `gpt-revised_plan.md` propose protected publication areas and resolution receipts to preserve competing heads.
- `kimi-revised_plan.md` strengthens the pre-upload check and audit, but acknowledges a residual window.
- `gemini-revised_plan.md` does not address concurrency explicitly.

**Settlement path:**
The one-player-never-concurrent model cannot guarantee linearizable synchronization across devices. The minimum contract is:
1. Recheck the remote object immediately before overwrite.
2. Never overwrite a remote object that differs from agreement without first holding its bytes.
3. Audit every overwrite with before/after hashes.
4. Document the residual window.

**Prediction:** The protected publication area is the only mechanism that preserves competing heads. The pre-upload check alone cannot close the window.

---

### 1.4 Manifest amendments

**Disagreement:**
- `claude-revised_plan.md`, `gpt-revised_plan.md`, and `kimi-revised_plan.md` propose targeted schema amendments (origin sub-object, screenshot binding, group key, parse-failure rule, identity-collision rule).
- `gemini-revised_plan.md` does not address schema amendments explicitly.

**Settlement path:**
The corpus shows the schema lacks:
- A way to record the producer's provenance for a materialized version.
- A way to bind the thumbnail to the state.
- A way to group multi-file saves.
- A rule for unparseable manifests.
- A rule for identity collisions.

**Prediction:** The amendments are load-bearing. Without them, provenance dies at re-slot, the picker shows wrong pictures, and multi-file saves split.

---

### 1.5 D-CLOUD-029 (no `--update` stopgap)

**Disagreement:**
- `claude-revised_plan.md` and `kimi-revised_plan.md` retain D-CLOUD-029 (no `--update` stopgap).
- `gemini-revised_plan.md` argues for an immediate `--update` stopgap.
- `gpt-revised_plan.md` argues that `--update` is unsafe due to the boot-restore clobber.

**Settlement path:**
The embedded `102-cloud-saves` script runs `cloud_restore --yes --method=copy --update` at boot, before the backup. If the exit path skips uploading, the next boot's restore overwrites the local progress. `--update` is unsafe in both directions.

**Prediction:** D-CLOUD-029 stands. The lossless interim posture (disable the boot pair and SYNC row, leaving only the exit upload) is the only safe configuration until the wizard ships.

---

## 2. Load-bearing claims that must be verified

### 2.1 ES primitives

**Claim:** `getNextFreeSlot()` returns `-99` for an auto-only repository; `copyToSlot()` ignores copy/rename return values and returns `true` unconditionally.

**Verification:** Read `es/SaveStateRepository.cpp` and `es/SaveState.cpp`. The auto-only case is source-visible; the copy/rename behaviour requires testing against an unwritable destination.

**Status:** Verified in the corpus (`gpt-analysis.md` §1.8; `claude_peer_review.md` §3).

---

### 2.2 Manifest transport

**Claim:** The exit upload republishes a stale cached foreign manifest over the producer's newer one.

**Verification:** Fixture: plant a stale foreign manifest locally, run the exit pass, assert the remote's copy unchanged.

**Status:** Not verified. The corpus shows the allowlist admits `manifest-*.json` (`+ /savestates/**`), but does not show the exit upload's behaviour.

---

### 2.3 Bisync behaviour

**Claim:** Bisync's behaviour under `--conflict-resolve none`, interruption, and filter change.

**Verification:** Spike against WebDAV and Dropbox with the fixtures in §1.1.

**Status:** Not verified. The corpus contradicts itself on bisync's behaviour.

---

### 2.4 Local backend-hash computation

**Claim:** `rclone hashsum <backend>` computes backend-native hashes locally on the device.

**Verification:** `rclone hashsum dropbox` a state on the device vs. `lsjson --hash` of its uploaded copy.

**Status:** Not verified. General knowledge, not corpus.

---

### 2.5 Core-set divergence

**Claim:** Core sets differ per target.

**Verification:** Diff `LIBRETRO_CORES` across targets in the tree.

**Status:** Not verified. The corpus does not establish this.

---

### 2.6 Staging and union-fetch cost

**Claim:** Staging and union-fetch cost on the maintainer's real library.

**Verification:** Shadow mode on the maintainer's devices.

**Status:** Not verified. The corpus does not establish this.

---

### 2.7 480×320 usability

**Claim:** Real thumbnails are recognizable on the RG351M.

**Verification:** Layout at 480×320 first; real-thumbnail recognition test on the RG351M.

**Status:** Not verified. The corpus does not establish this.

---

## 3. Elements each plan uniquely contributes

### 3.1 `claude-revised_plan.md`

1. **The boot-sync vs. game-session race.** The boot sync backgrounds itself and can overlap with active gameplay, uploading transient `.bak` files. This is the most consequential gap in the corpus.
2. **The reflash case.** A reflashed device regenerates the same identity and finds its own backups again. The manifest must download before first capture.
3. **The discard store.** `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` is the only mechanism that bounds discarded-save retention without sync-tree contamination.
4. **The one-writer rule.** The save tree has one writer at a time; the boot sync moves into ES.

---

### 3.2 `gemini-revised_plan.md`

1. **The `#10` launch-behaviour rehearsal.** Shipping `es_savestates.cfg` forces `racommands = false` and flips `autosave`/`incremental` defaults — a launch-behaviour migration, not a config change.
2. **The bisync spike reframing.** Bisync is a candidate transfer engine, not a detector. The spike's fixtures double as the adversarial suite for the manifest detector.

---

### 3.3 `gpt-revised_plan.md`

1. **The manifest/content test as authority.** The detector is stateless and manifest-based, not bisync. This is the only mechanism that satisfies the corpus's constraints.
2. **The staging mirror.** Each sync pass mirrors the remote's saves tree into `/storage/.cache/cloud_sync/stage/`, then sha256-hashes staged and local files. This is the only mechanism that learns C by content on every backend.
3. **The typed outcomes.** Normalized result protocol; conflicts-pending is a state file plus a menu badge; per-phase failures propagate.

---

### 3.4 `kimi-revised_plan.md`

1. **The resolution receipt.** A decision bound to the exact operand hashes and resulting locations prevents ping-pong.
2. **The discard-store scope.** `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` is outside the sync tree, so no allowlist rule is needed.
3. **The headless handoff.** The exit sync never opens the wizard over a player who just finished a game; it records conflicts and the card says so.

---

## 4. Elements that should not be built

### 4.1 Over-engineering

1. **Semantic binary merging.** The corpus does not establish that savestates are semantically mergeable. V1 does not need it.
2. **Vector clocks for the whole library.** The corpus does not establish that the whole library needs causal ordering. V1 does not need it.
3. **A shared database.** The corpus does not establish that a shared database is needed. V1 does not need it.
4. **Progress heuristics selecting a winner.** The corpus does not establish that progress heuristics are reliable. V1 does not need them.

---

### 4.2 Unsafe assumptions

1. **Bisync as the detector.** The corpus does not establish that bisync can accept external resolution decisions without `--resync`.
2. **Size-plus-relist certification.** The corpus shows this is the #53 failure shape.
3. **Absence as deletion intent.** The corpus shows absence is not intent.
4. **The pre-upload check alone as concurrency mitigation.** The corpus does not establish that it closes the window.

---

## 5. Which plan I would build from, and what I would take from the others

I would build from `claude-revised_plan.md`. It is the only plan that:
1. Addresses the boot-sync vs. game-session race.
2. Preserves the reflash case.
3. Bounds discarded-save retention without sync-tree contamination.
4. Enforces the one-writer rule.
5. Demotes bisync to a diagnostic tool.
6. Requires explicit tombstones for deletion propagation.
7. Proposes protected publication areas and resolution receipts for concurrency.

From `gpt-revised_plan.md`, I would take:
1. The staging mirror as the substrate for detection, wizard screenshots, KEEP BOTH materialization, and discard-store population.
2. The typed outcomes and normalized result protocol.

From `kimi-revised_plan.md`, I would take:
1. The resolution receipt to prevent ping-pong.
2. The discard-store scope and location.
3. The headless handoff and conflicts-queue badge.

From `gemini-revised_plan.md`, I would take:
1. The `#10` launch-behaviour rehearsal and deferral.

---

## 6. What changed my mind since my own revision

1. **The boot-sync vs. game-session race.** I did not consider that the boot sync backgrounds itself and can overlap with active gameplay. This is the most consequential gap in the corpus, and `claude-revised_plan.md` is the only plan that addresses it.
2. **The reflash case.** I did not consider that a reflashed device regenerates the same identity and finds its own backups again. The manifest must download before first capture.
3. **The discard store.** I did not consider that `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` is the only mechanism that bounds discarded-save retention without sync-tree contamination.
4. **The one-writer rule.** I did not consider that the save tree has one writer at a time; the boot sync moves into ES.

---

## 7. The build order

1. **Repair `tools/cloud-round-trip`.** It overwrites `rclone.conf` before asserting the first remote, never restores it, and carries assertions that cannot pass against the embedded uploader.
2. **Run the bisync spike.** Settle bisync's behaviour under `--conflict-resolve none`, interruption, and filter change.
3. **Run the session-zombie experiment.** Startup sync on, boot, launch from a numbered slot within 30 s, let the boot sync finish, exit, list the remote for `.bak` and extra slot files.
4. **Run the ES primitive failure paths.** Auto-only allocation → −99; `copyToSlot` against an unwritable destination → reported success vs. actual bytes; refresh invalidation.
5. **Run the local backend-hash experiment.** `rclone hashsum dropbox` a state on the device vs. `lsjson --hash` of its uploaded copy.
6. **Run the core-set divergence check.** Diff `LIBRETRO_CORES` across targets in the tree.
7. **Run the round-trip full run.** GENERIC_X64 VM, WebDAV and MinIO, with the new steps: manifest transport, two-device both-sides-changed, deletion-resurrection, wrong-clock, foreign-manifest republication, discard-store exclusion, no-allowlist `RCLONEOPTS`.
8. **Run the shadow-mode census.** The detector runs log-only for a fixed window. Outputs: fork rate per kind, verdict distribution, unknown-rate.
9. **Run the 480×320 recognition test.** Real thumbnails on the RG351M.

Build order after the gates: capture (#21) → detector/staging (#22) → wizard (#23) → merge adapter (#24). #10's directory move and #25 follow with their own futros.