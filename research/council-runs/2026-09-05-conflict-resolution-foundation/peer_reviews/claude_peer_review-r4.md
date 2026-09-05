# claude_peer_review-r4.md

**Peer review of the four round-3 revised approaches to the ROCKNIX cloud-save conflict-resolution foundation**

I read the embedded corpus as supplied (42 sources, hash-verified at embed time by the Facilitator) and the four injected plans. I did not re-read, re-hash, or execute anything. Citations use `S01`–`S42` in embed order; each resolves to the exact declared path and sha256 in `corpus.provenance.json` at the end. Short paths in prose are suffixes of the declared paths under `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/`. Plans are cited by filename. The two maintainer decisions in the brief are applied as authoritative and no plan is criticised for not naming them.

---

## 0. Where the four plans now stand

The four plans have converged on one architecture, and the convergence is real rather than nominal. All four now hold: sha256-of-stored-bytes identity (D-CLOUD-030); per-device manifests with a local unsynced agreement record (D-CLOUD-031); a home-built three-way classifier over complete member maps with bisync demoted to a candidate transport; agreement written on verified equality as well as on transfer; every write path reads cloud evidence before it overwrites, including the game-exit pass; a lifecycle gate beside the cloud lock; a checked adapter over ES's slot primitives; a deterministic KEEP BOTH on an auto-state conflict; queue-and-badge for unattended passes; retention ON by default, count-bounded, with no undo control in V1; version-specific tombstones for explicit deletes and fail-closed handling of unexplained absence; cloud-side compaction to end the renumber loop; `--backup-dir` as the remote retirement mechanism gated on a race fixture.

What remains is the subject of this review: the retention stores as a later reader would actually experience them, the residual differences, and a handful of load-bearing claims — two of which are wrong.

---

## 1. Question 1 — the restore tool walked through each store

The query to trace: *"show me the retained past versions of this game, newest first, with a thumbnail, the producing device, and which side won."* For each plan I state what a later reader opens, what it must read, what it scans that it does not need, and whether every field exists at the moment of the discard without consulting a manifest, the rotating audit log, or a disposable apply record.

Two facts from the corpus frame every trace. First, the wizard never needs the cloud side's *bytes* to display a conflict — it fetches the small PNG and reads metadata from the manifest union (`repo/docs/save-manifest-schema.md` §6 `screenshot` rationale [S03]; #20's comment "fetch that side's thumbnail without pulling the savestate itself" [S21]). So on KEEP RIGHT (device wins) the cloud loser's bytes have not been downloaded by the walkthrough; a local store only holds them if the apply step fetches them before publishing. Second, the compare surface the maintainer wants to reuse shows "date · time · device + model · core + version" with the `clock_synced` warning (`repo/docs/conflict-wizard-ia.md` [S02]; [S03] §6), so a store that omits local time, clock confidence, or model will drive a poorer picker than the wizard it is meant to reuse.

### 1.1 `gemini-revised_plan-r3.md` — `/storage/.cache/cloud_sync/discarded/<path>/{<sha256>, <sha256>.png, <sha256>.json}`

**Reader path.** The store is keyed by the discarded file's sync-root-relative path. To answer "this game," the reader either constructs candidate paths from the game (`savestates/<system>/<rom>.stateN`, `<system>/<rom stem>.srm`) and opens those directories directly — cheap, but it misses standalone and container layouts where the path does not encode the ROM (PPSSPP by game ID, the Dreamcast VMU folder; D-CLOUD-028's reasoning [S06]) and breaks when #10 re-keys state paths — or it scans every `<path>/` directory and reads every `.json` to filter by `system` + `rom`. In practice it will scan.

**Fields at discard time.** The sidecar carries `rom`, `system`, `kind`, `slot`, `producer.{device_id, device_label, core, core_build, captured_at}`, `winner_side`, `winner_sha256`, `reason`, `resolved_at`, `run_id`. Written before the destructive step. Nothing here depends on a manifest, the audit log, or the apply plan. **Sufficient** for the literal question: game (yes), newest first (`resolved_at`, wall clock), thumbnail (`<sha256>.png` by naming convention — the sidecar does not reference or hash it), producing device (yes), which side won (yes).

**What is thin.** No `captured_local`, no `clock_synced`, no `device.model`/`family`, no `emulator`, no `size`, no explicit screenshot reference, no container/unit case at all (the sidecar shows `rom` as a string; gemini adopted `kind: container` in the manifest but not in the store). "Newest first" rests on the resolving device's wall clock; a device that booted without a network (`clock_synced: false`, [S03] §6) misorders it. Retention "3 per save unit" is keyed by path, so a state discarded from slot 3 and later from slot 2 after a renumber sits in two buckets.

**Cloud-loser bytes.** gemini states directly: "When a resolution discards a copy (local or cloud), the engine writes: The State & Thumbnail: the discarded bytes." The download-before-publish is implied and should be stated as a step.

