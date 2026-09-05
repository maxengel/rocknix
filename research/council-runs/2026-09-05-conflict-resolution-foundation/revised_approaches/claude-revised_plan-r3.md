# Round-3 revised approach — `claude-revised_plan-r3.md`

**Member posture.** The reviews cite my round-2 artifact as `claude-revised_plan-r2.md`; this document supersedes it and is written to stand alone. I have no filesystem access; every source citation below is to the corpus embedded above, by path under `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/` and by `[Snn]` index into the provenance block at the end. Hashes are copied from the per-source headers, not recomputed. Nothing was run.

**Markers used throughout.** `[V]` source-visible in the embedded corpus. `[K]` unmeasured; a named experiment settles it. `[C]` the council converges but the corpus does not settle it. `[M]` the maintainer's call.

---

## 0. The answer in one page

The foundation is a **manifest-and-agreement reconciler that owns every write path**, with rclone as transport only. It classifies each save *unit* three ways — local hash, cloud hash, last-agreed hash — and refuses to overwrite anything the classification does not license. The wizard is the only place a genuine fork is decided. Every decision retains what it discards, in a store shaped for a reader that does not exist yet. Nothing in the flow offers to undo; undo is a separate tool.

### Load-bearing (get any of these wrong and the milestone is unsafe)

| # | Component | One-sentence contract |
|---|---|---|
| L1 | **Identity** | A save version is the sha256 of its stored bytes (D-CLOUD-030 `[V]`); a save *unit* is a complete member map (one file for most saves; several for memcards/`.eep`+`.mpk`); classification is per unit, never per file. |
| L2 | **Classifier** | Three-way on last-agreed state; never agreed → ask; equal size is never an equality verdict; no clock enters a verdict. |
| L3 | **Write-path ownership** | Boot, game-exit and the SYNC row all go through L2; a both-sides fork is *refused*, not resolved, by every path; an overwrite needs fresh, candidate-scoped evidence about the cloud head, obtained in the same run. |
| L4 | **Manifest transport** | Each device publishes only its own manifest, last, only when an entry changed; foreign manifests live in the stage, never in the tree; agreement is recorded only after a verified publication. |
| L5 | **Lifecycle gate** | Real mutual exclusion between a game session and any local save-tree mutation, surviving ES dying while the emulator lives; pending-apply recovery runs before any emulator can consume the tree. |
| L6 | **Retention** | The losing copy of every wizard decision is kept, on by default, bounded by a count per game, with a self-contained record a future picker can drive; the done page says so; no undo control ships. |
| L7 | **Merge adapter** | KEEP BOTH never calls ES's slot primitives raw: `getNextFreeSlot()` returns −99 on an auto-only repository, `copyToSlot()` returns `true` unconditionally, and `makeStateFilename(fullPath)` derives the destination from the *source's* directory `[V]`. |
| L8 | **Deletion** | Unexplained absence never deletes anything (it resurrects); mass absence refuses the pass; operations ES actually performed retire the *named version* on the other side into a recoverable sibling; duplicate compaction converges. |

### Optional (can follow, or be dropped if a gate says so)

