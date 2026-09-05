I will build from `claude-revised_plan.md`, with specific lifts from `gpt-revised_plan.md` and `kimi-revised_plan.md`. This synthesis preserves claude's operational clarity while adopting gpt's precision on lifecycle gates and kimi's evidence discipline.

---

## 1. Architecture

### 1.1 Detection

**Manifest-based three-way reconcile** (L, C, A) is the only writer of the save tree. Bisync is demoted to a spike; its output is not trusted for classification. The detector:

- **Inputs:** union of manifests, local tree scan, `agreed.json`, `remote_hash` observations.
- **Output:** per-path verdict (identical, one-way, divergent, unknown), plus a frozen plan file for the wizard.
- **Budget:** ≤ 2 rclone spawns (listing + changed-files upload), proven on H700.

**Conflict table** (claude §3.4) is authoritative. Tombstoned deletions, provisional-agreement rows, and recorded-loser rows are all implemented. The table is lifted verbatim into #22's ACs.

### 1.2 Transport

**Manifest transport** is owned: `.rocknix/**` excluded from bulk upload; own manifest uploaded explicitly via `--files-from`. Foreign manifests may sit in the tree as read-only caches.

**Agreement** is scoped to remote + root. A credential refresh does not invalidate agreement; a remote/root change does.

### 1.3 Merge

**ES primitives** are wrapped in a checked adapter (claude §3.6). The adapter:

- Rejects −99 allocations (auto-only repository).
- Verifies `copyToSlot()` success (both state and PNG).
- Observes moves (mistral's insight) and updates placement records.
- Preserves producer provenance (gpt's `origin` field).

**KEEP BOTH** materialises the cloud version into a numbered slot with its thumbnail; the device resume point stays at `.state.auto` (gpt §4.6).

### 1.4 Safety

**Concurrency:** pre-upload check + `--backup-dir` on every overwrite + audit + anomaly report. Manual recovery is the honest contract for V1.

**Deletion:** conservative resurrection (kimi's policy). Unexplained absence fails closed; explicit player deletions propagate as tombstones with a mass-delete guard.

**Apply:** audit line → archive/discard-store copy → destructive step, per item. Interrupted applies converge on re-run.

---

## 2. Register changes

### D-CLOUD-031 (refinement)

**Schema amendment** (mistral's D-CLOUD-031-A…E):

```json
{
  "schema": 1,
  "device": { … },
  "generated_at": "…",
  "entries": {
    "path": {
      "kind": "state|auto|save|container",
      "sha256": "…",
      "size": …,
      "mtime": "…",
      "captured_at": "…",
      "captured_local": "…",
      "clock_synced": …,
      "system": "…",
      "rom": "…",
      "emulator": "…",
      "core": "…",
      "core_build": "…",
      "core_display_version": "…",
      "slot": …,
      "screenshot": "…",
      "screenshot_sha256": "…",  // gpt's binding
      "replaces": "…",
      "remote_hash": { … },
      "origin": {  // gpt's durability
        "device": "…",
        "sha256": "…",
        "captured_at": "…"
      },
      "group": "…"  // claude's unit label
    }
  }
}
```

**Rules:**

- `rom` is the matched stem under `nofileextension = true` (claude §3.2 R9).
- `screenshot_sha256` binds the displayed PNG to the chosen state version.
- `origin` preserves producer metadata separately from the publishing device.
- `group` labels coherent units (N64 pairs, VMU directories, emulator-specific layouts).

### D-CLOUD-027 (refinement)

**Retention default ON, bounded** (unanimous consensus against IA rev 4):

```
D-CLOUD-027-A: *keep discarded saves* defaults ON, with a count selector (default 3).
D-CLOUD-027-B: Discarded copies are stored under `/storage/.cache/cloud_sync/discarded/<stamp>/`.
```

### D-CLOUD-029 (withdrawal)

**D-CLOUD-029 is withdrawn** (gemini's procedural closure). The interim posture is:

- Isolated test storage.
- Disabled auto-sync toggles as a maintainer operating choice.

---

## 3. Implementation sequencing

### 3.1 Repair the harness

- **Gate 0:** `tools/cloud-round-trip` must pass end-to-end against disposable GENERIC_X64, both WebDAV and MinIO.
- **Fixes:** preserve configuration before mutation; use exact paths and destination bytes; reconcile content fixtures with the current allowlist.

### 3.2 Build the detector

- **Gate 1:** H700 timings for no changed candidates, one changed SRAM, one state + PNG, a save unit, hashless verification, unavailable network.
- **Gate 2:** Two-H700 boot-race reproducer (claude §3.7.1, gpt §4.9).

### 3.3 Build the adapter

- **Gate 3:** Auto-only allocation returns −99; `copyToSlot()` verifies success; moves update placement records.
- **Gate 4:** KEEP BOTH outcome: device resume point stays at `.state.auto`; cloud version materialises into a numbered slot with its thumbnail.

### 3.4 Build the wizard

- **Gate 5:** RG351M layout at 480×320; real thumbnails recognisable.
- **Gate 6:** Interrupted apply converges on re-run.

### 3.5 Build #10

- **Gate 7:** Real-device launch-behaviour rehearsal (gemini's gate).
- **Gate 8:** #19's bench decides badge severity (D-CLOUD-025).

---

## 4. Hardware gates

| Gate | Experiment | Owner | Pass condition |
|---|---|---|---|
| 0 | `tools/cloud-round-trip` | #35 | End-to-end pass, both backends |
| 1 | Exit-push budget | #22 | ≤ 2 spawns, ≤ 5 s on H700 |
| 2 | Boot-race reproducer | #22 | Both heads present, one canonical, one in dated sibling |
| 3 | ES primitive adapter | #24 | −99 rejected; `copyToSlot()` verified; moves observed |
| 4 | KEEP BOTH outcome | #24 | Device resume point at `.state.auto`; cloud version in numbered slot |
| 5 | RG351M layout | #23 | Thumbnails recognisable at 480×320 |
| 6 | Interrupted apply | #22 | Converges on re-run |
| 7 | #10 launch behaviour | #10 | Auto-resume and incremental-slot behaviour verified on real device |
| 8 | #19 bench | #19 | Badge severity decided |

---

## 5. What not to build

- **The one-way stopgap** (gemini §5.1, mistral §3.2) — unsafe (§2.2.1).
- **gpt's protected-publication store in V1** (§4.7) — over-earned for the accepted risk.
- **gpt's full durable transaction journal in V1** (§4.8) — keep the apply ordering and idempotent re-plan.
- **mistral's in-tree discard store** (§3.5) — wrong placement.
- **mistral's kid-mode reachability requirement** (§5) — contradicts the mode's purpose.
- **Any production role for bisync before the spike answers question zero** — all four agree.

---

## 6. Evidence discipline

Every claim is marked with the corpus source that settles it:

- **[C]** claude-revised_plan.md
- **[G]** gpt-revised_plan.md
- **[K]** kimi-revised_plan.md
- **[M]** mistral-revised_plan.md
- **[S]** embedded source file

Example:

> `getNextFreeSlot()` returns −99 for an auto-only repository [K] [S37]

The resulting document is a build contract with no unmeasured claims.