**One wording defect.** The done page reads "Discarded copies are kept and can be recovered later." "Can be recovered" promises a tool V1 does not ship; the changelog is explicitly a claims document that readers act on [S14]. gpt's "kept on this device" is the safe sentence.

### 1.2 `gpt-revised_plan-r3.md` — `/storage/.local/share/rocknix/cloud-saves/{discarded, preimages, pending}/`

**Reader path.** gpt specifies the record contract exhaustively and the physical layout not at all: it says records are pruned "by local commit order in a small ordered index," and groups counts by "logical retention bucket" (a game/core collection for renumberable states; a unit for saves and containers), but it does not say whether directories are named by record ID, by bucket, or by path. The reader therefore either reads the index (if it carries bucket keys) or reads every record under `discarded/`. Both work; neither is written down. This is a specificity gap, not a field gap.

**Fields at discard time.** The most complete contract of the four: record and operation IDs, resolving device, sync-context reference; system, ROM filename, content locator, unit ID and kind, container label; original relative paths, core repository, slot or `auto`, final destination mapping; every member's sha256, size, and stored location; producer snapshot copied inline (device id/label/model/family, emulator/core/build, capture times, clock confidence, explicit unknowns); PNG location and hash or explicit absence; the decision, winner map/hashes and known winner producer; retention reason; prepared-versus-finalized completion state. gpt states, and I confirm by inspection, that the record does not depend on a current manifest, the rotating audit log, or the in-flight plan. **Sufficient**, and the only store whose "newest first" is RTC-independent (commit order, not wall clock).

**Cloud-loser bytes.** §8.1 says the copies are kept "on this device," and §7.5 verifies "required preimages and retained metadata are durable" before destructive work — which for a cloud loser requires a fetch. Implied; should be a step.

**Location.** `/storage/.local/share/rocknix/cloud-saves/` is a proposed new path with no precedent in the corpus. gpt's argument against `.cache` is sound: the IA doc documents `.cache` as the home for state that "persists but can be regenerated," whose caches "self-invalidate" on a version stamp change [S02]. The counter-risk is that `.local` is unverified against `backuptool` — the alignment review verified only that `/storage/.cache` and `/storage/roms` are not archived [S04 §1]. Either home works once the invariant "this subtree is not a cache and is not in the settings archive" is enforced and tested; the choice is a decision for the maintainer, not an architecture.

### 1.3 `kimi-revised_plan-r3.md` — `/storage/.cache/cloud_sync/discarded/<operation-id>/{<sync-root-relative paths…>, operation.json}`

**Reader path.** Keyed by operation, where `operation-id = <utc>-<device-id>-<seq>`. To answer "this game" the reader lists `discarded/`, opens every `operation.json`, and filters its per-copy entries by `system` + `rom` (or container label). That is a full scan of every retained operation — bounded by (count × units), so at most a few hundred small files. Acceptable; not indexed. Newest first: sort directory names by their `<utc>` prefix — wall clock again; the `<seq>` component prevents collision but not misordering, and kimi does not say what "keep the last 3" orders by.

**Fields at discard time.** Per retained copy: the loser's manifest entry verbatim (kind, sha256, size, slot, system, rom, emulator, core, core_build, device id/label/model/family, captured_at/local, clock_synced, screenshot path + sha256), `reason`, `winner` {side, path, sha256, device}, and the wizard's decision summary. Written before the first destructive step. No dependency on manifest, audit log, or the transient pending record — kimi split those deliberately (C4). **Sufficient**, and kimi's own "reader test" (§3.6: overwrite the producer's entry, renumber, rotate the audit log, remove the pending record, then read) is the right acceptance test and should be lifted into every plan.

**Cloud-loser bytes.** This is where kimi is ambiguous. §3.6 gives a "remote analog": cloud retirements go to `SYNCPATH-replaced/<device-id>/<stamp>/`. §3.8's apply sequence says "retention copy + operation.json → … → publish remote with `--backup-dir`, retire the remote loser to the sibling." Whether the cloud loser is *also* fetched into the local store before publication is not stated. If it is not, a KEEP RIGHT leaves the retained copy only in the remote sibling, and the done page's "the copies are kept" is true only with a network. The fix is one sentence: the local store is the store; a cloud-side loser is fetched into it (tens of KB, one scoped copy) before the remote is overwritten; the sibling is a second copy.

### 1.4 `mistral-revised_plan-r3.md` — `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` + `<sha256>.json`

**Reader path.** Same shape as gemini: path-keyed, so per-game lookup is path construction (fragile) or a scan of all sidecars.

**Fields at discard time.** The sidecar carries the manifest entry verbatim (as kimi), `reason` ∈ {conflict-loser, superseded-by-download, compaction, es-delete}, `winner`, "the run/transaction id," and the decision text. **No discard timestamp.** The only times in the record are the loser's `captured_at`/`captured_local` — the producer's clock at capture, which may be a year before the discard. "Newest first" therefore has nothing correct to sort by unless run IDs are monotonic, which is unstated. This is a real gap against the maintainer's requirement; the fix is one field (`discarded_at`, or better a commit sequence per gpt).

