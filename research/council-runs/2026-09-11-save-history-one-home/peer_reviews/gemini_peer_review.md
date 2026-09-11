Here is my review of the three injected analyses, evaluated against the embedded corpus.

### 1. Testing Claims Against the Corpus

**`claude-analysis.md`**
*   **Claim:** The count bound is keyed to the unit, meaning auto-states will evict manual states. 
    *   *Verdict: True.* Source 11 (R4) defines identity as "*L* = this device's hash set for the unit" and R9 defines "unit = game + kind". Since auto-states and manual states are both "states" for the same game, they share a unit. A count of 3 will indeed allow auto-states (which churn on every exit) to evict manual states.
*   **Claim:** D-CLOUD-100's auto-heal cannot fetch the good copy on the exit path because R5 forbids it.
    *   *Verdict: True.* Source 11 (R5) explicitly states the exit push is "to-the-cloud only... No fetches, no ICMP, no probes on this path." D-CLOUD-100 requires the good copy to be "restored" (fetched). These two directives are in direct conflict.

**`gpt-analysis.md`**
*   **Claim:** The three bounds (count, age, size) and "never the only copy" cannot all be unconditional.
    *   *Verdict: True.* This is a mathematically sound deduction. If a player has 300 games with 1 MiB saves, the total is 300 MiB. The 256 MiB cap (D-CLOUD-096) demands pruning, but the "never the only copy" rule forbids it. 
*   **Claim:** The old store's record is explicitly for "finalized, coherent wizard losers."
    *   *Verdict: True.* Source 11 (R9) explicitly states: "The store counts finalized, coherent wizard losers only... Propagated deletions, compactions and one-way transfers are not retained here."

**`mistral-analysis.md`**
*   **Claim:** The `copyto` operation is a "cloud-to-cloud copy (no device upload)" and costs no device bandwidth.
    *   *Verdict: False.* Source 17 (D-QA-017) mandates support for self-hosted backends including SFTP and SMB. As `kimi-analysis.md` correctly infers, rclone cannot perform server-side copies on these protocols; the data must stream down to the handheld and back up.
*   **Claim:** The `copyto` happens "after the game has started (D-CLOUD-076) or after the sync card has said the player may go (D-CLOUD-038)."
    *   *Verdict: False.* Source 4 (D-CLOUD-038) explicitly states that a sync "gates game launch." The player waits on the card *before* the game starts. 

### 2. Separating Established Facts from Assertions

*   **rclone overlap and sync behavior:** `claude-analysis.md` and `kimi-analysis.md` assert that rclone `sync` will not delete excluded files unless `--delete-excluded` is passed, and that `copy` does not check for source/destination overlap. These are assertions based on external tool knowledge. They are highly likely to be true, but both authors correctly identify that they require VM verification.
*   **The TOCTOU (Time-Of-Check to Time-Of-Use) Race:** `gpt-analysis.md` asserts that even with retain-before-publish, a concurrent publisher can overwrite a version without retaining it. (Device A and B both retain H0; A publishes HA; B publishes HB. HA is destroyed without being retained). This is an assertion based on distributed systems logic, not explicitly detailed in the corpus, but it is undeniably correct because the transfer lock `L_T` is device-local (Source 11, R6), not a remote mutex.
*   **Network Latency Estimates:** All three analyses estimate the time cost of the extra `copyto` operation. These are inferences. `mistral-analysis.md` assumes 1-2 seconds based on Dropbox, while `claude-analysis.md` and `kimi-analysis.md` correctly assert that hashless/streaming backends (SFTP/SMB) will take significantly longer, especially for large PPSSPP states.

### 3. Strongest and Weakest Arguments

**`claude-analysis.md`**
*   **Strongest:** The identification of the R5 (no fetches on exit) vs. D-CLOUD-100 (auto-heal restore) contradiction, and the proposed fix to heal from the local capture stage. This perfectly resolves the conflict without violating the time-to-play budget.
*   **Weakest:** The recommendation to outright *drop* the 90-day age cap because clocks are untrusted. D-CLOUD-096 explicitly requests an age cap. Outright dropping it violates a maintainer constraint. `gpt-analysis.md`'s approach (establishing a strict priority order for bounds) is a much better way to handle the contradiction.

