# Council — round 4, revised approach

You are one of five council members. You have each produced a revised approach
to the foundation for cloud-save conflict resolution in ROCKNIX, and the other
four have now reviewed all of them. The corpus is embedded above, unchanged and
hash-verified; those four reviews are injected below.

Now produce **your round-4 revised approach**: the foundation you would
actually build, having heard this second round of critique. This is the artifact
the council votes on next, so it must stand on its own — a reader should be able
to act on it without having read any analysis, review, or earlier revision.

## Anti-self-citation constraint

Reason about the substance on its merits, against the embedded corpus. Do not
treat the injected reviews as evidence about how councils, models, or this
deliberation behave.

## Amendment to the problem context — two maintainer decisions

Both are authoritative, both were made **after** the injected plans were
written, and neither is open for argument. No plan is expected to name them and
none should be criticised for their absence. What matters is which plans are
closest to them, and what each would have to change.

### The purpose, restated

> The goal is to preserve the sanctity of the user's saves and to empower them
> with the choice to make a decision about a conflict. Undoing that choice is
> also something a user should have the option to do. They likely aren't going
> to be going 8 steps back with the save, but may accidentally make the wrong
> choice with the conflict and want to undo that choice. That's going to be the
> primary use case.
>
> Some of the edge cases around card disconnection, and so on, are good to think
> about, but are edge cases that shouldn't constrain our approach unnecessarily.

So: reversibility is a first-class requirement, the depth that matters is one
step back rather than a version history, and an edge case may inform a design
but may not drive it. In particular, the argument that a capability must be
given up *because* a detached or unmounted card is indistinguishable from a
deliberate deletion is not on its own sufficient. Failing closed on an
unexplained absence is cheap and is still expected; abandoning a capability to
buy it needs a better reason than the edge case alone.

### Where the undo lives, and where it does not

The plans divided on whether version one ships a control the player can press.
The maintainer has settled it:

> I don't want to add more complexity to the user during conflict resolution.
> The goal there is to get the user going as quickly as possible.

**Version one retains the discarded copy, on by default, bounded by a count, and
ships no undo control.** The wizard's done page says what was discarded and that
the copies are kept. Nothing in the resolution flow offers to put one back. A
plan that makes an on-device undo surface a version-one requirement is now
over-scoped, and a plan that builds lineage or receipt machinery deeper than one
step back is solving a problem the maintainer has said is not the primary case.

Restoring a discarded copy becomes a **separate tool**, tracked as its own
issue, and the maintainer has given it a shape:

> an option that allows you to essentially go back through conflict resolution
> flow and use it as a history restore flow, almost like a time machine, to
> overwrite the existing save with something from the past

That is the wizard's own compare-and-choose surface, pointed at a game's
retained past versions instead of at a live conflict, reached from outside the
moment of resolution.

**One consequence lands inside version one even though the tool does not.**
Nothing reads the discard store in version one, so nothing will catch a store
shape that a later reader cannot drive a picker from — one keyed only by a
timestamp, or one that drops which game, which slot, which device produced the
copy, and which side won. The store is designed now for a reader that does not
exist yet. Say whether each plan's retention design survives that requirement.

## What this revision is, given where the round landed

The reviews you are about to read were asked to sort every remaining difference
between the plans into two kinds: differences that could simply be **lifted**
from one plan into another, and differences where taking both is incoherent and
a builder has to **pick**. Read what they concluded before you revise.

That framing decides what this revision is for. Where a difference is liftable
and a reviewer said it should move into your plan, **move it** — do not argue
for your own wording of the same rule. Where a reviewer says it should move out
of your plan, take it out or say why the reviewer is wrong on the substance.
Prose ownership is worth nothing here; the council is trying to converge on one
buildable document, and a difference kept only because you wrote it your way is
a difference that costs a builder time.

Where a difference genuinely requires a pick, that is the small set worth your
argument. Name each one, state the choice you make, and give the reason a
builder could act on. If you believe no such difference remains between your
plan and another, say so explicitly rather than implying it.

## What this revision must do

Three revisions have closed the easy distance. What remains are the places where
the plans genuinely disagree, and the places where all four agree without the
corpus having settled the point. Both are dangerous, and this round exists to
deal with them rather than to polish prose.

- **Settle, do not average.** Where the reviews identified a substantive
  disagreement, take a position and give the reason. If the evidence does not
  yet exist, say which experiment settles it and what your plan does in the
  meantime under each outcome. Do not adopt a compromise that no reviewer
  argued for.
- **Separate what the corpus settles from what the council merely agrees on.**
  A position held by everyone and evidenced by nobody is the most expensive
  kind of error, because no reviewer is left to catch it. Mark those explicitly.
- **Concede what was refuted**, naming the reviewer and the file, and correct
  it. A revision that quietly drops a refuted claim is worse than one that owns
  it. Where a review misread you, say so and make the argument better.
- **Adopt what others got right**, crediting them by filename. You are not
  scored on originality.
- **Refuse what the problem does not earn.** This is a handheld running busybox
  with a five-second budget on a path the player watches. Where a reviewer or a
  plan proposes machinery beyond that, say so and cut it.
- **Keep the load-bearing separable from the optional.** Get the load-bearing
  parts wrong and the milestone is unsafe; the rest can follow later. Make the
  boundary explicit.
- **State decision changes explicitly.** If your approach requires reopening a
  decided register row, name the ID, state the change as a new refinement
  citing the old row, and give the argument. If it needs no reopening, say so.
- **Pay the amendments.** If your plan named an on-device undo surface as a
  version-one requirement, remove it and re-home its design to the separate
  restore tool. If it carries lineage, generation tracking or receipts deeper
  than one step back, justify each against the maintainer's stated primary
  case or cut it. State plainly what your retention store records, and whether
  a later restore tool could drive a picker from it.