O1 single-spawn manifest-last via `--order-by` (Gate 2); O2 route-table reachability for LAN-only remotes; O3 `writer_instance` for cloned cards (experiment is mandatory, the field is not); O4 the compatibility badge (after #19, D-CLOUD-025); O5 bisync as a bulk transport for non-conflicting units (after the spike, never as an authority); O6 `resolves` receipts (small, kept — see §3.1).

---

## 1. What changed since round 2, and why

### 1.1 Conceded and corrected

| Refuted claim in `claude-revised_plan-r2.md` | Who | Correction in this plan |
|---|---|---|
| Eight-generation `lineage` as *permission* for an ordinary "cloud changed" download; a lineage bound that expires turns a long offline run into a prompt. | `gpt_peer_review-r3.md` §2.4 | Cut. The signed three-way classifier is sound without it (§3.3). Kept: one-step `replaces` (schema §6 `[S03]`), a one-step `resolves` receipt per publication, and a pending-operation record for interrupted applies. |
| Apply ordering contradicted itself: §2.4 said payload → manifest → agreement; §2.8 recorded agreement per item before remote publication. | `gpt_peer_review-r3.md` §3.2 | Agreement is written only after the winner's publication is verified (§3.9.2). A four-phase pending record replaces a boolean `done`. |
| Two tmpfs markers as the lifecycle gate; check-and-set is not mutual exclusion; and ES may die while the emulator lives. | `gpt_peer_review-r3.md` §3.3; `kimi_peer_review-r3.md` §4, §5 | A real `flock`, acquisition order specified, fd inherited by the emulator child so ES's death does not release it (§3.6). |
| "No ordinary deletion in V1", argued chiefly from the detached-card case; the optional per-path hold-back (O2) was tombstone-sized machinery in disguise. | `gpt_peer_review-r3.md` §2.3; `kimi_peer_review-r3.md` D1; the maintainer's amendment | Adopted `gpt-revised_plan-r2.md`'s version-specific retirement records, transported in the own manifest (§3.5). Hold-back cut. The card case is handled by the mass-absence refusal alone. |
| `BACKUPPATH ≠ RESTOREPATH` refused with exit 1. | `gpt_peer_review-r3.md` §2.7; `kimi_peer_review-r3.md` D4 | The two-way reconciler refuses split roots; the one-way *import* into `RESTOREPATH` stays as its own operation, writing no agreement and retaining what it overwrites (§3.11). `cloud_sync.conf` documents the split as a feature `[S33]`. |
| Documented the `check_network_link` false negative for LAN-only remotes and kept exit 4. | `kimi_peer_review-r3.md` D5; `gemini-revised_plan-r2.md` §4.4 | Fixed on the *changed* path only, and by the route table, not ICMP — `gpt_peer_review-r3.md` §3.5 is right that a ping replacement repeats the liveness category error the rule file names `[S09]`. |
| Discard store `<path>/<sha256>` kept bytes and PNG but not the producer or which side won; both evaporate (plan file deleted, audit log rotates, manifest entry overwritten). | `kimi_peer_review-r3.md` §1.1–1.2; `gpt_peer_review-r3.md` §1 | A self-contained `record.json` per retained resolution; retention and pruning promoted from optional (O1/O6) to load-bearing (L6, §3.9.1). |
| Single-file `copyto` treated as forcing a decided transfer past metadata comparison. | `gpt_peer_review-r3.md` §2.2 | `--ignore-times` on every transfer the classifier has already decided; `cloud_backup` and `cloud_restore` both pair `copyto` with `--ignore-times` for exactly this reason `[S29][S30]`. |
| Reset `replaces` on renumber moves and treated a deliberately restored identical file as a "new version". | `gpt_peer_review-r3.md` §2.4 | A move re-keys the entry and preserves `replaces` and `captured_at` (schema §6 `[S03]`); identical bytes restored are a new *publication* of the same version, never a new version and never a blacklist. |
| "After two full passes, treat unexplained cloud bytes as legacy" was too broad for multi-file units. | `gpt_peer_review-r3.md` §3.1 | Narrowed: escalation is per unit and only when no manifest claims any member; a unit with some members claimed and others not is *torn* and is never installed or offered (§3.3.3). |
| Spawn A (`rclone hashsum <type>` locally to fill `remote_hash`). | Defended by `kimi_peer_review-r3.md` D3, questioned by `gpt_peer_review-r3.md` §5.2 | Subsumed: the post-publication verification listing on hashful backends fills `remote_hash` as a by-product (§3.4.2). Spawn A is gone; it cost a process start for nothing the verify step does not already return. |

### 1.2 Misreadings, corrected

- `gemini_peer_review-r3.md` §2 says my plan deferred #10 "because flat-path collisions become visible conflicts". It did not; it kept #10 in the drop, sequenced last behind a launch-behaviour rehearsal — as `gpt_peer_review-r3.md` §2.6 and `mistral_peer_review-r3.md` §1.5 read it. That position is unchanged here (§3.10).
- `mistral_peer_review-r3.md` §1.1 and §3 list my plan among those that already "propagate recorded deletions as moves into dated siblings" and credit me with "intent-recorded deletion receipts". My round-2 plan did not propagate deletions; `kimi_peer_review-r3.md` and `gpt_peer_review-r3.md` read it correctly. I now *do* adopt propagation — by `gpt-revised_plan-r2.md`'s design — but the credit belongs there.

### 1.3 Adopted, credited by file

- `gpt_peer_review-r3.md` / `gpt-revised_plan-r2.md`: version-specific retirement records; retention-count exemptions for incomplete operations; "the store under `.cache` is not a disposable cache"; "No new saves to upload" as the honest idle wording; the ES-death survival requirement; the cloned-card experiment as mandatory; the retained-store readability acceptance test; the four-phase pending record; the split-root import distinction.
- `kimi_peer_review-r3.md`: the `record.json` field contract (§1.2); the verified ES primitive defects (−99, unconditional `true`, parent-derived destination) `[S37][S38]`; the `RCLONEOPTS` allowlist bypass `[S29][S33]`; `.state.auto.bak` matching `+ /**/*.state*` while matching neither ES regex `[S32][S39]`; exit-time renumbering being conditional, not universal `[S38][S41]`; the 0-idle / few-changed spawn accounting; the churn trace as a convergence gate.
- `gemini_peer_review-r3.md` / `gemini-revised_plan-r2.md`: the LAN-only reachability *intent*; the pre-pass/SRAM dependency test placed at the non-conflict boundary; the explicit "unanimous but unmeasured" marker on consensus.
- `mistral_peer_review-r3.md` / `mistral-revised_plan-r2.md`: the out-of-scope fence (§9); the IA "checked, not assumed" correction for the auto-only case; reconciling the round-trip harness's content fixture with D-CLOUD-019 (via `gpt_peer_review-r3.md` §4).

### 1.4 Refused

- Kimi's resume-side sub-choice for auto KEEP BOTH (`mistral_peer_review-r3.md` §1.6 settles to it): refused under "get the user going as quickly as possible". Deterministic outcome with one sentence (§3.7.4).
- Gemini's ping probe (mechanism, not intent).
- Mistral's "≤ 2 spawns, proven on H700" gate: nothing has run (`issues/issue-35.md` `[S27]`); a gate written to a guessed number is either failed falsely or quietly edited.
- GPT's protected-publication protocol in V1: not earned on a five-second path under a one-player model; the residual race is bounded by fork detection plus `--backup-dir` recoverability and is measured at Gate 9.
- Cached foreign-manifest claims as permission to overwrite at game exit (the exit path in `kimi-revised_plan-r2.md` §4.3 as described by `gpt_peer_review-r3.md` §2.1): refused. The ordinary offline fork — B publishes Hᵦ, A played offline from H₀, A's exit overwrites Hᵦ with Hₐ — is the milestone's primary case, not an edge case; archiving Hᵦ preserves bytes but denies the player the decision. Fresh evidence is required (§3.4.2).

---

## 2. Paying the maintainer's amendments

**Reversibility, one step, no undo control.** My round-2 plan already retained discarded copies on by default with a count of three and named an on-device undo control as out of scope (`kimi_peer_review-r3.md` §1.1 T1). Nothing is removed on that axis. The done page gains the required sentence: *what was discarded, and that the copies are kept.*

**Depth of lineage.** The eight-generation chain is cut (§1.1). What remains — one `replaces` per entry, one `resolves` list per publication, one pending record per apply, one retained record per decision — is exactly one step back, which is the maintainer's stated primary case.

**Edge cases inform, do not drive.** The detached-card argument no longer removes a capability: recorded deletions propagate (§3.5). The card case keeps only what is cheap — a mass-absence refusal.

**The store must be readable by a reader that does not exist.** My round-2 store did not survive that requirement: `<path>/<sha256>` located bytes, but the producer, the winner and the other operand were held in a plan file that is deleted after apply, an audit log that rotates at 1 MiB (D-CLOUD-027 `[S06]`), and a manifest entry that the producer overwrites on its next capture. This plan's store (§3.9.1) writes a `record.json` beside the retained bytes carrying everything the wizard's compare screen would need to render both panels again, keyed by a per-device sequence number rather than a clock. The acceptance test that proves it is Gate 8.

**The separate restore tool.** Re-homed to its own issue with the maintainer's shape (§3.9.4): the wizard's compare-and-choose surface pointed at a game's retained records, reached from outside the moment of resolution, installing through the same adapter, and making the copy it replaces a new retained record so that a wrong restore is itself one step reversible.

---

## 3. The architecture

### 3.1 Identity and lineage

**Stands: D-CLOUD-030 `[S06]`.** The version identity is the sha256 of stored bytes; slot and file name are attributes; a renumber is a move (same hash, new path); the thumbnail is not identity.

**Units.** A save *unit* is the set of files that must be read together for the emulator to see one coherent save: one `.srm`; one `.stateN` plus its `.png`; both `.eep` and `.mpk` for one N64 game; a shared VMU or memcard file for many games. Classification (§3.3) and apply (§3.9.2) operate on complete member maps — the disjoint-member fork in `gpt_peer_review-r3.md` §2.5 (local edits member a, cloud edits member b, no single path divergent) is a unit-level fork and must be presented as one. Membership comes from a small static table owned by #21 (path patterns per system/emulator), not inferred; a file the table does not group is its own unit. Shared containers get `rom: null` and a `unit` value naming the container (`dc/shared/vmu`, `psx/memcards/<name>`); the schema gains one optional field, `unit`, defaulting to the entry's own path. I pick `rom: null` + `unit` over a new `kind: "container"` (`mistral-revised_plan-r2.md`) because the wizard's glyph logic keys on `kind` and a memcard is still an in-game save to the player. `[M]` for #20's thread; additive, no schema bump.

**Lineage, one step.** `replaces` (schema §6 `[S03]`): the hash this version replaced at this path on this device. A move re-keys the entry, preserving `replaces` and `captured_at`. A KEEP BOTH placement is a new entry with `replaces: null`; its origin is in the audit log and, for the discarded side of the same decision, in the retained record. Restoring bytes that already have a hash is a republication of that version, not a new version.

**`resolves`, one step (O6, small, kept).** When a wizard decision or an explicit restore *publishes* a version to the cloud, the publishing device's entry carries `resolves: [<hashes chosen over>]`. Its only use: a device whose local hash appears in the cloud entry's `resolves` treats the cloud change as an informed choice (download without prompting) rather than an uninformed fork (ask). Attached to the publication, superseded by any later entry at that path, never a permanent stigma on a hash. This closes the case a fresh device with no agreement record would otherwise re-ask about a conflict the player already decided; it is one list on one entry, not a graph.

### 3.2 Manifest and agreement

**Stands: D-CLOUD-031 `[S06]`, schema rev 1 `[S03]`.** One JSON per device at `savestates/.rocknix/manifest-<device-id>.json`, in-game saves included, keyed by path relative to the sync root. Additive fields proposed: `unit` (above), `resolves` (above), `retired` (§3.5). Readers ignore fields they do not know; `schema` stays `1`.

**Transport rules (L4).**

1. A device writes and publishes only its own manifest. Foreign manifests are fetched into the stage (`/storage/.cache/cloud_sync/stage/`) and never into `/storage/roms/savestates/.rocknix/`. Reason `[V]`: `+ /savestates/**` precedes `- /**` `[S32]`, so any legacy full pass would republish a stale foreign manifest over its producer's newer one during cutover. (`mistral-revised_plan-r2.md`'s "read-only caches in the tree" is refused on this ground — `kimi_peer_review-r3.md` D6.)
2. The own manifest is written whole, temp-and-rename (schema §5), and **only when an entry changed** — never to refresh `generated_at` (`kimi-revised_plan-r2.md`, `gpt-revised_plan-r2.md` §3.2). A metadata-only exit manufactures no upload.
3. The own manifest is published **after** the payload it describes, as a separate `copyto` — payload, manifest, agreement (`kimi_peer_review-r3.md` D7). O1: if the Gate 2 spike shows `--transfers 1 --order-by name,desc` delivers the `.rocknix/` object last in one spawn `[K]`, the extra spawn can be dropped; until proven, one spawn is the price of a commit point. The existing `--recent` stamp/`--max-age` mechanism is replaced, not extended (§3.4).
4. Readers take the union of every `manifest-*.json` they can see (D-CLOUD-017). For a cloud object at path P with observed hash C, provenance is the entry whose `sha256` maps to C; if several manifests claim the same hash they agree by construction; if none, `unknown`. **Unit coherence**: a multi-member unit is well-formed only if one manifest's declared member map covers the observed members exactly; a partial match is *torn* (§3.3.3).
5. Alignment-review action 3(c) `[S04]` — "the manifest rides the same `--recent` pass, no spawn added" — is superseded by this design; §4 records the refinement of D-CLOUD-028 that pays for it.

