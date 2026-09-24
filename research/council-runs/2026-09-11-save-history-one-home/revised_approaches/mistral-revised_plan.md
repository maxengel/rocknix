I've synthesized the peer reviews and the embedded corpus into a revised approach for the delta. This revision endorses, amends, or replaces each row of `save-history-plan-delta.md` while addressing the critiques and missed failure modes.

---

## Revised Delta to the Council-Derived #11 Plan

### 1. Store Location and Structure (Endorsed with Amendments)

**Original:**
> store at `<SAVES_REMOTE>-discarded/`, written on a wizard decision

**Revised:**
> store at **`<SAVES_REMOTE>/.history/<unit>/<seq>/`** with:
> - `record.json` carrying `reason: discarded | replaced | deleted | suspect | legacy`
> - A **`README.md`** at `<SAVES_REMOTE>/` and inside `.history/` declaring the store's purpose and that the device menu restores from it
> - **`- /.history/**`** prepended to the shipped `cloud_sync-rules.txt` **one image before R1** (D-CLOUD-097 not reopened; this is a guard, not a retention change)

**Rationale:**
- **One home, hidden, declared** (D-CLOUD-095) is endorsed.
- **Amendments:**
  - `reason: legacy` for migrated `-replaced/` entries (GPT: sync-mode deletions are not "replaced"; Kimi: unknown producer/time).
  - Ship the allowlist rule early to close the pre-R1 exposure window (Claude: the store is unsafe under the shipped rules; Gemini: the delta's rule is not yet shipped).
  - The README is excluded from sync by the shipped rules (Gemini), but its creation must be guarded against mass-absence (GPT: metadata can conceal emptiness).

**Failure Modes Addressed:**
- `.history/` members matching `+ /**/*.srm` restored to devices or deleted into `-replaced/` under the shipped rules (Claude).
- Sync-mode deletions misclassified as `replaced` (GPT).
- Mass-absence bypass via control files (GPT).

---

### 2. Retain-Before-Publish (Amended)

**Original:**
> retain the loser before the winner replaces it (wizard only)

**Revised:**
> **retain-before-publish for every overwriting publish (decided or not):**
> 1. Copy the cloud's current version into `.history/` with `reason: replaced` (or `deleted` for sync-mode deletions).
> 2. Verify the retained bytes and `record.json` before publishing the new head.
> 3. For one-way fetches, retain the local loser in `.history/` if its hash is not already there (Gemini: closes GPT's race follow-on).
> 4. **Ordering:** Own-manifest witness (R7) runs before any retain (Kimi: cloned cards must not write store entries for refused publishes).

**Rationale:**
- **Universal retention** (D-CLOUD-095) is endorsed.
- **Amendments:**
  - **Conditional local retention** (Gemini): Only when the local loser's hash is absent from the store (GPT's race follow-on).
  - **Verification before publish** (Claude/GPT): Bytes-first, record-last, with the record as commit point (D-CLOUD-078).
  - **Ordering rule** (Kimi): Witness before retain to prevent cloned-card store pollution.

**Failure Modes Addressed:**
- Concurrent publishes overwriting versions without retention (GPT).
- Cloned cards writing store entries for refused publishes (Kimi).
- Torn writes or verification failures leaving the store incoherent (Claude).

---

### 3. Retirement of `--backup-dir` (Amended)

**Original:**
> retired once the reconciler is the only writer (R1); until then unchanged

**Revised:**
> **Retired at R1.** Until then:
> - **No interim widening of `-replaced/`** (D-CLOUD-097).
> - **Migration at R1:** Fold `-replaced/` and `.cache/cloud_sync/replaced/` into `.history/` under `L_T` with `reason: legacy`, verify before deleting, and preserve unique local copies (Claude/GPT).
> - **Grace period:** Import entries older than 90 days but do not prune them until the next full pass (GPT: age cap applies immediately otherwise).

**Rationale:**
- **No interim** (D-CLOUD-097) is endorsed.
- **Amendments:**
  - **Migration:** Fold both set-asides into `.history/` (Claude/GPT: no data loss; Gemini/Mistral's versions lose data).
  - **Grace period:** Protects old entries from the age cap (GPT).

**Failure Modes Addressed:**
- Unique local copies lost (Mistral: ignored `.cache/cloud_sync/replaced/`).
- Age cap pruning imported entries immediately (GPT).

---

### 4. Allowlist Rule (Amended)

**Original:**
> `- /savestates/.snapshots/**` ahead of `+ /savestates/**` (a guard with no writer)

**Revised:**
> **`- /.history/**`** prepended to the shipped `cloud_sync-rules.txt` **one image before R1**, ahead of every include. The `.snapshots` rule is dropped (no writer after R1).

**Rationale:**
- **Prepended rule** is endorsed.
- **Amendment:** Ship the rule early (Claude: closes the pre-R1 exposure window).

**Failure Modes Addressed:**
- `.history/` members restored to devices or deleted into `-replaced/` under the shipped rules (Claude).

---

### 5. Retention Settings (Amended)

**Original:**
> KEEP DISCARDED SAVES (switch) · DISCARDED SAVES KEPT PER SAVE (1–9, default 3) on the cloud-saves page

**Revised:**
> **SAVE HISTORY** (submenu under SAVE MANAGEMENT) with:
> - **KEEP EARLIER VERSIONS OF SAVES** (switch, on by default)
> - **VERSIONS KEPT PER SAVE** (3–5, default 3; per (unit, member path), not per unit)
> - **AGE CAP** (90 days, trust-gated: prune only entries with `decided_at` > earliest trusted clock)
> - **TOTAL SIZE CAP** (256 MiB, soft: prune oldest-first on full passes only)
> - **Disclosure:** The README and settings page state that caps are soft and pruning runs on full passes only.

**Rationale:**
- **Nesting** (D-UI-039) and **one vocabulary** (D-CLOUD-096) are endorsed.
- **Amendments:**
  - **Per-file count keying** (Claude): Protects manual slots from auto-state churn (D-CLOUD-099).
  - **Trust-gated age cap** (Claude): Prune only entries with trusted timestamps (untrusted clocks are corpus evidence).
  - **Soft caps** (Kimi): Pruning runs on full passes only; exit-only devices overshoot between full passes.
  - **Disclosure:** The README and settings page must not promise hard ceilings.

**Failure Modes Addressed:**
- Auto-state churn evicting manual slots (Claude).
- Untrusted clocks pruning fresh entries (Gemini).
- Soft-cap semantics not disclosed (Kimi).

---

### 6. Restore Tool (Amended)

**Original:**
> reads `-discarded/`, labels `-replaced/` copies separately

**Revised:**
> **#25 reads one store (`.history/`), labels by `reason`:**
> - **YOU CHOSE THE OTHER** (`discarded`)
> - **REPLACED BY A SYNC** (`replaced`)
> - **DELETED** (`deleted`)
> - **SET ASIDE AS DAMAGED** (`suspect`)
> - **UNKNOWN** (`legacy`)
> - **Restore mechanics:** Republication with a new `pub`; the old `retired` record does not consume it (A9).

**Rationale:**
- **One store** is endorsed.
- **Amendments:**
  - **Legacy reason** for migrated entries (GPT/Kimi).
  - **Restore mechanics:** Republication with a new `pub` (A9).

**Failure Modes Addressed:**
- Sync-mode deletions misclassified (GPT).
- Unknown producer/time for migrated entries (Kimi).

---

### 7. Suspect Classifier (Amended)

**Original:**
> adds a `suspect` class: zero length, or all one byte, where the previous version was neither

**Revised:**
> **`suspect` class:** Zero length or uniform byte (format-aware: e.g., all `0x00` or `0xFF` for known formats) where the previous version was neither.
> - **Auto-heal:** Restore the cloud's good copy; set the suspect aside with `reason: suspect`.
> - **Message:** "The save for X was damaged when the game closed. The last good copy from your cloud was put back." (D-CLOUD-077: no lying; GPT: intentional erasures must not be silently rolled back).
> - **Both suspect:** Flag as a question for the wizard (no silent rollback).
> - **Unavailable good copy:** Flag as a question for the wizard (no silent rollback).
> - **Audit line** for every auto-heal (Mistral: generalized to all store mutations).

**Rationale:**
- **Auto-heal** (D-CLOUD-100) is endorsed.
- **Amendments:**
  - **Format-aware uniform-byte detection** (Kimi: hash shortcut is backend-dependent).
  - **Both-suspect and unavailable-counterpart handling** (GPT: no silent rollback).
  - **Message wording** (GPT: intentional erasures must not be silently rolled back).
  - **Audit line** (Mistral: generalized to all store mutations).

**Failure Modes Addressed:**
- Intentional erasures silently rolled back (GPT).
- Both-suspect or unavailable-counterpart cases mishandled (GPT).

---

### 8. Save States (Endorsed)

**Original:**
> decided (D-CLOUD-099): all of them, auto-states included

**Revised:**
> **All save states, auto-states included, bounded by the per-file count.**

**Rationale:**
- **D-CLOUD-099** is endorsed.
- **Amendment:** Per-file count keying (Claude) protects manual slots from auto-state churn.

---

### 9. Time-to-Play Cost (Amended)

**Original:**
> one small extra transfer per replaced save

**Revised:**
> **Operation ledger (worst-case, SFTP/SMB):**
> | Operation | Round Trips | Payload (S = save size) | Notes |
> |---|---|---|---|
> | Fresh head evidence | 1 | Listing | |
> | Retain old bytes | 1 | Download S | |
> | Verify retained bytes | 1 | SHA-256 | |
> | Write `record.json` | 1 | Upload ~1 KiB | |
> | Verify `record.json` | 1 | Download ~1 KiB | |
> | Publish new head | 1 | Upload S | |
> | Verify new head | 1 | Download S or SHA-256 | Backend-dependent |
> | **Total** | **6–7** | **2S + ~2 KiB** | |
>
> **Estimated latency (20 Mbit/s, 5 MiB save):**
> - Payload: ~4.2 s (2 × 5 MiB @ 20 Mbit/s).
> - Request overhead: ~1–2 s (6–7 round trips).
> - **Total: ~5–6 s per replaced save.**
>
> **Mitigations:**
> - **Exit path:** Retain and verify in the background after the card says the player may go (D-CLOUD-038).
> - **Startup path:** Retain and verify during the boot sync (D-CLOUD-072), but this lengthens the boot sync and raises cancellation probability (D-CLOUD-076).
> - **Backend optimization:** Server-side copy (Dropbox, S3) reduces payload to ~S + ~2 KiB (~2.1 s for 5 MiB).

**Rationale:**
- **Cost transparency** (D-CLOUD-098) is endorsed.
- **Amendment:** Full operation ledger (GPT) and latency estimates (Claude).

**Failure Modes Addressed:**
- Understated cost (Mistral: fabricated measurement; GPT: omitted operations).

---

### 10. Migration (Amended)

**Original:**
> Devices already hold `Saves-replaced/` folders and a local `.cache/cloud_sync/replaced/`

**Revised:**
> **At R1:**
> 1. **Fold both set-asides into `.history/` under `L_T`:**
>    - `-replaced/<stamp>/` → `.history/<unit>/<seq>/` with `reason: legacy`.
>    - `.cache/cloud_sync/replaced/<stamp>/` → `.history/<unit>/<seq>/` with `reason: legacy`.
>    - Preserve unique local copies (Mistral: ignored `.cache/cloud_sync/replaced/`).
> 2. **Verify before deleting:** Check hashes and `record.json` for every imported entry.
> 3. **Grace period:** Import entries older than 90 days but do not prune them until the next full pass (GPT).
> 4. **Release gate:** "Upgrade both devices before syncing" (GPT: mixed-fleet ordering).

**Rationale:**
- **No data loss** (commission rule) is endorsed.
- **Amendments:**
  - **Fold both set-asides** (Claude/GPT: no data loss; Gemini/Mistral's versions lose data).
  - **Grace period** (GPT: age cap applies immediately otherwise).
  - **Release gate** (GPT: mixed-fleet ordering).

---

### 11. Reopened Decisions

| ID | Change | Argument |
|---|---|---|
| **D-CLOUD-047** | Retain deletions and sync-mode replacements in `.history/` with `reason: deleted`/`replaced` | The delta's `reason: deleted` and retirement of `-replaced/` contradict D-CLOUD-047's exclusions. |
| **D-CLOUD-041** | Cloud loser (KEEP RIGHT) uses `copyto` instead of server-side move | Copy-before-replace closes the D-CLOUD-037 window (GPT/Kimi: absent-head TOCTOU). Cost: SFTP/SMB streams through the device. |
| **D-CLOUD-046** | Exit path may fetch for auto-heal (bounded) | D-CLOUD-100's "restored" contradicts R5's "no fetches on exit." Amendment: heal from the stage first (Claude); fetch only if the stage lacks the good copy (GPT). |
| **D-CLOUD-052** | Recoverable concurrency accepted as a residual | GPT's counterexample proves R5's head check is not a serialization. Amendment: retain-on-fetch-when-absent-from-store (Gemini) closes the follow-on; escrow (GPT) is the stronger alternative. Residual: `HA` is unrecoverable from the cloud alone until A next syncs. |

---

### 12. Failure Modes Not in the Delta

1. **Witness-before-retain ordering** (Kimi): Cloned cards must not write store entries for refused publishes.
2. **Audit lineage for routine retains/prunes** (Kimi): The store's mutations need D-CLOUD-027 lineage.
3. **Startup sync's backup half retains too** (Kimi): Lengthens the boot sync and raises cancellation probability.
4. **Auto-rule churns the store twice** (Kimi): The divergent-`.state.auto` rule installs slot 4, which overwrites any existing slot 4, creating a store entry.
5. **Soft-cap semantics** (Kimi): Pruning runs on full passes only; exit-only devices overshoot between full passes.
6. **Wizard's pre-pass retains survive a quit** (Kimi): The delta should disclose this.
7. **Allowlist rule ships at R1** (Kimi): The store is unsafe under the shipped rules until R1.

---

### 13. Simpler Shape?

The delta is already the simplest shape that meets the maintainer's constraints:
- **One home** (D-CLOUD-095).
- **Inside the saves folder** (D-CLOUD-095).
- **Hidden but declared** (D-CLOUD-095).
- **One vocabulary** (D-CLOUD-096).
- **No stacking of settings** (D-UI-039).
- **Recoverable accidental overwrites** (D-CLOUD-099).

The amendments above refine it for safety and consistency, not complexity.

---

## `corpus.provenance.json`

```json
{
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "embedded read-at-time corpus; no filesystem access; hashes are the Facilitator's embed-time values, not recomputed by this member",
  "manifest": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step3-source-manifest.json",
  "manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
  "source_file_paths": [
    "research/council-runs/2026-09-11-save-history-one-home/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-plan-delta.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-gap-analysis.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/decision-register-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/time-to-play.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/es-native-ui-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_backup-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_restore-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_sync-rules.txt",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/22.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/23.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/25.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/134.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/135.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/131.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md"
  ],
  "source_file_hashes": [
    "f7d770768b3bf81985b7415b4d82f8ee9ef26965a98eb6c47c166f54db673b27",
    "1d320545319eba2e8852d830d52f76ab3a417e48e365d01fe79231bade77da8b",
    "d1107b7e1790b8e8aab177411b96bb3828f69e389fbc8e33c36ce616f67105aa",
    "46ccfb71ef85537639501c2973a5b02fd81b6d5772662608ead073b209ea2726",
    "6d7813f91e37510f5578f35adec3f9372ed34e1ce5d871fcc0f34e392b202911",
    "97d2fbba79fa42f22def37e4ff90e18149fc9fbc216d255d091da3dc187075da",
    "32be1ee4164c9d1f09e7a9e9c8c25f526e70802f75901e456097bdb5c02d46e4",
    "e5b57d74b83046fc7ebf44b4129c68815a575b35553e938c2ae377c685852509",
    "c0dacd8aa1eb1a4df2986447a853cc3c47b666b6234127e61783a151faa448bd",
    "bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e2d69ea018b8c9d5484d",
    "b05b7095a31dd11f63cc342129fd3b765a19b9ba4b4a91b4b9aa1877c7658b27",
    "1ca065c449e0b3695f1ab4e9573ad5bd4a92b21ae23c869bba8730fcefdebfc1",
    "14a3cee5592021447395db3e59dfaf27ec09de77f1fb85fe5c10cfde9da28d1b",
    "d7ffb5a4648964d458b18a4a5427b1bb5d8fd356bb31fd06182d2d08c33a2071",
    "3998a6e46d8cdd903deb97b2da23afb78ad1b237061328f4402291c03e0ff137",
    "b8034bb7ab57d7ffb7d5aa4cf16d0974f0bf8d731c983e864081296fa6ccc17c",
    "4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2"
  ],
  "peer_reviews": [
    "claude_peer_review.md",
    "gemini_peer_review.md",
    "gpt_peer_review.md",
    "kimi_peer_review.md"
  ],
  "corpus_gaps_surfaced": [
    "The unit table in #21 (decides whether a game's states are one unit; needed for per-file count keying).",
    "Backend capability results for server-side copy, hash availability, and modtime preservation on copyto (needed for cost estimates and clock mitigations).",
    "The full backup/restore scripts (needed to audit MATCH THIS DEVICE TO THE CLOUD and --delete-excluded behavior).",
    "The save-manifest schema and conflict-wizard IA (referenced but not embedded).",
    "The upgrade-and-install rules (referenced by the commission but not embedded)."
  ],
  "fabrication_statement": "No path, hash, or content has been invented for unembedded material. The analyses reviewed are the four injected peer reviews, cited by filename only."
}
```