**A second defect.** `compaction` is a retention reason. D-CLOUD-030 compaction removes a copy only after both files are re-read and the hashes found equal [S06]; the bytes survive at the lower slot by construction. Storing the compacted copy wastes space and — worse — under a per-unit count of 3, three routine compactions (which the renumber-then-sync cycle produces) would evict the player's real conflict losers. kimi's rule ("compaction and renumber retirements are not stored — verified-identical bytes survive at the retained slot; audit lines only") is correct and should be lifted in.

**Cloud-loser bytes.** Not addressed.

### 1.5 Findings common to the trace

- **All four stores are self-contained in the fields that matter** — none makes the later reader consult a mutable manifest, the rotated audit log, or a disposed apply record. The maintainer's requirement is met by all four in principle; mistral's missing discard time and gemini's thin sidecar are the two field defects; kimi's and mistral's silence on fetching the cloud loser is the one behavioural gap.
- **None of the path- or operation-keyed layouts is indexed by game.** The reader scans. Given the bound, that is fine; but a `game_key` (system + rom, or container label) per record plus a monotonic commit sequence (gpt) would let a later tool be written without a scan and without trusting the RTC. Liftable into all four in an afternoon.
- **The compare surface reuse argues for the fuller record.** gemini's sidecar would drive a picker showing UTC time with no clock warning and a label but no model; kimi/gpt/mistral would drive the same panel the wizard shows.

---

## 2. Question 2 — every remaining difference, sorted

The rule I applied: *liftable* = a rule, field, path shape, or ordering that moves without disturbing anything else; *architectural* = taking both is incoherent and the choice ripples. I was strict, and I found nothing in the second class that is not simply an error in one plan.