- **Be honest about what is still unmeasured**, and name the experiment that
  settles each hypothesis about rclone, bisync, RetroArch, a backend, or the
  hardware.

Refer to members and artifacts by filename (for example `gpt-analysis.md`,
`kimi_peer_review-r4.md`), never by an invented ordinal.

## Injected peer reviews

=== START claude_peer_review-r4.md ===

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

=== END claude_peer_review-r4.md ===

=== START gemini_peer_review-r4.md ===

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

=== END gemini_peer_review-r4.md ===

=== START gpt_peer_review-r4.md ===

# gpt_peer_review-r4.md

## Review posture and conclusion

I reviewed the four injected **current** plans against the embedded source corpus. I did not access a filesystem, recompute hashes, or run tests. References such as **[S03]** identify the exact declared path and embed-time SHA-256 recorded in the provenance block below. References to earlier plans inside the injected documents do not supply missing specifications or evidence.

**I would use `claude-revised_plan-r3.md` as the editing baseline, not as an implementation-ready specification.** Its game-addressed retention store, sealed upload staging, and game-lifetime exclusion are the strongest foundation. Before building, I would integrate several concrete provisions from `kimi-revised_plan-r3.md`, the explicit event timestamp and verification-deferral policy from `gemini-revised_plan-r3.md`, and the thumbnail classification rule from `mistral-revised_plan-r3.md`.

The important conclusions are:

- **The basic architecture has converged.** All four choose an application-owned reconciler, rclone transport, content identity, local agreement, and a retained-copy store outside the sync tree.
- **None of these current plans still requires a version-one undo control.** There is no reason to penalize them for earlier positions. The remaining amendment costs are predominantly retention-schema work.
- **Two stores are close to the future reader requirement; two need more substantial completion.** None should be accepted merely because its document says that the reader test passes.
- **Several correctness holes remain more important than the remaining plan differences:** incomplete retention of multi-file units, circular remote-hash verification, losing upload retries behind the idle fast path, and recovery that trusts a phase label more than actual files.
- **Nothing architectural remains between `claude-revised_plan-r3.md` and `kimi-revised_plan-r3.md` once the corrections below are integrated.** Their remaining differences are mostly fields, ordering, storage layout, or replaceable policy rules.

---

## 1. Walk the future restore reader through each store

### The reader contract

For the maintainer’s primary use case, “newest first” should mean **most recently retained by a completed decision**, with the save’s capture time displayed separately. An old save discarded today must not disappear down the list merely because its `captured_at` is old.

The reader needs:

1. A game or shared-container identity and a complete retained save unit.
2. Original path, slot, core, and other compatibility context.
3. Retained bytes and a retained thumbnail, where one genuinely exists.
4. Producing-device information, explicitly unknown when unavailable.
5. Which side won, and the selected action.
6. A durable event order and completion status.
7. References that resolve **inside the retention record**, not back into today’s save tree.

It does **not** need eight generations of ancestry, historical copies of both winners and losers, or a database. A later PAST-versus-NOW comparison can read NOW from the live tree.

One source detail matters to three of the proposals: in the signed manifest, **`device` is top-level, not part of an entry**. Also, `screenshot` is a sync-root-relative path, not a retained-file locator, and the entry contains no screenshot hash. “Copy the manifest entry verbatim” therefore does not, by itself, preserve all the context these plans promise. [S03, §6]

### `claude-revised_plan-r3.md`

**Literal reader walk**

1. Derive the game’s `unit-key`.
2. Open:

   `/storage/.cache/cloud_sync/retained/<system>/<unit-key>/`

3. Enumerate `<device-id>-<seq>/record.json`.
4. Select completed retained records and order them by the persisted sequence.
5. Read the retained operand, producer, decision, winner, original path/slot, and member list from `record.json`.
6. Open the member files and PNG in that record’s directory.

**Unnecessary scanning:** ordinarily none outside that game’s retention bucket. If the game has several separately keyed units, the reader enumerates those units. It need not scan other games, manifests, audit logs, or completed pending records.

**What survives:** the proposed record expressly snapshots both operands’ provenance, the decision, winning hash and destination, retained side, original location, and member information. That is substantially sufficient for the requested single-file picker. This is the strongest reader-oriented layout of the four.

**What does not yet survive the general case:**

- **Files “by basename” can collide inside a multi-file unit.** Two retained members from different directories can share a basename. The record must store collision-free retained-relative paths; `kimi-revised_plan-r3.md` already supplies the better payload layout.
- “ROM filename made path-safe” needs an **unambiguous encoding or a recorded key mapping**, not an unspecified lossy slug. Different names must not acquire one retention bucket accidentally.
- `phase` must be finalized in the retained record itself before the transient pending record is removed. Writing `prepared` once is insufficient.
- Sequence ordering is sound within one issuing sequence domain. The specification should define what happens if a store survives an identity change or is imported from another device; lexical comparison of unrelated per-device counters is not chronology.
- The screenshot reference must explicitly point into the retained directory. The original remote-relative reference can remain as provenance.

The plan’s claim that a reader can “render both panels from `record.json` alone” is broader than necessary: historical winner bytes and its screenshot are not necessarily retained. **Rendering the retained candidate, identifying the historical winner, and comparing against the current live save is sufficient.**

**Verdict:** survives the amendment for the ordinary single-file case; close for general units after small, concrete layout and finalization corrections.

### `gemini-revised_plan-r3.md`

**Literal reader walk**

The store is:

`/storage/.cache/cloud_sync/discarded/<path>/<sha256>`

with `<sha256>.png` and `<sha256>.json`.

