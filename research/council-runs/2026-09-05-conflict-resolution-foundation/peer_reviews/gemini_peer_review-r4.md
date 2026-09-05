Here is the round-4 peer review of the revised approaches, evaluating them against the embedded corpus and the maintainer's authoritative amendments.

### 1. Walk the restore tool through each plan's retention store

The maintainer requires a store shaped for a future reader (a "time machine" picker) that can show retained past versions of a game, newest first, with a thumbnail, producing device, and which side won. 

**Claude (`claude-revised_plan-r3.md`):**
*   **Path opened:** `/storage/.cache/cloud_sync/retained/<system>/<unit-key>/`
*   **What it reads:** It lists the subdirectories (`<device-id>-<seq>`), sorts them descending by `<seq>` to get chronological order, and reads the `record.json` inside each.
*   **What it scans that it doesn't need:** Nothing. The path isolates the exact game, and the sequence number provides the sort order without opening files.
*   **Fields present at discard:** Yes. `record.json` is self-contained and written *before* the destructive step. It relies on no external logs or mutable manifests.

**GPT (`gpt-revised_plan-r3.md`):**
*   **Path opened:** `/storage/.local/share/rocknix/cloud-saves/discarded/` (or a logical bucket within it).
*   **What it reads:** It must read the records to group them by game and sort by the "local commit order in a small ordered index." 
*   **What it scans that it doesn't need:** If the filesystem isn't strictly partitioned by game (GPT specifies "unique record ID" and "logical retention bucket" but no exact path hierarchy), the reader must scan an index or multiple unrelated JSONs to find the target game.
*   **Fields present at discard:** Yes. The record copies the producer snapshot inline at retention time.

**Kimi (`kimi-revised_plan-r3.md`):**
*   **Path opened:** `/storage/.cache/cloud_sync/discarded/`
*   **What it reads:** It lists all `<operation-id>` directories (formatted as `<utc>-<device-id>-<seq>`).
*   **What it scans that it doesn't need:** **Everything.** Because the directory structure is flat by operation rather than grouped by game, the reader must open and parse *every* `operation.json` ever recorded for *every* game just to filter down to the one game the player is asking about. This is O(N) on total lifetime conflicts.
*   **Fields present at discard:** Yes. The loser's manifest entry is copied verbatim.

**Mistral (`mistral-revised_plan-r3.md`):**
*   **Path opened:** `/storage/.cache/cloud_sync/discarded/<path>/`
*   **What it reads:** It lists the `<sha256>` subdirectories and reads the `<sha256>.json` sidecars.
*   **What it scans that it doesn't need:** It isolates the game perfectly, but because the directory is keyed by hash rather than a sequence number, the reader must open *every* JSON sidecar for that game to determine chronological order (or rely on filesystem `mtime`, which GPT correctly warns against due to wrong-RTC boots).
*   **Fields present at discard:** Yes.

**Verdict:** **Claude** is the only plan that designed a filesystem structure (`retained/<system>/<unit-key>/<device-id>-<seq>/`) allowing O(1) discovery of a game's history, perfectly sorted, without scanning unrelated files or opening JSONs just to find the date.

### 2. Sort every remaining difference into liftable or architectural

**Architectural differences (a builder must pick one):**
*   **Store Location:** GPT places the store at `/storage/.local/share/rocknix/cloud-saves/`. Claude, Kimi, and Mistral place it in `/storage/.cache/cloud_sync/`. *Architectural.* A builder must pick a path.
*   **Manifest Transport:** Claude and Mistral require a two-spawn approach (payload, then manifest-last `copyto`) to create a commit point. GPT and Kimi use a one-spawn approach (`--files-from` carrying both payload and manifest). *Architectural.* 
*   **Exit Path Budget Fallback:** Claude mandates reading current cloud evidence before overwrite; if it takes 9 seconds, the user waits 9 seconds. GPT and Mistral dictate that if hashless verification exceeds the 5-second budget, the upload is deferred to the background boot/menu pass. *Architectural.*

**Liftable differences (can be moved without disturbing the architecture):**
*   **Typed Exit Codes:** Kimi maps rclone's exit codes to internal typed outcomes (0, 3, 4, 5, 6, 1) so rclone's native 3/4 don't collide with the script's reserved meanings. *Liftable into any plan.*
*   **`resolves` Receipt:** Claude includes a 1-step `resolves` array in the manifest to prove a conflict was decided. GPT and Kimi reject this as unnecessary metadata. *Liftable (can be dropped).*
*   **Inline JSON Schema:** Mistral provides the exact JSON schema amendment inline. *Liftable into any plan.*
*   **`kind: container`:** Kimi and Mistral use `kind: container` with `rom: null` for shared VMUs/memcards. *Liftable into any plan.*