| # | Difference | Plans | Class | Direction / fix |
|---|---|---|---|---|
| 1 | Store home: `.cache/cloud_sync/discarded` vs `/storage/.local/share/rocknix/cloud-saves` | gemini, kimi, mistral vs gpt | Liftable (single pick, no ripple) | Either, with the invariant "not a cache, not archived" enforced and tested. Lean gpt's reasoning; verify against `backuptool` (not embedded). |
| 2 | Store keying: by path / by operation / by record + index | gemini, mistral / kimi / gpt | Liftable | Add `game_key` and a commit sequence to any layout. gpt → all. |
| 3 | Sidecar richness | gemini thin; kimi/mistral verbatim entry; gpt full contract | Liftable | kimi's "manifest entry verbatim + screenshot hash" plus gpt's "winner producer, completion state" → gemini. |
| 4 | Discard timestamp / ordering | gemini `resolved_at` (wall), kimi utc prefix (wall), gpt commit order, mistral none | Liftable | gpt's commit order → all; at minimum a `discarded_at` → mistral. |
| 5 | Count bucket: per path / per unit / per game-core collection for numbered states | gemini / kimi, mistral / gpt | Liftable | gpt's bucket definition → all (renumbers must not fragment the count). |
| 6 | Compaction copies stored | mistral yes; kimi no; gpt lists "redundant occurrence retirement" as a reason but separates allowances | Liftable | kimi's rule → mistral (and clarify in gpt). |
| 7 | Cloud loser fetched into the local store on KEEP RIGHT | gemini explicit; gpt implied; kimi ambiguous (remote sibling); mistral silent | Liftable (one sentence) | gemini → kimi, mistral. |
| 8 | Exemptions from pruning (pending/unreviewed) | gpt, gemini, kimi, mistral all state | Converged | — |
| 9 | Retention count default 3 per unit | All (as proposal) | Converged; unmeasured | Census sets it. |
| 10 | Tombstone lifetime: pruned with the retention window, resurrection accepted (kimi) vs not pruned by discard count, stop automatic retirement at a limit (gpt) | kimi vs gpt (gemini adopts gpt's shape without a lifetime; mistral silent) | Liftable (one rule) | Prefer kimi's bounded window with the resurrection consequence stated — resurrection is non-destructive and the manifest stays bounded. gpt's alternative is coherent too; pick one, cite the maintainer's "edge cases inform, not drive." |
| 11 | Tombstone channel: bounded list in the per-device manifest | kimi explicit; gpt "active retirement notices" (schema item, channel implied); gemini adopts; mistral "receipts" | Converged in substance | kimi's wording → gemini/mistral. Schema refinement row required (D-CLOUD-031). |
| 12 | Delete hook absent — degradation | mistral: "resurrection + hold-back until the hook ships"; kimi: RetroArch-menu deletes held; gpt/gemini: hook is required | Liftable | mistral's fallback → all (the hook site is not embedded). |
| 13 | Container representation: per-entry `kind: container` (gemini, kimi, mistral) vs unit-level (gpt); mistral's example keys a *directory* with a single sha256 | All | **Correction, not fork** | Per-file entries stay (D-CLOUD-031 "one per file" [S03 §5]; identity is a file's bytes, D-CLOUD-030). `kind: container` is legitimate for a single-file multi-game save (PSX `.mcr`) with `rom: null`; a multi-file VMU folder is a *unit* over per-file entries (kimi's declared-unit table, gpt's unit framing). mistral's directory entry must be removed. |
| 14 | Manifest transport: `--files-from` (gemini, gpt, kimi) vs "manifest-last commit" kept (mistral) | mistral vs rest | Liftable | The safety lives in the reader's coherence check (kimi §3.1 last bullet; gpt §6.3), not in ordering. Manifest-last becomes an optional measured spawn. gpt → mistral. |
| 15 | "Spawn A": compute the backend-native hash locally so the next exit push confirms C = A "without a listing" | mistral (attributed to `claude-revised_plan-r2.md`) | Liftable — and the claim is **wrong** (§3.2 below) | gpt's framing: optional optimisation, test it, never a prerequisite. |
| 16 | Exit deferral wording | gemini "the upload is deferred"; kimi/gpt "never upload over an unread head"; mistral "defer verification… leaving the exit push as a fast-path upload only" | Liftable — mistral's sentence is ambiguous (§3.3) | Defer the *upload*, not just verification. kimi → mistral. |
| 17 | Lifecycle gate: present and ordered (gemini, gpt, kimi); ES-death ownership (gpt only); absent (mistral) | — | Liftable | gpt §3.2 → gemini, mistral. |
| 18 | Capture unconditional on the sync setting | gpt only | Liftable | gpt → all. Source-visible need: the exit call is gated on `cloudsaves.gameexit` and `!isRunning()` [S41]. |
| 19 | Agreement bound to sync context (remote, backend, root, link identity) | gpt only | Liftable | gpt → all (§3.4 below explains the hazard). |
| 20 | Manifest union = set of claims, not last-map-wins | gpt only | Liftable | gpt → all; refines the schema's "merge of maps" [S03 §5]. |
| 21 | Foreign manifests to an out-of-tree observation cache, never republished | gpt explicit; kimi "never republished"; gemini/mistral silent | Liftable | gpt → all. |
| 22 | Typed outcomes and run-bound results | kimi F3 (codes); gpt (run ID + context, stale = failure); gemini/mistral silent | Liftable | Both → gemini, mistral. |
| 23 | Cancellation wording ("nothing transfers" vs pre-pass completed) | gpt only | Liftable | gpt → IA rev 5. |
| 24 | Kid/kiosk pending work | gpt, kimi | Liftable | → gemini, mistral. |
| 25 | #10 in the drop, last, gated on rehearsal | gemini, gpt, kimi; **mistral silent** | Liftable (gap) | kimi §3.11 → mistral (its `racommands` finding is the sharpest; §3.1 below). |
| 26 | Checked adapter over `getNextFreeSlot`/`copyToSlot` (−99 auto-only; unconditional `true`; parent-derived destination) | gpt, kimi, mistral; gemini §3.5 uses the raw primitives | Liftable (gap in gemini) | kimi §3.5 / gpt §7.4 → gemini. |
| 27 | Interrupted-apply journal states | gemini enumerates four; gpt frozen plan with per-unit state; kimi pending record + kill points; mistral silent | Liftable | gemini's enumeration verbatim → all. |
| 28 | Day-one filings: `RCLONEOPTS` bypass, `.bak`/conflicted-copy admission, harness defects | kimi F1–F4; gpt §6.2/§10.3; gemini/mistral silent | Liftable | kimi → gemini, mistral. |
| 29 | Split roots as one-way import; LAN `ip route get`; bisync demotion; queue-and-badge; boot under ES; equality bootstrap; member maps; deterministic auto KEEP BOTH; `--backup-dir` race gate; same-ID fork warn-and-refuse | All four | Converged | — |

**Conclusion.** Between `gpt-revised_plan-r3.md` and `kimi-revised_plan-r3.md` nothing architectural remains; every difference is a field, a rule, or a path that moves in one direction or the other. `gemini-revised_plan-r3.md` is a thinner instance of the same architecture with two gaps (raw ES primitives; thin sidecar). `mistral-revised_plan-r3.md` differs from the others only by errors and omissions (items 6, 13, 14, 15, 16, 25, and the missing gate), none of which is a design fork. A builder does not have to choose between these plans; a builder has to integrate them.

---

## 3. Load-bearing claims tested again

I checked every claim below against the embedded text. "Source-visible" means I could read it in the corpus; nothing here was executed.

### 3.1 Confirmed, and important

