# Consensus integration plan

**Base:** `claude-revised_plan-r4.md`, adopted whole. Nothing below re-opens its architecture (one reconciler owning every writer; sha256 identity; per-device manifests; local agreement; a home classifier; a lifecycle gate; a checked adapter; count-bounded default-on retention with no undo control; queue-and-badge). Where this document amends the base, the amendment **replaces** the base's text for the section named; everything else in the base stands as written and is not repeated here.

**Corpus and citations.** The 42 embedded sources, cited `[Snn]` in manifest order; the provenance block at the end maps `n` to declared path and embed-time sha256. Nothing was re-read, re-hashed, or run.

**Markings.** *[corpus]* — settled by an embedded source, cited. *[council]* — a position taken here, with the reason and its cost. *[unmeasured → Gate n]* — a hypothesis, with the experiment that settles it.

**Cost discipline (binding).** Every safeguard adopted below names its cost — rclone spawns (≈1 s each on the H700: `rclone version` alone measured at 1.0 s, `[S09]`), remote round trips, bytes copied, bytes held in memory, files kept on the card — and what it buys. Where a fix removes a rule, that is said too.

---

## Winning plan as base

### What stands unchanged from `claude-revised_plan-r4.md`

- §1.1 one reconciler (`cloud_reconcile`) owning boot, the three save rows, the hub tick, the Tools symlinks, the game exit, #37's tile and shell invocations; own argument list, never `RCLONEOPTS`; the shipped allowlist as the outer boundary with `- /**/*.bak` and `- /savestates/.snapshots/**` added ahead of `+ /savestates/**`. Rests on D-CLOUD-029 `[S06]`, blindspot 28 `[S07]`, `[S29]` `[S30]` `[S35]` `[S41]` *[corpus]*.
- §1.2 identity (D-CLOUD-030) and shape (D-CLOUD-031) unchanged; agreement written on verified equality; units; per-entry `producer` when publisher ≠ producer; manifests cached outside the tree; the `.cache` rule "state whose loss fails closed" — **narrowed below** (D2).
- §1.3 classification table — **three rows rewritten below** (B3, D1).
- §1.4 lifecycle gate — **contract made explicit below** (B2).
- §1.5 capture unconditional; frozen launch context; sealed copies — **sealing mechanism replaced** (B1); exit path — **upload-only, admission ceiling** (D5).
- §1.6 full passes; queue-and-badge; kid/kiosk; held items counted.
- §1.7 the checked adapter; COMPLETE re-checks the world; phased apply; hash-inspecting recovery — **durability and scope widened** (D2, I3, I4).
- §1.8 deletions — **rewritten as one algorithm** (D1).
- §1.9 the retention store: home, layout, `record.json`, buckets, the future reader — unchanged except I13, I18, I26.
- §1.10 cutover in one image; mixed firmware per-device only; replaced-mechanism inventory; route test at boot.
- §1.11 separable items; §2 picks 1–6; §3 refusals (no undo control, no ancestry beyond `replaces`, no database, no protocol, no daemon).

### Blockers cleared (required by the brief)

**B1 — Sealing is an independent copy, never a hard link.** Replaces the base's "hard-links or copies" (§1.4 fourth bullet, §1.5). Capture writes each member to seal through one pass — `cat <live> | tee <stage path> | sha256sum` (busybox has both) — then fsyncs the stage file; the manifest records the hash of the *copy*, and every later upload transfers the copy. A hard link shares the inode, so a straggling emulator write or RetroArch's 10 s SRAM flush (`autosave_interval = "10"`, `[S03]` §4) after ES's exit hook would change bytes already hashed and, later, upload bytes that no longer match their manifest claim. **Price:** one full read and one full write to the card per changed member at exit; on this device a numbered state is 28–51 KB and its PNG ~48 KB (`[S03]` §1, §7), an `.srm` 8–128 KB, so a typical exit writes 100–250 KB extra — tens of milliseconds on an SD card; a PSP `SAVEDATA/<id>/` directory can be several MiB *[unmeasured → Gate 12]*. Stage bytes persist on `/storage` (D2), are bounded by the pending set, and are removed on verified publication. Paid because the hashed object and the uploaded object must be provably the same bytes *[council]*.

**B2 — The lock contract.** Two locks, one order, one marker.

- `L_T` = `/var/run/cloud_sync.lock`, the existing `take_cloud_lock` (`[S29]`): guards the remote and a reconciler run. `L_S` = `/var/run/cloud_session.lock` (new): guards the save tree against concurrent mutation. Both on tmpfs, so neither survives a reboot (the reasoning `[S29]` gives for `L_T`).
- **Order:** any party needing both takes `L_T` then `L_S`, never the reverse. Only the reconciler ever holds both. ES holds only `L_S`. Capture holds nothing of its own: it runs as ES's child inside ES's `L_S` hold and writes only stage, `.cache` and the own manifest — never the tree, never the remote. The exit push takes only `L_T`: it is upload-only (D5) and never mutates the tree.
- **ES:** takes `L_S` with a bounded blocking wait (proposal 30 s, behind its launch splash) *before* `setupSaveState`'s renames (`[S38]`); holds it through `process.run()`, `onGameEnded`, the repository refresh and capture (`[S41]`); releases after capture returns. A correct reconciler holds `L_S` only across rename-plus-re-read batches (milliseconds — Gate 3 measures), so exhausting the wait means a hang; ES then refuses the launch with a one-line message and a retry rather than mutating a tree mid-install *[council]*.
- **Reconciler:** after `L_T`, before each tree-mutation batch (installs for one game, a retirement, a compaction, recovery) it tries `L_S` non-blocking; on failure the batch is deferred (typed outcome 6, "a game is running") and the pass continues with non-mutating work — listing, classification, uploads from stage. It releases `L_S` before any network call.
- **Deadlock:** a cycle needs two parties each waiting on the other. The reconciler never waits (both of its acquisitions are non-blocking). ES waits only on `L_S`, and the only holder of `L_S` besides ES is a reconciler batch that waits on nothing. Capture and the exit push are sequential children of ES that take nothing ES holds. No cycle exists.
- **Survival across an ES death** (`engineering-practices.md` records ES abort()ing and being restarted, `[S10]`): a lock dies with its holder, so `L_S` cannot represent a session ES has lost. The **session marker** does: ES writes `/var/run/cloud_session.json` `{run_id, game, system, emulator, core, es_pid, started_at}` before its pre-launch renames and removes it after capture. Reconciler rule: marker present and `es_pid` alive → in flight → that game's units excluded from mutation and from upload; marker present and `es_pid` dead → interrupted → the same exclusion, reported, until a clean capture of that game or a reboot (tmpfs; no emulator survives a reboot). `<rom>.state.auto.bak` remains a second in-flight signal (base §1.4). This removes the base's dependency on `ProcessStartInfo` inheriting a lock fd (source not embedded; unverifiable) and the exec wrapper. **Cost:** one flock per launch and per batch; one ~200-byte write per launch; one `/proc/<pid>` stat per pass; zero spawns.

