# kimi-revised_plan-r3.md

**Cloud-save conflict resolution in ROCKNIX — the foundation to build (round 3)**

This is a standalone specification. A reader can act on it without any prior round, review, or analysis. Sources are cited as [S01]–[S42] in embed order; full declared paths and the Facilitator's sha256 values are in `corpus.provenance.json` at the end. I did not re-read, re-hash, or execute anything; the embedded corpus is my read-at-time basis. The two maintainer decisions in the orchestrator brief are applied as authoritative.

---

## 1. The foundation in twelve sentences

1. **Identity** is the sha256 of a save's stored bytes; slot and file name are attributes (D-CLOUD-030 [S06]). Saves are classified as **units**: a single file by default; a declared multi-file unit (N64 `.eep/.mpk`, PSX memcard, Dreamcast VMU, PPSSPP game-ID set) is classified as **one whole member map** (path → hash), never as an aggregate of per-file verdicts; a shared container (VMU, memcard) is one unit with `kind: container`, `rom: null`.
2. **Truth channels** are the per-device synced manifests (D-CLOUD-031 [S03], [S06]) plus the local, unsynced agreement record; **agreement is written on verified equality as well as on transfer** — otherwise every save on every existing device prompts once on its first change, and the upgrade is not invisible [S11].
3. **The classifier is ours**: three-way (local *L*, cloud *C*, agreed *A*) per unit, with **move inference** (a hash the agreement knew at path *k* now visible at path *k−1* in the cloud listing or the manifest union is a move, not delete + create) and **bounded tombstones** in the per-device manifest for pure deletions. Never-agreed-and-differ asks; `unknown` is rendered honestly; nothing stamps a file it did not write [S03 §§2–4].
4. **Every write path reads before it writes.** The game-exit pass reads cloud evidence for exactly the changed set (capture knows it by hash) before uploading; the boot/menu passes classify everything before transferring anything; a fork is **refused, queued, and badged** — never resolved by recency, on any path, per the futro's #22 AC (a) [S05 §5].
5. **Capture** runs at game exit, told the game, emulator and core by ES [S41], [S42], hashes locally, and writes the manifest **only when something changed**; the upload carries the exact changed set plus the own manifest via `--files-from` — one spawn, no filter composition, no `--max-age` as change detector.
6. **The wizard** opens from a badge after the non-conflict pre-pass has completed; cloud is always left; KEEP LEFT / KEEP RIGHT / KEEP BOTH; KEEP BOTH is savestates-only through a **checked adapter** over ES's primitives; an auto-state conflict is a resume-point decision with a **deterministic** KEEP BOTH outcome (this device keeps `.state.auto`; the cloud copy becomes a numbered state with its PNG); nothing transfers until COMPLETE; quitting discards decisions; the done page names every discarded copy and says the copies are kept.
7. **Retention is on by default, bounded per save unit, and ships no undo control.** The store at `/storage/.cache/cloud_sync/discarded/<operation-id>/` carries a **self-contained `operation.json`** per operation — the loser's manifest entry verbatim, reason, winner, run id, screenshot path + hash — so the maintainer's later "time machine" tool (a separate issue: the wizard's compare surface pointed at retained versions) can drive a picker from it. V1 builds the store, not the tool.
8. **Deletions propagate when — and only when — intent was recorded.** A player-initiated delete in the savestate manager is hooked and recorded; the next pass retires the cloud copy by copy-verify-delete into a dated sibling (D-CLOUD-026 shape [S06]); other devices retire their local copies on sighting the tombstone. Renumber and compaction propagate by hash inference plus **cloud-side compaction under D-CLOUD-030's existing wording**. **Unexplained absence fails closed**: hold, log, surface; never delete, never silently resurrect.
9. **Concurrency** is the existing cloud lock (`take_cloud_lock`, exit 3 [S29]) plus one local **lifecycle gate** with a fixed acquisition order: a network worker takes the cloud lock, then the gate non-blockingly; a game session holds the gate for local capture, releases it, then requests cloud work; capture never waits for the cloud lock; the gate is never held across a network wait. The boot sync moves under ES's scheduling; the detached `autostart/102-cloud-saves` pair [S35] is retired by the engine, not patched.
10. **Safety**: every destructive step is preceded by its retention copy and its audit-intent line, and followed by an audit-outcome line; a pending-operation record makes an interrupted apply recoverable; `--backup-dir` is the remote retirement mechanism **pending a race fixture**, with a defined fallback if it fails; every guard is proven to fire against a constructed violation [S10].
11. **Migration** is shadow mode → census → enforce. The engine first classifies and logs on the maintainer's devices while the shipped paths run unchanged (D-CLOUD-029 stands [S06]); the census prices the design on the real library; then the engine takes over the write paths wholesale. Equality-seeding (item 2) means existing devices see no prompt storm.
12. **bisync is not the detector.** It may earn the bulk-transfer role for non-conflicting units if the spike passes; the classifier is the manifest three-way regardless. This amends the approach language of #9/#22 [S17], [S18], [S23] and the IA's detection section [S02]; it contradicts no decided row.

---

## 2. What the maintainer's two decisions cost this plan — concessions, named

`kimi-revised_plan-r2.md` was mostly aligned with the amendments (no undo control; retention on, count 3). What it owed, and what this revision changes:

| # | Concession | Refuted or required by | The change in this plan |
|---|---|---|---|
| C1 | **The KEEP BOTH auto sub-choice is dropped.** My r2 asked the player which copy becomes `.state.auto`. | `claude_peer_review-r3.md` D3; `gpt_peer_review-r3.md` §2.7; the maintainer's "I don't want to add more complexity during conflict resolution." | Deterministic rule: the device's resume point stays at `.state.auto`; the cloud copy becomes the next free numbered slot with its PNG; the done page names where it went. A player who wants the cloud copy as the resume point presses KEEP LEFT. |
| C2 | **The exit pass must read before it writes.** My r2 consulted cached manifest claims and accepted that a fork created since the last full pass could be overwritten, with the dated sibling as recovery. | `claude_peer_review-r3.md` D2; `gpt_peer_review-r3.md` §2.1; the futro's #22 AC (a) — *refused*, not resolved [S05 §5]. | §3.3: the exit pass reads cloud evidence for the changed set before any upload. Recoverability is a floor, not refusal. |
| C3 | **The discard store was a stamp-keyed path mirror.** It could not drive the later picker: device of origin and which side won were lost when the winner's manifest entry replaced the loser's and the apply record was disposed of. | `claude_peer_review-r3.md` §1.1–1.2; `gemini_peer_review-r3.md` §1; `gpt_peer_review-r3.md` §1 ("the missing retention contract"). | §3.6: self-contained `operation.json`; PNG travels; per-unit counts; exemptions for pending operations. |
| C4 | **The apply record's fate was unstated** — "presence means interrupted" implied disposal on completion. | `gpt_peer_review-r3.md` §1 table; `claude_peer_review-r3.md` §1.1. | Split in two: a *transient* pending record (removed on completion) and a *permanent* `operation.json` written with the retention copies before the first destructive step. |
| C5 | **Deletion propagation was under-specified and, on one reading, refused.** `gemini_peer_review-r3.md` read my r2 as refusing to propagate ordinary deletions; `gpt_peer_review-r3.md` §2.3 found the receipt's transport undefined (a local unsynced journal cannot tell device B that device A retired path P). | `gemini_peer_review-r3.md` §§1–2; `gpt_peer_review-r3.md` §2.3; the maintainer's "abandoning a capability to buy [edge-case safety] needs a better reason than the edge case alone." | §3.7: recorded deletions propagate as copy-verify-delete into dated siblings. Transport is (a) hash inference for moves/compactions — no record needed, the hash's new location is the signal — and (b) a bounded tombstone list in the synced per-device manifest for pure deletes. No new channel. |
| C6 | **#10 deferred.** My r2 moved per-core directories out of the drop. | `claude_peer_review-r3.md` D6; `gpt_peer_review-r3.md` §2.6; D-CLOUD-024 and S01's milestone scope. | §3.11: #10 stays in the drop, sequenced last, gated on the launch-behaviour rehearsal — with a sharper finding (§3.11) about what the rehearsal must measure. Deferral happens only on rehearsal evidence, as a maintainer scope decision. |
| C7 | **The ops journal was partly justified by `replaces` fidelity across rename-then-edit** — lineage depth the maintainer has set aside. | `claude_peer_review-r3.md` §4 (kimi bullet); the maintainer's one-step-back. | The journal's V1 jobs are exactly two: deletion receipts and pending-operation recovery. Nothing deeper. |
| C8 | **Manifest transport by filtered `--include`, gated on a dry run.** | `claude_peer_review-r3.md` D7; S09's gotcha ("using `--include` at all excludes everything it does not match"). | `--files-from` from capture's exact changed set; staging-directory copy as the fallback; dry-run gate either way (§3.2). |

One misreading to correct: `gemini_peer_review-r3.md` §2 attributes to my r2 the claim that `--backup-dir` "will atomically archive the intervening head." My r2 listed `--backup-dir` as *council-agreed, untested for this use* (as `claude_peer_review-r3.md` D10 confirms). The overclaim was `gemini-revised_plan-r2.md`'s ("recoverable without extra spawns"). The race fixture (§8, gate 6) gates it for everyone; no plan may claim the guarantee yet.

---

## 3. The architecture, part by part

Verdicts on the approach as it stands [S01], then the design.

| Part | Verdict |
|---|---|
| Identity (D-CLOUD-030) | **Endorse**; clarify compaction scope (§3.7) |
| Manifest (D-CLOUD-031) | **Endorse with refinement** (§3.1, §4) |
| Namespace (D-CLOUD-017) | **Endorse**; #10 gated on rehearsal (§3.11) |
| Detection (bisync, #9/#22) | **Replace**: own classifier; bisync a candidate transport (§3.10) |
| Presentation (IA rev 4 [S02]) | **Endorse with amendments**: queue-and-badge; retention ON; deterministic auto KEEP BOTH; rev-5 corrections (§3.4) |
| Merge (#24) | **Endorse** via checked adapter, never raw primitives (§3.5) |
| Audit (D-CLOUD-027) | **Endorse**; intent + outcome lines; the audit is not the store's index (§3.8) |
| Write paths (D-CLOUD-029) | **Endorse the row**; replace wholesale via shadow → enforce (§3.9) |
| Compatibility (#19, D-CLOUD-025) | **Endorse**; badge severity waits for the bench (§3.11) |
| Snapshots (#25) | **Endorse V2**; the retention store is separate machinery; #25 still owes its allowlist rule when it lands [S03 §8] |

### 3.1 Identity, agreement, and the classifier

- **Units.** Default unit: one file (a state with its PNG as an attribute — the PNG is not identity, D-CLOUD-030 [S03 §1]). Declared units, shipped as a small table keyed by system/emulator, covering exactly the special layouts the allowlist already names [S32]: `n64/save/*`, `psx/memcards/*`, `dc/shared/savefiles/**`, `psp/PPSSPP/**`. A declared unit's member set is checked against the allowlist at declaration time — a unit containing a member the `*.db` rules exclude [S32] can never sync that member, and the table must say so rather than discover it (credit `gpt-revised_plan-r2.md` §12, via `claude_peer_review-r3.md`).
- **Member-map classification.** For a declared unit, build three maps — M_local, M_cloud, M_agreed (path → hash over the complete member set). The three-way rules of [S03 §3] apply to the maps as wholes: equal → nothing; only one side's map differs from agreed → apply that side's whole map (install *and remove* members so the destination holds the complete selected map, never a merge of two maps — credit `gpt_peer_review-r3.md` §2.5); both differ → divergent → wizard. The disjoint-member fork (agreed (a₀,b₀), local (a₁,b₀), cloud (a₀,b₁)) is a fork under this rule and invisible to per-file aggregation — `gemini-revised_plan-r2.md` §2.1's "any member divergent" rule misses it, as `claude_peer_review-r3.md` D1 shows. Pure classifier fixture, no hardware, ten minutes; it settles toward member maps.
- **Moves.** Before any "device-only → upload" or "cloud-only → download" verdict, check whether the hash exists at another path in the cloud listing or the manifest union. If so: it is a move; re-key locally; do not transfer; compact per D-CLOUD-030. This extends the schema's "a move is not a conflict" [S03 §3] from conflict-avoidance to transfer-suppression, and it is what terminates the renumber churn loop without a journal (credit `claude_peer_review-r3.md` D4).
- **Equality writes agreement.** When a pass verifies L == C by content for a path with no agreement, it writes agreement (refinement of D-CLOUD-031; §4). The schema as signed writes agreement only on upload/download [S03 §§2, 9]; devices synced by the shipped scripts have L == C everywhere and no agreement, so without this the engine's first change to any save is "never agreed → ask" (credit `gpt-revised_plan-r2.md` §4.1 via `claude_peer_review-r3.md` §3 item 10). On hashless backends, seeding agreement requires a matching foreign-manifest claim with matching size+mtime, or download-and-hash; otherwise no agreement is written and the first real divergence asks. Fail toward asking, never toward silent.
- **Unknown and foreign artifacts.** A file with no entry anywhere is `unknown` in every provenance field and still classified by hash [S03 §4]. A Dropbox "conflicted copy" or Syncthing `.sync-conflict-` file is never offered as a version and never moved by us (D-CLOUD-022; [S04] §3.5) — and the saves allowlist currently admits them (§11, filing F2).
- **Cloud member maps must be coherent.** Readers assemble a cloud unit's member map from the listing plus foreign manifests and require all members to match **one** foreign manifest's declared map; a mixed set (interrupted publication) matches nothing, is never installed or offered as a coherent unit, and is surfaced as incomplete (credit `gpt_peer_review-r3.md` §3.1). Manifest-last publication is a hint for readers, never a proof.

### 3.2 Capture and manifest transport (#21)

- ES calls capture at the existing exit point [S41], passing game path, `getEmulator(true)`, `getCore(true)` [S42] — told, not discovered (S03 §9). Standalones pass their own name as core.
- Capture takes the **lifecycle gate** briefly (the emulator process has exited; the gate excludes a concurrent sync install), hashes the game's save/state paths, re-keys moved entries (same hash, new path → update the key, `replaces` and `captured_at` unchanged [S03 §6]), writes new entries for changed files, and **writes the manifest file only when an entry changed** — never to bump `generated_at` (kept from `kimi-revised_plan-r2.md`; credited in `gpt_peer_review-r3.md` §4). A metadata-only exit then costs zero spawns and manufactures no history.
- `core_build` comes from `/usr/share/rocknix/core-pins`, emitted at image build from `LIBRETRO_CORES` × `get_pkg_version`, with a core→package map and `"unknown"` when unmapped [S03 §9].
- **Transport**: the exit upload is `rclone copy --files-from <changed saves + own manifest> --no-traverse --backup-dir <sibling>` — one spawn, no filter composition, and `--max-age` is retired as the change detector (the shipped script's own comment admits wrong-mtime files escape it [S29]). `--files-from` is not covered by the corpus; the dry-run gate (§8, gate 0) proves it composes with `--no-traverse` and `--backup-dir` on 1.75.0, with a staging-directory copy as the fallback. Downloads exclude the own manifest by exact path; a foreign manifest is never republished, and the cloud's copy of our manifest never overwrites locally captured unpublished entries.

### 3.3 The three write paths, replaced

**Game-exit pass** (the watched ~5 s path [S09], D-CLOUD-028):
1. Capture (above). Changed set empty → stamp, done. **Zero rclone spawns** — better than the shipped `--recent`, which spawns once even when idle [S29].
2. Take the cloud lock non-blockingly; held → exit 3, SKIPPED, no stamp [S29].
3. **Evidence read, changed set only**: one `lsjson --hash` per distinct parent directory (typically one), matched against the manifests' `remote_hash` claims [S03 §6]. Hashless backend: the listing yields names/sizes; any changed path whose cloud presence and equality cannot be established from the listing plus a foreign-manifest claim is **downloaded and hashed** (scoped `--files-from` to a staging dir; tens of KB). A listing that answers nothing is *unknown*, never "no conflict" (blindspot 22 [S07]).
4. Classify each changed unit: cloud head == agreement or absent → upload with `--backup-dir`; cloud head ≠ agreement → **fork: do not upload; queue; badge; typed outcome** (§3.8). Evidence unreadable → defer, report honestly, fail closed.
5. Upload (`--files-from`, one spawn), verify, advance agreement, stamp, audit.

Budget: idle ≈ 1–2 s (local hashing only); one changed save ≈ the ~7 s the corpus already prices [S09], plus one scoped listing. **Gate 4 measures it on the H700.** If the evidence read breaks the budget, the fallback (credit `gemini-revised_plan-r2.md` §4) is: upload only units whose cloud head is *verified* equal to agreement, defer the rest to the full pass — **never upload over an unread head**. AC (a) holds under every outcome.

**Boot pass / SYNC row / menu rows** (full passes): lock → classify everything (capture full scan; download foreign manifests; cloud listing; on hashless, size+mtime hints plus foreign-manifest claims, with download-and-hash only for candidates whose decision needs equality — equal size is not an equality verdict, credit `claude_peer_review-r3.md` §3 item 10's implication and `gpt_peer_review-r3.md` §2.2) → run the **pre-pass** (all non-conflict verdicts: cloud-only down, device-only up, one-way changes, moves folded, compactions) → queue conflicts → badge. Downloads/installs happen only when no game session is live (the gate): installing a save while RetroArch runs is pointless — the exit flush overwrites it — and racy. Uploads re-hash immediately before transfer; a file that changed since capture is re-classified, never uploaded stale.

**Replaced-mechanism inventory** (the futro's #22 AC (f) [S05 §4]): the `--update` newer-on-destination skip → replaced by agreement-based one-way rules (strictly safer: agreement, not recency); restore-before-backup ordering → preserved inside one pass (downloads apply before uploads); the lock → kept; the `--recent` window → replaced by capture's exact set; the stamps in `/storage/.cache/cloud_sync/` → kept, same files, same meanings (D-UI-018's rows read them [S06]).

**Typed outcomes**: the engine maps rclone's exit codes internally and emits its own — 0 applied; 3 lock-held skip; 4 no-route skip; 5 conflicts pending (badge); 6 evidence unreadable, deferred; 1 error — because rclone's own 3/4 collide with the scripts' reserved meanings and `clean_exit` stamps any code [S29], [S40] (filing F3).

### 3.4 Presentation and resolution (#23)

- **Trigger: queue-and-badge.** IA rev 4's "a sync that reports conflicts opens the wizard" [S02] is right for a menu-initiated sync and wrong for boot and game exit; unattended passes queue and badge (the CLOUD SETTINGS row, the SYNC row's last-run line, and #37's savestate-manager tile reading the manifests [S28], [S04] §3.5). Kid/kiosk hides GAME SETTINGS [S13]; nothing destructive happens without the wizard; unlocking resolves. Council-agreed, not corpus-settled → IA rev 5.
- **Pre-pass gate**: the wizard refuses to open until the non-conflict pre-pass has completed and says so (futro AC on #23 [S05 §5]); an interrupted pre-pass is ordinary idempotent transfers, resumed next pass.
- **The screen**: as IA rev 4 — cloud always left; screenshot or glyph; date/time (local, with the `clock_synced` warning), device label + model, emulator/core + build per side; no size, no play time; KEEP BOTH dimmed with a reason on in-game saves; auto conflicts labelled as the resume-point decision [S03 §4]; `unknown` rendered honestly. Compatibility badge severity waits for #19 (D-CLOUD-025).
- **KEEP BOTH on an auto conflict: deterministic** (C1). This device keeps `.state.auto`; the cloud copy becomes the next free numbered slot with its PNG; the done page names the slot.
- **Nothing transfers until COMPLETE; quitting discards decisions** [S02]. The done page names each discarded copy per game **and says the copies are kept** (the audit line precedes the deletion [S05 §5]). **No undo control anywhere in the flow** — the maintainer's decision. The restore tool is a separate issue with the maintainer's shape: the wizard's compare-and-choose surface pointed at a game's retained versions, reached from outside the moment of resolution.
- **Layout at 480×320 first**, `tools/vm-visual-qa` frames at both sizes, and an RG351M recognition test with real thumbnails (§8, gate 8) [S05 §5].

### 3.5 Merge: the checked adapter, never the raw primitives

Verified against the embedded ES sources:

- `getNextFreeSlot()` returns **−99 for an auto-only repository** — the loop scans slots 99999→0 and an auto state (slot −1) never matches [S37]. That is the *ordinary* case for the commonest conflict kind [S03 §4], not an edge case. The adapter: auto-only → allocate from `firstslot`; `isEnabled` false (non-RetroArch emulator [S37]) → KEEP BOTH disabled with a reason; any other −99 → refuse with a reason. Blanket rejection or blanket conversion of −99 to 0 are both wrong (credit `gpt_peer_review-r3.md` §2.7).
- `copyToSlot()` discards the `renameFile`/`copyFile` results and returns `true` unconditionally [S38]. The adapter re-reads the destination and verifies the hash after every copy.
- `makeStateFilename(fullPath = true)` derives the destination from the **source's parent** [S38] — a cloud state staged in `/tmp` would "merge" into `/tmp`. Stage in the real save directory under a temp name matching neither ES regex (`X.state1.tmp-<id>` matches neither `^(.*)\.state($|[0-9]+)$` nor the auto pattern [S39]; credit `claude_peer_review-r3.md` §3 item 3).
- Slot allocation reuses ES's `getNextFreeSlot()` (inherits `firstslot` and future conventions [S02]) behind the adapter, with **in-memory reservations** so two merges in one wizard run for one game allocate distinct slots; the pre-pass gate makes free-on-device equal free-on-both [S02].
- The PNG moves with the state — `copyToSlot` already pairs them [S38] — and the adapter verifies both.

### 3.6 The retention store (the amendment's design)

- **Home**: `/storage/.cache/cloud_sync/discarded/`. Alternatives are worse: `/storage/.config` is swept into `backuptool`'s archive [S04 §1]; anything under `/storage/roms` is admitted by the allowlist [S32]. But `.cache` is the established home for *regenerable* state [S02] and **these bytes cannot be regenerated** (credit `gpt-revised_plan-r2.md` §12 via `claude_peer_review-r3.md` §1.2). So the location comes with a named rule: **this subtree is not a cache** — no schema-version rebuild ever wipes it; the retention count is the only eviction. Decided with the shape, with the maintainer.
- **Layout**: `discarded/<operation-id>/` where operation-id = `<utc>-<device-id>-<seq>` (no wall-clock uniqueness assumption — credit `gpt_peer_review-r3.md` §1). Retained files sit under their sync-root-relative paths; a state's PNG sits beside it [S03 §4].
- **`operation.json`** (one per directory, written **before** the first destructive step): operation id; kind (`wizard-resolution | sync-retirement | es-delete`); and per retained copy: the loser's **manifest entry verbatim** (kind, sha256, size, slot, system, rom, emulator, core, core_build, device id/label/model/family, captured_at/local, clock_synced, screenshot path + sha256 — all present at discard time), `reason` ∈ {`conflict-loser`, `superseded-by-download`, `es-delete`}, `winner` = {side, path, sha256, device} or null, and the wizard's decision summary for wizard operations.
- **Retention rule** (default ON; count is a **proposal**, council-agreed not corpus-settled — the maintainer said "bounded by a count"): per save unit, keep the last **3** `conflict-loser`/`es-delete` copies and the **1** most recent `superseded-by-download` copy. Compaction and renumber retirements are **not stored** — verified-identical bytes survive at the retained slot; audit lines only (D-CLOUD-030's compaction is lossless by construction [S06]). **Exempt from eviction**: anything referenced by a pending operation record (credit `gpt-revised_plan-r2.md` §6.3 via `claude_peer_review-r3.md` §1.2).
- **Remote analog**: retirements on the cloud go to `SYNCPATH-replaced/<device-id>/<stamp>/` (outside the sync root, so it never syncs), same reasons and counts, pruned on full passes by the device that wrote them.
- **The reader test** (credit `gpt_peer_review-r3.md` §1): resolve a conflict; then overwrite the producer's manifest entry, renumber the live slots, rotate the audit log, remove the completed pending record. A test-only reader must still identify the game, render the retained candidate from its PNG, name its producer, and say which side won. This store passes; a stamp-keyed mirror does not.

### 3.7 Deletion, renumber, compaction — and the fail-closed half

- **Recorded intent propagates.** One load-bearing hook: the player-initiated delete in the savestate manager (attach at the `GuiSaveState` delete action — the call site is **not embedded**; §12 — *not* at `SaveState::remove()`, which `onGameEnded` also calls for its own cleanup [S38] and would record false deletions). The hook hashes the file at delete time and records {path, sha256, when}. The next pass retires the cloud copy by copy-verify-delete into the dated sibling and appends a **tombstone** {path, sha256, retired_at, reason} to the own manifest's bounded tombstone list. A peer sighting the tombstone: local hash == tombstone hash → retire locally into its own store, drop agreement; local hash ≠ tombstone hash → a divergent version the tombstone does not name → ordinary classification (upload or conflict). **A stale tombstone never authorizes retiring different bytes** (the fixture in §8, gate 7).
- **Renumber and compaction need no tombstone.** The hash survives at the new/lower path, visible in the listing and the manifest union; move inference (§3.1) re-keys and compacts locally. The cloud copy is compacted the same way — D-CLOUD-030 says "after a sync, two slots of one game holding the same hash are compacted: the higher slot is removed" and does not say *locally* (credit `claude_peer_review-r3.md` D4). Cloud-side compaction by copy-verify-delete terminates the churn loop with no journal.
- **D-CLOUD-030 clarification** (§4): compaction concerns numbered slots of one game in one repository, after hash re-verification, logged; it **never collapses an auto resume point into a numbered slot** (credit `gpt-revised_plan-r2.md`, via `mistral_peer_review-r3.md` §3).
- **Unexplained absence fails closed.** No receipt, no inference, no tombstone → hold the local copy, do not upload, do not delete, log, and surface as an anomaly at the next wizard run. A RetroArch-menu deletion (invisible to ES) lands here: held, not propagated — the stated residual, and the player can delete again via the manager. The maintainer: failing closed on unexplained absence is cheap and expected; abandoning propagation for it was not sufficient reason.
- **Tombstone lifetime**: pruned with the same per-unit retention window. A device returning after the window with the retired hash re-uploads it; other devices see an ordinary one-way transfer and the file returns — bounded, non-destructive, and the next deletion propagates the same way. Stated, accepted.

### 3.8 Safety, audit, and the interrupted apply

- Apply sequence per COMPLETE: freeze the plan (decisions, operands, destinations, hashes) → write the **pending record** → per unit: stage and hash-verify the winner → retention copy + `operation.json` → **audit-intent line** → install (staging rename; KEEP BOTH via the adapter) → publish remote with `--backup-dir`, retire the remote loser to the sibling → verify publication → advance agreement → **audit-outcome line** → remove the pending record. Intent and completion are separate lines; the audit log (D-CLOUD-027, append-only, rotated 1 MiB keep-one [S06]) is a support artefact, never the store's index.
- Kill-point fixtures at the two named stages (credit `gemini-revised_plan-r2.md` §6): after local replacement before remote publication; after publication before agreement advance. Recovery reads the pending record, verifies actual state by hash, and completes or repairs — never re-asks (decisions were made at COMPLETE), never leaves a half-installed unit consumable by the classifier. Honest residual: a kill between two member renames of a multi-file unit leaves a mixed unit until the next engine run repairs it; the window is two rename syscalls; the pending record makes the repair deterministic.
- `--backup-dir` is proven in the corpus only in the shipped mirror mode [S29]. The race fixture (§8, gate 6) has three outcomes (credit `gpt-revised_plan-r2.md` §6.3 via `claude_peer_review-r3.md` D10): pass → ship as designed; unsupported-or-ambiguous on a backend → no canonical replacement on that backend, forks surface via lineage next pass; loses a head → stop and redesign the retirement step.

### 3.9 Migration off today's write paths

D-CLOUD-029 stands [S06]; `mistral-revised_plan-r2.md`'s "withdrawn" reopens a decided row without the argument S01 requires, and misattributes the withdrawal (credit `claude_peer_review-r3.md` §4). The sequence: (1) engine ships in **shadow mode** — full classification and logging, zero transfers — beside the shipped paths, on the maintainer's devices only; (2) the **census** (§8, gate 5) prices verdict distribution, fork rate per kind, auto share, unknown rate, evidence-read cost, store growth; (3) **enforce**: the boot pair, the exit call [S41], and the menu rows call the engine; the shipped scripts keep the system-backup and content tiers, which are out of scope. Upgrade invisibility comes from equality-seeding (§3.1): the maintainer's devices, synced by the shipped scripts, have L == C mostly — zero prompts; genuinely divergent pre-existing files ask once, with `unknown` shown honestly [S11].

### 3.10 bisync's role

Demoted to candidate transport; the spike decides (§8, gate 2): fixture matrix against the loopback WebDAV (D-QA-002) then Dropbox from the device — compressed states (`#RZIPv`), a device-side rename, a genuine both-sides change, an interrupted run; record `--conflict-resolve none` output shape; confirm `--recover`/`--resilient` avoid `--resync`; the detector never runs `--resync` on its own; `--conflict-loser` never renames a savestate (its suffix breaks `{{romfilename}}.state{{slot}}` [S02], [S23]); workdir named explicitly at `/storage/.cache/rclone/bisync` [S05]; every call under the lock; a dry-run listing grepped for `conflict` as the guard (the futro's #22 ACs (b)–(e) [S05 §5]). If it passes, bisync may carry non-conflicting bulk transfers; the classifier and the agreement record are ours regardless — bisync's own agreement state is then unused, and the spike must confirm it cannot conflict with ours (S01 §4 item 2).

### 3.11 #10 and #19 sequencing

- **#19 first** (D-CLOUD-025): the bench protocol [S08], same-chipset control on the two H700s before the cross-chipset matrix, Test C (loud vs silent) even if A and B pass. The badge's severity waits; `core_build` and `device.family` are in the schema regardless.
- **#10 last in the drop**, gated on the **launch-behaviour rehearsal** — and this plan sharpens what the rehearsal must measure. The XML parser **hard-codes `racommands = false`** and defaults `autosave`/`incremental` to false, while the compiled `Default()` sets all three true [S39]. So shipping any `es_savestates.cfg` — no matter what it says — retires the `racommands` branch of `setupSaveState()` [S38]: the auto `.bak` dance at launch and restore at exit. No config can express `racommands = true`. Rehearsal questions: (1) with the XML path, does launching from a numbered slot still produce a correct auto at exit, and does the pre-launch auto survive — if not, #10 needs an ES patch making `racommands` configurable, not a config file; (2) does RetroArch honour the per-core directory (`savestate_directory`; `setsettings.sh` is **not embedded**, §12) — two consumers, one layout [S04 §3.2]; (3) are old flat states still discovered — `defaultCoreDirectory` dual-scans the default core only [S39], so non-default cores need the logged copy-verify-delete migration (D-CLOUD-026 shape), decided on rehearsal evidence. If the rehearsal cannot preserve launch behaviour, *that finding* — not the wizard's convenience — goes to the maintainer as a scope decision (credit `claude_peer_review-r3.md` D6).

---

## 4. Register changes (each stated as a refinement citing the old row)

- **D-CLOUD-032 (refines D-CLOUD-031):** agreement is written on verified equality as well as on transfer; a bounded tombstone list joins the per-device manifest; `kind: container` with `rom: null` for shared units; declared units classify as whole member maps; the manifest is written only on change and rides uploads via `--files-from`. Argument: §3.1–3.3; the equality gap is the sharpest hole in the signed schema (`claude_peer_review-r3.md` §3 item 10).
- **D-CLOUD-033 (refines D-CLOUD-030):** compaction concerns numbered slots of one game in one repository, after re-verification, logged; never collapses an auto; applies to the cloud copy by copy-verify-delete. Argument: §3.7; terminates the churn loop.
- **D-CLOUD-034 (new; supersedes IA rev 4's "keep discarded saves is off by default" [S02], by the maintainer's amendment):** retention ON by default, bounded per unit (3 proposed), store shape per §3.6, no undo control in V1, restore tool as its own issue.
- **D-CLOUD-035 (new; amends #9/#22 approach language, contradicts no decided row):** detection authority is the manifest three-way classifier; bisync is a candidate transport pending the spike; the wizard trigger is queue-and-badge for unattended passes (IA rev 5).
- **D-CLOUD-036 (new; cites D-CLOUD-026, D-CLOUD-030):** recorded deletions propagate as copy-verify-delete into dated siblings; renumbers/compactions propagate by hash inference and cloud-side compaction; unexplained absence fails closed.
- **D-CLOUD-029: stands.** No reopening. **D-CLOUD-017, 024, 025, 027: stand.**

---

## 5. Corpus-settled vs council-agreed vs unmeasured

**Settled by the corpus** (build on these): identity and compaction (D-CLOUD-030); manifest shape and fields (D-CLOUD-031); the shipped write paths are newest-wins ([S35], [S29] `--recent`; blindspot 28 [S07]); the ES primitive behaviours (§3.5 [S37], [S38]); no `es_savestates.cfg` ships and the XML path flips `racommands`/`autosave`/`incremental` ([S39], [S04] §3.2); the allowlist's actual behaviour ([S32], [S05] fixture); `--include` excludes everything unmatched [S09]; rclone 1.75.0 with bisync and its workdir [S05]; the budget numbers [S09], D-CLOUD-028; the QA WebDAV has no hashes and no modtimes ([S04], [S29]); `cloud_device_id`/`--label` ([S34], D-CLOUD-009); lock exit 3, no-route exit 4 [S29]; kid/kiosk hides GAME SETTINGS [S13]; ES knows emulator/core at exit ([S41], [S42]).

**Council-agreed, not corpus-settled** (flagged; each has a gate): bisync's demotion ◊; queue-and-badge ◊; retention count 3 per unit ◊; boot sync under ES scheduling ◊; `--backup-dir` as the retirement mechanism on every backend ◊; the lifecycle gate design ◊; tombstones-in-manifest for pure deletes ◊; `--files-from` transport ◊; 480×320 recognisability ◊.

**Unmeasured, with the experiment named**: bisync's behaviour (gate 2); `--backup-dir` under a two-writer race (gate 6); exit-pass evidence-read cost (gate 4); auto-conflict frequency and verdict distribution (gate 5 census); the zombie-auto mtime consequence — the copy utility's timestamp behaviour is not embedded (gate 3); `--files-from` composition (gate 0); the XML path's real launch behaviour (gate 9); thumbnail recognisability at 480×320 (gate 8).

---

## 6. Known unknowns → resolution plans (the problem statement's §4)

1. **Chipset axis; loud vs silent** → #19 bench [S08], same-chipset control first, before badge design. Outcomes: portable → badge is a convenience; silent failure → badge is a safeguard and the cross-core/chipset toggles get destructive framing.
2. **bisync behaviour** → gate 2 spike; dry-run first; the classifier does not wait on it.
3. **Is the auto state the commonest conflict?** → gate 5 census measures; the wizard treats `kind: auto` as a resume-point decision regardless [S03 §4].
4. **Pre-pass gate sufficiency** → the wizard refuses to open until the pre-pass completes (AC); interruption is idempotent transfers; the KEEP BOTH fixture asserts no slot collision across two devices.
5. **No `es_savestates.cfg` ships** → #10 creates it *and* moves RetroArch's `savestate_directory`; rehearsal gate 9 with the three questions of §3.11.
6. **`core_build` not on the device** → #21 emits `/usr/share/rocknix/core-pins` at image build; ES passes emulator/core at exit [S03 §9].
7. **`BACKUPPATH == RESTOREPATH`** → assumed [S03 §9]. Split roots: two-way reconciliation **refuses with a clear message**; the shipped config documents split roots as a restore-elsewhere feature [S33], so a **one-way import** is preserved as a separate operation that writes no agreement and retains overwritten destination data (credit `gpt_peer_review-r3.md` §2.7).
8. **Standalone layouts** → the declared unit table (§3.1) covering exactly the allowlist's special dirs [S32]; containers present as one row; a conflict on a multi-file save presents as one decision over the whole map.
9. **480×320** → layout at 480×320 first; frames at both sizes; RG351M recognition test (gate 8).
10. **Two devices online at once** → not enforced; the lock is per device; `--backup-dir` plus lineage (agreement mismatch → fork next pass) is the net; gate 6 measures the mechanism; the audit log shows violations. Accepted per the futro [S05 §5].
11. **The round-trip suite has never run** → repair the harness (§11, F4), run on GENERIC_X64 against WebDAV and MinIO before enforce ships; add the manifest step [S04 §3.6], the two-device both-sides-changed step [S05 §5], the exit-pass fork-refusal fixture, and the churn-termination fixture.

## 7. Unknown unknowns — the failure and the cheapest experiment that exposes it

- **Classification bugs in our own engine.** The most dangerous unknown is the one we ship. Cheapest exposure: **shadow mode on the maintainer's real devices** (gate 5) — classify and log for a week beside the shipped paths; every wrong verdict appears in the log before it can touch a byte.
- **A JSON reader in ES is asserted, not shown.** The futro's build-vs-adopt table claims "pugixml/JSON already in ES" [S05]; the corpus embeds no ES JSON parser. Cheapest exposure: grep the ES tree for the JSON library before #22's output format is frozen; fall back to a trivial line-oriented format the wizard parses in fifty lines.
- **Clock skew making `captured_local` misleading.** `clock_synced` exists for this [S03 §6]; the census measures how often devices boot unsynced; the wizard renders the warning rather than trusting the time.
- **Store growth on a small card.** Worst case ≈ 3 × (tens of KB states + 64 KB SRAM) per unit; trivial — but the census measures real growth, and the count selector is the bound [S02].
- **A same-device-id manifest fork (cloned card).** Warn and refuse — fail closed; no generation-counter machinery (credit `claude_peer_review-r3.md` §6). Edge case; the audit log will show if it ever happens.

## 8. What must be proven on hardware before any of it is built — in order

0. **No hardware:** repair the harness (F4); run the pure classifier fixtures (member-map fork; move inference; stale tombstone vs new occupant; never-agreed-ask; unknown-both).
1. **#19 bench** (H700 ×2 control → cross-chipset → loud/silent) — before the badge is designed.
2. **bisync spike** (loopback WebDAV dry-run → Dropbox from the RG35XX SP) — before the transport choice.
3. **Zombie-auto reproducer on H700**: launch a numbered slot while the shipped boot pair runs; observe the auto handling and the copy utility's timestamp behaviour [S38], [S35] — validates the race the lifecycle gate closes.
4. **Exit-pass evidence-read cost on H700**: spawns, round trips, seconds for the scoped listing and the hashless scoped download — settles read-before-write vs the verified-only fallback (§3.3).
5. **Shadow census** on the maintainer's library, one week, both devices — before enforce.
6. **`--backup-dir` race fixture** on Dropbox and WebDAV with the three-outcome contract (§3.8).
7. **Deletion/compaction convergence fixtures**: churn termination across three passes on two devices; highest-slot delete propagation; stale tombstone meets a different occupant.
8. **RG351M 480×320 recognition test** with real thumbnails.
9. **#10 launch-behaviour rehearsal** on H700 (§3.11's three questions).
10. **The sequential two-device offline fork** (agree H₀; B publishes Hᵦ; A plays offline and exits) — pass condition: A's exit pass uploads nothing, both heads unchanged, the badge shows one conflict; then resolve and verify the loser's `operation.json`. This is AC (a)'s constructed fixture (credit `gpt_peer_review-r3.md` §2.1).

## 9. Load-bearing vs optional

**Load-bearing** (wrong = unsafe milestone): identity/agreement/classifier including equality-writes-agreement, member maps, move inference; read-before-write on every path; the checked ES adapter; the lifecycle gate and lock order; the retention store's self-contained `operation.json`; fail-closed absence with tombstones for pure deletes; the pending-operation record; the three day-one filings the engine must not inherit (F1–F3).
**Optional / later**: bisync as transport; #10 (last, gated); the badge's severity; the restore tool (V1 ships only the store); remote sibling pruning cadence; cross-device resolution receipts (V2 — the ordinary outcome is correct and retained without them; credit `claude_peer_review-r3.md` D5); the move hook (fidelity only; the delete hook is the load-bearing one).

## 10. What is not built

No undo control in V1 (maintainer). No SQLite index — all four reviews converge; #20's open question is answered: no. No vector clocks or generation counters beyond fail-closed warn on a same-id manifest fork. No protected-publication/two-phase commit — the one-player model does not earn it on a 5 s path. No full staging mirror — blind to same-size changes on hashless backends; candidate-scoped reads. No semantic binary merging. No 99-slot cap — 99999 exists; the adapter owns −99. No kid/kiosk resolver. No progress heuristics selecting a winner — the cardinal rule [S17]. No daemon — systemd units and ES calls only [S01]. No move hook justified by lineage. No `--include`-based manifest transport. No probe replacing `ip route` — D-CLOUD-028 [S06]; a literal-IP endpoint can use `ip route get`, a hostname without a default route is unreachable anyway (credit `claude_peer_review-r3.md` D8).

## 11. Day-one filings (bycatch, not baggage)

- **F1 — `RCLONEOPTS` without `--filter-from` bypasses the allowlist.** A non-empty `RCLONEOPTS` replaces the default option set *including* `--filter-from` [S29 `backup_game_saves`]; a user edit then syncs `/storage/roms` with only `--exclude=bios/**`. Fix: always append `--filter-from`, asserted non-empty at the point of use (blindspot 24's rule [S07]). (Kept from `kimi-revised_plan-r2.md`; verified by `gemini_peer_review-r3.md` §3.)
- **F2 — The saves tier admits conflict artifacts and transients.** `+ /savestates/**` takes `.state.auto.bak`; `+ /**/*.srm` takes `X (conflicted copy).srm` [S32]; the shipped scripts carry no exclusion [S29], [S30] — D-CLOUD-022's fix reached only the content tier. Add scoped exclusions to the defaults (`- /savestates/**/*.bak`, `- /**/*conflicted copy*`, `- /**/*.sync-conflict-*`) and enforce them in the engine's code, not only in the filter file (user rules precede defaults [S31]).
- **F3 — Exit-code typing.** rclone's 3/4 collide with the scripts' reserved meanings; `clean_exit` stamps any code [S29]. The engine emits typed outcomes (§3.3).
- **F4 — The round-trip harness cannot pass as embedded, and would harm a configured device.** It writes `rclone.conf` wholesale before asserting the first remote and never restores it; asserts `{device_id}/{ARCHIVE_NAME}` where the uploader stamps undated names as `${stamp}-${base}` [S29]; reads the archive back at the original path where restore writes the dated name [S30]; looks for `*-*_BACKUP.tar.gz` the fixture never creates [S36] (credit `claude_peer_review-r3.md` §3 item 13). Fix: back-up-and-restore around `rclone.conf`; assert the first remote against the merged config; align archive-name expectations; reconcile the content fixture with D-CLOUD-019's ES-declared membership (credit `mistral-revised_plan-r2.md` via `gpt_peer_review-r3.md` §4).
- **F5 — Boot liveness still pings google.com** [S35] — pre-existing; filed on #7 [S04 §3.7]; the engine's boot pass replaces it rather than patching it.
- **F6 — IA rev 5 text**: the "checked, not assumed" paragraph is wrong about `getNextFreeSlot()` for the auto-only case [S02] vs [S37]; the trigger, the retention default, and the done-page wording change per §3.4.

## 12. Gaps surfaced to the orchestrator

Not embedded, and depended on: `GuiSaveState.cpp` (the delete hook's attach point), `SaveState.h`/`SaveStateRepository.h` (default arguments), `Paths.cpp`, and the filesystem copy/rename utilities (timestamp behaviour for gate 3). rclone 1.75.0 documentation or source for bisync, `--backup-dir`, `--files-from`, and filter ordering (gates 0, 2, 6). ES startup ordering relative to network readiness, and the `autostart/102-cloud-saves` handoff (the boot pass moving under ES). `setsettings.sh` and the shipped `retroarch.cfg` (`savestate_directory`, `savestate_auto_save`; the #10 two-consumer layout; auto-state frequency). `cloud_sync.conf.defaults`, `cloud_sync-rules.txt.defaults`, the content scripts, `cloud_setup`, `backuptool`, `tools/cloud-test-backend`. The four round-2 plans themselves (including `kimi-revised_plan-r2.md`) are not embedded; this plan restates its own positions and never relies on them as evidence.

## 13. Credits

From `gpt_peer_review-r3.md`: read-before-write on the exit pass (the five-step fixture); the retention contract and its reader test; coherent member maps; split-root import preserved; the content-fixture reconciliation. From `claude_peer_review-r3.md`: the D2/D3/D4/D6/D7 settlements; equality-writes-agreement as the schema's sharpest gap; cloud-side compaction under D-CLOUD-030's wording; the store's non-disposable rule; the staging-name regex check; the harness defect list. From `gemini_peer_review-r3.md`: the budget fallback rule; the two named kill points; the deletion-propagation push that the maintainer's amendment settles. From `mistral_peer_review-r3.md`: `kind: container`; the gate-table shape; the IA-text corrections. Kept from `kimi-revised_plan-r2.md`: the three shipped hazards (F1–F3); write-only-on-change capture; the corpus-vs-council table; the churn fixture; "a deliberately restored file is a new version, not a stigmatized one" — a restore from the store is an ordinary new version to the classifier.

---

## `corpus.provenance.json`

```json
{
  "artifact": "kimi-revised_plan-r3.md",
  "role": "council member, round-3 revised approach",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 correspond to the ordered, same-index source_file_paths and source_file_hashes arrays",
  "reviewed_artifacts": [
    "claude_peer_review-r3.md",
    "gemini_peer_review-r3.md",
    "gpt_peer_review-r3.md",
    "mistral_peer_review-r3.md"
  ],
  "reviewed_artifact_hashes_provided": false,
  "own_prior_revision_embedded": false,
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "separate_declared_path": null,
    "sha256": null,
    "applied_as_authoritative": true
  },
  "peer_material_use": "Judged on merits against the embedded corpus and the maintainer's two decisions; not treated as evidence about councils, models, or this deliberation.",
  "source_file_paths": [
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/blindspot-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/savestate-compat-test.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/upgrade-and-install.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/es-native-ui.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/cloud-sync-changelog.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/CLAUDE.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/rclone-bisync-planning.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-11.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-9.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-10.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-19.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-20.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-21.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-23.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-24.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-25.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-35.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-37.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/ThreadedCloudSync.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp"
  ],
  "source_file_hashes": [
    "7e8c1076ee1735925af1d59dded61d23146c5c8e9fb2aae2be53d5afca26b6b7",
    "5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9",
    "2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce",
    "56f6c54c013c5476f638a0dee5f2201e6a4ad021b47c674010bdc392665bfd48",
    "d22a49e73fe5d25cafea7646ec353e57a3da95f6ef84d4b86249c91bb170cf43",
    "0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640",
    "1514b33d61ab148d4e59bf446af03d973792a0673969df471b41c021edc9cbd8",
    "4d0b9d21ee5c9c26a25da5c169d9e99b83c18457732bd9471078c2d508b1d1bb",
    "7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353",
    "e8ee62ea5af749ef09c0ede9da7abc5d7c192d890ae2e737cc369a5c5549c646",
    "d343c805b912141a1f8af7aa8d6025e2379e5335fb197c4cc59adf960fa43cbb",
    "cba905608c0104093b166c88393dba32159dca2b280d8a5229b6668930c8e4d2",
    "3ab8da275237ac1ccf3cab3bf2f019077d7fdef06d2e6afd180313ca80e00d8c",
    "6357ada783d5b09f22bd6fad2745b5c101e68fcdf2f85ffc698975be356cd594",
    "b19a3fd41d9728a0d5ee22aad6fd54c2f2d5199cd5835dbdc695d6e5062f8516",
    "acae778e1ee700e4a7c0120cb5e9be2fb5d2129aa04ef3e75590af2effca60eb",
    "4c6881068dd2be7eca3031e8d929b4d1a5f314eb6d08ba07a1d7cbd735bd207f",
    "cf3f971c8c6d95f0429d7f2937ecb130b1b40f2d12d7681441548230ca48a9c0",
    "4704211f8e92be217eb2f16cd363a6a7c3dacc381f5083b7536e9aa33b79ab0f",
    "b4f54c4e548f514f9429d5ea56dc9c3e246b95b0ae519a4b013891b1d69ffe39",
    "083c6c3504c578da7c283008d1305492f792a82c4b0a30d35007f9776ff6ad90",
    "c87315eb509d89d1ac2f8595c1fb47c9227836fadfbd13cf22122fce5f9806d3",
    "6d998503be831ad800a34bbfa952fc2aeb85ca5f5d959b6d10dad98d0fea6831",
    "016287a95f088a1cf137199a4c50321e0650684b78ecbe1849d995ae52afb6ee",
    "f87746eecfd56f78e477d227a25ddb7cfc2accc4626656c41ac14eeff8285ea0",
    "696bcdba14d33dfeea8e627a90094a2b1955745f32fc28677f54bb97f88099ba",
    "5787b6f79b1f7a9160c0540997d8b2fae1541201224c4bb8bf17b3cacf610210",
    "a43faf60f3fa4d2aa60345815484ff7c862bdba0061befa068e64b1994e0a907",
    "dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57",
    "3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9",
    "8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823",
    "60db296dde26bebbf4fcf1b97101188799cedb2eb3260616204a2ee082ce19c3",
    "c9f4d94dc9745bce7bccf99145816e0e45305c8a5058acb6476a1fb56f96eb6c",
    "2b56d6f5fd4a86bfd40578bec43308204f62af513df9b3ed227cf971585f837b",
    "7c3e79bbe41bd70ec1c1f08d9defd04e38af891430616173609bf3e76c2159ee",
    "212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49",
    "9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b",
    "848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741",
    "4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15",
    "62f817868c3b803429e62efb7aa8f37aa995213386c6e4303e8e1f490a144ffc",
    "5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233",
    "2410e4316d9c2c3bfb301c39dbe79590fb73682b18e70988527eeecc2a024fa6"
  ],
  "gaps_for_orchestrator": [
    {
      "material": "GuiSaveState.cpp, SaveState.h, SaveStateRepository.h, Paths.cpp, and the filesystem copy/rename utility implementations",
      "reason": "The load-bearing delete hook's attach point is uncited in the corpus; default arguments and copy timestamp behaviour (the zombie-auto trace) are not inspectable from the excerpts.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 documentation or source for bisync, --backup-dir, --files-from, and --filter/--filter-from ordering",
      "reason": "Gates 0, 2 and 6 rest on behaviour the corpus does not contain.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "ES startup ordering relative to network readiness and the autostart handoff",
      "reason": "The boot pass moves under ES scheduling; the corpus does not show when ES is up or how 102-cloud-saves would hand off.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "setsettings.sh, shipped retroarch.cfg and es_systems.cfg",
      "reason": "RetroArch's savestate_directory and savestate_auto_save decide the #10 two-consumer layout and the auto-state frequency claim.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, tools/cloud-test-backend",
      "reason": "Cross-tier and upgrade claims referenced by this plan cannot all be checked from the embedded callers.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "The four round-2 plans, including kimi-revised_plan-r2.md",
      "reason": "Not embedded; this plan restates its own positions and relies on none of them as evidence.",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated."
}
```