- **`getNextFreeSlot()` returns −99 for an auto-only repository and for any non-RetroArch emulator.** In `es/SaveStateRepository.cpp` [S37] `isEnabled` returns false unless `getEmulator() == "retroarch"`; an auto state is registered with `slot = -1` (the default when `matchSlotFile` fails and `matchAutoFile` succeeds); the allocator scans 99999→0 and never matches −1. kimi, gpt, mistral state it correctly; gemini's "correctly returns −99" is odd phrasing but its §4 says the adapter allocates from `firstslot`. The IA doc's "checked, not assumed" paragraph [S02] does omit this case (kimi F6 is right).
- **`copyToSlot()` returns `true` regardless of `renameFile`/`copyFile`; `makeStateFilename(fullPath=true)` derives the destination from `fileName`'s parent** [S38]. A cloud state staged in a temporary directory and wrapped in a `SaveState` would be "merged" into that directory. Confirmed. The header with default arguments is not embedded (gpt, kimi flag it).
- **The XML config path retires `racommands`.** In `es/SaveStateConfigFile.cpp` [S39] the compiled `Default()` sets `incremental`, `autosave`, `racommands` all true; the XML reader sets `emul->racommands = false` unconditionally and defaults `autosave`/`incremental` to false (settable). kimi's statement — "no config can express `racommands = true`" — is exact, and its consequence is source-visible in `es/SaveState.cpp` [S38]: every `if (racommands)` block in `setupSaveState` (the `.state.auto` → `.bak` dance, the `-autosave 1` flags, the `mNewSlotFile` copy) and the restore in `onGameEnded` are skipped. Also visible: `setupSaveState` rewrites `-emulator`/`-core` for a non-active config only when `!racommands` — the XML mode *is* ES's per-core mode. So gemini's Gate 4 ("verify that RetroArch's `racommands`, autosave, and incremental behaviors are preserved") will fail on `racommands` by construction; the rehearsal's real question is whether the non-racommands launch path (`-state_slot N -state_file "…"`) works on ROCKNIX's RetroArch launcher — which is not embedded. kimi's sharpened gate is the one to build from; gpt states the same fact in outline.
- **Numbered-slot launches restore the pre-session auto.** Under `racommands`, `onGameEnded` removes the auto written during the session and renames the `.bak` back [S38]. gpt is right that the schema's "auto states diverge every session" [S03 §4] is not generally established — it holds for launches into the auto or a new game, not for launches from a numbered slot. The census settles frequency; the resume-point presentation stands regardless.
- **The exit call is gated on the setting and on a running sync** [S41]. gpt's insistence that capture be unconditional is therefore load-bearing: a builder who puts capture inside that `if` loses provenance whenever exit sync is off, offline, or the lock is held.
- **`RCLONEOPTS` replaces the default option set including `--filter-from`** (`sources/cloud_backup` `backup_game_saves`: the `--filter-from` fallback runs only when the options array is empty [S29]); **user rules precede defaults** in `sources/cloud_sync_helper` [S31]; **the saves allowlist admits `.state.auto.bak`, the transient incremental slot copy, and `X (conflicted copy).srm`** (`+ /savestates/**`, `+ /**/*.state*`, `+ /**/*.srm` in `sources/cloud_sync-rules.txt` [S32]). kimi F1/F2 and gpt §6.2 are correct.
- **rclone's exit 3/4 collide with the scripts' reserved 3/4, and `clean_exit` stamps any code** [S29], [S40]. kimi F3 correct.
- **The round-trip harness cannot pass as embedded**: it writes `rclone.conf` before asserting the first remote and never restores it; asserts `{device_id}/ROCKNIX-backup-qa.zip` where the uploader stamps undated names `${stamp}-${base}`; reads the archive back at the undated local path where restore writes the dated name; looks for `*-*_BACKUP.tar.gz` no fixture creates (`tools/cloud-round-trip` [S36] against [S29], [S30]). gpt §10.3 and kimi F4 correct.
- **Shipped write paths are newest-wins**: `autostart/102-cloud-saves` runs `copy --update` both ways [S35]; `--recent` forces `copy` with no `--update` and the ES call adds none [S29], [S41]. All four correct.

### 3.2 An error: "Spawn A" cannot confirm the cloud without a listing

`mistral-revised_plan-r3.md` §4.3: compute the backend-native hash of the local file at upload time "so the *next* exit push for the same game can confirm C = A without a listing." A hash computed locally describes local bytes; it can only be *compared against* a listing. Knowing our uploaded version's Dropbox hash lets the next `lsjson --hash` be matched without a download — useful, and exactly what `remote_hash` in the schema is for [S03 §6] — but the listing is still required to learn what the cloud holds now. gpt §6.1 states the correct position ("It cannot reveal whether the cloud has changed since the last observation"). mistral attributes Spawn A to my own earlier revision; I cannot inspect that text here, but the position as described is one I no longer hold, and the spawn should not be a prerequisite of the exit path. This matters because mistral's "0 idle, 3–4 changed" spawn count is built on it: at ~1 s per rclone start on an A53 (`.claude/rules/rclone-cloud-sync.md` [S09]; D-CLOUD-028 [S06]), that is two to three seconds added to a ~7 s one-save exit on a path a player watches.