**`gpt-analysis.md`**
*   **Strongest:** The identification of the concurrent-publisher TOCTOU race. `claude-analysis.md` attempted to fix this by checking the hash *after* the copy, but `gpt-analysis.md` correctly realizes that a race window still exists between that check and the final publish. The requirement for "candidate escrow" (retaining the publish candidate *before* modifying the shared head) is the only mathematically safe solution.
*   **Weakest:** The insistence on keeping the `.snapshots` exclusion guard. Source 2 explicitly states the `.snapshots` rule is dropped, and Source 13 confirms "no local snapshots". Defending a deprecated guard distracts from the actual namespace protection needed for `.history/`.

**`mistral-analysis.md`**
*   **Strongest:** The concrete migration mapping. Moving `-replaced/` to `.history/` and synthesizing the `record.json` using `reason: replaced` is a highly practical application of the "read both, write the new one" rule.
*   **Weakest:** The recommendation to *ignore* the local `.cache/cloud_sync/replaced/` folder during migration. Source 3 explicitly states this folder holds "the device copy a restore overwrote." Ignoring it guarantees the loss of any unpublished local saves that were overwritten by a restore, directly violating the commission's "no earlier version is lost" rule.

### 4. Missed Failure Modes

*   **The Intentional Erasure Loop:** If a player intentionally erases their save in-game (resulting in a 0-byte file), D-CLOUD-100's auto-heal will silently restore the old cloud copy. The player will delete it again, and the system will heal it again, trapping the player in an infinite loop. `gpt-analysis.md` briefly touches on this ("Restore loops back into auto-heal"), but none of the analyses provide the necessary mechanical fix: a "sticky divergent" state that forces the wizard to ask the player what they actually want to do.
*   **`--delete-excluded` Wiping History:** `kimi-analysis.md` is the only one to catch this. If any legacy script or user configuration passes `--delete-excluded` to rclone, the `- /.history/**` rule will cause rclone to actively delete the history store from the cloud. 

### 5. Concrete Revisions for Step 3

**For `claude-analysis.md`:**
1.  Do not drop the 90-day age cap. Instead, adopt `gpt-analysis.md`'s priority ordering for bounds (e.g., "never the only copy" > count > age > size) to handle the mathematical contradictions.
2.  Acknowledge `gpt-analysis.md`'s TOCTOU race. Your "hash from the copy" fix narrows the race window but does not close it. Adopt the "candidate escrow" concept: the device must upload its *new* save to `.history/` as a pending candidate before it overwrites the live head.

**For `gpt-analysis.md`:**
1.  Adopt `claude-analysis.md`'s brilliant "count per file" fix. You correctly noted that auto-states shouldn't consume the battery-save allowance, but your solution requires complex UI/logic exceptions. Claude's fix (applying the count to the *file path* rather than the *unit*) solves it instantly without reopening D-CLOUD-099.
2.  Revise your migration strategy to explicitly include the local `.cache/cloud_sync/replaced/` folder, as `claude-analysis.md` and `kimi-analysis.md` did.
3.  Drop the defense of the `.snapshots` guard; the corpus has already retired it.

**For `mistral-analysis.md`:**
1.  Correct your assumption that `copyto` is always a zero-bandwidth server-side operation. You must account for the SFTP/SMB backends (D-QA-017) which will stream the data through the handheld, impacting the time-to-play budget.
2.  Correct your reading of D-CLOUD-038. Sync *gates* launch; it does not happen in the background after the game starts.
3.  Do not ignore the local `.cache/cloud_sync/replaced/` folder during migration. You must fold it into `.history/` to prevent data loss.
4.  Do not reopen D-CLOUD-099 (auto-states). Instead, adopt `claude-analysis.md`'s "count per file" logic to prevent auto-states from evicting manual saves.