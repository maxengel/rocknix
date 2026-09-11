# Council — Step 3: Revised Approach

Having reviewed the embedded corpus and the four peer analyses, I present my revised approach for the save-history delta. 

First, a crucial concession: **I concede the concurrency serialization claim refuted by `gpt-analysis.md`.** The assertion made in earlier rounds that a fresh-head check serializes publishes (or acts as a "cheap compare-and-swap") is false. As `gpt-analysis.md` proved, two devices can pass the head check and publish concurrently; the second overwrites the first's head without retaining it. The delta's retain-before-publish alone does not guarantee recoverability. This revision adopts the necessary backstop to close that data-loss window.

Here is the revised delta, separated into the load-bearing foundation (required for data safety) and refinements, followed by explicit register reopenings and unmeasured hypotheses.

---

## 1. The Load-Bearing Foundation (Data Safety & Concurrency)

These elements must be implemented exactly as described, or the plan will lose player saves or break the time-to-play budget.

**1.1 Closing the Concurrent-Publisher Race (Adopted from `gpt-analysis.md` and `gemini-analysis.md`)**
Because R5 is check-then-write, Device B can overwrite Device A's newly published head (`HA`) without retaining it. When Device A next syncs, it will fetch B's head and overwrite its local `HA`. 
*   **The Rule:** We must implement **retain-before-install on fetch**. Before a one-way fetch or restore overwrites a local save, the reconciler must check if the local loser's hash exists in the cloud `.history/` store. If it does not, the device must upload the local loser to the store before installing the fetched bytes. 
*   *Cost:* One store listing per fetching unit, and a rare small upload when the race actually occurs. This is the cheapest sufficient form (D-CLOUD-034) to guarantee recoverability.

**1.2 Namespace Protection & The Standing Fold (Adopted from `gpt-analysis.md`, `claude-analysis.md`, and `kimi-analysis.md`)**
The shipped `cloud_sync-rules.txt` contains `+ /**/*.srm` and similar rules that match at any depth. An old-image device running a sync-mode backup will match `.history/` members, delete them from the cloud, and move them into `-replaced/`. 
*   **The Rule:** The exclusions `- /.history/**` and `- /README.md` (credited to `mistral-analysis.md`) must be placed at the absolute top of the shipped rules file.
*   **The Standing Fold Migration:** Because user-edited rules files or dormant old-image devices may still execute the destructive sync, migration cannot be a one-shot script. We adopt `kimi-analysis.md`'s standing fold: the reconciler must be permanently path-aware. If it finds members in `-replaced/<stamp>/.history/<unit>/<seq>/`, it folds them back into `Saves/.history/<unit>/<seq>/`, verifies them, and deletes the legacy `-replaced/` folder. The store thus self-heals from old-image damage.

**1.3 Copy, Never Move (Adopted from `gpt-analysis.md` and `kimi-analysis.md`)**
Retain-before-publish must use `copyto`, not a server-side `move`. A server-side move leaves a window where the cloud head is absent. If the subsequent publish fails or is interrupted, the next pass sees an unexplained absence and asks the player a D-CLOUD-037 question. The old bytes must remain at the head until the new bytes are positively verified.

**1.4 MATCH Deletions Must Retain (Adopted from `mistral-analysis.md`)**
The menu map defines MATCH THIS DEVICE TO THE CLOUD as "the only action that deletes." Because MATCH bypasses the standard classifier, its deletions must explicitly execute a copy-then-delete into `.history/` with `reason: deleted`. Otherwise, MATCH permanently destroys the bytes the store exists to protect.

---

## 2. Retention Rules & Scope

**2.1 Per-File Count Keying (Adopted from `claude-analysis.md`)**
D-CLOUD-099 grants history to auto-states so players can recover from accidental overwrites. However, if the retention count (default 3) is keyed per *unit* (game + kind), three exits of auto-state churn will evict the manual slot's retained version. 
*   **The Rule:** The count bound must be scoped per `(unit, member path)` or per `(unit, kind-with-auto-separate)`. This aligns with the player-facing label VERSIONS KEPT PER SAVE and protects the manual slot.