**Agreement (`/storage/.cache/cloud_sync/agreed.json`, unsynced).** Per path: the hash last published *and verified* or last downloaded *and verified* by this device, with `remote_hash` where the backend offers one. Bound to the 5-tuple `{remote name, remote type, SYNCPATH, BACKUPPATH, RESTOREPATH}` (`gemini_peer_review-r3.md` §4 credits this to my round-2 plan; it stands): a change of remote, folder or roots invalidates agreement wholesale, so the next pass classifies everything as never-agreed rather than silently mass-overwriting under a false A.

**Reflash bootstrap.** A reflashed device regenerates the same `cloud_device_id` (seeded from the permanent hardware address, D-CLOUD-009 `[S06][S34]`). Before its first capture it downloads its own previous manifest from the cloud and adopts those entries as its prior claims; otherwise its first exit would publish a near-empty manifest over its own history. Agreement starts empty (never agreed → ask), which is correct: a reflashed device has no memory of what it last held.

**Written-before-clock.** `clock_synced` (schema §6) is recorded; no verdict reads a time. `captured_at` is display only.

### 3.3 Classification

#### 3.3.1 The verdict table (per unit, L = local, C = cloud, A = agreed)

| L vs C | A | Verdict | Action |
|---|---|---|---|
| equal | any | identical | record A = L = C if not already |
| L only | A absent | device-only | upload |
| L only | A = L | cloud absent, unexplained | **resurrect** (upload); never delete local |
| L only | a visible `retired{path, sha256 = L}` record exists | cloud retired | retire local: move to retained store, audit |
| C only | A absent | cloud-only | download, install |
| C only | A = C | local absent, unexplained | **resurrect** (download); count toward mass-absence |
| C only | a `retired{path, sha256 = C}` record exists and C is the cloud head | local retired it | retire cloud copy into `-replaced` sibling (copy-verify-delete) |
| differ | A = L | cloud changed | download, install, A = C |
| differ | A = C | device changed | upload, A = L (after verified publication) |
| differ | A absent, C.`resolves` ∋ L | informed choice | download, install, A = C |
| differ | A absent (never agreed) | **divergent** | queue for wizard |
| differ | A ≠ L, A ≠ C | **divergent** | queue for wizard |
| same hash, different paths, one side each | — | move | re-key locally to the cloud's path (D-CLOUD-030's move rule); if both are numbered slots of one game, compact the higher (§3.5) |
| any | listing failed or returned nothing where the root is known non-empty | **unknown** | refuse the pass; never "no conflict" (blindspot 22 `[S07]`) |

