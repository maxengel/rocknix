I vote for **`claude-revised_plan-r3.md`**.

### Reasoning

This plan provides the most robust, implementable, and grounded architecture, directly satisfying the maintainer's amendments while solving the deepest technical hazards surfaced in the corpus.

*   **Retention Store Design:** `claude` groups retained records by `/storage/.cache/cloud_sync/retained/<system>/<unit-key>/<device-id>-<seq>/`. This perfectly satisfies the maintainer's requirement to design the store for a future reader, making it trivial for the restore tool to list retained versions per game without scanning the entire store. `kimi-revised_plan-r3.md` uses a flat `<operation-id>` structure, and `mistral-revised_plan-r3.md` uses `<path>/<sha256>`, both of which would require the future picker to perform an O(N) scan of all records to group them by game. `gpt-revised_plan-r3.md` proposes a new path (`/storage/.local/share/`) not grounded in the corpus, whereas `claude` uses the established `.cache` directory but explicitly defines it as non-disposable, citing the audit log's placement (D-CLOUD-027) as precedent.
*   **Lifecycle Gate:** `claude` solves the ES-death concurrency hazard elegantly by having the emulator child inherit the `flock` file descriptor. This ensures the lock is held for the true duration of the gameplay session even if ES crashes and restarts (a known behavior per `engineering-practices.md`), preventing a background sync from mutating saves while the emulator is running.
*   **Exit Path Budget:** `claude` provides a realistic accounting of the `rclone` spawns required for safe read-before-write on the exit path. Crucially, it offers a clear, prioritized degrade path (drop the verify listing, then fold the manifest upload) if the 5-second budget is exceeded on hardware, giving the maintainer a practical knob to tune.
*   **ES Primitives Adapter:** `claude` thoroughly catalogs the defects in `SaveState.cpp` (e.g., returning `-99` on auto-only repositories, unconditional `true` returns on copy failures, and source-derived destination paths) and defines a strict adapter contract to bypass them safely.
*   **Rclone Exit Code Collision:** `claude` correctly identifies that `rclone`'s native exit codes 3 (Directory not found) and 4 (File not found) collide with the scripts' reserved meanings (lock held, no network). Mapping them internally prevents the UI from falsely reporting "SKIPPED - NO NETWORK" when a file is simply missing.

### What the winner needs to satisfy the amendments

To strictly adhere to the maintainer's amendment that "the depth that matters is one step back" and to avoid adding unnecessary complexity, `claude` must **drop the `resolves` receipt (O6)**. While it is a clever, lightweight way to prevent a fresh device from re-asking about a previously resolved conflict, it introduces a form of cross-device history that the primary use case does not earn. A fresh device re-asking is an acceptable, safe fallback that keeps the architecture simpler.

### Dissent and ideas to preserve from losing plans

*   From **`gpt-revised_plan-r3.md`**: The strict insistence that the retention store must be treated as irreplaceable user data, not a cache. While `claude` notes the store is non-disposable, `gpt`'s posture that it must be explicitly exempted from any OS-level cache-clearing routines is the correct defensive mindset and should be adopted.
*   From **`kimi-revised_plan-r3.md`**: The explicit use of `--files-from` for manifest transport to avoid the `--include` trap entirely. `claude` adopts this, but `kimi`'s explanation of why it is necessary (because `--include` excludes everything it does not match, leading to silent no-op transfers) is a vital safeguard that must be preserved in the implementation.

### Remaining defects in the winner

*   **The `resolves` receipt:** As noted above, this feature violates the spirit of the maintainer's "one step back" constraint and should be removed before implementation.
*   **Assuming `flock` inheritance:** The plan relies on ES's `ProcessStartInfo` not closing inherited file descriptors before `exec`. If ES sets `O_CLOEXEC` on all open file descriptors (a common security practice), the lock will be dropped when the emulator launches. The plan notes this must be verified and proposes a one-line wrapper if true, but this wrapper must be designed carefully to ensure it doesn't leave orphaned lock-holding processes if the emulator crashes.