**2.2 Pub-Chain Ordering vs. Untrusted Clocks (Adopted from `claude-analysis.md` and `gpt-analysis.md`)**
Handheld clocks are frequently wrong (`clock_synced: false`). Using time to determine the "oldest" entry for the count/size caps will cause a device with a 1970 clock to instantly evict its own fresh saves.
*   **The Rule:** "Oldest first" must be determined by the publication chain (D-CLOUD-045's `pub` and D-CLOUD-027's `replaces` lineage). Time is for display metadata only. If the chain breaks (e.g., a foreign publisher), fallback to time is permitted but must be marked untrusted.

**2.3 Soft-Cap Semantics (Adopted from `kimi-analysis.md`)**
Because pruning and the 256 MiB size sweep run only on full passes, an exit-only device will overshoot the count and size caps between full passes. The UI and README must not promise a hard ceiling, and the admission ceiling must not block publishes merely because the history store is temporarily oversized.

---

## 3. Time-to-Play & The Exit Path

**3.1 Admission Ceiling Must Count Retain Bytes (Adopted from `mistral-analysis.md`)**
On backends without server-side copy (e.g., SFTP, SMB), retain-before-publish streams through the device. A 30 MB state costs 60 MB of Wi-Fi transit. The exit sync's admission ceiling must weigh the *retain bytes plus the publish bytes*. If a unit exceeds the ceiling, both the retain and the publish must defer to the next full pass.

**3.2 Bounded Fetch for Auto-Heal (Adopted from `kimi-analysis.md` and `mistral-analysis.md`)**
D-CLOUD-100 requires restoring a good copy over a suspect save, which requires a fetch. However, D-CLOUD-046 defines the exit path as push-only. 
*   **The Rule:** We must explicitly amend D-CLOUD-046 to permit *one bounded fetch per suspect unit* on the exit pass. The exit card is exactly where D-CLOUD-098 permits spending the player's attention for a recovery event.

---

## 4. Explicit Register Changes (Reopenings & Amendments)

To implement this delta, the following binding rows must be explicitly reopened or amended by ID:

*   **Reopen #22 Negative Scope (C1):** Amend "no local retention of anything" to require *retain-on-fetch* when a local save is about to be overwritten by a one-way fetch and its hash is absent from the cloud store.
*   **Amend D-CLOUD-042:** Supersede the location clause (the store moves from `Saves-discarded/` to `Saves/.history/`). The legacy split-root refusal clause remains binding.
*   **Amend D-CLOUD-047:** Supersede the deletion retention clause. Interface deletions and MATCH deletions must be retained in `.history/` with `reason: deleted`. Compactions still retain nothing.
*   **Amend D-CLOUD-046:** Refine the exit-path contract to permit one bounded fetch per suspect unit for auto-heal, and require the admission ceiling to count retain bytes.
*   **Amend D-CLOUD-096:** The 90-day age cap must be trust-gated. It applies only to entries whose `decided_at` timestamp was written by a device with `clock_synced: true`. 

---

## 5. Unmeasured Hypotheses (Honesty & Next Steps)

This revised approach relies on the following hypotheses which must be settled on the GENERIC_X64 VM against the #133 QA matrix before shipping:

1.  **Server-Side Copy & Modtime Preservation:** We hypothesize that `copyto` is a zero-device-transit operation on WebDAV/SFTP/SMB. If it is not, the time-to-play budget on the exit path will be severely impacted. We also hypothesize rclone preserves source modtimes on these backends. Both must be measured.
2.  **Rules File Upgrades:** We hypothesize that `cloud_sync_helper` overwrites a user-edited `cloud_sync-rules.txt` on upgrade. If it does not, the `- /.history/**` guard will never reach those devices, making the standing fold migration (1.2) the *only* line of defense. This gap in the corpus must be audited.
3.  **Operation Ledger:** The exact latency of the retain-before-publish transaction (Obtain head evidence → Copy to `.history/` → Verify → Write `record.json` → Publish new head) must be measured in seconds on the VM to ensure it fits the D-CLOUD-098 budget.