Two rules the table obeys: **never agreed and different is a conflict** (#11's rule, schema §3 `[S03]`); **unknown provenance is a value the wizard renders**, never a stamp (`upgrade-and-install.md` `[S11]`).

#### 3.3.2 How C is obtained without a full download

- Hashful backends (Dropbox, S3): `rclone lsjson --hash` of the candidate paths; the native hash is matched against `remote_hash` claims in the manifest union to yield a sha256. A listing that matches nothing is `unknown`, not "changed" and not "same".
- Hashless backends (the QA WebDAV `[S04][S09]`): size and mtime are *hints* for candidate selection only. **When a decision depends on equality — an overwrite, a compaction, an agreement — the bytes are downloaded to the stage and hashed.** Equal size is never an equality verdict; this is the #53 shape and the corpus paid for it once `[S29]`. Cost is priced at Gate 4; the degrade clause is to *defer the write*, never to write and verify afterwards.
- Bucket remotes: `lsjson --stat` is not an existence test `[S09]`; existence is a listing that contains the object.

#### 3.3.3 Unknown, in-flight, torn, legacy

A cloud object no manifest explains may be legacy (pre-capture), another writer's, or an in-flight publication whose manifest has not landed (payload lands before manifest by §3.2 rule 3). Rule: it is `unknown` for two consecutive full passes, then escalates to *legacy*: cloud-only legacy is downloaded as unknown provenance; legacy that differs from a local copy asks. **Narrowing** (`gpt_peer_review-r3.md` §3.1): escalation is per unit and only when no manifest claims *any* member; a unit some of whose members are claimed is **torn** — never installed, never offered, reported in the pass result. Two passes cannot turn a half-published memcard into a valid save. Dropbox "conflicted copy" and Syncthing `.sync-conflict-` objects are never versions (D-CLOUD-022 `[S06]`); they have no entry and are not moved.

### 3.4 Write paths and the exit budget

**Ownership (L3).** #22 replaces `autostart/102-cloud-saves` (`copy --update` both ways `[S35]`), the SYNC row's identical pair, and the game-exit `cloud_backup --yes --saves-only --recent` (`copy`, no `--update` `[S29][S41]`) — the shipped newest-wins pipeline named by blindspot 28 `[S07]`. D-CLOUD-029 stands: they run unchanged until the replacement lands; no stopgap. Replaced-mechanism inventory (blindspot 23), each with a home: newer-on-destination skip → the classifier; restore-before-backup ordering → downloads applied before uploads in every pass; the cloud lock → kept (`take_cloud_lock` `[S29]`); the `--recent` window → the hash-selected change set; the last-run stamps GAME SETTINGS reads (D-UI-018) → kept, written from the result file; user filter rules → the allowlist is still applied via `--filter-from`, with our command-line excludes ahead of it (`--include`/`--exclude` outrank `--filter-from` `[S09]`).

**Option hygiene.** The reconciler never passes `RCLONEOPTS` raw. A non-empty user value replaces `cloud_backup`'s default option set including `--filter-from` `[S29][S33]` — a shipped allowlist bypass. The reconciler composes its own options and reads only documented knobs. `--exclude '*.bak'` on every transfer: `.state.auto.bak` passes `+ /**/*.state*` and matches neither ES regex `[S32][S38][S39]`.

#### 3.4.1 Game exit, nothing changed (the watched path)

ES's launch path already runs `onGameEnded()`, refreshes the repository, and then starts the exit sync `[S41]`. Capture runs between the refresh and the sync, under the lifecycle gate ES already holds (§3.6), told the system, ROM, emulator and core on the command line (`getEmulator(true)`/`getCore(true)` `[S42]`, schema §9). Capture: enumerate this game's unit members; size+mtime pre-check against the own manifest; sha256 anything that might have changed; update entries (`replaces` = old hash); write the manifest only if an entry changed; copy changed members and PNGs into the stage. Release the gate.

If nothing changed: **no rclone process starts.** The card says "No new saves to upload" (`gpt-revised_plan-r2.md` §5.2), never "in sync". This is strictly under D-CLOUD-028's measured five seconds `[S06][S09]`.

#### 3.4.2 Game exit, something changed

1. Take the cloud lock (non-blocking; held → normalised SKIPPED, no stamp). Network answer from the route table: a default route, **or** a connected route covering the remote host's address (LAN-only and self-hosted remotes; `[S09]` "reachability means the remote"); no ICMP. None → SKIPPED-NO-NETWORK at once.
2. **Spawn 1 — preflight**: `lsjson --hash` of the changed unit's paths (via `--files-from` `[K]`, else the unit's directory). Obtain C for each member (§3.3.2); on a hashless backend, download-and-hash where equality decides. Also fetch any foreign manifest whose listing entry changed since last seen, into the stage.
3. Classify the unit. Device-changed → continue. Divergent, never-agreed, unknown or torn → **no upload**; queue the conflict; card says "A conflict was found — resolve it from GAME SETTINGS > CLOUD SETTINGS". This is the AC #22 carries: a constructed both-sides change is *seen* to be refused here, at boot and from the SYNC row.
4. **Spawn 2 — publish**: `copy --files-from <winners> --ignore-times --backup-dir <SYNCPATH>-replaced/<device-id>-<seq>/`, our filters only. `--backup-dir` is a sibling of the destination (D-CLOUD-014 `[S06]`); named by device and sequence, not by clock.
5. **Spawn 3 — verify** (hashful backends): `lsjson --hash` of the winners; hashes must match the recorded mapping. This listing fills `remote_hash` as a by-product, which is why spawn A is gone. On hashless backends the forced `--ignore-times` transfer plus rclone's exit code is the evidence, and the agreement is marked `verified_by: "transfer"`.
6. **Spawn 4 — manifest** `copyto`, last (O1 may fold it into spawn 2).
7. Agreement for the verified paths; result file with the run id ES issued (§3.9.3); release the lock.

**Accounting `[K]`.** Idle: 0 spawns. Changed: 3 (hashless) to 4 (hashful), plus the transfer itself; predicted 6–9 s on H700 → Dropbox given ~1 s per start and ~2 s of Dropbox commit `[S09]`, against today's ~7 s for one save. Gate 4 sets the ceiling; the maintainer accepts it or names a degrade `[M]`. The degrade order is: drop the verify listing (accept exit 0), then O1. The preflight is never dropped — it is what makes the path safe.

#### 3.4.3 Boot and the SYNC row (full passes)

One recursive `lsjson --hash` of `SYNCPATH`; foreign manifests into the stage; classify every unit; apply the **pre-pass**: downloads to stage → install under the gate (per unit; skipped, not queued, if the gate is held by a running game — completed by the next pass); uploads with `--ignore-times --backup-dir`; moves and compactions; verify; manifest; agreement. Divergent units are queued; nothing is transferred for them. The boot pass runs in the background with no UI; the SYNC row shows the card. The boot script's `ping google.com` gate `[S35]` goes with it (already filed on #7 by the alignment review `[S04]`).

### 3.5 Deletion, moves, compaction (L8)

**Compaction (D-CLOUD-030).** After a pass, one game holding one hash in two numbered slots: download the higher-numbered copy if it is remote (tens of KB), re-read both, confirm equal, then remove the higher on whichever side holds it — remote removal as copy-verify-delete into the `-replaced` sibling, local removal directly (the bytes are identical to the kept copy) — and write the audit line. Acting on the remote copy is what makes the loop converge without a receipt (`kimi_peer_review-r3.md` D1 concedes this); acting only locally re-downloads the duplicate forever.

**Recorded operations retire named versions.** The own manifest gains `retired: [{path, sha256, op: "delete"|"move"|"compact", seq}]`, a bounded ring (last 64). Records are minted only by operations this device performed and the reconciler can vouch for: an explicit delete in the savestate manager (the hook point is `GuiSaveState.cpp:236`, where `renumberSlots()` follows a deletion `[S25]` — the file itself is a corpus gap, §10; we own the fork, so the hook is ours to add, and the gap is about verifying the call site, not availability); a renumber move the capture step observed (same hash, new path); a verified compaction. A record names the exact bytes, so a stale record can never retire a later occupant of the path — the consuming device checks `sha256 == cloud head` before acting. Bounded count is a sufficient lifetime: an inert record is harmless by construction (`gpt-revised_plan-r2.md` §4.3; the "where does B get A's intent" question in `gpt_peer_review-r3.md` §2.3 is answered by transport in the own manifest, which every device already reads).

**Unexplained absence never deletes.** One-sided absence with `A` known and no record is resurrected (re-uploaded or re-downloaded): nothing is destroyed, and the worst case — a state the player deleted on a pre-record build reappears — is repaired by deleting it again, which now mints a record. **Mass absence** — the local root missing, empty, or more than a threshold of previously agreed units absent at once — refuses the whole pass with a support-level reason. This is the cheap fail-closed the maintainer still expects, and it is the *only* thing the detached-card case buys.

**Product consequence `[M]`.** Once records propagate, deleting a state in the savestate manager removes it from the cloud and from other devices. The manager's delete confirmation must say so (one sentence); the cloud copy goes to the `-replaced` sibling, not to `/dev/null`.

### 3.6 Lifecycle gate (L5)

