# kimi-revised_plan-r4.md

**Round-4 revised approach — the foundation for cloud-save conflict resolution in ROCKNIX (epic #11; #19–#25, #10, #9).**

This document stands alone. It is the foundation I would build, revised after reading the four injected round-4 peer reviews (`claude_peer_review-r4.md`, `gemini_peer_review-r4.md`, `gpt_peer_review-r4.md`, `mistral_peer_review-r4.md`) against the embedded corpus. Corpus citations use the declared paths under `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/`, shortened to their suffix (e.g. `repo/docs/save-manifest-schema.md`); decisions are cited by register ID. The two maintainer decisions in the brief — reversibility as one-step retention, on by default, no V1 undo control; the restore tool as a separate issue — are applied as authoritative.

One honesty note up front: the round-3 plans themselves are not embedded in this prompt — only the four reviews are. I reconstruct my own round-3 plan (`kimi-revised_plan-r3.md`) from the reviews' descriptions, which are detailed, quote it extensively, and agree with each other about its content. Where I concede or defend, I am working from that reconstruction, and I say so.

---

## 1. The foundation in twelve sentences

1. **Identity.** A save version is the sha256 of its stored bytes; slot and file name are attributes (D-CLOUD-030). A multi-file save (Dreamcast VMU folder, N64 `.eep/.mpk` pair) is a *unit* of per-file versions with a declared member map; a single-file multi-game save (PSX `.mcr`) is one entry with `kind: container`, `rom: null`.
2. **Manifest.** Each device writes only `savestates/.rocknix/manifest-<device-id>.json` (D-CLOUD-031). Readers take the union as a **set of claims, never a merge of maps** — two devices legitimately hold different hashes for one path, and that *is* the conflict. Foreign manifests are downloaded into an observation cache **outside** the synced tree and are never republished.
3. **Agreement.** A local, unsynced record (`/storage/.cache/cloud_sync/agreed.json`) holds the hash this device last verifiably uploaded or downloaded per path, **bound to a sync context** (remote name, backend type, remote root, local roots, link identity). A context change — CHANGE CLOUD FOLDER, a re-link — voids agreement; every affected path becomes "never agreed → ask," never "cloud changed → download."
4. **Capture.** At every game exit, whether or not any sync setting is on, the device hashes the save tree and records provenance for what it wrote — emulator and core as **effectively executed** (frozen at launch, after `SaveState::setupSaveState()` rewrites), core build from the image's pins file. Nothing stamps a file it did not write; `unknown` is a rendered value.
5. **Classification.** A home-built three-way classifier (local *L*, cloud *C*, agreed *A*) over complete member maps decides every unit: identical → nothing; one side changed → transfer, no prompt; both changed, or never agreed and differing → conflict. Moves are folded out first, under the qualifications in §3.3.
6. **Write paths.** Every path that can overwrite a save — boot pass, SYNC SAVE DATA row, game-exit pass — reads current cloud evidence for the changed set **before** writing. A head it cannot read, it does not overwrite: the upload is deferred and the unit stays pending. This fulfills D-CLOUD-029's replacement; it does not patch the shipped newest-wins pair (blindspot 28).
7. **Wizard.** Conflicts queue and badge; the wizard opens only after the non-conflict pre-pass has verifiably completed; no conflict resolution transfers until COMPLETE; quitting discards decisions — and completed pre-pass transfers are not rolled back (the IA rev 4 sentence is corrected to say so).
8. **Merge.** KEEP BOTH re-slots through a checked adapter over ES's primitives, with in-memory slot reservations for the whole walkthrough. On an auto-state conflict the shape is deterministic: this device keeps `.state.auto`, the cloud copy is preserved as the next free numbered slot.
9. **Retention.** The discarded copy is retained **on by default**, bounded per game/unit, as a self-contained event record under `/storage/.local/share/rocknix/cloud-saves/`; a cloud-side loser is fetched into the store **before** the remote is overwritten. Version one ships **no undo control**; the done page says what was discarded and that the copies are kept on this device.
10. **Deletion.** Explicit deletes propagate as bounded tombstones in the per-device manifest. Unexplained absence **holds and reports** — fail closed, no automatic resurrection, no deletion. Compaction and renumber retirements are verified-identical by construction and are **not** stored.
11. **Lifecycle.** A gate owned across the emulator's process lifetime — surviving an EmulationStation crash-and-restart — excludes the save tree from every sync pass while a game runs. Uploads use sealed stage copies, never live emulator files.
12. **Transport.** rclone only: scoped `--files-from` batches, transfers forced past metadata comparison, results verified against the artifact before agreement advances. `bisync` is a candidate transport the spike may promote or kill; the classifier is ours regardless.

---

## 2. What changed since `kimi-revised_plan-r3.md`

### 2.1 Conceded — refuted, with the file that refuted it

1. **The `defaultCoreDirectory` "dual scan" does not exist.** `gpt_peer_review_r4.md` §2.7 is right, against `es/SaveStateConfigFile.cpp`: `defaultCoreDirectory` *replaces* the config's directory for the default core (`copy->directory = pInfo->defaultCoreDirectory`); it does not add a second scan, and `es/SaveStateRepository.cpp` scans the selected directory non-recursively. My round-3 claim that supplying it keeps both flat and per-core layouts discoverable was wrong. Consequence: **#10 requires an ES patch, not a config file** — which is also what my own `racommands` finding already implied (the XML reader sets `racommands = false` unconditionally, retiring the `.auto`/`.bak` dance and the `-autosave` launch flags; `es/SaveState.cpp`). The #10 rehearsal (§8, gate 10) now tests launch behavior *and* both-layout discovery, expecting a patch.
2. **Equality-seeding from a foreign manifest plus size/mtime is not equality.** `gpt_peer_review-r4.md` §2.2 is right: a manifest claim describes an intended version, not the bytes currently at a mutable remote path, and the QA WebDAV offers neither hashes nor modtimes (`repo/docs/save-manifest-alignment-review.md` §1; `repo/.claude/rules/rclone-cloud-sync.md`). On a hashless backend, size/mtime can only *disprove* equality (a mismatch means known-different); a match means *unknown*, resolved by download-and-hash or by deferral. My round-3 rule permitting the seed is removed.
3. **Restoring retired bytes is a republication, not a new version.** `gpt_peer_review-r4.md` §2.5 is right under D-CLOUD-030: identity is the hash, so a restored file is the *same* version with new provenance. My round-3 text calling the restore "a new version" is corrected, and the tombstone rule gains explicit applicability/consumption semantics (§3.9).
4. **The operation-keyed retention store makes the future reader scan.** My round-3 store (`discarded/<utc>-<device-id>-<seq>/`) forced the restore tool to open every `operation.json` and filter by game. I adopt the game-addressed layout of `claude-revised_plan-r3.md` as relayed by `gemini_peer_review-r4.md` §1 and `gpt_peer_review-r4.md` §1 — while keeping my path-preserving payloads and self-contained record, which `gpt_peer_review-r4.md` §1 credits. See §4.
5. **"A window of two rename syscalls" misstates the interruption geometry.** `gpt_peer_review-r4.md` §2.3 is right: after a kill, a half-installed multi-member unit stays half-installed until recovery runs; the window is not bounded by the next syscall. Recovery restores local coherence **offline, before launch**, inspecting actual hashes (§3.6).
6. **The store does not belong in `.cache`.** `gpt-revised_plan-r3.md`'s reasoning, relayed by `gemini_peer_review-r4.md` §3 and `gpt_peer_review-r4.md` §4: the IA doc defines `/storage/.cache/` as the home of state that "persists but can be regenerated" (`repo/docs/conflict-wizard-ia.md` § Where state lives), and the retention store holds the *only* copy of user data. Moved to `/storage/.local/share/rocknix/cloud-saves/`, gated on a `backuptool` verification (§5, pick 1).
7. **"The loser's manifest entry verbatim" is not self-contained.** `gpt_peer_review-r4.md` §1 is right against `repo/docs/save-manifest-schema.md` §6: `device` is a *top-level* block, not an entry field, and the entry's `screenshot` is a remote-relative path with no hash. The record now carries the entry **plus a snapshot of the enclosing device block**, and the retained PNG's sha256 computed at retention time.
8. **Ordering by UTC directory prefix trusts the RTC.** `claude_peer_review-r4.md` §2 item 4 and `gpt_peer_review-r4.md` §1: a device that booted without a network (`clock_synced: false`, schema §6) misorders wall-clock keys. Ordering is now a persisted commit sequence; wall-clock times are display-only (§4).

### 2.2 Adopted — credited, and where it lands

| From | What | Where |
|---|---|---|
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` §3.4, §5) | **Agreement bound to a sync context** — the rule `claude_peer_review-r4.md` calls "the single most valuable rule in the four plans that the other three lack" | §3.1 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` item 18) | **Capture unconditional on the sync setting** — the ES exit call is gated on `cloudsaves.gameexit` and `!isRunning()` (`es/FileData.cpp.launchGame-excerpt-l740-850.cpp`); capture must not live inside that `if` | §3.2 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` item 17; `gpt_peer_review-r4.md` §2.3) | **Gate ownership surviving ES death** — ES abort-and-restart is documented in `repo/.claude/rules/engineering-practices.md` | §3.5 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` items 20–21) | **Claims-set union; foreign manifests to an out-of-tree cache** | §3.1 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` items 2, 5) | **Commit-order pruning; game/core retention bucket** | §4 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` item 23) | **Cancellation wording** — "completed non-conflicting transfers are not rolled back" | §3.6, IA rev 5 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` §5) | **Bucket-remote `--backup-dir` prefix validation** — verify the retirement by listing, not exit code (blindspot 22) | §3.9 |
| `gpt_peer_review-r4.md` §2.1 | **Capture dirtiness ≠ publication dirtiness** — the idle fast path must check for unpublished versions, retained staging, and pending operations, or a failed upload is forgotten | §3.4 |
| `gpt_peer_review-r4.md` §2.2 | **Forced transfers** — exact-file uploads pair with `--ignore-times`, the shipped archive paths' own rule (`repo/.../sources/cloud_backup`, `cloud_restore`) | §3.4 |
| `gpt_peer_review-r4.md` §2.6 | **Precondition recheck at COMPLETE** — the pre-pass is a snapshot, not a reservation; agreement alone cannot detect a moved cloud head | §3.6 |
| `gpt_peer_review-r4.md` §2.7 | **Effective emulator/core frozen at launch** — `setupSaveState()` rewrites `-emulator`/`-core` (`es/SaveState.cpp`) | §3.2 |
| `gpt_peer_review-r4.md` §2.5 | **Move-inference qualifications** — same repository and kind, current bytes validated, permutations planned as a set | §3.3 |
| `claude-revised_plan-r3.md` (via `gemini_peer_review-r4.md` §1, `gpt_peer_review-r4.md` §4–5) | **Game-addressed retention discovery; sealed stage copies for upload** | §4, §3.5 |
| `gemini-revised_plan-r3.md` (via `claude_peer_review-r4.md` §5) | **The four-state apply journal sentence** — "prepared operands, local installation complete, remote publication verified, agreement committed"; **explicit cloud-loser fetch**; **the cloned-card experiment** | §3.6, §4, §8 |
| `mistral-revised_plan-r3.md` (via `claude_peer_review-r4.md` §5) | **Hook-absent degradation** — if `GuiSaveState.cpp` (not embedded) offers no clean attach point, reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships | §3.9 |
| `mistral-revised_plan-r3.md` (via `gpt_peer_review-r4.md` §4) | **A thumbnail anomaly is not a progress fork when the state bytes are identical** — the PNG is excluded from version identity (schema §1) and verified/repaired independently | §3.3 |
| `claude_peer_review-r4.md` §3.6 | **The transient incremental slot-copy fixture** — under `racommands`, `setupSaveState` copies the loaded state to the next free slot mid-session (`mNewSlotFile`), admitted by `+ /**/*.state*`; a concurrent full pass would upload a phantom | §8, gate 3 |

### 2.3 Where a review misread my plan

- **`mistral_peer_review-r4.md` §3 lists "`--include`-based manifest transport" as something my plan has that should not be built.** My round-3 transport was `--files-from`, as `claude_peer_review-r4.md` item 14 and `gemini_peer_review-r4.md` §2 both record. No change needed; the record is corrected here.
- **`gemini_peer_review-r4.md` §1 calls my operation-keyed store O(N) with "severe performance issues."** Overstated: the store is count-bounded (count × units), so the scan is a few hundred small JSON files at most — `claude_peer_review-r4.md` §1.3 called the same scan "acceptable; not indexed." I adopt game-keyed discovery because it is strictly better at zero cost, not because the scan was unsafe.
- **`mistral_peer_review-r4.md` §1.1 says my store is "the only" one surviving the amendment while its own table marks `claude` and `gpt` as surviving.** Internally inconsistent; no consequence for the design.

After the integrations above, I believe **no architectural difference remains** between this revision and the integrated endpoint that `claude_peer_review-r4.md` §2 ("a builder does not have to choose between these plans; a builder has to integrate them") and `gpt_peer_review-r4.md` §3 ("nothing architectural remains") describe. What remains is a small set of policy picks, named and settled in §5.

---

## 3. The architecture, end to end

### 3.1 Identity, manifest, agreement

- **Identity** is unchanged from D-CLOUD-030: sha256 of stored bytes; slot and name are attributes; duplicates compacted only after re-reading both files and finding the hashes equal, with an audit line.
- **Manifest** is unchanged in shape from D-CLOUD-031, with four refinements (§6): the union is a **set of claims**; a bounded `retirements` list (§3.9); `kind: container` confined to single-file multi-game saves with `rom: null`, with multi-file containers expressed as **declared units** over per-file entries; and foreign manifests cached outside the synced tree.
- **Agreement** (`agreed.json`, local, unsynced — D-CLOUD-031 stands) gains a `sync_context` block: remote name, backend type, remote root (`SYNCPATH`), local roots (`BACKUPPATH`/`RESTOREPATH`), and a link fingerprint (the remote's non-secret identifying fields; exact field set is a build-time detail, the binding is the rule). On any mismatch, agreement is void and the classifier's conservative branch governs. This closes the hazard `claude_peer_review-r4.md` §3.4 traces: a re-linked folder whose differing bytes would otherwise classify as "cloud changed → download, no prompt" over the player's local progress.
- **Agreement advances only on verified equality**: after an upload, the remote head is verified against what was sealed (post-transfer listing matched to `remote_hash` where the backend hashes; download-and-hash on hashless backends); after a download, the local bytes are re-hashed. An exit code is never evidence (`repo/.claude/rules/engineering-practices.md` — verify the artifact). If verification is impossible within the operation's budget, the mutation or the agreement advance is **deferred**, not asserted.

### 3.2 Capture (#21)

- Runs at **every** game exit, independent of `cloudsaves.gameexit` and of the cloud lock — the ES call site gates the *transfer*, and capture must not inherit that gate (`es/FileData.cpp.launchGame-excerpt-l740-850.cpp`).
- Receives emulator and core **as executed**: frozen at launch after `SaveState::setupSaveState()`'s rewrites (`es/SaveState.cpp`), passed on the command line per the alignment review's "told, not discovered" constraint (`repo/docs/save-manifest-alignment-review.md` §3.3). Standalones pass their own name as `core`.
- Core build comes from `/usr/share/rocknix/core-pins`, emitted at image build (#21's existing constraint).
- Cost on the watched path: the exit capture hashes what the session could have touched. States are tens of KB and `sha256sum` is busybox-present (schema §1). Large standalone saves (PPSSPP) use an mtime+size **negative filter** — unchanged metadata means skip the re-hash — with the boot/full pass re-hashing everything as the invalidation backstop. The filter is a heuristic for *local* capture only; the classifier never treats size/mtime as equality proof for the cloud side (§2.1.2). The census (gate 5) measures the real distribution, including large states — a count is not a byte-space guarantee.

### 3.3 Classification (#22)

- Per unit, over complete member maps: *L* from the local tree, *C* from the claims-set union plus a scoped listing, *A* from the bound agreement record. The verdict table is the schema's §3 made mechanical, with disjoint-member changes inside one unit classified as **one fork**, not per-file conflicts.
- **Moves fold out first**, qualified (`gpt_peer_review-r4.md` §2.5): same hash elsewhere counts as a move only within the same game/core repository and save kind; the *current* bytes are validated, not a stale manifest claim; multiple matches and occupied destinations are handled; a renumber permutation is planned as a set, not renamed through one occupant at a time. D-CLOUD-030 does not establish "the cloud's path wins"; the re-key rule stays the schema's.
- **Thumbnail anomalies are not progress forks** when the state bytes are identical (`mistral-revised_plan-r3.md` via `gpt_peer_review-r4.md` §4); the PNG is verified and repaired as an associated artifact.
- **Never agreed and differing → ask.** A file with no entry on either side is `unknown`-both and still asks (the alignment review's #22 constraint). A Dropbox "conflicted copy" or Syncthing `.sync-conflict-` file is never offered as a version (D-CLOUD-022).
- **bisync** remains a candidate transport. The corpus contains its flags and help text, not a run (`repo/rclone-bisync-planning.md`, `issues/issue-22.md`); the spike (gate 2) decides, and the classifier is ours either way. The planning note's "newer file wins" Phase 3 stays struck (alignment review §3.1).

### 3.4 The write paths

- **Boot pass and SYNC row** route through the reconciler. The boot pass moves under ES scheduling once the network is up, replacing the `ping google.com` gate (`repo/.../autostart/102-cloud-saves`; the rule file and the alignment review both condemn it). The handoff is not embedded — orchestrator gap; the autostart shim stays a no-op until the ES side lands, and the lock prevents a double run during transition.
- **Game-exit pass**: capture (always) → changed set. Idle requires **all** of: no local changes since last capture, no captured-but-unpublished versions, no retained staging, no pending operations (`gpt_peer_review-r4.md` §2.1 — the shipped `--recent` keys its window to a *successful* backup stamp, and that retry property is preserved, not lost). Idle → zero rclone spawns. Changed → one scoped listing of the changed units' remote heads → classify → non-conflicts transfer in one `--files-from` batch, **forced** past metadata comparison (`--ignore-times`, the shipped scripts' own precedent) → conflicts queue and badge. If the head cannot be read within budget, **the upload is deferred** — never "the verification is deferred" while the upload proceeds; `claude_peer_review-r4.md` §3.3's reading of mistral's sentence is the behavior to avoid, and the futro's #22 AC (a constructed both-sides change *refused* on the exit pass) is the guard (`repo/plans/conflict-resolution/vita-style-conflict-resolution.md` §5).
- **Budget**: idle ≈ 0 added seconds; one changed save targets the measured ~7 s envelope on H700 (`repo/.claude/rules/rclone-cloud-sync.md` — ~1 s per rclone start). Gate 4 prices it. The hashless QA WebDAV is designed-for fail-closed, not sized-for; the budget is sized on Dropbox/S3 (`claude_peer_review-r4.md` §6).
- **Every caller takes `take_cloud_lock`**; rclone's exit codes are mapped into typed internal outcomes so rclone's 3/4 never collide with the scripts' reserved skip codes, and no stamp is written for work that did not run (my F3 filing; `repo/.../sources/cloud_backup`, `es/ThreadedCloudSync.cpp`).

### 3.5 The lifecycle gate

- A file descriptor held across the emulator's process lifetime — by the launch supervisor, or by a one-line wrapper if ES closes descriptors on exec (`O_CLOEXEC` is the test `gemini_peer_review-r4.md` §4 names; unmeasured, gate 3). While held, no sync pass installs into or publishes from the save tree. This closes the mid-session transients: the zombie `.state.auto.bak` and the transient incremental slot copy (`es/SaveState.cpp`; `claude_peer_review-r4.md` §3.6), both admitted by the shipped allowlist (`repo/.../sources/cloud_sync-rules.txt`).
- **Uploads use sealed stage copies** (`claude-revised_plan-r3.md` via `gpt_peer_review-r4.md` §4): the bytes hashed are the bytes uploaded, staged under a temp name matching neither ES regex (my round-3 rule), never a live file an emulator can rewrite mid-read.

### 3.6 The wizard (#23) and the apply engine (#24)

- **Queue-and-badge**: an unattended pass that finds conflicts queues them and badges the cloud row; the wizard opens from the badge or the next attended sync. IA rev 4's "a sync that reports conflicts opens the wizard" becomes IA rev 5 (council-agreed, not corpus-settled — §7).
- **Pre-pass gate** stands (futro AC): the wizard refuses to open until every cloud-only file is downloaded, and says so. **At COMPLETE, preconditions are rechecked** — local and cloud operands, the complete unit map, proposed destination slots, pending tombstones — because the pre-pass is a snapshot, not a reservation (`gpt_peer_review-r4.md` §2.6). A moved head reclassifies rather than applies.
- **Apply journal** (`gemini-revised_plan-r3.md`'s sentence, adopted): the record distinguishes *prepared operands → local installation complete → remote publication verified → agreement committed*. With `gpt_peer_review-r4.md` §2.3's correction: a phase is a checkpoint, not proof — recovery inspects actual member hashes at every phase, including when the record says `prepared`, and local coherence is restored **offline, before the next launch**. A prior decision authorizes its recorded operands, not an arbitrary future remote head.
- **Done page**: names each discarded copy per game (futro AC), states that the copies are kept on this device and how many are kept. It does **not** promise recovery — "can be recovered later" is a claim about a tool V1 does not ship, and the changelog rule is that claims are acted on (`repo/docs/cloud-sync-changelog.md`; `claude_peer_review-r4.md` §1.1).
- **Cancellation wording** (IA rev 5): "No conflict-resolution changes apply until COMPLETE. Completed non-conflicting transfers are not rolled back by canceling the walkthrough."
- **Auto pair**: presented first, labeled as the resume-point decision (schema §4); KEEP BOTH's shape is deterministic (§1.8).
- **Kid/kiosk**: pending conflicts never block non-conflict transfers; in modes that hide GAME SETTINGS (`repo/docs/es-menu-map.md`), conflicting units are held, not resolved — fail closed, no prompt surface that mode cannot reach.

### 3.7 The checked slot adapter

All ES contact goes through one adapter; nothing calls the primitives raw. The adapter owns the four source-visible traps: `getNextFreeSlot()` returns −99 for an auto-only repository and for any non-RetroArch emulator (`es/SaveStateRepository.cpp` — `isEnabled` requires `"retroarch"`; an auto state registers with `slot = -1` and the allocator's 99999→0 scan never matches it); `copyToSlot()` returns `true` regardless of the copy/rename result (`es/SaveState.cpp`); `makeStateFilename(fullPath=true)` derives the destination from the *source's* parent, so a cloud state staged in a temp directory would be "merged" into the temp directory; and the `.png` must be verified to have moved. The adapter allocates from `firstslot`, verifies every filesystem effect, derives destinations from the game's real state directory, and holds **in-memory slot reservations** so two KEEP BOTH decisions for one game in one walkthrough allocate different slots before either is installed (my round-3 rule; `gpt_peer_review-r4.md` §4 lifts it). `gpt-revised_plan-r3.md`'s ten-point contract (via `claude_peer_review-r4.md` §5) is the acceptance checklist.

### 3.8 Audit

`/storage/.cache/log/cloud_audit.log`, append-only text, rotated at 1 MiB keeping one predecessor (D-CLOUD-027 — stands; the retention store is **not** the audit log, and `claude_peer_review-r4.md` §3.7's labeling correction is taken). The audit line for a discard is written **before** the apply step deletes anything (futro AC). The audit log is support-only; the done page is what the player sees. The SQLite index question left open in #20 is closed: **no index** — all four plans agree, and the store's record contract carries what an index would.

### 3.9 Deletion, tombstones, unexplained absence

- **Explicit deletes propagate.** The per-device manifest carries a bounded `retirements` list: `{path, sha256, retired_at, seq}`. A consumer seeing a file matching a live tombstone, with no *newer* manifest entry for that (path, hash), retires its local copy and logs it. A manifest entry for the same (path, hash) **newer** than the tombstone consumes it — that is a republication with fresh provenance, not a resurrection (§2.1.3). Tombstoned deletions are applied without retention-store copies: the store's semantics stay "conflict losers," and a deliberate ES delete is already permanent today; widening the store into a trash can is scope the problem does not earn.
- **Window**: pruned when every device in the union has observed them, else after a generous bound (proposal: 64 events or 90 days — unmeasured, §7). The consequence is stated plainly: a forgotten tombstone plus a late device means the file returns as device-only and is uploaded without a prompt — non-destructive, self-correcting, at worst a later conflict the wizard shows. The window is **decoupled from the retention count** (`gpt_peer_review-r4.md` §2.5); `claude_peer_review-r4.md` §2 item 10 prefers this bounded shape over an unbounded list, and so do I (§5, pick 3).
- **Unexplained absence** (no tombstone, file gone on one side): **hold and report** — fail closed, badge, no automatic resurrection, no deletion (my round-3 rule; `gpt_peer_review-r4.md` §2.5 lifts it into every plan). Failing closed on an unexplained absence is cheap and expected, per the maintainer's amendment.
- **Remote retirement mechanism**: `--backup-dir` into a dated **sibling** of the destination (D-CLOUD-014), gated on the race fixture (gate 6); on bucket remotes the retirement is verified by listing, not exit code (blindspot 22; `repo/.claude/rules/rclone-cloud-sync.md` — `mkdir` exits 0 creating nothing).
- **Hook-absent degradation** (`mistral-revised_plan-r3.md` via `claude_peer_review-r4.md` §5): if the delete hook has no clean attach point (`GuiSaveState.cpp` is not embedded), reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships.

### 3.10 #10 per-core namespacing

In the drop, last, gated on the rehearsal (gate 10). The rehearsal's questions, sharpened by §2.1.1: (1) does the non-`racommands` launch path (`-state_slot N -state_file "…"`) work on ROCKNIX's RetroArch launcher — not embedded (`setsettings.sh`, the launch wrapper, the shipped `retroarch.cfg` are gaps); (2) does an ES patch scanning both the flat and per-core directories preserve discovery of existing states; (3) does losing the `.auto`/`.bak` dance change observable behavior (gate 3's reproducer answers). Expect an ES patch, not a config file. D-CLOUD-017 stands; the implementation path is what changed.

---

## 4. The retention store, specified for its future reader

The maintainer's requirement: nothing reads this store in V1, so nothing will catch a shape a later reader cannot drive a picker from. The reader's query is: *"show me the retained past versions of this game, newest first, with a thumbnail, the producing device, and which side won."*

**Root:** `/storage/.local/share/rocknix/cloud-saves/` (§5, pick 1).

**Layout:**

```
discarded/<system>/<unit-key>/<seq>-<device-id>/
    record.json
    <each retained member at its original sync-root-relative path, recreated beneath this directory>
