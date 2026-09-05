I have reviewed the five revised approaches for the cloud-save conflict resolution foundation in ROCKNIX. This is a peer review of their merits against the embedded corpus and the maintainer's two binding amendments.

---

## 1. The two questions this round must answer

### 1.1 Walk the restore tool through each plan's retention store

| Plan | What the future reader does | Survives the amendment? | Notes |
|---|---|---|---|
| **claude** | Enumerates `/storage/.cache/cloud_sync/retained/<system>/<unit-key>/` by `seq`; renders both panels from `record.json` alone; installs without consulting any manifest, log, or plan. | ✅ Yes | Self-contained `record.json`; PNG travels; per-unit counts; exemptions for pending operations. |
| **gemini** | Enumerates `/storage/.cache/cloud_sync/discarded/<path>/` by timestamp; reads `<sha256>.json` for producer/winner context; must consult the winner's current manifest for the screenshot path. | ❌ No | Screenshot path is in the manifest, which may be overwritten; timestamp-keyed pruning can evict the newest. |
| **gpt** | Enumerates `/storage/.local/share/rocknix/cloud-saves/discarded/` by record ID; renders from `operation.json` alone; no manifest lookup. | ✅ Yes | Self-contained `operation.json`; PNG hash travels; per-unit counts; exemptions for pending operations. |
| **kimi** | Enumerates `/storage/.cache/cloud_sync/discarded/<operation-id>/` by `seq`; renders from `operation.json` alone; no manifest lookup. | ✅ Yes | Self-contained `operation.json`; PNG travels; per-unit counts; exemptions for pending operations. |
| **mistral** | Not specified in the embedded artifact. | ❓ Unknown | The plan is not embedded; the review cannot trace it. |

**Verdict:** claude, gpt, and kimi survive the amendment. gemini's store is insufficient for the future reader.

---

### 1.2 Sort every remaining difference into liftable or architectural

| Difference | Liftable? | Direction | Notes |
|---|---|---|---|
| **Retention store location** | ✅ Yes | `/storage/.local/share/rocknix/cloud-saves/` (gpt) | Avoids `.cache` cache-wiping; all three surviving plans can adopt it. |
| **Retention count** | ✅ Yes | 3 per unit (kimi) | Product proposal; all can adopt it. |
| **Auto KEEP BOTH outcome** | ✅ Yes | Deterministic (kimi) | This device keeps `.state.auto`; the cloud copy becomes the next free numbered slot. All can adopt it. |
| **Queue-and-badge trigger** | ✅ Yes | Queue-and-badge (kimi) | IA rev 5; all can adopt it. |
| **Equality writes agreement** | ✅ Yes | Equality writes agreement (claude) | Schema refinement; all can adopt it. |
| **Member-map classification** | ✅ Yes | Member maps (gpt) | Disjoint-member fork detection; all can adopt it. |
| **Move inference** | ✅ Yes | Move inference (claude) | Terminates renumber churn; all can adopt it. |
| **Tombstones in manifest** | ✅ Yes | Tombstones in manifest (kimi) | Pure deletions propagate; all can adopt it. |
| **Lifecycle gate** | ✅ Yes | Lifecycle gate (gpt) | ES-death survival; all can adopt it. |
| **Exit-path evidence read** | ✅ Yes | Read before write (gpt) | The five-step fixture; all can adopt it. |
| **bisync's role** | ❌ Architectural | Own classifier (kimi) | The spike decides; no plan may claim bisync's failure in advance. |
| **Deletion propagation** | ❌ Architectural | Propagate (kimi) | The maintainer's amendment settles it; no plan may refuse it. |
| **Store shape** | ❌ Architectural | Self-contained `operation.json` (kimi) | The amendment's reader test gates it; gemini's store fails. |

**Verdict:** The only architectural differences are bisync's role and deletion propagation. The rest are liftable.

---

## 2. What each plan uniquely has

| Plan | Unique element | Lift verbatim |
|---|---|---|
| **claude** | Move inference and cloud-side compaction under D-CLOUD-030's wording | "A move is not a conflict; compaction applies to the cloud copy by copy-verify-delete." |
| **gpt** | The five-step exit-path evidence-read fixture | "Read cloud evidence for the changed set before any upload; defer if unreadable." |
| **kimi** | Self-contained `operation.json` with PNG hash and per-unit counts | "Retain the loser's manifest entry verbatim, reason, winner, and the PNG's hash." |
| **gemini** | None | — |
| **mistral** | Not embedded | — |

---

## 3. What should not be built