For a game whose states have been renumbered or moved into per-core directories, today’s live paths do not identify all historical `<path>` directories. The reader must therefore:

1. Recursively enumerate sidecars under `discarded/`.
2. Read each sidecar’s `system` and `rom`, selecting the requested game.
3. Sort selected records by `resolved_at`.
4. Read `producer`, `winner_side`, and `winner_sha256`.
5. Open the adjacent hash-named payload and PNG.

**Unnecessary scanning:** sidecars and directory entries for unrelated games and historical paths. No unrelated save payload needs to be read.

**What survives:** for a single numbered state, the example explicitly retains game, system, kind, slot, producing-device ID/label, core/build, winning side/hash, resolution time, and run ID. Those particular facts do not depend on a later manifest or audit lookup.

**Missing or ambiguous:**

- There is no complete multi-file unit descriptor or retained member map. A reader cannot reconstruct a coherent `.eep`/`.mpk` or PPSSPP save set from unrelated per-file sidecars without additional grouping.
- A repeated discard of **the same hash at the same path** overwrites the previous contextual sidecar. Content deduplication is reasonable, but content identity is not decision identity.
- `resolved_at` is useful, but a wrong or repeated wall-clock value needs an independent ordering/tie-breaking field.
- The example lacks record schema and completion state.
- Producing model, emulator, clock confidence, and full original provenance are not all retained. The required device identification is present, but reusing the full wizard later would otherwise require filling these omissions from a manifest that may have changed.
- The PNG relationship is conventional rather than an explicit retained artifact descriptor with availability and hash.

**Verdict:** sufficient for a narrow single-file history listing, not yet sufficient for the plan’s whole-unit architecture. Medium-sized, liftable schema work is required.

The done-page wording should also be the maintainer’s narrower statement—**what was discarded and that copies are kept**—rather than implying that a recovery facility is already available in version one.

### `kimi-revised_plan-r3.md`

**Literal reader walk**

The store is:

`/storage/.cache/cloud_sync/discarded/<utc>-<device-id>-<seq>/operation.json`

with payloads beneath their original sync-root-relative paths.

The reader:

1. Enumerates all operation directories.
2. Opens every `operation.json`.
3. Examines its retained-copy records, filtering by game/system or container.
4. Orders matching decision occurrences using the operation sequence, with capture time shown separately.
5. Reads the chosen record’s producer, winner, reason, decision summary, and screenshot descriptor.
6. Opens retained files by prefixing their recorded sync-root-relative paths with that operation directory.

**Unnecessary scanning:** every operation record, including unrelated games, plus unrelated entries within an operation that resolved several games. It need not scan unrelated payload bytes.

**What survives:** the path-preserving payload layout is good. The intended metadata contract includes the decision and origin information, and explicitly separates permanent retention metadata from disposable pending state.

**What needs correction before the assurance is true:**

- “The loser’s manifest entry verbatim” does not contain the listed device fields. Serialize **the entry plus a snapshot of the enclosing producer descriptor**. The screenshot hash must be computed from the retained PNG; it is not supplied by the signed entry. [S03, §6]
- `operation.json` must explicitly group retained files into **complete units**, including unchanged members required to load the selected past version. A bag of individually retained copies is not enough.
- Define sequence persistence and ordering independently of the UTC prefix. Avoid assuming lexicographic directory order means decision order.
- A permanent completion/outcome field is needed. The operation record is written before the destructive step, so its mere presence cannot say that its described discard actually happened.
- Per-unit pruning within a directory containing several games must not remove unrelated retained candidates. Either prune individual unit records carefully or use one retained leaf per unit decision.

For shared containers, `rom: null` is honest, but a reader cannot infer “this game uses this VMU” from it. The unit declaration must supply that association where knowable; otherwise the tool should present **shared save containers**, not attribute them to the last game played.

**Verdict:** close to sufficient and particularly strong on payload placement. The missing producer join, unit grouping, event ordering, and completion field are liftable corrections, not a new storage architecture.

### `mistral-revised_plan-r3.md`

**Literal reader walk**

The store again uses:

`/storage/.cache/cloud_sync/discarded/<path>/<sha256>`

and a `<sha256>.json` sidecar.

The reader must:

1. Recursively enumerate sidecars across all historical paths.
2. Read their game/system fields to select the requested game.
3. Read the intended producer, winner, reason, transaction ID, and decision text.
4. Open the adjacent retained payload and thumbnail.

**Unnecessary scanning:** the same unrelated historical-path and sidecar scan required by `gemini-revised_plan-r3.md`.

**The ordering step cannot be completed as specified.** The sidecar contains capture timestamps, but no specified discard/resolution timestamp or ordered event identifier. A transaction ID with unspecified structure does not solve that. Sorting by `captured_at` would sort save creation, not the user’s most recent decision. Recovering decision order from the audit log would fail after D-CLOUD-027’s rotation. [S06]

Other gaps are the same substantive ones:

- The top-level producer descriptor is not included by copying an entry verbatim.
- There is no explicit complete-unit retention descriptor.
- Repeated path/hash occurrences share one contextual filename.
- Completion state and retained-relative screenshot references are unspecified.
- The store’s non-disposable status is raised as something to decide rather than made an operative contract.

**Verdict:** the intended facts are mostly named, but the store cannot reliably drive the primary recent-choice reader as written. It needs an event record, ordering, complete-unit membership, and an explicit non-disposable storage contract. These are still liftable changes.

### Retention assessment against the amendments