### 3.3 An ambiguity that reads as a defect

`mistral-revised_plan-r3.md` §4.3 and D-CLOUD-029-A: "Defer hashless verification if it exceeds the budget, leaving the exit push as a fast-path upload only." Read literally, the upload proceeds unverified — which is the behaviour the futro's #22 AC (a) forbids (a both-sides change is *refused* on the exit pass; `repo/plans/conflict-resolution/vita-style-conflict-resolution.md` §5 [S05]). gemini ("the upload is deferred to the next full pass"), kimi ("never upload over an unread head"), and gpt ("leave that unit pending") say it right. The fix is one sentence.

### 3.4 A hazard only one plan closes

`gpt-revised_plan-r3.md` §4.4 binds the agreement record to a sync context (remote name and backend, remote root, local roots, a link identity). Trace the alternative with the classifier every plan shares: a player uses CHANGE CLOUD FOLDER (`repo/docs/es-menu-map.md` [S13]) or re-links to a different account under the same remote name. The local file is unchanged, so L = A. The new remote holds different bytes at that path, so C ≠ A. Verdict: "cloud changed → download, no prompt" [S03 §3] — the player's local save is overwritten by a stranger folder's file without a question. gpt's binding turns that into "never agreed → ask." This is the single most valuable rule in the four plans that the other three lack, and it costs a few lines in `agreed.json`.

### 3.5 A schema-semantics correction only one plan makes

The signed schema says "the union of two devices' manifests is a merge of maps" keyed by path [S03 §5]. Two devices legitimately hold entries for the same path with different hashes — that *is* the conflict. A merge of maps keyed by path keeps one and loses the other. gpt §4.2's "set of claims, not a right-biased merge in which the last manifest read wins" is the correct reading and belongs in the D-CLOUD-031 refinement row.

### 3.6 A transient none of the four names