| Plan | Over-scoped or unsafe |
|---|---|
| **claude** | Protected-publication protocol in V1; 8-generation lineage; cached-manifest exit overwrites. |
| **gpt** | Full staging mirror; vector clocks; semantic merging; 99-slot cap. |
| **kimi** | Move hook justified by lineage; `--include`-based manifest transport. |
| **gemini** | Timestamp-keyed discard store; ping probe on the exit path. |
| **mistral** | Not embedded; cannot judge. |

---

## 4. Which plan I would build from

**I would build from kimi-revised_plan-r3.md.**

### 4.1 Why kimi

- **Survives the amendment's reader test.** The self-contained `operation.json` is the only store shape that does.
- **Owns every write path.** The classifier is ours; bisync is a candidate transport only.
- **Reads before it writes.** The exit path refuses offline forks.
- **Propagates deletions.** The maintainer's amendment is satisfied.
- **Fails closed on unexplained absence.** The residual is bounded and non-destructive.
- **The lifecycle gate survives ES death.** The emulator process inherits the fd.
- **The checked adapter never calls ES's primitives raw.** The adapter owns −99, unconditional `true`, and parent-derived destination.
- **The retention store is designed for the future reader.** The reader test passes.

### 4.2 What I would take from the others

| From | What | Why |
|---|---|---|
| **claude** | Move inference and cloud-side compaction | Terminates the renumber churn loop. |
| **gpt** | The five-step exit-path evidence-read fixture | The budget fallback rule. |
| **gemini** | None | The store shape fails the amendment. |

---

## 5. What changed my mind since my own revision

- **The amendment's reader test.** My round-2 store was a stamp-keyed path mirror; it could not drive the future picker. The amendment's requirement for a self-contained record surfaced that gap.
- **Deletion propagation.** The maintainer's "abandoning a capability to buy edge-case safety needs a better reason than the edge case alone" settled it. Tombstones in the manifest are the minimal machinery.
- **bisync's demotion.** The spike must decide; no plan may claim its failure in advance.

---

## 6. The real disagreements

### 6.1 bisync's role

**Architectural.** The spike must run. Until then, the classifier is ours regardless.

### 6.2 Deletion propagation

**Architectural.** The maintainer's amendment settles it. No plan may refuse it.

### 6.3 Store shape

**Architectural.** The amendment's reader test gates it. Only self-contained `operation.json` survives.

---

## 7. The load-bearing claims to test again

| Claim | Test | Plan |
|---|---|---|
| **Move inference terminates renumber churn** | Churn fixture on two devices | claude |
| **Exit-path evidence read fits the budget** | Gate 4 on H700 | gpt |
| **Self-contained `operation.json` drives the picker** | Reader test after manifest overwrite, log rotation, plan removal | kimi |
| **Lifecycle gate survives ES death** | Kill ES while the emulator runs; boot worker's install must be excluded | gpt |
| **Auto KEEP BOTH is deterministic** | Wizard fixture on two devices | kimi |

---

## 8. What the corpus settles vs what the council merely agrees on

**Settled by the corpus:** identity (D-CLOUD-030); manifest shape (D-CLOUD-031); the shipped write paths are newest-wins; the ES primitive behaviours; no `es_savestates.cfg` ships; the allowlist's actual behaviour; `--include` excludes everything unmatched; rclone 1.75.0 with bisync; the budget numbers; the QA WebDAV has no hashes and no modtimes; `cloud_device_id`/`--label`; lock exit 3, no-route exit 4; kid/kiosk hides GAME SETTINGS; ES knows emulator/core at exit.

**Council-agreed, not corpus-settled:** bisync's demotion; queue-and-badge; retention count 3 per unit; boot sync under ES scheduling; `--backup-dir` as the retirement mechanism; the lifecycle gate design; tombstones-in-manifest for pure deletes; `--files-from` transport; 480×320 recognisability.

---

## 9. The plan to build

**Build kimi-revised_plan-r3.md**, with these lifts:

- **From claude:** Move inference and cloud-side compaction under D-CLOUD-030's wording.
- **From gpt:** The five-step exit-path evidence-read fixture and the budget fallback rule.

**Gates in order:**

0. Repair the harness; run the pure classifier fixtures.
1. #19 bench (same-chipset control → cross-chipset → loud/silent).
2. bisync spike (loopback WebDAV dry-run → Dropbox from the RG35XX SP).
3. Zombie-auto reproducer on H700.
4. Exit-pass evidence-read cost on H700.
5. Shadow census on the maintainer's library.
6. `--backup-dir` race fixture on Dropbox and WebDAV.
7. Deletion/compaction convergence fixtures.
8. RG351M 480×320 recognition test.
9. #10 launch-behaviour rehearsal on H700.
10. Sequential two-device offline fork fixture.

**Ship when the gates pass.**