| Current plan | Version-one UI/default cost | Retention work still required |
|---|---|---|
| `claude-revised_plan-r3.md` | Already aligned; remove optional cross-device resolution semantics from the minimum if simplifying scope | Low–medium: collision-free member placement, key definition, finalization, sequence-domain rule |
| `gemini-revised_plan-r3.md` | Already aligned; narrow done-page wording | Medium: complete units, decision-occurrence identity, ordering, completion, fuller context |
| `kimi-revised_plan-r3.md` | Already aligned | Low–medium: producer snapshot, unit grouping, ordering/finalization, safe per-unit pruning |
| `mistral-revised_plan-r3.md` | Already aligned; explicitly add the “copies are kept” done-page contract | Medium: event-based records, chronology, unit membership, producer snapshot, settled storage lifetime |

The proposed count of three is not authoritative. Whatever count is selected, it must count **coherent retained candidates**, not individual members of one save set. Incomplete operations remain exempt. Routine synchronization preimages should not accidentally consume the entire allowance intended for wrong conflict choices.

---

## 2. Load-bearing claims that still need correction

### 2.1 Zero-spawn idle must not mean “forget an unsuccessful upload”

All four seek a zero-rclone-start idle path. That is a good optimization, but the distinction between **captured** and **successfully published** is not consistently maintained.

A normal failure sequence is:

1. Capture records local version H1 in the own manifest.
2. Upload is skipped or fails.
3. The next game exit finds no difference from that manifest.
4. “Changed set empty” returns without retrying H1.

The shipped `--recent` mechanism instead keys its window to a successful backup stamp. Replacing it requires preserving that retry property, not just replacing its file-selection mechanism. [S29; D-CLOUD-028]

**Required correction for every plan:** the idle predicate must include outstanding unpublished versions, retained staging work, and pending operations. Capture dirtiness and publication dirtiness are separate facts. Capture also must not disappear merely because the upload toggle is off or another cloud job is running; the current ES call site has those gates around the transfer. [S41]

`claude-revised_plan-r3.md` additionally proposes a size/mtime precheck before hashing possible changes. **Same size and mtime cannot authorize skipping the content check indefinitely.** The project has already encountered equal-size changes, and its clocks are explicitly not reliable evidence of version equality. Hash the relevant save units at the capture boundary; use cheap metadata only as an optimization with an independent invalidation or rescan rule. [S03; S29]

**Settling fixture:** failed upload followed by an unchanged exit must retry; an equal-size, equal-mtime byte change must still enter the changed set.

### 2.2 The remote-hash bridge must prove a correspondence, not assign one

Three different errors survive here.

#### `claude-revised_plan-r3.md`

The changed-path sequence drops local backend-hash computation and says the post-upload listing both verifies the upload and fills `remote_hash`.

For a **new** local SHA-256 H, there is no previously verified H-to-native-hash mapping. Observing remote digest R and recording “H maps to R” does not prove that the remote contains H. It is a correspondence being assumed at precisely the point where the plan says it is verified.

The specification must name the independent evidence:

- compare R with a native digest computed over the sealed local payload;
- or download the resulting remote object and compare SHA-256;
- or use a specifically tested transport verification result that establishes the same correspondence.

The hashless branch’s `verified_by: "transfer"` and proposed degradation to accepting exit zero do not meet the project’s **verify the artifact, not the report** constraint merely by receiving a label. [S10]

#### `kimi-revised_plan-r3.md`

The equality-seeding rule permits a matching foreign-manifest claim plus matching size/mtime as an alternative to download-and-hash on a hashless backend. That contradicts the stricter rule elsewhere in the same plan.

A manifest describes an intended version; it does not prove the bytes currently occupying a mutable remote path. Equal size and mtime do not close that gap. The QA WebDAV has neither usable hashes nor modtimes in the embedded account. [S04; S09]

#### `mistral-revised_plan-r3.md`

Computing the backend hash locally cannot let “the next exit push … confirm C = A **without a listing**.” It computes an expected digest, not the current remote head. Another device may have published since the last observation.

Local native-hash computation can complement a fresh remote observation. It cannot replace one.

#### Transfer authorization must survive rclone’s own comparison

`claude-revised_plan-r3.md` explicitly forces decided transfers with `--ignore-times`. The corresponding exact-file upload commands in the other plans do not consistently do so.

Selecting one file—or using `copyto`—does not itself force a transfer past metadata comparison. The shipped archive paths explicitly pair the selected transfer with `--ignore-times` because of this failure class. [S29; S30]

**Integration:** lift the forced-transfer rule, keep candidate-scoped fresh evidence, and specify how post-transfer content is verified before advancing agreement. If the hashless path is too expensive, **defer the unverified mutation or agreement advance**, not the proof while claiming completion.

This is consequential: a falsely advanced A can make the next pass classify the still-old cloud file as a legitimate cloud change and download it over the intended local progress.

### 2.3 Lifecycle exclusion and recovery are not complete in three plans—and have one important flaw in the fourth

`claude-revised_plan-r3.md` supplies the best lifecycle contract:

- exclude save-tree mutation throughout a game session;
- preserve the exclusion if ES dies before the emulator;
- upload sealed copies rather than live emulator files;
- recover incomplete local installation before another launch.

That should be lifted.

`gemini-revised_plan-r3.md`’s lock sequence protects a local hash read, then releases the snapshot lock before network work. It does not specify the session’s lock ownership, survival through ES death, or reacquisition for installation.

`kimi-revised_plan-r3.md` correctly identifies the gate but still relies in places on re-hashing immediately before uploading a live file. A writer can change it immediately afterward. It also describes an interrupted multi-member install as a “window” of two rename syscalls. **After a process kill, that window lasts until recovery**, not until the next syscall would have run.

`mistral-revised_plan-r3.md`’s move of boot work under ES scheduling is not a substitute for a mutual-exclusion contract covering direct script calls and emulator lifetime.

There is also a flaw in `claude-revised_plan-r3.md`’s otherwise useful phase model:

> `prepared` → discard stage, nothing happened

A crash can occur after a file was replaced but before the phase record advances. Recovery must inspect the actual member hashes even when the durable record still says `prepared`. A phase is a checkpoint, not proof that no later side effect occurred.

Two further limits belong in all four:

- **Local coherence recovery must work offline.** A device should not need cloud connectivity merely to repair a partially installed local unit and return to play.
- **A prior decision authorizes its recorded operands, not an arbitrary future remote head.** Recovery should not ask again just because a process restarted; it must reclassify if another version appeared meanwhile.

The source-visible filesystem primitives reinforce why this must be explicit: `copyToSlot()` ignores copy/rename results, and its destination derives from the source parent. [S38] ES also performs save-tree work before and after the emulator invocation. The gate must bracket those mutations, not just `process.run()`. [S38; S41]

**Settling fixture:** kill after each individual filesystem effect and before its corresponding checkpoint update; restart without network; verify a complete unit before launch and no publication over an unexpected remote head.

### 2.4 Whole-unit classification needs whole-unit publication and retention

All four now state the right disjoint-member rule. None should treat that statement as a complete wire format.

The signed schema contains entries for files; it does not contain a complete publication-level member map. [S03] A reader rule requiring “one manifest’s declared map” therefore needs an actual descriptor covering:

- required member paths and hashes;
- member additions and removals;
- optional thumbnail artifacts;
- the publication that makes the map coherent.

This descriptor must distinguish **publisher** from **producer**. A device may publish a unit containing unchanged members produced elsewhere without falsely stamping those members as its own.

`mistral-revised_plan-r3.md`’s example makes the problem concrete: it assigns a file SHA-256 and size to the directory key `dc/shared/savefiles/`. A directory has no single “stored file bytes” under D-CLOUD-030. Represent actual member files and a unit member map; do not silently redefine file-version identity.

The retention side needs the same completeness. Saving only the members that changed or conflicted cannot reconstruct the loser’s coherent past save set.

One useful correction is already explicit in `mistral-revised_plan-r3.md`:

> “A thumbnail anomaly is not a progress fork when the state bytes are identical.”

Lift this into any unit specification that currently includes PNG hashes indiscriminately in its progress-comparison map. Retain and verify the PNG as an associated artifact, but D-CLOUD-030 expressly excludes it from save-version identity. [S03, §1]

### 2.5 Hash identity does not establish move intent or a permanent deletion prohibition

Both `claude-revised_plan-r3.md` and `kimi-revised_plan-r3.md` sometimes compress move handling into:

> same hash elsewhere → move → re-key

That needs qualifications:

- Match within the correct game/core repository and save kind.
- Validate the **current** file, not merely an old manifest claim.
- Account for copies, multiple matching locations, and occupied destinations.
- Plan a renumber permutation as a set; do not rename one occupant over another while “following” hashes.

D-CLOUD-030 establishes content identity and verified duplicate compaction. It does **not** establish the general rule that the cloud’s path wins. [S06]

The retirement proposals also need one small but important adversarial sequence:

1. Delete H and publish its retirement.
2. Intentionally restore H from retained storage.
3. Encounter the old retirement again.

The bytes are still H. The restore is a **new publication of the same version**, not a new version. `kimi-revised_plan-r3.md`’s final description of restore as “a new version” conflicts with D-CLOUD-030. Hash equality alone cannot distinguish an old copy from an intentional republication.

This does not justify a deep ancestry graph. It requires explicit retirement applicability and consumption rules that do not turn a content hash into a permanent blacklist.

The lifetime claims also need honesty:

- `claude-revised_plan-r3.md`’s last-64 ring is not “sufficient” merely because an old record is harmless while present. Forgetting it can permit resurrection.
- `kimi-revised_plan-r3.md` states that limitation, but coupling tombstone expiry to the undo retention window conflates two different jobs.
- `mistral-revised_plan-r3.md` needs an actual peer-visible retirement channel. Copying payloads into a sibling is not, by itself, transporting deletion intent to other devices.

Keep explicit-delete records and verified compaction. Do not abandon deletion propagation because an absence is unexplained. On that unexplained case, I would lift the **hold and report** rule from `kimi-revised_plan-r3.md`, replacing automatic resurrection in `claude-revised_plan-r3.md`.

### 2.6 The pre-pass is not a permanent reservation

The pre-pass solves an important snapshot problem, but not all later changes.

All four need a precondition check at **COMPLETE**, covering:

- the local and cloud operands;
- the complete unit map;
- proposed destination slots;
- any relevant pending retirement.

`claude-revised_plan-r3.md`’s check that agreement has not changed since queuing is insufficient: agreement is local and can remain unchanged while the cloud changes.

Also correct the inherited IA contradiction rather than repeating it:

> **No conflict-resolution changes apply until COMPLETE. Completed non-conflicting transfers are not rolled back by canceling the walkthrough.**

That is consistent with the pre-pass and staging. “Nothing transfers” and “both sides exactly as before” without this qualification are not. [S02]

### 2.7 Two source-visible migration claims remain wrong

**`kimi-revised_plan-r3.md`: `defaultCoreDirectory` is not a dual scan.**

In the embedded implementation it selects a replacement directory for the relevant configuration; it does not add a second scan of both the flat and per-core locations. The repository then scans the selected directory non-recursively. [S39; S37]

Consequently, the #10 rehearsal must prove that both old and new locations remain discoverable. Merely supplying `defaultCoreDirectory` cannot establish that.

**`claude-revised_plan-r3.md`: downgrade is not shown to be non-destructive.**

The old scripts can still overwrite saves by recency or by unconditional copy, and can transport foreign manifest files through the broad savestates include. [S29; S30; S32; S35] “Old images ignore manifests” does not make their write behavior harmless.