pending/<operation-id>/…        # transient apply journal; removed on finalize
```

- `<unit-key>`: for states, `<rom-stem>+<core>`; for in-game saves, `<rom-stem>`; for shared containers, `container:<label>`. Encoded unambiguously — percent-encode every byte outside `[A-Za-z0-9._-]` — with the raw `system`/`rom`/`core` recorded in `record.json` (`gpt_peer_review-r4.md` §1: no lossy slug).
- `<seq>`: a persisted local counter, zero-padded, incremented under the cloud lock, seeded above the maximum found on disk. **Commit order, RTC-independent** (`gpt-revised_plan-r3.md` via `claude_peer_review-r4.md` item 4). `<device-id>` disambiguates an imported store.

**`record.json`** (schema 1): `record_id`, `seq`, resolving `device_id`; `resolved_at` (UTC), `resolved_at_local` (with offset), `clock_synced` of the resolving device — display fields, never ordering; `system`, `rom` (null for shared containers), `unit_key`, `kind`, `slot`; `decision` (`keep-left`|`keep-right`|`keep-both`); `winner` {side, sha256, paths, producer snapshot or null}; `loser` {side, **producer snapshot = manifest entry verbatim plus the enclosing top-level `device` block** (§2.1.7), `members`: [{original sync-root-relative path, sha256, size, retained-relative location}], `screenshot`: {retained-relative path, sha256 computed at retention} | null}; `reason`: `conflict-loser` (**only** — compaction and renumber retirements are not stored; verified-identical bytes survive at the retained slot, my round-3 rule, which `claude_peer_review-r4.md` §1.4 confirms against D-CLOUD-030 and lifts into mistral); `state`: `prepared` → `finalized`, finalized before the pending record is removed (`gpt_peer_review-r4.md` §1 — presence of the record must not be the only evidence the discard happened); `sync_context`; `run_id`.

**Cloud loser on KEEP RIGHT:** the wizard never needed the cloud side's bytes to display (schema §6's `screenshot` rationale), so the apply step fetches the loser's bytes and PNG into the event directory — one scoped copy, tens of KB — **before** the remote is overwritten. The remote `--backup-dir` sibling is a second copy, not the store. (My round-3 text was ambiguous here; `claude_peer_review-r4.md` §1.3's fix sentence is adopted verbatim in effect, crediting `gemini-revised_plan-r3.md`'s explicit statement.)

**Pruning:** per `unit_key` bucket, keep the N newest **finalized** records by `seq`; N = 3 as a product proposal, set by the census (gate 5) — the maintainer said "bounded by a count," not three (§7). `prepared` records are never pruned. Pruning removes whole event directories; it counts coherent retained candidates, not member files (`gpt_peer_review-r4.md` §1).

**Reader walkthrough:** open `discarded/<system>/<unit-key>/`; list event dirs; sort by `<seq>` descending; read each `record.json`; render the retained panel from the record alone — thumbnail from the retained PNG, device + model from the producer snapshot, local time and clock warning from `resolved_at_local`/`clock_synced`, the winning side from `decision`. No manifest, no audit log, no pending record, no scan of other games.

**The reader test** (my round-3 acceptance test, which `claude_peer_review-r4.md` §1.3 says to lift into every plan; extended per `gpt_peer_review-r4.md` §5): create retained decisions for several games, a complete multi-file unit, a repeated hash, and a renumbered state; then overwrite the producer's manifest entry, rotate the audit log, remove the pending records, and set the clock backward. A test-only reader must still produce the per-game list, correctly ordered, and open the right bytes and PNG. This is a **schema gate**, not a V1 user control.

**The separate restore tool** (its own issue, the maintainer's shape): the wizard's compare-and-choose surface pointed at a game's retained versions — PAST versus NOW, where NOW is read from the live tree. This store drives it without modification.

---

## 5. The picks — where a builder must choose, and what I choose

1. **Store home: `/storage/.local/share/rocknix/cloud-saves/`.** The store holds the only copy of user data; `.cache` is the documented home of regenerable state (`repo/docs/conflict-wizard-ia.md`), and a future cache convention is not worth the convenience. *Gate:* verify against `backuptool` (not embedded) that `.local` is neither archived nor wiped — the alignment review verified only that `.cache` and `/storage/roms` escape the archive (`repo/docs/save-manifest-alignment-review.md` §1). If `.local` fails, fall back to `/storage/.cache/cloud_sync/discarded/` with an explicit no-invalidate marker and a register note. Either way the invariant — *not a cache, not archived* — is enforced and tested. (Changes my round-3; credits `gpt-revised_plan-r3.md`.)
2. **Store keying: game-keyed event directories.** The future reader's query is per-game; operation-keying forces a bounded but unnecessary scan; game-keying costs nothing. (Changes my round-3; credits `claude-revised_plan-r3.md`. My payload layout and record content survive.)
3. **Tombstone lifetime: bounded window, decoupled from the retention count, resurrection consequence stated.** An unbounded list is churn on every exit upload for devices that never return (`claude_peer_review-r4.md` §6); resurrection is non-destructive and self-correcting. `claude_peer_review-r4.md` §2 item 10 prefers this shape; `gpt_peer_review-r4.md` §2.5's decoupling is incorporated.
4. **Manifest transport: one spawn, `--files-from`, payload and manifest together.** The safety lives in the reader's coherence check — a manifest entry whose payload is absent or hash-mismatched is a torn unit, and torn units defer harmlessly — not in ordering (`claude_peer_review-r4.md` item 14; `gemini_peer_review-r4.md` §3). A mandatory manifest-last second spawn costs ~1 s on the watched path to buy a commit point no reader needs. Ordering remains an optional, measured optimization.
5. **No protected-publication protocol in V1, whatever the race fixture shows.** If `--backup-dir` cannot preserve an intervening head, the response is to narrow operation — fail closed, queue, warn-and-refuse same-ID — not to change the remote representation. The maintainer's amendment: edge cases inform, not drive; one player, never concurrent, is the stated model (`00-problem-statement.md`), with the audit log as the tripwire. (Against `gemini-revised_plan-r3.md`'s conditional requirement; with `gpt_peer_review-r4.md` §3 — "the experiment has not earned that fork yet.")
6. **Retention count: propose 3 per unit bucket; the census sets it.** Marked council-agreed, not corpus-settled.

---

## 6. Decision-register changes

- **New row refining D-CLOUD-031** (the schema row): the union is a set of claims, not a merge of maps; a bounded `retirements` list is added to the per-device manifest, with the consumption rule of §3.9; `kind: container` is confined to single-file multi-game saves (`rom: null`), multi-file containers are declared units over per-file entries; foreign manifests are cached outside the synced tree and never republished; `agreed.json` gains the `sync_context` binding.
- **New row refining D-CLOUD-028** (the exit-sync row): the changed set is computed by capture-hash comparison rather than `--max-age`; the retry property is preserved by keying publication state, not just capture state; the exit pass reads cloud evidence before overwriting and defers the upload when it cannot.
- **New small row**: the retention store's location, shape, count, and the done-page sentence — recording the maintainer's amendment where a builder will find it.
- **Unchanged, cited, fulfilled**: D-CLOUD-030 (identity; the republication clarification is schema-doc wording, not a row change); D-CLOUD-029 (write paths stay shipped until #22 replaces them — this plan is that replacement); D-CLOUD-027 (audit log); D-CLOUD-017 (per-core namespacing; the implementation path becomes an ES patch, rehearsal-gated); D-CLOUD-022 (conflicted copies never offered, never carried); D-CLOUD-024/025 (wizard in this drop; #19 before the badge).
- **IA rev 5**: queue-and-badge; the cancellation sentence; the done-page sentence; the deterministic auto KEEP BOTH; the store's reader test as a schema gate.

---

## 7. What the corpus settles vs what the council merely agrees on

**Corpus-settled:** identity and compaction (D-CLOUD-030); manifest shape (D-CLOUD-031); the shipped write paths are newest-wins (`repo/.../autostart/102-cloud-saves`, `repo/.../sources/cloud_backup`, blindspot 28); the ES primitive behaviors (§3.7's four traps; renumber-on-delete; the `racommands` retirement); no `es_savestates.cfg` ships; the allowlist's actual behavior (fixture-tested in the futro); `--include` precedence; rclone 1.75.0 present with bisync flags; the budget numbers; the QA WebDAV has neither hashes nor modtimes; `cloud_device_id`/`--label`; lock exit 3, no-route exit 4; kid/kiosk hides GAME SETTINGS; ES knows emulator/core at exit (`es/FileData.cpp.getCore-excerpt-l1470-1560.cpp`); thumbnails on, compression on; `.cache` and `/storage/roms` not archived; sqlite present (and rejected).

**Council-agreed, not corpus-settled — each with its gate:** bisync's demotion (gate 2); queue-and-badge (IA rev 4 says the wizard opens on report; the change is a design call); retention count 3 (gate 5); boot sync under ES scheduling (the handoff is not embedded); the lifecycle gate's fd-inheritance ownership (the `O_CLOEXEC` test, gate 3); tombstones in the manifest (a schema change; consumer cost unmeasured); `--files-from` composition with `--no-traverse`/`--backup-dir` on 1.75.0 (gate 6); `--backup-dir` preserving an intervening head under a race (gate 6); 480×320 recognisability (gate 9); `--ignore-times` forcing exact-file transfers in this composition (shipped precedent, untested here); the capture negative-filter plus full-pass rescan sufficing (gates 3, 5); the store home surviving `backuptool` (pick 1's verification).

---

## 8. What must be proven on hardware, in order

0. **Repair the harness** (my F4: as embedded, `repo/tools/cloud-round-trip` overwrites `rclone.conf` before asserting the first remote and never restores it; its archive-name expectations mismatch the dated uploader; its tar.gz glob matches no fixture — against `repo/.../sources/cloud_backup`, `cloud_restore`). Run the pure classifier fixtures on disposable GENERIC_X64 storage, WebDAV **and** MinIO. Never point the unrepaired harness at a configured device.
1. **#19 bench** (`repo/docs/savestate-compat-test.md`): same-chipset control (H700 ×2) → cross-chipset → loud/silent, all on one build. Gates the badge's severity (D-CLOUD-025).
2. **bisync spike**: loopback WebDAV dry-run, then Dropbox from the RG35XX SP; record `--conflict-resolve none` output shape; confirm `--recover`/`--resilient` avoid `--resync`; decide bisync's transport candidacy.
3. **Zombie-auto + transient-slot reproducer** on H700: launch from a numbered slot with incremental states on, run a full pass mid-session, inspect what reached the remote; kill ES with the emulator alive and verify the gate holds (the `O_CLOEXEC` test).
4. **Exit-pass evidence-read cost** on H700: spawns, round trips, seconds, idle and one-save-changed.
5. **Shadow census** on the maintainer's library: conflict frequency, auto-state share, unit sizes including large standalone states — sets the retention count and the capture filter's real cost.
6. **`--backup-dir` race fixture** on Dropbox and WebDAV, plus bucket-prefix validation on MinIO.
7. **Deletion/compaction/republication convergence**: delete a numbered state, renumber, sync repeatedly — remaining versions survive exactly once; restore previously retired identical bytes and verify an old tombstone cannot silently remove the restored choice.
8. **Retention reader test** (§4) — the schema gate.
9. **480×320 recognition** on the RG351M: `tools/vm-visual-qa` frames at both sizes; recognition, not merely fit.
10. **#10 rehearsal** on H700 (§3.10's three questions).
11. **Cloned-card experiment** (`gemini-revised_plan-r3.md` via `claude_peer_review-r4.md` §5): two live devices sharing one `cloud_device_id`; verify warn-and-refuse.
12. **Sequential two-device offline fork** (the capstone): agree H0; device B publishes HB; device A edits HA offline; exit on A — no boot, exit, menu, hub, or direct path overwrites either candidate before a decision; then a failed upload followed by an unchanged exit must retry.

Ship when the gates pass.

---

## 9. What is not built

No V1 undo control (the maintainer's decision). No Spawn A as a prerequisite — a locally computed backend-native hash cannot certify the remote (`claude_peer_review-r4.md` §3.2). No mandatory manifest-last second spawn. No compaction copies in the store. No raw ES primitives. No "can be recovered later" on the done page. No unbounded tombstone list. No SQLite index — #20's open question is closed. No cross-device resolution receipts (`resolves`), vector clocks, or generation counters beyond same-ID warn-and-refuse. No daemon, no full remote staging mirror, no semantic binary merging, no 99-slot cap, no automatic `--resync`. No size/mtime precheck that skips hashing indefinitely. No sizing the budget on the hashless backend. No protected publication in V1 (§5, pick 5).

**Load-bearing** (get these wrong and the milestone is unsafe): identity, the bound agreement record, the classifier, the write-path evidence read, the retention record contract, the lifecycle gate, the checked adapter, the apply journal. **Optional or later:** #10's namespacing (gated, last), the badge's severity (after #19), bisync's promotion (after the spike), #25 snapshots (V2, unblocked by §3.9's sibling mechanism and the schema's §8), the restore tool itself (separate issue; its store ships now).

---

## 10. Gaps for the orchestrator

Depended on and not embedded: `GuiSaveState.cpp` (the delete hook's attach point); `SaveState.h`/`SaveStateRepository.h` (default arguments); `Paths.cpp` and the filesystem copy/rename utilities (timestamp behavior); `setsettings.sh`, the shipped `retroarch.cfg`, and the RetroArch launch wrapper (whether `-state_file` is honored decides gate 10); `backuptool`, `cloud_sync.conf.defaults`, `cloud_sync-rules.txt.defaults`, `cloud_setup`, `tools/cloud-test-backend` (pick 1's verification; harness repair); rclone 1.75.0 documentation or source for `--files-from`, `--backup-dir`, and filter ordering; ES startup ordering relative to network readiness and the `102-cloud-saves` handoff; the current issue bodies (the embedded issue files are predominantly comment threads). The round-2 and round-3 plans, including my own `kimi-revised_plan-r3.md`, are not embedded; §2's concessions and defenses are reconstructed from the four reviews' mutually consistent accounts, not from the plan text.

---

## `corpus.provenance.json`

```json
{
  "artifact": "kimi-revised_plan-r4.md",
  "role": "council member, round-4 revised approach",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "own_prior_revision_embedded": false,
  "own_prior_revision_basis": "kimi-revised_plan-r3.md is not embedded; its content is reconstructed from the four injected reviews' mutually consistent accounts",
  "reviewed_artifacts": [
    "claude_peer_review-r4.md",
    "gemini_peer_review-r4.md",
    "gpt_peer_review-r4.md",
    "mistral_peer_review-r4.md"
  ],
  "reviewed_artifact_hashes_provided": false,
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "separate_declared_path": null,
    "sha256": null,
    "applied_as_authoritative": true
  },
  "peer_material_use": "Judged on merits against the embedded corpus and the maintainer's two decisions; not treated as evidence about councils, models, or this deliberation",
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
      "reason": "The explicit-delete hook's attach point, default arguments for makeStateFilename/copyToSlot, and copy timestamp behavior are not inspectable from the embedded excerpts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "setsettings.sh, the shipped retroarch.cfg, and the RetroArch launch wrapper",
      "reason": "Whether the launcher honors -state_file (the non-racommands path ES emits under an es_savestates.cfg) decides gate 10; savestate_directory and savestate_auto_save are not embedded",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "backuptool, cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_setup, tools/cloud-test-backend",
      "reason": "Pick 1's store-home verification and the harness repair cannot be checked from the embedded callers",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 documentation or source for bisync, --files-from, copy --backup-dir, and filter ordering",
      "reason": "Transport and preservation claims rest on behavior the corpus does not contain",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "ES startup ordering relative to network readiness and the autostart/102-cloud-saves handoff",
      "reason": "The boot pass moves under ES scheduling; the corpus does not show when ES is up or how the autostart script would hand off",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current issue bodies for #9, #10, #20–#25, #35, #37",
      "reason": "The embedded issue files are predominantly comment threads; body edits reported by the futro are not independently present",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "The round-2 and round-3 revised plans, including kimi-revised_plan-r3.md",
      "reason": "Not embedded; section 2's concessions and defenses are reconstructed from the four reviews' accounts, not from the plan text",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated"
}
```