**B3 — Torn units are held, never promoted.** Replaces the "escalate after two consecutive full passes" row. A unit whose declared members are incomplete or hash-mismatched in the cloud is **held**: nothing installed, nothing uploaded for that unit, counted on the row, re-evaluated every pass. Repeated observation is not evidence of completeness — an interrupted PPSSPP publication stays identically incomplete indefinitely. The publishing device completes it on its own next pass because its pending list still holds the missing members (§1.5). Unrelated units proceed. Sets that **no** manifest declares (legacy multi-file saves from before this firmware) are classified per file with `unknown` provenance — today's behaviour, and the only honest one when nothing states the member list; the residual is that an emulator may see a partially transferred legacy directory between two full passes, as it does today. A unit declared by a device that never returns is held forever and stays counted; V1 offers no decision for it. **Cost:** none — this removes the pass counter and the promotion rule. Buys: no declared multi-file unit can ever be installed as a whole from a partial publication.

**B4 — Distinct backup and restore roots fail closed.** `cloud_sync.conf` ships `RESTOREPATH` beneath the comment "Changing the below to be different from BACKUPPATH will prevent data from being replaced on restore" (`[S33]`) *[corpus]* — a documented configuration, and one the schema assumes away (`[S03]` §9; `[S04]` §3.4). The classifier needs one local tree. Rule: `cloud_reconcile` reads both; if they differ, **every path refuses** — typed outcome 1 with reason `split-roots`; the card says "Cloud saves are set to separate backup and restore folders; sync is off." No agreement is written, nothing transfers, nothing is silently treated as one tree. A one-way import mode for that configuration is not designed here; if wanted it is its own issue. The sync context (I1) carries both roots, so changing them back invalidates and re-derives agreement. **Cost:** two string compares. *[council; the maintainer's word on refusing versus supporting — see handoff.]*

### Further defects of the base corrected

**D1 — Deletion, moves and compaction as one algorithm per game.** Replaces §1.8 and the one-sided rows of §1.3.

1. *Publication identity.* Every manifest entry gains `pub: "<device-id>:<seq>"`, drawn from the device's one persisted monotonic counter (the same `.seq` the retention store uses; one counter, two domains). A retirement record is `{path, sha256, pub, at, seq}`. `published_at` stays for display only; no clock is ever compared to decide a retirement. This replaces the base's `published_at`-later-than-`at` rule and the `clock_synced` hold on retirements — a rule removed. **Cost:** one short string per entry and per record.
2. *Applicability.* A record applies to a surviving copy at `path` iff the copy's re-read sha256 equals the record's **and** either the claim for that copy carries the same `pub` or no claim carries any `pub` for it (legacy). A restore from retention is a **republication of the same version** (D-CLOUD-030: same bytes, same identity) under a fresh `pub`, so no old record consumes it.
3. *Rows, stated against the survivor.* Cloud has it, this device lacks it, this device's own manifest holds an applicable record → the **cloud copy** is the survivor: copy-verify-delete into `<SYNCPATH>-replaced/<date>/` (D-CLOUD-014's sibling; never `rclone move`, D-CLOUD-026): `copy --files-from` + `check --one-way` + `delete --files-from` = **3 spawns per pass** however many files, batched. This device has it, cloud lacks it, another device's applicable record → the **local copy** is the survivor: remove it after re-read equality; no local retention copy (I13); record absence in agreement. Either side only, agreement records presence, **no** applicable record → **unexplained absence: hold and report**, in both directions — including a copy the player removed over SMB, which V1 cannot distinguish from loss and therefore leaves as a held item *[council]*. Either side only, no agreement → new here/there → transfer.
4. *One move plan per game.* Fold moves first (same hash, different path, within one (system, rom, core repository, kind); the cloud's layout wins on the pulling device — lossless by construction, logged), then D-CLOUD-030 compaction (one hash still in two slots → keep the lower after re-read equality; emit a retirement for the removed placement). Compute the whole permutation before any rename; execute through the install mechanics of D7. Reconciled, the two rules cannot undo each other.
5. *Residuals stated.* The `retired` ring is bounded (64). A device that holds agreement for a path and finds it gone with no record holds — fail closed. A device that holds **no** agreement for the path (it upgraded after the deletion had already reached the cloud; an imported card) classifies the file as "new here" and re-uploads it: visible in the savestate manager, non-destructive, wizard not involved. The base's "resurrection no longer exists" was too strong; bounded control state cannot buy unbounded convergence, and growing the ring buys a guarantee the one-player model does not need.

**D2 — Recovery is durable, and covers every install.** The base's rule "everything whose loss fails closed lives in `.cache`" is right for `agreed.json` (loss → never agreed → ask; bootstrap re-seeds identical pairs), `queue.json` and `pending-publish.json` (loss → re-derived by the next full pass). It is **not** established for a pending-apply record: losing the only record of a half-installed multi-member unit leaves a torn local candidate that the wizard would present as a version. So transaction state moves beside the store it pairs with, under the same never-cleared contract: `/storage/.local/share/rocknix/cloud-saves/{pending,stage}/`. **Every** install — a wizard apply, a pre-pass one-way download, a move, a compaction — writes `pending/<run-id>.json` `{context, units: [{members: [{path, from_sha, to_sha, stage_path}]}], phase}` and fsyncs it **before the first rename**, with every operand complete in the stage. Recovery runs at the start of every reconciler invocation, offline, and ES runs `cloud_reconcile --recover` before taking `L_S` at launch when `pending/` is non-empty (stat first — no spawn when it is empty). **Cost:** one small JSON per install run; one bash spawn (~50 ms, no rclone) per launch only while something is pending. Buys: a complete unit exists before any game starts, not only after a wizard decision.

**D3 — Read-check-write is not compare-and-swap.** The base's §6 claim that fresh evidence makes two devices online at once "a queued conflict rather than a clobber" is withdrawn. The window is the seconds between a device's evidence read and its upload; a publication by the other device inside it is overwritten in the cloud, and the overwritten device's next pass sees "cloud changed → download." The one-player model makes the window rare; closing it needs a publication protocol, which the cost discipline rules out. What V1 does instead: (a) a **durable `uploaded-unverified` state** in `pending-publish.json` — if correspondence cannot be shown after an upload, operands stay in stage, agreement does not advance, and the next pass re-observes before retrying; the system never says "never written" about bytes it sent; (b) `--backup-dir <SYNCPATH>-replaced/<date>` on uploads *if* Gate 7 shows `copy --backup-dir` keeps the replaced object under interruption — the loser then exists in the cloud sibling, reachable from a computer. **Cost of (a):** a state value; **of (b):** one server-side move per replaced object, no extra spawn. *[unmeasured → Gate 7 includes the paused-between-read-and-write race.]*

**D4 — Three source claims corrected.** (1) `[S03]` §3's table **does** have an equality row ("equal → identical → nothing"); what it lacks is the agreement-seeding action on that row — the equality bootstrap adds the action, not the row. (2) Caching foreign manifests under `.cache` stops *this* device republishing a stale one; it does not stop a device on the old firmware, whose `copy --update` pass carries `savestates/.rocknix/**` both ways (`[S32]`, `[S35]`) — already covered by the per-device guarantee of the mixed-firmware period. (3) The D-CLOUD-028 and D-CLOUD-031 refinements are material changes to decided behaviour and appear in the handoff as proposals needing the maintainer's word, not as "unchanged."

**D5 — The exit path: upload-only, admission-gated, priced.** Replaces the exit-path paragraphs of §1.5.

- **Upload-only.** The exit push never downloads and never mutates the tree; downloads wait for the boot or menu pass. Removes any need for the exit path to touch `L_S` (B2) and matches the shipped `--recent` path, which only copies up (`[S29]`).
- **Admission ceiling, not abort** (I9). The ceiling (measured, Gate 4) is checked before the upload spawn starts; once an upload has started it runs to completion — killing it mid-transfer manufactures torn state and the card keeps reporting. Overrun is bounded by one upload's duration; stated.
- **Spawn count, hashed backends** (Dropbox, S3/MinIO): (1) `lsjson --hash --files-from <changed>` — fresh cloud-head evidence, 1 spawn, 1 round trip; (2) `hashsum <type> --files-from` over the stage — the expected native digest, which is also the `remote_hash` value to record, 1 spawn, no network; (3) `copy --files-from --ignore-times --no-traverse <stage> <remote>` — 1 spawn, N puts, whose **built-in post-transfer hash comparison is the correspondence proof** *if* Gate 4 shows a mismatch fails closed (non-zero exit, the file named, agreement not advanced); otherwise (4) `lsjson --hash --files-from` after the upload stays. **Target 3 spawns and 1 listing round trip; fallback 4 and 2** *[unmeasured → Gate 4]*. Optional, also Gate 4: md5/sha1 (busybox) and Dropbox's content hash for files ≤ 4 MiB (sha256 of the raw sha256 of a single block) can be computed in shell, removing spawn (2) on those backends.
- **Hashless backends** (the QA WebDAV: no hashes, no modtimes, `[S04]` D-QA row): the listing's **size** is the cheap negative — size ≠ agreed size → C ≠ A → not eligible, left pending, no download; size equal → download the cloud heads into scratch and `sha256sum`, **capped** (proposal 1 MiB per unit; above it, defer to the full pass) (I10). Correspondence by `check --download --one-way --files-from`, reading the whole output (the D-CLOUD-026 precedent). **Cost:** 3 spawns and the bytes twice, bounded by the cap. In practice this path serves the test suite; the maintainer's backends offer hashes *[corpus: `[S03]` §7 Dropbox listing]*.
- Idle exit stays at zero spawns; captured and published remain separate facts; the "nothing changed ≈ 5 s" contract of D-CLOUD-028 is improved, the changed path exceeds it and is refined as P4.

**D6 — The capture filter's consequence, stated.** The launched game's units are always hashed. Other files under the sync root are selected for hashing by mtime-in-session-window or size change; ext4 mtime is second-resolution (`[S03]` §6), so a same-size rewrite within the same second as the previous capture is not hashed until the next full pass. Non-destructive delay; the full pass hashes everything. No cost.

**D7 — Install mechanics.** Every install copies from the stage to `<destination dir>/.rocknix-tmp-<run-id>-<name>`, fsyncs, renames over the destination (same directory → atomic on any filesystem), re-reads and hashes. Hidden files are skipped by `SaveStateRepository::refresh` (`file.hidden`, `[S37]`) *[corpus]*, so ES never lists a temp. Whether `/storage/roms` shares a filesystem with `/storage/.local` is device- and card-dependent and not established in the corpus; this form is correct either way and has no `EXDEV` branch — a rule removed. **Cost:** one extra copy of each installed member (tens of KB for a state). Recovery removes orphaned temps under its run-id.

---

## Dissent primitives integrated into the base

Each credited to the plan it came from and the assessment that surfaced it; one line on cost.

- **I1 — Sync-context binding.** From `kimi-revised_plan-r4.md` and `gpt-revised_plan-r4.md` §4.4 (surfaced by `kimi_vote-r4.md`, `gpt_vote-r4.md`, `claude_vote-r4.md`). `context = {remote_name, remote_type (the section's type= line), syncpath, backuppath, restorepath, device_id, relink_epoch}`; `relink_epoch` is an integer in `/storage/.cache/cloud_sync/context.json` incremented by `cloud_setup` whenever it writes the remote section and by CHANGE CLOUD FOLDER (`[S13]`). `agreed.json`, `queue.json`, `pending-publish.json` and every `pending/<run-id>.json` carry it; a mismatch invalidates: agreement treated as absent (never agreed → ask; equality bootstrap re-seeds identical pairs silently), queue and pending-publish discarded and re-derived, pending-apply **not applied**, reported, operands kept. Not a hash of the remote section: rclone rewrites tokens on refresh, so the fingerprint would churn. Not `rclone about`: a spawn and a round trip per pass. **Cost:** ~150 bytes per file and string compares; on a genuine context change, one wizard pass for real forks. *[unmeasured → Gate 1 CHANGE CLOUD FOLDER fixture; `cloud_setup` is not embedded.]*
- **I2 — Own-manifest witness (cloned card).** From `gpt-revised_plan-r4.md` (via `kimi_vote-r4.md`) and `kimi-revised_plan-r4.md`'s experiment (via `gpt_vote-r4.md`). `cloud_device_id` returns the stored value (`[S34]`), so a copied `/storage` duplicates the identity. Each full pass already downloads every `manifest-*.json`; if one carries our own `device.id` and is not the version we last published (compare `generated_at` and `pub`), refuse to publish (typed outcome 1, `duplicate-device-id`), transfer nothing, report. **Cost:** one compare on a file already fetched. *[→ Gate 13]*
- **I3 — The cloud-loser fetch as an explicit `prepared` sub-step.** From `gemini-revised_plan-r4.md` (via `gpt_vote-r4.md`, `kimi_vote-r4.md`). On KEEP RIGHT the discarded cloud unit's bytes and PNG are fetched into stage in one `copy --files-from` for all cloud losers of the COMPLETE, hashed against the listing before phase 1 completes; the PNG already fetched for display is reused if its hash matches; a mismatch (the cloud moved) returns the unit to the queue. Without this, "copies are kept" is false for cloud losers. **Cost:** one spawn per COMPLETE plus the loser units' bytes.
- **I4 — "Kept" only after verification.** From `gpt_vote-r4.md`'s condition on the base's recovery contract. Phase 1 fsyncs the retained copy and re-reads its hash; a failure defers the destructive step (unit back to queue) rather than disabling retention. **Cost:** one read per retained member.
- **I5 — Claims-set union.** From `gpt-revised_plan-r4.md` §4.3 and `kimi-revised_plan-r4.md` (via `kimi_vote-r4.md`, `gpt_vote-r4.md`). The union of manifests is a **set of claims**, not a merge of maps (`[S03]` §5's sentence): two manifests claiming different hashes at one path are both kept and matched against the verified listing; a claim matching no current byte is stale, not a fork. **Cost:** nil; register refinement P3.
- **I6 — Parser discipline.** From `gpt-revised_plan-r4.md` §4.5 (via `gemini_vote-r4.md`, `kimi_vote-r4.md`). Manifests, listings and retained records are untrusted input: reject absolute paths and `..`; refuse to install through a symlink that escapes the sync root; reject duplicate keys; reject entries outside the allowlist; bound entry and member counts (proposal 4096 per manifest); detect case-folded path collisions across the claim set and hold both (Dropbox is case-insensitive, ext4 is not). **Cost:** string checks per entry, no spawns.
- **I7 — `verified_by` on agreement entries.** From `mistral-revised_plan-r4.md` (via `claude_vote-r4.md`), generalising the base's `verified_by: "download"`: `native-hash | download | equality`. **Cost:** one string per entry.
- **I8 — Never rewrite an unchanged manifest.** From `gpt-revised_plan-r4.md` §3.3 (via `claude_vote-r4.md`, `kimi_vote-r4.md`). `generated_at` advances only when an entry changes; otherwise an idle exit manufactures an upload. **Cost:** negative.
- **I9 — Admission ceiling, not abort.** From `gpt-revised_plan-r4.md` (via `kimi_vote-r4.md`); applied in D5. **Cost:** bounded overrun by one upload.
- **I10 — Hashless evidence cap and size negative.** From `gemini_vote-r4.md`'s defect note; applied in D5. **Cost:** bytes ≤ cap.
- **I11 — Outcome aggregation.** From `gpt-revised_plan-r4.md` (via `kimi_vote-r4.md`). Both scripts' `main()` exit with the saves-phase status only (`clean_exit ${BACKUP_STATUS}` `[S29]`, `clean_exit ${RESTORE_STATUS}` `[S30]`) *[corpus]*; when delegating to `cloud_reconcile` they return the worse of its typed code and the archive phase's status, mapped so an rclone code from the archive phase can never land on 3–6. **Cost:** nil.
- **I12 — The transient numbered slot.** From `gpt-revised_plan-r4.md` (via `kimi_vote-r4.md`). `setupSaveState` copies the loaded state to `mNewSlotFile`; `onGameEnded` removes it when unchanged (`[S38]`) *[corpus]*. The session marker covers it (capture runs after `onGameEnded`); if ES dies first, the duplicate is caught by D-CLOUD-030 compaction. **Cost:** nil.
- **I13 — Retention counts wizard losers only.** From `kimi-revised_plan-r4.md` (via `claude_vote-r4.md` defect 6) and `gpt_vote-r4.md` point 6. Propagated ES deletions are **not** copied into the store (the deleting device's copy-verify-delete into `-replaced/` is the record; locally an ES delete is final today), and compaction never is (identical bytes survive in the lower slot). Buckets therefore count only the decisions the amendment names as the primary case. **Cost:** negative (bytes saved on the card). *[council — touches what is kept; maintainer's nod in handoff.]*
- **I14 — `defaultCoreDirectory` for #10.** From `kimi-revised_plan-r4.md` §2.1.1 (via `gemini_vote-r4.md`, `gpt_vote-r4.md`). `copy->directory = pInfo->defaultCoreDirectory` **replaces** the scan directory rather than adding one, and the XML path sets `racommands = false` (`[S39]`) *[corpus]*; Gate 9 requires both-layout discovery and launch parity, and an ES patch is expected. **Cost:** build-time.
- **I15 — Core pins from actual package resolution.** From `gpt-revised_plan-r4.md` §3.3 (via `claude_vote-r4.md`); blindspot 12 `[S07]`. The pins file is generated from the build's resolved `PKG_VERSION` per package (overrides re-set it) and asserted against the installed `.so` set in the image. **Cost:** build-time.
- **I16 — Done-page wording.** From `mistral-revised_plan-r4.md` (via `claude_vote-r4.md`, `kimi_vote-r4.md`): `DISCARDED (kept on this device): <game> · <slot | save | resume point> · <from device>`. **Cost:** nil.
- **I17 — Release-note fact.** From `mistral-revised_plan-r4.md` §11.2 (via `claude_vote-r4.md`): a device on the previous image overwrites by recency (`[S29]`, `[S35]`) and nothing a new device does prevents it; stated plainly for the drop. **Cost:** nil.
- **I18 — The unknown-provenance loser record.** From `gpt-revised_plan-r4.md` §8.2 (via `claude_vote-r4.md`). When no claim exists for a discarded operand, `retained_operand` carries `"unknown"`/null in every provenance field and the known identity (sha256, size, path, kind, slot, PNG). **Cost:** nil.
- **I19 — Unknown-unknowns experiments.** From `gpt-revised_plan-r4.md` §11 (via `claude_vote-r4.md`, `kimi_vote-r4.md`); collected as Gate 13. **Cost:** bench time.
- **I20 — Pre-pass installs journaled; recovery before launch.** From `gpt_vote-r4.md` blocker 4 on the base; applied in D2.
- **I21 — Storage guards.** From `gpt-revised_plan-r4.md` §11 (via `claude_vote-r4.md`). Before staging: free space ≥ the run's bytes (one `statfs`). Before any pass: the sync root is a mountpoint and, if agreement records ≥ 1 presence, non-empty — otherwise refuse (an unmounted card must not read as "everything deleted"). **Cost:** one `statfs`, one `stat`.
- **I22 — bisync fallback framing.** From `gpt-revised_plan-r4.md` (via `kimi_vote-r4.md`). If the maintainer declines the demotion (C6), bisync is at most a transport adapter behind the home classifier; the verdict is never bisync's; `--resync` never runs unattended (`[S05]` §4 step 2). **Cost:** nil unless adopted.
- **I23 — Negative-scope checklist.** From `mistral-revised_plan-r4.md`'s not-to-build list (via `kimi_vote-r4.md`), merged with the base's §3 refusals in the handoff. **Cost:** nil.
- **I24 — Auto-only allocation from `firstslot`.** From `claude_vote-r4.md`'s note contrasting `gemini-revised_plan-r4.md`'s keep-one prompt: `getNextFreeSlot` returns −99 for an auto-only repository because an auto state registers as slot −1 and the 99999→0 scan never matches (`[S37]`) *[corpus]*; the adapter allocates from `firstslot`. Already the base's rule; recorded so the prompt is not copied. **Cost:** nil.
- **I25 — Retirement without `--backup-dir`.** From `gemini-revised_plan-r4.md`'s fallback (via `claude_vote-r4.md`): explicit copy-verify-delete for cloud-side removals whatever Gate 7 shows. Already the base's rule; `--backup-dir` remains a bonus. **Cost:** nil.
- **I26 — Sequence allocation and recovery.** From `kimi-revised_plan-r4.md` (via `gpt_vote-r4.md`). `.seq` is incremented under `L_T`; if missing or damaged it is re-seeded above the maximum found in `retained/*/*/<device-id>-*` and in the own manifest's `pub` values. **Cost:** one directory scan on the rare repair.

---

## Dissents that conflict with the base

Each states both positions and why they cannot both hold. The base's position stands unless the maintainer says otherwise; none is resolved by averaging.

**C1 — Preimages of routine one-way downloads.** `gpt-revised_plan-r4.md` (via `claude_vote-r4.md`, `kimi_vote-r4.md`): before a "cloud changed → download" overwrites a local file, copy the local file into a `preimages/` area as transaction protection distinct from retention. The base (§1.9.4): routine one-way overwrites are not retained in V1. They cannot both hold — one writes the bytes, the other does not. **Cost of the dissent:** one extra copy per downloaded member on every pass (bytes equal to the local unit; for a PSP directory, MiB), plus pruning. **What it buys:** protection against a *wrong* one-way classification, which after I1 (context) and I2 (witness) reduces to the two-devices-online race of D3 — the guarantee the one-player model does not need — and forward recovery, which D2 already provides from the stage (the winner is complete in stage before the first rename). The base's position stands under the cost discipline; the maintainer should see that D3's race is the one case a preimage would have saved.

**C2 — A mandatory producer object on every entry.** `mistral-revised_plan-r4.md` (via `gpt_vote-r4.md`): every entry carries an explicit producer snapshot, unknown values allowed. The base (§1.2 item 3): the object is present only when publisher ≠ producer; absent means "the manifest's own device produced it," and the parser treats it so. Either every entry has the block or absence has a meaning; not both. **Cost of the dissent:** ~250 bytes × ~50 entries ≈ 12 KB per manifest, re-uploaded on every change, on a path a player watches. The base's rule stands; I18 covers the unknown case in the record where it matters.

**C3 — `kind: "container"` keyed by a directory.** `kimi-revised_plan-r4.md` (via `mistral_vote-r4.md`): a single-file multi-game save (a PSX memcard) is its own kind. The base (§1.2 item 2, pick 6): entries stay one per file, `kind` stays `state | auto | save`, a memcard is a `save` with `rom: null`, and multi-file containers are declared units over per-file entries. Both cannot hold: the wizard's glyphs key on `kind` (`[S02]`) and D-CLOUD-031 keys one entry per file (`[S03]` §5). The base's position stands.

**C4 — The store under `.cache` with an exemption.** `gemini-revised_plan-r4.md` (via `claude_vote-r4.md`, `kimi_vote-r4.md`): `/storage/.cache/cloud_sync/retained/`, asserted exempt from sweeps. The base (pick 1): `/storage/.local/share/rocknix/cloud-saves/`, because the corpus defines `.cache` as regenerable state with a "store a schema version and rebuild" convention (`[S02]` § Where state lives) *[corpus]*, and a retained copy is the one thing that must never be rebuilt. One directory or the other; the exemption exists nowhere in the corpus. The base's position stands; D2 moves transaction state beside it. Survival across an in-place update is Gate 2 *[unmeasured]*.

**C5 — A protected-publication protocol, conditionally.** `gemini-revised_plan-r3.md` as `mistral_vote-r4.md` reports it: if the race fixture fails, adopt protected publication objects. The base (§3 refusals): not earned; no V1 part depends on it. Either the cost discipline rules out multi-writer machinery or it does not. The base's position stands; if Gate 7 shows the race is common on the maintainer's bench, the cheaper answer is the existing exclusion — a device is told to sync before the other plays — not a protocol.

**C6 — bisync as the detector.** The IA (`[S02]` § Detection), the futro's #22 ACs (`[S05]` §5) and #22's thread (`[S23]`) say a bisync run reports conflicts and the wizard resolves; the base (§1.1, pick 5) says bisync is neither the detector nor a V1 transport, because the classifier's inputs (agreement, unit maps, claims, retirements, `unknown`) do not exist in bisync's listing state, and its state under `/storage/.cache/rclone/bisync` would be a second authority beside `agreed.json` with the `--resync` hazard in reach. No register row binds either (`[S06]`), so nothing is reopened, but the IA and #22 need the edit and the maintainer's word — with I22 as the written fallback. **Cost of the base's position:** the #22 spike (Gate 11) becomes informational.

**C7 — Unexplained absence when the cloud has a file this device lacks.** One reading of `kimi-revised_plan-r4.md` (via `mistral_vote-r4.md`'s "non-destructive, self-correcting"): re-download is harmless, so do it. The base and D1: hold in both directions, uniformly, because V1 cannot tell a deliberate removal over SMB from loss. Both preserve progress; they cannot both be the rule. The base's position stands — one rule, fail closed — and the residual (a persistent held item after a manual removal, until the player deletes it in ES on some device) is named for the maintainer.

---

## Step 5 handoff content

### Load-bearing requirements (the issues carry these verbatim)

- **R1 (#22)** Every writer of the save tree — boot (`[S35]`), SYNC/UPLOAD/DOWNLOAD and the hub tick (`[S13]`), the Tools symlinks (`[S09]`), the game exit (`[S41]`), #37's tile, `cloud_backup`/`cloud_restore` from a shell — reaches it only through `cloud_reconcile`, cut over in **one image**. The saves phases of the two scripts delegate; their archive phases are untouched; outcomes aggregate per I11.
- **R2 (#22)** `cloud_reconcile` builds its own rclone arguments; never sources `RCLONEOPTS`; passes the shipped allowlist `[S32]` as the outer boundary with `- /**/*.bak` and `- /savestates/.snapshots/**` ahead of `+ /savestates/**`; every decided transfer uses `--files-from` **and** `--ignore-times`.
- **R3 (#20/#21)** Schema rev 2, additive to D-CLOUD-031: per-entry `unit`, `producer` (when imported), `published_at`, `pub`; top-level `units`, bounded `retired`; agreement written on verified equality with `verified_by`; manifests read as a claim set (I5); own manifest at `/storage/.cache/cloud_sync/manifest-<id>.json`, foreign ones under `/storage/.cache/cloud_sync/manifests/`; the `schema` integer stays `1` because no cloud has yet received rev 1. Never rewrite an unchanged manifest (I8).
- **R4 (#22)** Classification per unit by the base's §1.3 table with B3 and D1 applied: identical → seed agreement; one side changed → silent transfer of the unit's changed members; both changed or never agreed → queue; declared-incomplete → hold; unexplained absence → hold; applicable retirement → act on the survivor; another client's conflict artefact → never a version (D-CLOUD-022).
- **R5 (#21/#22)** Capture runs on every exit regardless of the toggle, network or lock; the emulator and core passed are the ones frozen at command construction (`[S38]` `_changeCommandlineArgument`; `[S42]`); sealing is an independent copy (B1); the exit push is upload-only, produces fresh cloud-head evidence per unit, proves correspondence before advancing agreement, and defers above the admission ceiling (D5).
- **R6 (#22)** The lock contract of B2: `L_T` then `L_S`, non-blocking in the reconciler; ES holds `L_S` from pre-launch renames through capture with a bounded wait and refuses to launch on timeout; the session marker with a pid check; capture holds no lock; the exit push takes only `L_T`.
- **R7 (#22)** Sync context (I1) on `agreed.json`, `queue.json`, `pending-publish.json` and every pending-apply record; `relink_epoch` bumped by `cloud_setup` and CHANGE CLOUD FOLDER; own-manifest witness (I2); split roots refuse (B4); storage guards (I21); parser discipline (I6).
- **R8 (#23/#24)** The checked adapter (base §1.7): next free slot computed from visible numbered states from `firstslot`; slots reserved in memory for the walkthrough; KEEP BOTH dimmed for non-RetroArch units (`isEnabled` requires `"retroarch"`, `[S37]`) and for in-game saves; auto states: this device keeps its `.state.auto`, the cloud copy goes to the next free numbered slot, one sentence, no question. COMPLETE re-checks local members, the cloud head (fresh listing), the unit map, reserved slots and pending retirements. Apply in four phases with the record written before the first effect; phase 1 includes the cloud-loser fetch (I3) and retention verification (I4); install by D7; recovery by D2.
- **R9 (#23/#25)** The retention store exactly as base §1.9 (home, layout, percent-encoded unit key, persisted `seq`, `record.json`, buckets counting finalized coherent wizard losers only — I13, I18, I26); on by default; count bounded; the done page names each discard per game with I16's wording and says the copies are kept; **no undo control**; the restore tool is its own issue reusing the compare surface.
- **R10 (#22)** Typed outcomes: 0 done · 1 failed (reasons `split-roots`, `duplicate-device-id`, …) · 3 lock held · 4 no route · 5 conflicts queued · 6 held or deferred; never rclone's own code; result file `/storage/.cache/cloud_sync/runs/<run-id>.json`; the card renders 3–6 as SKIPPED/WAITING, never FAILED.
- **R11 (#22/#7)** Unattended passes never open the wizard; the boot pass replaces `ping google.com` (`[S35]`) with the route test; per-row stamps keep their names (D-UI-017/018/020).

### Negative scope (not built in V1)

No undo control, history browser or extra decision in the resolution flow; no ancestry beyond `replaces`; no `resolves` receipts; no SQLite index (say so on #20); no generic merger or progress heuristic; no slot cap; no daemon; no protected-publication protocol; no preimages of one-way downloads (C1); no local retention of propagated deletions or compactions (I13); no exit-path downloads; no ICMP on the exit path; no split-root import mode; no `--resync` anywhere unattended.

### Acceptance conditions (each is a behaviour watched, never an artefact pointed to — blindspot 13, `[S07]`)

- **A1** Two devices agree H0; B publishes HB; A edits to HA offline; A exits, boots, presses SYNC, UPLOAD, DOWNLOAD, the hub tick, and runs both scripts from a shell: **neither HA nor HB is overwritten anywhere**; the row shows one queued conflict.
- **A2** After a failed upload, the next exit with nothing changed retries and publishes; an equal-size, equal-mtime byte change enters the changed set at the next full pass.
- **A3** CHANGE CLOUD FOLDER to a folder holding different saves: nothing downloads silently; identical pairs seed agreement; differing pairs queue.
- **A4** A KEEP RIGHT on a cloud loser: the loser's bytes and PNG are in `retained/` with matching hashes **before** the cloud head changes; KEEP LEFT likewise for the device loser; KEEP BOTH retains nothing and installs state + PNG in the next free slot with a visible thumbnail in the savestate manager.
- **A5** The test-only reader answers "this game, newest first, thumbnail, producing device, winning side" after manifest overwrite, renumber, audit-log rotation, clock set backward and all pending records removed; the store survives an in-place update on a device with real prior state.
- **A6** Kill ES mid-session: the game's units are excluded from mutation and upload until a clean capture or reboot; a boot pass overlapping a launch reports SKIPPED for that game and proceeds elsewhere; hold durations of `L_S` batches are under 100 ms on the H700 (proposal).
- **A7** Kill the reconciler after each rename and before its checkpoint, for a wizard apply **and** for a pre-pass download; restart offline: a complete unit exists before any launch; no torn candidate is ever shown.
- **A8** Interrupt a publication after one member: no device installs the mixed set at any later pass; the hold clears when the rest lands; other units transfer meanwhile.
- **A9** Delete a state on A and renumber; sync repeatedly on B: each surviving version exists exactly once; restoring a retired hash from retention is not consumed by the old record; an unexplained absence is held on the row and touched by nothing; a no-agreement device re-uploads (the D1 residual, observed and recorded).
- **A10** Idle exit spawns no rclone; the changed exit's spawns, round trips, bytes and seconds are recorded on Dropbox and the QA backend and the ceiling is set from them; correspondence failure after upload leaves an `uploaded-unverified` entry and advances no agreement.
- **A11** A cloned card: the second device refuses to publish with `duplicate-device-id` and transfers nothing.
- **A12** Split roots configured: every path refuses with the message; nothing transfers; agreement is untouched.
- **A13** The wizard lays out at 480×320 first; frames at 480×320 and 640×480 from `tools/vm-visual-qa` are the evidence (`[S24]`).
- **A14** The manifest reaches the remote under `savestates/.rocknix/` with `remote_hash` null on WebDAV and non-null on MinIO, and is absent from the content tier (`[S04]` §3.6).

### Ordered experiments (venue; what each gates)

| # | Gate | Venue | Gates |
|---|---|---|---|
| 0 | Repair `tools/cloud-round-trip` and run it: it overwrites `rclone.conf` without restoring it; its archive-name assertions disagree with the dated uploader/restorer (`[S29]`, `[S30]`); its content fixture predates D-CLOUD-019 (`[S36]`). WebDAV **and** MinIO. | GENERIC_X64 VM | everything |
| 1 | A1, A2, A3 (the cardinal-rule and context fixtures). | VM pair, then H700 pair | R1, R4, R5, R7 |
| 2 | A5 (the reader and survival test). | VM, then RG35XX SP | R9, the restore tool's issue |
| 3 | A6, A7; launch from an auto-only repository and observe RetroArch with `-state_slot -99` (`[S38]`). | H700 | R6, R8, D2 |
| 4 | A10; confirm `lsjson --hash --files-from` and `hashsum --files-from`; whether rclone's post-transfer hash mismatch fails closed; the hashless cap; the shell-computed native hash option. | H700 vs Dropbox; VM vs QA (loopback, D-QA-002) | D5, P4 |
| 5 | A9 (deletion, renumber, republication, residual). | VM pair | D1, P5 |
| 6 | A8 (torn unit). | VM | B3 |
| 7 | `copy --backup-dir` under interruption; the paused-between-read-and-write race. | H700 + VM | D3 (b), the `-replaced/` bonus |
| 8 | The #19 bench (`[S08]`): same-chipset control first, then cross-chipset, then loud/silent. Runs at any time — needs only the maintainer's hands. | bench | the badge's severity only |
| 9 | #10 rehearsal: an `es_savestates.cfg`; `racommands`/`incremental`/`autosave` flip; `defaultCoreDirectory` replaces the scan (I14); both layouts discoverable; RetroArch's `savestate_directory` moves with it. | H700 | §1.11 #10 |
| 10 | A13. | RG351M | the wizard's layout |
| 11 | The bisync spike (`[S05]` §2): output shape, `--recover`/`--resilient`, rename, interruption. Informational. | VM, then RG35XX SP | nothing in V1 (C6) |
| 12 | Shadow census: auto-state divergence frequency; what PPSSPP, Flycast, Mupen, DuckStation write (the unit table); retained bytes per bucket at count 3; stage bytes per exit. | RG35XX SP | R3 units, the count, B1's price |
| 13 | Unknown-unknowns (I19): same-basename ROMs in nested directories sharing a state path; a loaded old state restoring old SRAM that autosaves over the SRAM the wizard kept; a PNG belonging to another version; case-only path variants on Dropbox; full storage after a "successful" copy; an unmounted sync root; A11. | H700 + VM | guards I6, I21, I2; wizard copy for the save/state coupling |

**Build order:** Gate 0 → schema rev 2 and #21 capture (after Gate 12's inventory) → reconciler with the writer cutover (after Gates 1, 4) → store (after Gate 2) → wizard apply (after Gates 3, 6) → deletion (after Gate 5) → badge (after Gate 8) → #10 (after Gate 9) → the restore tool, in its own futro.

### Register rows proposed (IDs are the maintainer's to assign; each refines, none reopens)

- **P1 — Retention amendment** (refines D-CLOUD-024, D-CLOUD-027; IA rev 4's *keep discarded saves* default): V1 retains the discarded copy of every wizard decision, on by default, bounded by a count (**3 proposed; no corpus basis; the maintainer's number**), no undo control; the done page names discards and says copies are kept; the restore tool is a separate issue reusing the compare surface; the store is designed for that reader.
- **P2 — Store and transaction-state home** (refines D-CLOUD-027 as the `.cache` precedent): `/storage/.local/share/rocknix/cloud-saves/{retained,pending,stage}/`, never cleared by update, schema rebuild or cleanup; `.cache/cloud_sync/` holds only state whose loss fails closed.
- **P3 — Schema rev 2** (refines D-CLOUD-031, D-CLOUD-017): R3's additive fields; agreement on verified equality with `verified_by`; manifests as a claim set; foreign manifests cached outside the tree; sync context on all local records; `schema` stays `1`.
- **P4 — Exit-path budget** (refines D-CLOUD-028): idle exit zero rclone spawns; changed exit upload-only, fresh evidence before any write, correspondence before any agreement advance, 3–4 spawns on hashed backends, 3 plus capped bytes on hashless, admission ceiling measured by Gate 4; the "nothing changed ≈ 5 s" contract preserved.
- **P5 — Deletion semantics** (refines D-CLOUD-030): explicit deletions propagate via `retired` records applicable by `pub` identity; a restore is a republication; unexplained absence is held in both directions; the cloud's layout wins for moves and compaction follows in one plan; propagated deletions and compactions are not retained locally; the no-agreement residual is stated.
- **P6 — Write-path ownership** (refines D-CLOUD-029): one image replaces every writer in R1; the mixed-firmware period is guaranteed per device only (I17); distinct backup and restore roots refuse.
- **P7 — bisync's role** (no row exists; the IA and #22's thread say detect): the maintainer's word on C6, with I22 as the fallback.
- **P8 — Queue-and-badge** (IA rev 5): unattended passes never open the wizard; the maintainer's call.

### Document and issue edits required

IA rev 5 (`[S02]`): default flip for *keep discarded saves*; queue-and-badge; "nothing transfers until COMPLETE" qualified as "no resolution applies until COMPLETE; the pre-pass is not rolled back"; the auto rule; the SQLite question closed; the stamps directory already corrected. #22 body: R1–R7, R10, C6 with I22. #9 scope (`[S18]`, `[S16]`): "newer wins" struck (`[S04]` §3.1); bisync as evaluated transport only. #21: unconditional capture; frozen context; independent-copy sealing; the core-pins file per `[S03]` §9 and I15; no second spawn. #23: I16 wording; A13. #24: the adapter's rules. #25: the restore tool's shape, Gate 2 as its precondition, the allowlist rule. #35: the fixtures above. #7: the boot liveness test. #37 (`[S28]`): reads `device.label`/`core`/`core_build` from manifests; `copyToSlot`'s `makeStateFilename` default `fullPath` is unknown (`SaveState.h` not embedded) — a gap for any ES path that still calls it.

### Maintainer calls outstanding

1. bisync demoted (C6/P7) — or the I22 fallback.
2. Queue-and-badge as the trigger (P8).
3. The retention count (P1).
4. No local retention of propagated deletions and compactions (I13/P5) — the cloud `-replaced/` sibling is the record.
5. Split roots refuse rather than import (B4/P6).
6. Hold in both directions for unexplained absence (C7/P5), with its residual.
7. ES refuses a launch when the session lock cannot be taken within the bound (B2) — a rare, bug-indicating prompt, accepted over a possible mid-install corruption.

### Gaps the corpus does not fill

`ProcessStartInfo`/launcher implementation (fd inheritance — now non-load-bearing), `GuiSaveState.cpp`'s delete action, `SaveState.h`/`SaveStateRepository.h` defaults, `Paths.cpp`, `setsettings.sh`, `cloud_setup` (the `relink_epoch` write point), `backuptool`, `tools/cloud-test-backend`; rclone 1.75.0 documentation or source for `--files-from` with `lsjson`/`hashsum`/`copy`, `--ignore-times`, post-transfer hash behaviour, `--backup-dir` with `copy`; any executed result of the round-trip suite, the bisync spike, the #19 bench or a two-device fixture. None was fabricated; each maps to a gate above.

---

```json
{
  "artifact": "consensus_plan.md",
  "role": "council consensus integration over claude-revised_plan-r4.md",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "sha256 values copied verbatim from the per-source headers; verified at embed time by the Facilitator; not recomputed here",
  "citation_mapping": "S01 through S42 map in order to the parallel source_file_paths and source_file_hashes arrays",
  "base_artifact": "claude-revised_plan-r4.md",
  "injected_artifacts": [
    "claude-revised_plan-r4.md",
    "claude_vote-r4.md",
    "gemini_vote-r4.md",
    "gpt_vote-r4.md",
    "kimi_vote-r4.md",
    "mistral_vote-r4.md"
  ],
  "injected_artifact_hashes_provided": false,
  "peer_material_use": "Judged on substance against the embedded corpus and the two maintainer decisions in the orchestrator brief; plans not embedded (gemini/gpt/kimi/mistral-revised_plan-r4.md and all round-3 plans) are cited only as the votes describe them; nothing is drawn from any artifact as evidence about how councils or models behave.",
  "maintainer_decisions": {
    "source": "orchestrator brief embedded in this prompt",
    "applied_as_authoritative": true,
    "content": [
      "V1 retains the discarded copy, on by default, bounded by a count, no undo control; the restore tool is a separate issue reusing the wizard's compare surface; the store is designed for that reader",
      "cost discipline: name the cost of every safeguard; prefer forms that remove a rule; buy no guarantee the one-player model does not need"
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
    "696bcdba14d33dfeea8e627a90094a2b1955745f39c78677f54bb97f88099ba",
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
    {"material": "ES ProcessStartInfo/launcher, GuiSaveState.cpp delete action, SaveState.h / SaveStateRepository.h defaults, Paths.cpp, setsettings.sh, cloud_setup, backuptool, tools/cloud-test-backend", "reason": "Needed for the delete hook point, copyToSlot's fullPath default, the relink_epoch write point, the RetroArch directory rehearsal and the harness repair; the lock design no longer depends on fd inheritance", "declared_source_path": null, "sha256": null},
    {"material": "rclone 1.75.0 documentation or source for --files-from with lsjson/hashsum/copy, --ignore-times, post-transfer hash verification behaviour, local-backend hash types, --backup-dir with copy under interruption", "reason": "The exit-path mechanism, spawn counts and the -replaced/ bonus are hypotheses until Gates 4 and 7 measure them", "declared_source_path": null, "sha256": null},
    {"material": "The four other members' round-4 plans and all round-3 plans", "reason": "Not embedded; cited only as the injected votes describe them", "declared_source_path": null, "sha256": null},
    {"material": "Any executed result of the round-trip suite, the bisync spike, the #19 bench, or a two-device fixture", "reason": "None exists in the corpus; every gate above is unrun", "declared_source_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, contents, or execution results have been fabricated."
}
```