D-CLOUD-029 remains binding for the current maintainer-only period. It is not a coexistence guarantee for old and new writers. The cutover must explicitly cover all active write entry points, including manual upload/download, hub save actions, Tools/direct scripts, and the future #37 path—not just the three most frequently discussed callers. [S13; S28]

One additional capture correction applies broadly: `getEmulator(true)` and `getCore(true)` resolve configuration, but `SaveState::setupSaveState()` can rewrite the launch command for a selected state. Capture must receive the **effective executed emulator/core**, frozen after those choices, rather than blindly re-query settings at exit. [S38; S42]

---

## 3. Remaining differences: liftable or architectural?

“Liftable” below includes replacing a conflicting rule where the rest of the design remains unchanged. It does not mean running two contradictory rules simultaneously.

| Difference | Classification | Direction of integration |
|---|---|---|
| Game-keyed retention, operation-keyed retention, or historical-path/hash retention | **Liftable layout** | Use the game-addressed discovery of `claude-revised_plan-r3.md`, decision-occurrence identity, and the path-preserving payloads of `kimi-revised_plan-r3.md`. No database is needed. |
| Retained metadata fields | **Liftable schema** | Combine explicit producer snapshots, complete member maps, winner/action, event order, completion state, and retained-relative artifact references. Do not copy the entire producer manifest. |
| Resolution timestamp versus capture timestamp | **Liftable field** | Lift the separate `resolved_at` field from `gemini-revised_plan-r3.md`; retain the sequence rule from `claude-revised_plan-r3.md`. Display time is not a winner-selection rule. |
| Count per game versus per unit; conflict copies versus routine preimages | **Liftable retention policy** | Define the bucket in player-data terms and protect complete units. Lift `kimi-revised_plan-r3.md`’s separation of routine superseded preimages if those are retained. Keep pending-operation exemptions everywhere. |
| `kind: container` versus `kind: save` plus `unit` | **Liftable representation** | Either can work. Prefer keeping save-kind semantics separate from unit/container identity; do not make the glyph taxonomy carry the whole grouping model. Record the chosen D-CLOUD-031 refinement explicitly. |
| Whether PNGs participate in a unit’s conflict identity | **Liftable correctness rule** | Lift the explicit thumbnail-anomaly rule from `mistral-revised_plan-r3.md`. PNG integrity remains checked independently. |
| Manifest-last publication versus one batched invocation | **Liftable ordering/optimization** | Start with explicit payload-before-manifest ordering and coherent-map validation. Only combine invocations after the actual ordering and verification mechanism is demonstrated. |
| Computing a native hash locally versus learning it from a remote listing | **Liftable verification mechanism** | These are complementary, not competing architectures. A fresh observation still needs a verified mapping to the sealed local bytes. |
| Foreign manifests inside or outside the save tree | **Liftable path/ownership rule** | Lift the outside-tree cache from `claude-revised_plan-r3.md`, particularly during shadow-mode coexistence with broad legacy copies. |
| ES-scheduled boot work versus a separately scheduled worker | **Liftable scheduling** | The shared lifecycle gate is the safety mechanism. ES scheduling may simplify presentation, but does not replace exclusion and need not be made a separate architecture. |
| Snapshot lock versus session-lifetime gate | **Liftable, load-bearing contract** | Lift the session-lifetime contract from `claude-revised_plan-r3.md`; verify child/process ownership on the real launcher. |
| Four apply phases versus a frozen-plan journal | **Liftable recovery specification** | Use explicit phases, but inspect actual hashes at every recovery point. Add permanent retained-record completion; transient pending state can then be removed. |
| Hold versus resurrect unexplained absence | **Liftable policy replacement** | Use the hold-and-report behavior of `kimi-revised_plan-r3.md`. All plans already have the state needed; deletion propagation remains available for recorded intent. |
| Move receipts versus hash inference for renumber/compaction | **Liftable operation rule** | Use scoped, verified inference where unambiguous; retain explicit-delete intent. Ambiguity must not authorize removal. |
| Last-64 retirement ring versus per-unit expiry | **Liftable control-state policy** | Separate correctness-state lifetime from retained-copy count. State the late-device behavior rather than promising convergence from an arbitrary count. |
| `resolves` shortcut in `claude-revised_plan-r3.md` versus deferral elsewhere | **Liftable scope reduction** | Leave it out of the version-one minimum. The local retained-record and pending-apply designs do not depend on it. |
| Strict five-second changed path versus measured slower path | **Liftable operating policy** | Preserve the zero-work fast path and fresh evidence. Use deferral rather than weaker equality claims; any changed-path budget revision must explicitly refine D-CLOUD-028. |
| Literal-IP versus hostname LAN routing | **Liftable liveness rule** | A hostname can resolve through local DNS or hosts configuration without a default route. Lift destination-route evaluation; do not add ICMP or claim all such hostnames are unreachable. |
| #10’s delivery order | **No substantive current disagreement** | The current plans retain the feature and require a launch-behavior rehearsal. Do not continue arguing against an earlier deferral that is no longer proposed. |
| Deterministic auto KEEP BOTH, retention on, no V1 undo control | **No current disagreement** | Keep the shared simple flow. |
| Mutable canonical paths protected by preflight/retention versus mandatory protected publication after a failed race test | **Conditional architectural fork** | See below. |

### The one genuine conditional fork

`gemini-revised_plan-r3.md` says that failure of the `--backup-dir` race fixture requires protected publication before multi-device shipping. `claude-revised_plan-r3.md` and `kimi-revised_plan-r3.md` reject that protocol in version one.