Two locks, distinct jobs. The **cloud lock** (`/var/run/cloud_sync.lock`, `take_cloud_lock` `[S29]`) serialises network work on one device. The **lifecycle gate** (`/var/run/cloud_saves.lifecycle`, `flock`) serialises *local mutation of the save tree* against a running game.

Acquisition order (adopted from the reviews' account of `gpt-revised_plan-r2.md` and `kimi-revised_plan-r2.md`):

1. ES takes the gate before spawning the emulator and holds it for the session; the fd is inherited by the emulator child so that ES aborting and restarting (`engineering-practices.md` records SIGABRT restarts `[S10]`) does not release it while the emulator lives `[K]` — verify ES's `ProcessStartInfo` does not close inherited fds; if it does, a one-line wrapper holds it.
2. At exit, capture runs under the gate (short, local), releases it, and only then requests cloud work. Capture never waits for the cloud lock.
3. A network worker takes the cloud lock non-blockingly, does its listing and staging with no gate, then takes the gate non-blockingly for each unit's install; gate held → install skipped, stage kept, status SKIPPED for that unit.
4. Uploads proceed only from sealed stage copies, never from live tree files that could change under a running emulator (SRAM flushes every 10 s, schema §4 `[S03]`).
5. On ES start and before any launch or wizard open, **pending-apply recovery** (§3.9.2) runs. Cleared tmpfs is not evidence that the tree is whole.

Test (Gate 6): boot sync running; launch a game; kill ES while the emulator runs; the boot worker's install must be excluded until the emulator exits.

### 3.7 Presentation (#23; IA rev 4 `[S02]` with proposed rev 5 amendments)

3.7.1 **Trigger `[M]`.** IA rev 4 opens the wizard from "a sync that reports conflicts". I propose **queue and badge**: passes queue conflicts; a badge appears on the cloud rows and on the affected games; the wizard opens from GAME SETTINGS > CLOUD SETTINGS. A wizard forced at game exit contradicts "get the user going as quickly as possible", and the boot pass has no UI to open one from. `[C]` until the maintainer amends the IA.

3.7.2 **Pre-pass gate.** The wizard opens only after the non-conflict pre-pass completed (futro AC `[S05]`), and re-checks that agreement is unchanged since the queuing pass; otherwise it re-runs the pre-pass first. This is what makes KEEP BOTH's "next free" free on both sides.

3.7.3 **Screens.** Unchanged from rev 4: system → game walkthrough; cloud always left; screenshot or glyph; date/time/device+model/core+build; no size, no play time; KEEP LEFT / KEEP RIGHT / KEEP BOTH; nothing applied until COMPLETE; quitting discards decisions. Cloud PNGs are fetched by their `screenshot` remote path in one `copy --files-from` before the first screen. `unknown` renders as "unknown device / unknown core", never blank. Multi-member units are one card. A state and an in-game save of the same game appear adjacently with a note that loading a resume point can rewrite the in-game save (Gate 6 tests whether it does — `gemini-revised_plan-r2.md`'s dependency test).

3.7.4 **Auto KEEP BOTH, deterministic.** "Keep this device's resume point; the cloud's goes to slot N." One sentence, no sub-choice. Kimi's variant refused (§1.4).

3.7.5 **Done page.** Per game: what was kept, what was discarded, where a merged copy went, and *"Discarded copies are kept (up to N per game)."* No undo control. The audit line for a discard is written before the apply step mutates anything; the outcome line after.

3.7.6 **Corrections to "What ES already does (checked, not assumed)"** (`mistral-revised_plan-r2.md`): `getNextFreeSlot()` returns −99, not "highest + 1", when the repository holds only an auto state `[S37]`; `copyToSlot()` reports `true` regardless `[S38]`. The paragraph is rewritten to say the wizard uses a checked adapter (§3.8).

3.7.7 **Kid/kiosk.** The wizard is unreachable there (the full-UI block collapses `[S13]`); conflicts stay queued; nothing destructive happens.

3.7.8 **480×320 first.** Layout proven on the RG351M before 640×480 (futro AC); `tools/vm-visual-qa` frames at both sizes are the evidence; a thirty-item walkthrough by controller only is the fatigue gate.

3.7.9 **Badge.** Waits for #19 (D-CLOUD-025). `core_build` and `device.family` per entry carry the comparison regardless.

### 3.8 Merge adapter (#24, L7)

Source-visible defects `[V]` (verified by `kimi_peer_review-r3.md` §3 and `gemini_peer_review-r3.md` §3):

- `getNextFreeSlot()` scans 99999→0 for a numbered slot; an auto-only repository (slot −1) yields **−99** `[S37]`, and the auto-resume launch path appends `-state_slot <nextSlot>` unconditionally `[S38]` — what RetroArch does with −99 is `[K]` (Gate 6 launches *from the auto state* to see it).
- `copyToSlot()` ignores the return of `renameFile`/`copyFile` and returns `true` `[S38]`.
- `makeStateFilename(slot, fullPath = true)` combines with the *source's* parent directory `[S38]` — a state staged under `/storage/.cache` would be "copied to a slot" inside the cache.
- `isEnabled()` requires `emulator == "retroarch"` `[S37]`: standalone-emulator states never allocate; KEEP BOTH is disabled for them with a reason.

Adapter contract: compute destinations from the config templates itself (`SaveStateConfigFile` `[S39]`), never from a source path; distinguish auto-only (allocate `firstslot`) from unsupported (refuse) from −99 (refuse, report); stage the incoming state and PNG in the *target directory* under temporary names, verify sha256, then rename PNG then state into place; check every filesystem call; refresh the repository after apply (`refresh()` `[S37]`); `renumberSlots()` is never called by us. A merged copy is a new entry, `replaces: null`, origin in the audit log. No slot cap is invented to hide the −99 defect.

### 3.9 Safety, retention, pending record, result file, the restore tool

#### 3.9.1 The retained store (L6)

```
/storage/.cache/cloud_sync/retained/<system>/<unit-key>/<device-id>-<seq>/
    record.json
    <retained member files, by basename, PNG included>
```

- `unit-key` is the ROM file name (or container id) made path-safe; `seq` is a persisted per-device monotonic counter — never a clock (a device that booted without a network has a wrong one; pruning by date could evict the newest).
- **`record.json`**, schema-versioned, self-contained: system; rom or container; `unit` and complete member list with slot, sha256, size, screenshot; provenance of *both* operands (device id, label, model, emulator, core, core_build, captured_at, clock_synced — `unknown` preserved); which operand was cloud and which was device; the action (KEEP LEFT / RIGHT / BOTH); the winning sha256 and its resulting live path/slot; the retained side (`cloud` or `device`) and the original path it was discarded from; `resolution_id`; `phase`. Every field is already in hand at apply time; this is a write, not new machinery.
- **Count**: default 3 complete retained resolutions per `unit-key`; prune lowest `seq` first; a record whose `phase` is not `committed`, or that is the only surviving operand of an interrupted apply, is exempt (`gpt-revised_plan-r2.md` §2). `[M]` on the number; the amendment settles only "on, and bounded".
- The losing cloud copy of a KEEP RIGHT is downloaded into the record before publication overwrites it; the losing local copy of a KEEP LEFT is moved into the record before installation. KEEP BOTH discards nothing and writes no record.
- This directory, the pending records and the stage are **not disposable caches** despite living under `/storage/.cache/` (`gpt-revised_plan-r2.md`); the IA's note that `.cache` contents self-invalidate `[S02]` does not apply to them, and any cleanup must exclude them. Precedent: the audit log itself lives there (D-CLOUD-027).
- The remote `-replaced/` siblings written by `--backup-dir` are a *second*, cloud-side retention for races and retirements; the picker does not read them in V1.

**Does this survive the amendment's requirement?** Yes: a reader can enumerate `retained/<system>/<unit-key>/` newest-first by `seq`, render both panels from `record.json` alone, name the producer, state which side won, and install the retained bytes without consulting any manifest, log or plan. Gate 8 proves it with a test-only reader after the producer's manifest entry has been overwritten, slots renumbered, the audit log rotated and the pending record removed.

#### 3.9.2 The pending-apply record

One file per wizard apply under `/storage/.cache/cloud_sync/pending/<resolution-id>.json`, four phases per unit: `prepared` (operands staged, destinations computed, retained record written), `installed` (local tree mutated and verified), `published` (remote winners transferred and verified), `committed` (agreement written). Recovery on ES start (§3.6): `prepared` → discard stage, nothing happened; `installed`/`published` → finish the remaining phases from the stage; never re-decide. Per-file renames are atomic, a unit's install is not — the guarantee is "an incomplete unit is never consumed" via recovery-before-launch, not "old-or-new at every instant". The record is removed only at `committed`; the retained record it references stays.

#### 3.9.3 Result file and normalised statuses

rclone's exit 3 and 4 collide with the scripts' meanings (SKIPPED lock, SKIPPED network) as `ThreadedCloudSync` renders them `[S40]`. Every reconciler run writes `/storage/.cache/cloud_sync/result-<run-id>.json` with its own status vocabulary and the run id ES issued; ES compares ids — a missing or stale result is `unknown`, never success ("verify the artifact, not the report" `[S10]`). Last-run stamps (D-UI-018) are derived from it.

#### 3.9.4 The separate restore tool (its own issue; not V1)

Shape per the maintainer: from GAME SETTINGS > CLOUD SETTINGS (or a game's options), a list of games with retained records; per game, the wizard's compare screen with **PAST** left and **NOW** right, walking records newest-first; KEEP LEFT installs the past copy through the adapter (§3.8), makes the replaced live copy a *new* retained record (so a wrong restore is one step reversible), and publishes through the normal write path (device-changed → upload with `resolves`; a fork check still applies). Reads `record.json` only. Snapshots (#25) reuse the same store and record shape; the allowlist rule `- /savestates/.snapshots/**` is unnecessary because nothing here is under the sync root.

### 3.10 #10 — per-core directories: in the drop, sequenced last, gated

Stands: D-CLOUD-017 `[S06]`. The wizard does not need the directory, but the flat layout lets a second core overwrite the first core's `game.state1` locally before any reconciler sees it — a normal production hazard, not a card edge case, and "pre-existing" is provenance, not priority (`engineering-practices.md` `[S10]`). Sequence it last because creating `es_savestates.cfg` is a **launch-behaviour migration**: no such file ships (`[S04]`; ES looks in the user path then the image path `[S39]`), the compiled `Default()` sets `racommands`, `incremental` and `autosave` true, while the XML path hard-codes `racommands = false` and defaults `autosave`/`incremental` to false `[S39]`, changing how `setupSaveState()` and `onGameEnded()` behave `[S38]`. Gate 10: on a real device, with the file present, prove the `.auto`/`.bak` dance, incremental slots and autosave behave as today, that RetroArch's `savestate_directory` points where ES computes (`setsettings.sh` — not embedded, §10), and that old flat states remain discoverable ("read both, write the new one" `[S11]`). Entries are keyed by path, so the layout change is a re-key (schema §9). A clean #19 result does not repeal core namespacing.

### 3.11 Migration off the shipped write paths

Order: #21 capture (manifests only; no behaviour change; unknown first-class) → **shadow census** (the classifier runs read-only on every pass for a period on the maintainer's devices, logging verdict distribution, fork rate per `kind`, unknown/torn rate, and the changed-path cost in spawns and seconds; no writes) → #22 cutover of all three paths in one build behind the existing toggles (`cloudsaves.startup`, `cloudsaves.gameexit`) → #23 wizard → #24 adapter (with #23) → #10 last.

Read both, write new: pre-manifest files are `unknown` everywhere; no `states-<id>.json` ever shipped, so there is nothing else to read; old images ignore manifests and the allowlist carries them harmlessly. Downgrade is non-destructive. Split roots: two-way reconciliation refuses `BACKUPPATH ≠ RESTOREPATH` (agreement has one root); the one-way import into `RESTOREPATH` stays as a separate operation, writes no agreement, and retains whatever it overwrites in the retained store. Cloned identity (two live devices sharing one `cloud_device_id`, a supported edit `[S34]`) is a mandatory experiment (Gate 11): both write one manifest name; the expected failure is manifest ping-pong, the mitigation O3 `writer_instance` only if the experiment shows it.

---

## 4. Decisions: what stands, what is refined

No decided row is reversed. Proposed new rows (append-only, citing the old):

| Proposed | Refines / cites | Content | Basis |
|---|---|---|---|
| **D-CLOUD-032** | IA rev 4 "keep discarded saves off by default"; D-CLOUD-027 | V1 retains the discarded copy of every wizard decision, **on** by default, bounded by a count per game (default 3 `[M]`), with a self-contained per-resolution record; no undo control in the resolution flow; the done page states what was discarded and that it is kept; restore is a separate tool (own issue). | Maintainer's amendment, verbatim intent. |
| **D-CLOUD-033** | D-CLOUD-028 ("spawning rclone once") | The nothing-changed exit costs **zero** rclone starts; the changed exit may cost up to four within a ceiling measured at Gate 4, because the fork check it buys is the milestone's rule. Alignment-review action 3(c) `[S04]` is superseded. | §3.4; the corpus's own numbers `[S09]`. |
| **D-CLOUD-034** | D-CLOUD-030 | Clarifications: compaction may retire the remote copy after re-reading both; the thumbnail is not identity; identical bytes restored are a republication, not a new version; `resolves` is a per-publication receipt, never a permanent stigma. | §3.1, §3.5. |
| **D-CLOUD-035** | D-CLOUD-031 | Additive schema fields `unit`, `resolves`, `retired`; foreign manifests never in the tree; own manifest written only on change and published last. | §3.2. |
| **D-CLOUD-036** | #22 ACs `[S23]`; bisync planning `[S16]` | bisync is not the production detector or an authority on agreement; the classifier is ours; the spike may later earn bisync a bulk-transport role for non-conflicting units. The problem statement lists bisync-as-detector as the approach under judgement `[S01]`, but no register row binds it. | §3.3; `[C]` until the spike runs. |
| **D-CLOUD-037** | #22 ACs | Unexplained absence never deletes (resurrects); mass absence refuses the pass; recorded operations retire the named version into a recoverable sibling; ES's delete confirmation names the cloud effect. | §3.5; the amendment's edge-case rule. |
| **IA rev 5** `[M]` | IA rev 4 `[S02]` | Queue-and-badge trigger; retention default per D-CLOUD-032; auto KEEP BOTH deterministic; "checked, not assumed" corrected for −99 and unconditional `true`; kid/kiosk unreachable; the done-page sentence. | §3.7. |

Stand unchanged: D-CLOUD-017, -022, -025, -027, -029 (`mistral-revised_plan-r2.md`'s "withdrawn" misstates a decided row — `kimi_peer_review-r3.md` §3), -030, -031; D-QA-001/002; D-UI-017/018/020.

---

## 5. Known unknowns — resolution plan

| # (from `[S01]` §4) | Measure | Device | Before |
|---|---|---|---|
| 1 chipset axis; loud or silent | `docs/savestate-compat-test.md` `[S08]`: same-chipset control (RG35XX SP ↔ RG-SP) first, then RK3326/RK3566; Test C with compression off | bench, one build | #23's badge design (D-CLOUD-025); blocks nothing else |
| 2 bisync against a real remote | Gate 2 spike: compressed `#RZIPv` states + PNG, device-side rename, genuine fork, interrupted run, filter change; record `--conflict-resolve none` output and listing state; does `--recover`/`--resilient` avoid `--resync`; does its listing store duplicate `agreed.json` | RG35XX SP → QA WebDAV, then Dropbox | any bisync role decision; #22 code is not gated on it because bisync is not the detector |
| 3 auto state commonest | shadow census on the maintainer's devices: forks per `kind`; note only auto-resume sessions rewrite `.auto` — numbered-slot launches restore it from `.bak` at exit `[S38]` | RG35XX SP + RG-SP, real library | wizard ordering decisions in #23 (the `auto` kind renders as a resume point regardless) |
| 4 KEEP BOTH pre-pass sufficiency | Gate 8: interrupt the pre-pass mid-download; wizard must refuse to open and say why; then complete and open | two H700s | #23 apply |
| 5 no `es_savestates.cfg`; two consumers | Gate 10 rehearsal (§3.10); locate RetroArch's `savestate_directory` setting (`setsettings.sh`, not embedded) | RG35XX SP | #10 build |
| 6 core build pin absent on device | #21 emits `/usr/share/rocknix/core-pins` at image build; assert one line per `LIBRETRO_CORES` member; capture maps core → package with a small table; `"unknown"` when unmapped | build box, then device `strings`/`cat` | #21 capture |
| 7 `BACKUPPATH == RESTOREPATH` | assumption retained for two-way; split root → import mode (§3.11); `cloud_sync_helper` warns | VM | #22 |
| 8 standalone multi-file layouts | inventory what PPSSPP, Flycast, Mupen, DuckStation write per save on a device; write the unit table from it; fixture the disjoint-member fork | RG35XX SP (has the emulators) | #21 unit table, #22 classifier |
| 9 480×320 thumbnails | recognition test: maintainer identifies the moment from a rendered pair at 480×320 for ten real states; fallback single-column compare | RG351M frames via `tools/vm-visual-qa` | #23 layout |
| 10 two devices online at once | Gate 9 race fixture with `--backup-dir` on both (recoverability); Gate 3 sequential offline fork (the primary case) | two H700s | multi-device claim in the changelog |
| 11 round-trip suite never run | Gate 0 on GENERIC_X64: WebDAV and MinIO; repair content fixture to a D-CLOUD-019 declared system; add both-sides-changed, manifest, and retention-reader steps | VM | #22 code |

---

## 6. Unknown unknowns — the failure and the cheapest exposing experiment

1. **Path normalisation.** Dropbox is case-insensitive and may normalise Unicode; a `Pokémon Rouge.srm` round-trips as a phantom cloud-only/device-only pair. Experiment: upload a fixture set with mixed case and NFC/NFD names, list, compare bytes of the returned paths (Gate 2).
2. **Rate limits on many small operations.** Compaction, retirement and `--backup-dir` multiply small server-side operations; Dropbox throttles. Experiment: 200 tiny transfers in one pass, watch for 429s and the pass's honest status (Gate 2).
3. **Loading a state rewrites SRAM.** Resolving an in-game save then loading the other side's resume point can undo the choice silently. Experiment: resolve `.srm`, load the auto state from the other device, exit, hash `.srm` (Gate 6). If real, the wizard's adjacency note becomes a warning and the pre-pass never installs a state whose game has a queued save conflict.
4. **Capture races RetroArch's two-file write.** The `.png` lands after the state; capture may read a state without its PNG and record `screenshot: null` for a state that has one. Experiment: exit repeatedly, count entries with `null` screenshots whose PNG exists; fix by binding PNG presence to the state's mtime window or re-capturing at the next pass.
5. **ES's filesystem cache.** `Utils::FileSystem::FileSystemCache::reset()` is called on the launch path `[S41]`; our installs happen outside it. Experiment: install a state via the reconciler while ES is idle, open the savestate manager without relaunching; if stale, the adapter's post-apply `refresh()` must also invalidate the cache (Gate 6).
6. **Stage and tree on different filesystems.** A rename across mounts fails; install must be copy-verify-rename within the target directory (§3.8). Experiment: `/storage/.cache` and `/storage/roms` on one card are one filesystem; a second SD for ROMs is not — test on that layout.
7. **User filter rules ahead of defaults.** `cloud_sync_helper` merges user rules *first* `[S31]`; a user `+` rule can admit a `.db` or `.bak` our defaults exclude. Experiment: plant such a rule, dry-run, grep the listing; our command-line excludes outrank `--filter-from` `[S09]` and must be the mechanism.
8. **Two live devices, one identity** (§3.11). Experiment mandatory (Gate 11).
9. **Wrong clock, right pruning.** A device without RTC boots in 1970; anything pruned by date evicts the newest. Already designed out (prune by `seq`); the experiment is to set the clock back and run a pass anyway (Gate 8).
10. **Thirty conflicts by controller.** The IA's "quitting discards decisions" is fine for three and punishing for thirty. Experiment: a thirty-item queue pressed through on the RG351M; if the maintainer abandons it, per-game partial COMPLETE becomes a rev-5 question `[M]`.
11. **A half-published unit read as legitimate.** §3.3.3's torn rule is the guard; the experiment (`gpt_peer_review-r3.md` §3.1) is to throttle an upload, interrupt after one member, and assert no device installs or offers the mixed set (Gate 8).

---

## 7. What must be proven on hardware, in order

| Gate | What | Where | Blocks |
|---|---|---|---|
| **0** | Repair the instrument: `tools/cloud-round-trip` `[S36]` runs end-to-end on GENERIC_X64 against WebDAV and MinIO; content fixture moved to a D-CLOUD-019 declared system on disposable storage; config preserved and restored; remote asserted | VM | everything below |
| **1** | Corpus-settled counterexamples as fixtures: both-sides fork refused by boot/exit/SYNC; foreign-manifest republication; same-size SRAM change on WebDAV; disjoint-member fork; membership removal; failed listing vs empty listing; `unknown`-both asks | VM | #22 code |
| **2** | rclone 1.75.0 spike on the device: bisync matrix; `--backup-dir` with `copy` (which object, atomicity, cost); `lsjson --files-from`; `--order-by` manifest-last (O1); `copyto` vs `--ignore-times`; path normalisation; rate limits | RG35XX SP → WebDAV, then Dropbox | transport contract freeze |
| **3** | Sequential two-device offline fork (H₀ → B publishes Hᵦ → A offline Hₐ → A exits): both heads unchanged until a decision | RG35XX SP + RG-SP, disposable namespaces | cutover |
| **4** | Exit-path pricing: idle (0 spawns), changed on Dropbox and on WebDAV including preflight, hashless read, forced transfer, verify, manifest; sets D-CLOUD-033's ceiling; shadow census begins | H700 | cutover `[M]` on ceiling |
| **5** | #19 bench, same-chipset control first `[S08]` | bench | #23 badge only |
| **6** | Lifecycle and adapter: ES killed mid-game; boot overlap; launch from auto-only (observe −99); `copyToSlot` failure; parent-derived destination; SRAM rewrite; cache staleness | RG35XX SP | #23/#24 apply |
| **7** | Deletion and compaction to convergence: churn trace (cloud-only `state5` onto `{0,1,2}`, download, launch/exit, sync twice → one copy per side); stale record vs later occupant; unexplained single absence resurrects; mass absence refuses | two H700s | D-CLOUD-037 claim |
| **8** | Interrupt each apply phase; recovery before launch; retained-store readability with a test-only reader after manifest overwrite, renumber, log rotation and plan removal; wrong-clock pruning; torn-unit guard | RG35XX SP | ship |
| **9** | Two-device race with `--backup-dir` on both: recoverability, not prevention; report honestly | two H700s | multi-device changelog claim |
| **10** | #10 launch-behaviour rehearsal | RG35XX SP | #10 |
| **11** | 480×320 press-through with real thumbnails, unknown provenance, containers, deterministic auto KEEP BOTH, cancellation, done-page sentence, no undo; cloned-card experiment | RG351M; two H700s | ship |

---

## 8. What the corpus settles, and what the council merely agrees on

**Settled by the corpus `[V]`**: the shipped pipeline is newest-wins (`[S29][S35]`, blindspot 28); sidecars beside `.srm` do not sync (`[S05]` fixture, `[S32]`); the four ES primitive defects (`[S37][S38]`); `es_savestates.cfg` does not ship and the XML path changes launch behaviour (`[S04][S39]`); `RCLONEOPTS` bypasses the allowlist when non-empty (`[S29][S33]`); the QA WebDAV has no hashes or modtimes (`[S04]`); rclone start ≈ 1 s, idle exit ≈ 5 s, one save ≈ 7 s (`[S09]`, D-CLOUD-028); `lsjson --stat` cannot report absence on buckets (`[S09]`); the round-trip suite has never run (`[S27]`); `.state.auto.bak` is synced and invisible (`[S32][S38][S39]`).

**Council agreement the corpus does not settle `[C]`** — flagged so a reader knows these are reasoning, not evidence: bisync's demotion (the IA and #22 still say bisync detects `[S02][S23]`); the queue-and-badge trigger; that the manifest classifier fits the exit budget (every number is a prediction until Gate 4); that `--backup-dir` with `copy` archives the replaced object (the corpus shows it only in `cloud_backup`'s `sync` branch `[S29]`); that auto states are the commonest conflict (schema §4 asserts it; the census measures it); that the unit table matches what standalone emulators actually write; that ES's inherited fd survives its restart; that the offline-fork fixture passes against Dropbox's eventual consistency. Retention-on has left this list — the maintainer settled it.

---

## 9. What not to build

An undo control in the resolution flow (maintainer); a multi-step lineage or version graph (maintainer; `gpt_peer_review-r3.md` §2.4); a timestamp-keyed discard store; a general deletion protocol inferred from absence; the per-path hold-back; bisync as detector or as a second authority on agreement; a full staging mirror of the remote (blind to same-size changes on hashless backends); SQLite anywhere near the sync tree (the allowlist excludes it for a reason `[S32]`); a daemon; vector clocks; semantic merging; progress heuristics that *select* a winner (the rule file's "lean toward progress" `[S09]` informs display order at most, never a default); a 99-slot product cap to mask −99; a protected-publication protocol in V1; a two-spawn gate written before measurement; a ping probe on the exit path; the resume-side sub-choice; automatic cleanup of the stage or pending directory "on sight"; a kid-mode resolver.

---

## 10. Corpus gaps surfaced to the orchestrator

Load-bearing and not embedded: `GuiSaveState.cpp` (the delete hook for retirement records; known only via `issues/issue-24.md` `[S25]`); `SaveState.h` / `SaveStateRepository.h` (default arguments); `Paths.cpp` (the hard-coded savestates root); `setsettings.sh` (RetroArch `savestate_directory`); ES's `ProcessStartInfo` (fd inheritance); rclone 1.75.0 documentation or source for `--backup-dir` with `copy`, `lsjson --files-from`, `--order-by` ordering guarantees; `docs/es-ui-style-guide.md`; the current issue bodies with the futro's edited ACs (the embedded issue files are comment exports); and any executed test result — none exists in the corpus. My own round-2 artifact is not embedded; §1 reconstructs its claims from the four reviews and concedes them as they were described.

---

## `corpus.provenance.json`

```json
{
  "artifact": "claude-revised_plan-r3.md",
  "role": "council member, round-3 revised approach (supersedes claude-revised_plan-r2.md)",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "sha256 values copied verbatim from the per-source headers; verified at embed time by the Facilitator; not independently recomputed",
  "citation_mapping": "S01 through S42 map in order to the parallel source_file_paths and source_file_hashes arrays",
  "injected_peer_reviews": [
    "gemini_peer_review-r3.md",
    "gpt_peer_review-r3.md",
    "kimi_peer_review-r3.md",
    "mistral_peer_review-r3.md"
  ],
  "injected_review_hashes_provided": false,
  "own_prior_revision_embedded": false,
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "separate_declared_path": null,
    "sha256": null,
    "applied_as_authoritative": true,
    "content": [
      "reversibility is first-class; the depth that matters is one step back; edge cases inform but do not drive",
      "V1 retains the discarded copy on by default, bounded by a count, and ships no undo control; restore is a separate tool; the V1 store must be readable by that future tool"
    ]
  },
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
  "missing_material": [
    {"description": "GuiSaveState.cpp — the savestate manager's delete path, proposed hook point for retirement records; known only via issues/issue-24.md", "declared_path": null, "sha256": null},
    {"description": "SaveState.h, SaveStateRepository.h, Paths.cpp, ES ProcessStartInfo (fd inheritance), setsettings.sh (RetroArch savestate_directory)", "declared_path": null, "sha256": null},
    {"description": "rclone 1.75.0 documentation or source for --backup-dir with copy, lsjson --files-from, --order-by ordering guarantees, copyto comparison semantics", "declared_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md; current issue bodies with the futro's edited acceptance criteria", "declared_path": null, "sha256": null},
    {"description": "Any executed test, hardware, backend, or round-trip result — none exists in the corpus", "declared_path": null, "sha256": null},
    {"description": "claude-revised_plan-r2.md and the other round-2 plans, known here only through the four injected reviews", "declared_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, contents or execution results have been fabricated."
}
```