Under `racommands` with incremental states, `setupSaveState` copies the loaded state to the *next free slot* during the session (`mNewSlotFile`, with an MD5 to detect change) and `onGameEnded` deletes it if unchanged [S38]. That numbered state exists only for the session, is admitted by `+ /**/*.state*` [S32], and a concurrent full pass would upload it; when ES deletes it at exit, the next pass sees a cloud-only state (other devices download a phantom slot) and, locally, an unexplained absence. kimi F2 names the `.bak`; the lifecycle gate in gemini/gpt/kimi closes this transient too — provided the boot pass actually respects the gate. The cheap experiment: launch from a numbered slot with incremental states on, run the shipped boot pair mid-session, inspect what reached the remote (fits kimi's gate 3 "zombie-auto reproducer").

### 3.7 Smaller wording errors

- `mistral-revised_plan-r3.md` §7.1: "The sibling is a dated directory under the sync root, never inside it (D-CLOUD-014)." Under is inside; D-CLOUD-014 requires a *sibling of* the destination [S06]. Intent is clear; text is wrong.
- `mistral-revised_plan-r3.md` D-CLOUD-030-A: "Propagate as moves into dated siblings, **capped per run**." mistral §12 criticises `gemini-revised_plan-r2.md` for exactly this — a cap that drops records reintroduces non-convergence. Either the cap defers (fine) or drops (not fine); say which.
- `mistral-revised_plan-r3.md` labels the store amendment "D-CLOUD-027-A" (the audit-log row) and the exit-path amendment "D-CLOUD-029-A" (the write-paths-stay-shipped row). The store is not the audit log; replacing the exit path is #22 fulfilling D-CLOUD-029, not refining it. Harmless, but the register is append-only and the labels will be read literally.

### 3.8 Council-agreed but not corpus-settled

All four now share these; none is settled by the corpus and each has a gate: bisync's demotion (the spike — the corpus has flags and help text, not a run [S05], [S16], [S23]); queue-and-badge (IA rev 4 says the wizard opens on report [S02]); retention count 3 per unit (maintainer said "bounded by a count"); boot sync under ES scheduling (the handoff from `102-cloud-saves` is not embedded); the lifecycle gate's ownership; tombstones in the manifest (a D-CLOUD-031 schema change); `--files-from` composition with `--no-traverse`/`--backup-dir` on 1.75.0; `--backup-dir` preserving an intervening head under a race; 480×320 recognisability. All four say so honestly.

---

## 4. What the amendments cost each plan

- **`gemini-revised_plan-r3.md` — low.** Aligned on both decisions. Costs: enrich the sidecar (items 3, 4, 5); fix the done-page promise ("can be recovered later" → "kept on this device"); add the checked adapter it omits in §3.5. The store survives the future-reader requirement in fields, thinly.
- **`gpt-revised_plan-r3.md` — none on the decisions.** It withdrew the V1 native recovery route and removed cross-device receipts. The five records it keeps are current-state, not history, so the "deeper than one step back" test passes. The one cost is specificity: state the physical layout under `discarded/` and the index's shape so a builder has a path to open.
- **`kimi-revised_plan-r3.md` — none on the decisions.** Costs: the cloud-loser fetch sentence (item 7); an RTC-independent ordering (item 4); the bucket for renumbered states (item 5).
- **`mistral-revised_plan-r3.md` — moderate.** Aligned on the decisions (no undo control; retention ON; recovery route moved to the separate issue as its seed — correct). Costs: the store cannot answer "newest first" without a discard timestamp; compaction copies would evict real losers under the count; the exit-deferral sentence must be rewritten; Spawn A dropped as a requirement; the directory-keyed container entry removed; #10 and the lifecycle gate added from kimi/gpt.

---

## 5. What each plan uniquely has — liftable verbatim

- **`gemini-revised_plan-r3.md`**: the interrupted-apply journal contract — *"A boolean `done` is insufficient. The record must distinguish: prepared operands, local installation complete, remote publication verified, and agreement committed."* Also the cloned-card experiment (two live devices sharing one `cloud_device_id`; verify warn-and-refuse) and the explicit statement that the discarded cloud copy's bytes and PNG are written into the local store.
- **`gpt-revised_plan-r3.md`**: agreement bound to a sync context (§4.4); capture independent of the sync setting (§3.3); the lifecycle gate owned by the launch supervisor or emulator process lifetime so it survives ES dying with the emulator alive (§3.2 — ES abort-and-restart is documented in `.claude/rules/engineering-practices.md` [S10]); manifest union as a set of claims (§4.2); pruning by commit order (§8.4); the cancellation wording clarification (§7.2); foreign manifests to an out-of-tree cache (§4.2); validating the `--backup-dir` prefix on bucket remotes (§6.6); the observation that numbered-slot launches restore the pre-session auto (§10.2 item 3).
- **`kimi-revised_plan-r3.md`**: the `racommands` finding and the three rehearsal questions for #10 (§3.11); the four day-one filings F1–F4 with source citations (§11); "compaction and renumber retirements are not stored" (§3.6); the loser's manifest entry verbatim in `operation.json` (§3.6); the reader test (§3.6); typed outcome codes (§3.3); the zero-spawn idle exit; the staging temp-name that matches neither ES regex (§3.5); the ten-step hardware order with the sequential offline-fork fixture as its capstone (§8).
- **`mistral-revised_plan-r3.md`**: the hook-absent degradation — *"If the hook does not exist, reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships"* — the only plan that says what happens if `GuiSaveState.cpp` (not embedded) offers no clean attach point. Also the full field table reproduced from the schema as a paste-ready D-CLOUD-031 amendment (once the directory-keyed example is removed and `kind: container` is confined to single-file multi-game saves).

---

## 6. What should not be built

This is a busybox handheld with a ~5 s watched path and ~1 s per rclone start [S09], [S06].

- **Spawn A as a prerequisite** (mistral) — it does not certify the remote and costs a second on the watched path.
- **Manifest-last as a mandatory extra spawn** (mistral) — the reader's coherence check is the safety; ordering is an optional measured optimisation (gpt §6.3).
- **Compaction copies in the retention store** (mistral) — lossless by construction; they consume the count.
- **Raw `copyToSlot` / `getNextFreeSlot` without the adapter** (gemini §3.5) — return values are discarded and the destination follows the source's parent [S37], [S38].
- **A promise on the done page of a tool V1 does not ship** (gemini's "can be recovered later").
- **Unbounded tombstone lists** — gpt's "not pruned by the discard count" needs a bound of its own or kimi's window; a manifest that grows with every deletion for devices that never return is churn on every exit upload.
- **A hashless-and-modtimeless backend as the budget target.** The QA WebDAV has neither hashes nor modtimes [S04]; gpt correctly admits a full verify there "may ultimately read the whole eligible save library." Design fail-closed for it; size the budget on Dropbox/S3, which is what players have.
- **A SQLite index** — all four agree; close #20's open question.
- **Cross-device resolution receipts, vector clocks, generation counters beyond warn-and-refuse, a daemon, a full remote staging mirror, semantic binary merging, a 99-slot cap, automatic `--resync`** — all four now exclude these.

---

## 7. Which plan I would build from, and what I would take

**Build from `kimi-revised_plan-r3.md`.** Not because it is more correct than `gpt-revised_plan-r3.md` — on the rules that matter the two are equivalent and gpt has the deeper set — but because a builder needs literal paths, sentences, filings, and an ordered gate list, and kimi's twelve-sentence specification, `operation.json`, F1–F4, and ten-step hardware order are the closest thing in the four plans to a document one could hand to whoever implements #21/#22/#23 on Monday. gpt's plan is the reference to check kimi's against.

**Take from `gpt-revised_plan-r3.md` before building** (each a lift, none a rewrite): §4.4 sync-context binding of `agreed.json`; §3.3 capture unconditional on the sync setting; §3.2 gate ownership surviving ES death; §4.2 claims-set union and out-of-tree foreign manifests; §8.4 commit-order pruning and the game/core retention bucket; §7.2 cancellation wording; §6.6 bucket-remote `--backup-dir` prefix validation; §7.4's ten-point adapter contract as the acceptance checklist for kimi §3.5.

**Take from `gemini-revised_plan-r3.md`:** the four-state apply journal sentence; the explicit "cloud loser's bytes and PNG are fetched into the local store before publication"; the cloned-card experiment.

**Take from `mistral-revised_plan-r3.md`:** the hook-absent degradation; the schema table as the amendment's form, corrected.

**Then add** the one fixture none of the four names: the transient incremental slot copy under a concurrent full pass (§3.6 above), alongside kimi's zombie-auto reproducer.

### Where the plans changed my mind

`mistral-revised_plan-r3.md` attributes to my own earlier revision the manifest-last commit, Spawn A, a `<path>/<sha256>` store, and a "0 idle, 3–4 changed" spawn count. I cannot inspect that text here and will not reconstruct it; but the positions as described are ones I would now drop, and I say so because the reasoning that moved me should be visible to whoever integrates: gpt's argument that a locally computed hash cannot certify the remote and that a manifest is an observation rather than a commit; gpt's bucket argument that a path-keyed count fragments across ES renumbers; and kimi's `racommands` finding, which moved the #10 gate in my mind from "measure whether launch behaviour is preserved" to "expect that an ES patch, not a config file, is what #10 requires, and rehearse to confirm." I also now accept, with all four plans and against the reading I had leaned toward earlier, that propagating explicit deletions via version-specific tombstones is cheap enough to keep in V1 once unexplained absence fails closed — the maintainer's amendment makes the alternative argument insufficient on its own.

---

## 8. Gaps to surface to the orchestrator

Depended on by every plan and not embedded: `GuiSaveState.cpp` (the delete hook's attach point — the single load-bearing hook); `SaveState.h`/`SaveStateRepository.h` (default arguments for `makeStateFilename` and `copyToSlot`); `Paths.cpp`; the filesystem copy/rename utilities (timestamp behaviour for the zombie-auto trace); `setsettings.sh` and the shipped `retroarch.cfg` (`savestate_directory`, `savestate_auto_save`; whether the launcher honours `-state_file`, which the non-`racommands` path emits); `cloud_sync.conf.defaults`, `cloud_sync-rules.txt.defaults`, `backuptool` (to verify whichever store home is chosen is neither archived nor invalidated), `tools/cloud-test-backend`; rclone 1.75.0 documentation or source for bisync, `--files-from`, `--backup-dir`, and filter ordering; ES startup ordering relative to network readiness and the `102-cloud-saves` handoff; the current issue bodies (the embedded issue files are predominantly comment threads). The round-2 plans and my own earlier revision are not embedded; nothing above relies on them as evidence.

---

## `corpus.provenance.json`

```json
{
  "artifact": "claude_peer_review-r4.md",
  "role": "council member, round-4 peer review of the injected round-3 revised approaches",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 map in order to the same-index entries of source_file_paths and source_file_hashes; S01 is array index 0",
  "reviewed_artifacts": [
    "gemini-revised_plan-r3.md",
    "gpt-revised_plan-r3.md",
    "kimi-revised_plan-r3.md",
    "mistral-revised_plan-r3.md"
  ],
  "reviewed_artifact_hashes_provided": false,
  "own_prior_revision_embedded": false,
  "own_prior_revision_basis": "Known here only through attributions in mistral-revised_plan-r3.md; not inspected and not reconstructed",
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
      "reason": "The explicit-delete hook's attach point, default arguments for makeStateFilename/copyToSlot, and copy timestamp behaviour are not inspectable from the embedded excerpts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "setsettings.sh, the shipped retroarch.cfg, and the RetroArch launch wrapper",
      "reason": "Whether the launcher honours -state_file (the non-racommands path ES emits under an es_savestates.cfg) decides #10's rehearsal outcome; savestate_directory and savestate_auto_save are not embedded",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "backuptool, cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_setup, tools/cloud-test-backend",
      "reason": "The chosen retention-store home must be verified as neither archived nor cache-invalidated; upgrade and harness safety claims cannot be checked from the embedded callers",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 documentation or source for bisync, --files-from, copy --backup-dir, and filter ordering",
      "reason": "Transport and preservation claims shared by all four plans rest on behaviour the corpus does not contain",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "ES startup ordering relative to network readiness and the autostart/102-cloud-saves handoff",
      "reason": "All four plans move the boot pass under ES scheduling; the corpus does not show when ES is up or how the autostart script would hand off",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current issue bodies for #9, #10, #20–#25, #35, #37 and docs/es-ui-style-guide.md",
      "reason": "The embedded issue files are predominantly comment threads; the futro reports body edits whose current text is not independently present",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "The round-2 revised plans and this member's own earlier revision",
      "reason": "Not embedded; positions attributed to them by mistral-revised_plan-r3.md are addressed as described, not verified",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated"
}
```