If “protected publication” means immutable version objects and a publication-pointer or comparable commit protocol, it changes the remote representation, reader, agreement semantics, and migration. That is architectural. It is not another retention field.

But **the experiment has not earned that fork yet**. The source shows `--backup-dir` in the shipped sync branch, not the required copy/race guarantees. [S29] Run the experiment and state the promised guarantee. If a backend fails it, the maintainer must choose between a narrower operation/support contract and the stronger publication architecture.

Do not silently build the stronger architecture because a concurrency edge case is imaginable. Equally, do not describe best-effort recoverability as atomic preservation.

**Between `claude-revised_plan-r3.md` and `kimi-revised_plan-r3.md`, nothing architectural remains.** Their remaining provisions can be integrated without replacing the reconciler, transport model, or storage ownership model. The other two also use that same foundation; specification omissions are not alternative architectures.

---

## 4. What each plan contributes that should not be lost

| Plan | Distinct contribution worth lifting | Where it should go |
|---|---|---|
| `claude-revised_plan-r3.md` | **A game session’s exclusion survives ES dying while the emulator continues, and uploads use sealed stage copies.** It also provides the clearest game-addressed retention lookup. | Into the lifecycle sections of the other three and the shared retained-store contract. |
| `kimi-revised_plan-r3.md` | **In-memory slot reservations:** two KEEP BOTH decisions for one game in one walkthrough must allocate different slots before either is installed. Its sync-root-relative retained payload layout is also materially safer than basename storage. | Into the adapter and retention sections of `claude-revised_plan-r3.md`, and the abbreviated apply specifications of the other two. |
| `gemini-revised_plan-r3.md` | **A distinct structured `resolved_at` field**, separate from producer capture time, and an explicit budget fallback that leaves unverifiable uploads pending. | Into retained event records and the changed-path budget contract. Keep an independent sequence for reliable order. |
| `mistral-revised_plan-r3.md` | **Explicitly separating thumbnail anomalies from progress forks.** Its distinct suggestion to cap retirement work per run is useful as scheduling, provided remaining work stays pending rather than being dropped. | Into unit classification; optionally into full-pass work scheduling. A work cap must never become a correctness-record eviction rule. |

These are integration contributions, not claims that the ideas are proven merely because another plan contains them.

### What should not be built

- **An undo control in version one.** None of the current plans requires it; keep it that way.
- Deep ancestry or cross-device resolution machinery as a prerequisite for the local one-step recovery use case. In particular, the optional `resolves` shortcut in `claude-revised_plan-r3.md` changes classification authority and deserves separate justification, not “it is only one field.”
- A second production agreement authority hidden inside “bisync as bulk transport.” Bisync does not stop having its own listings and behavior because the wrapper calls that state unused. Direct rclone batches already match the proposed reconciler. Let a measured benefit earn anything more. [S02; S16; S23]
- A single-spawn target that weakens verification, an extra local hash spawn that is justified as replacing future remote observations, or a timer that permits an unread overwrite.
- A filename/hash-only retention index with no decision occurrence.
- Blanket cache invalidation of retained data or pending operands.
- A generic binary-save merger, semantic progress heuristic, arbitrary slot cap, or daemon.
- A claim that store growth is necessarily trivial because the corpus’s sample states are tens of kilobytes. Measure representative large states and containers; a count is not a byte-space guarantee. [S03; S21]
- A “standalone specification” whose essential lock, publication, recovery, or gate behavior exists only in references to an unembedded earlier plan. This is particularly a completion task for `mistral-revised_plan-r3.md`.

---

## 5. What I would build from, and what must change first

### Editing baseline

Use **`claude-revised_plan-r3.md`**, with this integration package:

1. **Retention:** keep its game-addressed event records; use `kimi-revised_plan-r3.md`’s path-preserving payload layout; add explicit unit membership, retained-relative artifact locations, producer snapshots, completion, and `resolved_at`.
2. **Verification:** remove the circular native-hash mapping and the exit-zero degradation. State the actual artifact proof before advancing agreement.
3. **Capture and retries:** separate capture from publication; preserve unpublished dirty state across network skips and failures; freeze the actual executed emulator/core.
4. **Adapter:** add `kimi-revised_plan-r3.md`’s in-memory reservations; preserve PNGs without making PNG-only differences progress conflicts.
5. **Recovery:** keep explicit phases, but replace “prepared means nothing happened” with inspection and deterministic local repair. Revalidate remote preconditions before retrying publication.
6. **Deletion:** retain explicit-delete propagation; hold unexplained absences; define retirement applicability and expiry without permanent hash blacklisting.
7. **Scope:** omit optional cross-device resolution shortcuts and bisync production integration until they earn their cost.
8. **Migration:** remove the downgrade-safety claim, correct the dual-scan assumption, and inventory every save writer at the script/backend boundary.

This is not a recommendation to implement every paragraph of the longest plan. It is a recommendation to start with the document that best separates the lifecycle and persistent-state responsibilities, then replace its incorrect rules.

### Evidence in priority order

1. **Repair the test instrument, on disposable GENERIC_X64 storage.**  
   The embedded round-trip harness overwrites `rclone.conf` before asserting the chosen remote and does not restore it. Its archive expectations disagree with the dated uploader/restorer; its content fixture also needs reconciliation with D-CLOUD-019’s membership rule. These are source-visible problems, not hypothetical test polish. [S36; S29; S30; S06]  
   Run WebDAV and MinIO. Do not point the current harness at the maintainer’s configured handheld.

2. **Prove the primary offline fork and retry path.**  
   Agree H0; let the other device publish HB; edit HA offline; exit. No boot, exit, menu, hub, or direct save-script path may overwrite either candidate before a decision. Then test a failed upload followed by an unchanged exit. Include an equal-size/equal-mtime mutation.