### 3. Find the real disagreements

**1. Is `/storage/.cache` safe for irreplaceable user data?**
*   *Disagreement:* Claude and Kimi argue `.cache` is the established home for persistent state outside the sync scope, provided we define a rule that it isn't wiped. GPT argues that user save data (even discarded) fundamentally does not belong in a directory named `.cache` which the OS or cleanup scripts might conventionally wipe.
*   *Substantive.* If ROCKNIX OS upgrades or user-triggered cleanup scripts wipe `/storage/.cache`, Claude's store is destroyed. GPT is correct: user data belongs in `/storage/.local/share`.

**2. Does manifest-last transport buy safety, or just waste a spawn?**
*   *Disagreement:* Claude argues the manifest must be uploaded in a separate, final spawn so readers never see a manifest before the payload lands. GPT and Kimi argue that since readers must verify the payload hashes anyway, a premature manifest just results in a temporary "torn" state that safely defers until the payload arrives.
*   *Substantive.* GPT and Kimi are right. If the reader verifies hashes (which all plans require), a torn unit is harmlessly ignored. Wasting 1 second on a second rclone spawn during the watched game-exit path is an unacceptable cost for a cosmetic commit point.

### 4. Test the load-bearing claims

*   **"ES inherited fd survives its restart."** Claude and GPT rely on an `flock` file descriptor being inherited by the emulator child so that if EmulationStation crashes (SIGABRT) and restarts, the lock is held until the emulator exits. *Test:* If ES uses `O_CLOEXEC` when opening files, or explicitly closes fds before `exec`ing the emulator, the lock is lost the moment ES dies. Claude correctly identifies this as a risk and mandates a one-line wrapper if true.
*   **"A reader can drive a picker from this store."** As proven in Section 1, Kimi's flat `<operation-id>` directory structure fails this claim at scale, as the future tool would hang while parsing hundreds of unrelated JSONs.

### 5. Say which plans the amendments cost, and how much

*   **Claude:** *Low cost.* Claude already had retention ON by default, bounded by a count, with no V1 undo control. It successfully designed the `record.json` and the optimal directory structure to satisfy the future reader requirement.
*   **GPT:** *Low cost.* It dropped its V1 native recovery UI and successfully designed a robust `record.json` contract.
*   **Kimi:** *Medium cost.* It had to add the discard sidecar, but its flat directory structure fails the efficiency test for the future reader.
*   **Mistral:** *Medium cost.* It adopted the sidecar, but its hash-keyed path structure loses chronological ordering in the filesystem.

### 6. Name what each plan uniquely has

*   **Claude:** The optimal retention directory structure (`retained/<system>/<unit-key>/<device-id>-<seq>/`). It is the only plan that allows O(1) discovery of a game's history, perfectly sorted, without scanning unrelated files.
*   **GPT:** The `/storage/.local/share/rocknix/cloud-saves/` path. It correctly identifies that irreplaceable user data must not live in `.cache`.
*   **Kimi:** Typed internal exit codes. It correctly identifies that passing raw rclone exit codes through to a UI that reserves 3 and 4 for its own skips is a bug waiting to happen.
*   **Mistral:** The explicit inline JSON schema amendment, making the exact fields and structure undeniable for the builder.

### 7. Name what any plan has that should not be built

*   **Claude's `resolves` receipt:** A cross-device resolution receipt is unnecessary metadata. If a user makes an informed choice, it is simply a new version. The ordinary classifier handles it.
*   **Claude's manifest-last two-spawn transport:** Wastes a full second on the watched exit path. `--files-from` in one spawn is strictly better since readers verify payloads anyway.
*   **Kimi's flat retention directory (`discarded/<operation-id>/`):** Will cause severe performance issues for the future restore tool.

### 8. Say which plan you would build from, and what you would take

I would build from **Claude (`claude-revised_plan-r3.md`)**. It has the most rigorous and complete architecture, and it is the only plan that successfully designed a retention filesystem structure capable of efficiently driving the maintainer's future restore tool.

**What I would take from the others:**
1.  **From GPT:** Move the retention store to `/storage/.local/share/rocknix/cloud-saves/`. User save data does not belong in `.cache`.
2.  **From GPT & Kimi:** Use the one-spawn `--files-from` transport. Drop Claude's manifest-last `copyto`; readers verifying hashes makes torn states harmless, saving 1 second on the exit path.
3.  **From Kimi:** Lift the typed internal exit codes to cleanly separate rclone's errors from the script's control flow.
4.  **From Mistral:** Lift the inline JSON schema amendment to ensure no ambiguity in the manifest shape.
5.  **From GPT & Kimi:** Drop Claude's `resolves` receipt. It is unnecessary complexity.