3. **Prove the retention reader before any restore UI exists.**  
   Create retained decisions for several games, a complete multi-file unit, a repeated hash, and a renumbered state. Overwrite producer manifests, rotate the audit log, remove completed pending records, and set the clock backward. A test-only reader must still produce the required per-game list and open the right retained bytes and PNG. This is a schema test, not a version-one user control.

4. **Prove local exclusion and recovery on H700.**  
   Exercise boot overlap, launch-time `.auto` handling, ES death with the emulator alive, and interruption between actual file effects and checkpoint updates. Recovery must restore local coherence before play without requiring network.

5. **Price the real changed path.**  
   Record process starts, remote requests, transferred bytes, and elapsed time on the H700 pair, including pending-work retries and hashless verification. Respect D-QA-002: the QA WebDAV remains loopback-bound; hardware testing needs an explicitly safe access arrangement, not an undocumented LAN rebind. [S06; S09]

6. **Prove ordinary deletion/renumber convergence and same-byte republication.**  
   Delete a numbered state, renumber, sync repeatedly, and verify that remaining versions survive exactly once. Restore previously retired identical bytes and verify that an old retirement cannot silently remove the restored choice.

7. **Run the presentation and namespace hardware gates.**  
   #19’s same-chipset control precedes cross-chipset work; loud/silent failure is measured separately. #10 must preserve launch behavior and discover both layouts. Test recognition at 480×320, not just whether the layout fits. [S08; S20; S38; S39]

The `--backup-dir` race experiment belongs alongside transport validation, but it should not displace the primary offline-fork, retention-reader, and retry proofs.

### What changed my assessment

My own earlier revision is not embedded, so I cannot honestly supply a precise version-to-version account of it. The substantive changes in judgment from this comparison are:

- `claude-revised_plan-r3.md` makes the case for **game-addressed retention discovery** particularly clearly.
- `kimi-revised_plan-r3.md` shows why **path-preserving payloads and in-memory slot reservations** should be integrated rather than treated as rival designs.
- The store traces demonstrate that **one-step reversibility requires a durable decision record, not deep lineage**.
- Most remaining disagreement is implementation integration. The team should spend less time choosing a plan and more time making the shared contracts falsifiable.

---

## 6. Corpus gaps that affect this review

The following were not embedded as inspectable implementations or results:

- The full savestate-manager delete action, launcher/process implementation, and filesystem copy/rename utilities.
- The complete ES startup/scheduling path and its interaction with the autostart worker.
- RetroArch configuration generation and the complete runtime configuration used for #10.
- rclone 1.75.0 source or authoritative behavior documentation for the proposed ordering, exact-file filtering, native-hash calculation, and copy/backup-directory race guarantees.
- The content scripts, backup implementation, defaults files, and QA backend implementation needed to finish the cross-tier and harness audit.
- Current issue bodies containing all reported amended acceptance criteria; the embedded issue files are principally comment exports.
- Executed full round-trip, conflict, retention-reader, interrupted-apply, and two-writer transport results.

The corpus does contain reported measurements and fixture observations. Those are useful evidence, but they are not substitutes for the missing runs above. I have not fabricated missing file paths, hashes, or test outcomes.

---

## `corpus.provenance.json`

```json
{
  "artifact": "gpt_peer_review-r4.md",
  "role": "council member, round-4 peer review; not a revised plan or vote",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "SHA-256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 identify the same-index pair in source_file_paths and source_file_hashes",
  "reviewed_plans": [
    {
      "filename": "claude-revised_plan-r3.md",
      "delivery": "injected text",
      "sha256_provided": null
    },
    {
      "filename": "gemini-revised_plan-r3.md",
      "delivery": "injected text",
      "sha256_provided": null
    },
    {
      "filename": "kimi-revised_plan-r3.md",
      "delivery": "injected text",
      "sha256_provided": null
    },
    {
      "filename": "mistral-revised_plan-r3.md",
      "delivery": "injected text",
      "sha256_provided": null
    }
  ],
  "maintainer_amendments": {
    "source": "orchestrator brief in this prompt",
    "separate_declared_path": null,
    "sha256_provided": null,
    "treated_as_authoritative": true
  },
  "peer_material_use": "The four current plans were evaluated against the embedded corpus. Their accounts of previous rounds were not treated as independent evidence, and no conclusions about councils or models were drawn from them.",
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
      "material": "Full savestate-manager delete action, launcher/process implementation, and filesystem copy/rename utilities",
      "reason": "Needed to verify the delete hook, effective launch provenance, lock inheritance, filesystem errors, and timestamp behavior.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Complete ES startup scheduling, RetroArch configuration generation, and runtime configuration for the namespace rehearsal",
      "reason": "Needed to establish boot handoff, save-directory agreement, and preservation of launch behavior.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 source or authoritative documentation for proposed filtering, ordering, native hashing, and copy/backup-directory race semantics",
      "reason": "The transport and verification guarantees are not established by the embedded callers.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Content scripts, backup implementation, defaults files, and QA backend implementation",
      "reason": "Required to complete cross-tier, upgrade, and test-harness verification.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current issue bodies with amended acceptance criteria",
      "reason": "Embedded issue exports principally contain comments; body edits reported elsewhere cannot be independently inspected.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Executed full round-trip, conflict, retention-reader, interrupted-apply, and two-writer transport results",
      "reason": "No supplied result establishes that the revised mechanisms pass these gates.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "This member's own previous revised plan",
      "reason": "Not supplied; no precise claim about a change from that revision has been fabricated.",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, contents, or execution results have been fabricated."
}
```

=== END gpt_peer_review-r4.md ===

=== START mistral_peer_review-r4.md ===

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

=== END mistral_peer_review-r4.md ===
