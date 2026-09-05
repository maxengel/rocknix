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

=== START kimi_peer_review-r4.md ===

# Round 4 peer review — `kimi_peer_review-r4.md`

**Posture.** I am the fifth member; my own revised approach is not among the injected artifacts, and per the brief I am not revising it here. The four injected plans — `claude-revised_plan-r3.md`, `gemini-revised_plan-r3.md`, `gpt-revised_plan-r3.md`, `mistral-revised_plan-r3.md` — are judged against the embedded corpus (cited as `[Snn]`, mapping to the provenance block at the end) and against the maintainer's two amendments, which I treat as authoritative. I re-traced every load-bearing claim I rely on against the embedded sources rather than accepting any plan's assurance, including my own prior positions — two of which do not survive this round (§10).

---

## 1. Question one: walk the restore tool through each plan's retention store

The reader's question, verbatim: *"show me the retained past versions of **this game**, newest first, with a thumbnail, the producing device, and which side won."* I trace each store literally.

### 1.1 `claude-revised_plan-r3.md` — survives the trace

**Store:** `/storage/.cache/cloud_sync/retained/<system>/<unit-key>/<device-id>-<seq>/record.json` + retained member files (PNG included), `unit-key` = ROM filename made path-safe, `seq` = persisted per-device monotonic counter (§3.9.1).

**The walk:**

1. From the game, derive `<system>` and `<unit-key>` (ROM filename, path-safe; container id for a VMU/memcard). Open that one directory. It contains exactly this game's retained resolutions and nothing else's — no filtering, no recursive scan.
2. **Newest first:** sort directory names by `<seq>` descending. The counter is monotonic and clock-free — correct on a device that booted without a network, which is precisely the case `clock_synced` exists for (`docs/save-manifest-schema.md` §6 `[S03]`). Because the store is local and only this device writes it, all records share the device's id prefix and the order is total.
3. **Per record, read one small `record.json`:** system; rom/container; `unit` and the complete member list with slot, sha256, size, screenshot; provenance of *both* operands (device id, label, model, emulator, core, core_build, captured_at, clock_synced, `unknown` preserved); which operand was cloud and which device; the action; the winning sha256 and its resulting live path/slot; the retained side and the original path; `resolution_id`; `phase`.
4. **Thumbnail:** the PNG is a member file in the same directory, named in the member list. Open it directly. For an in-game save there is none and the record says so — the glyph rule (`docs/conflict-wizard-ia.md` `[S02]`) applies.
5. **Producing device:** the discarded operand's inline provenance. **Which side won:** action + winning sha256 + retained side.

**What it scans that it does not need:** nothing. One directory, one JSON per record, named PNGs. It consults no manifest, no audit log, no pending record — and the plan's Gate 8 is a test-only reader run *after* the producer's manifest entry has been overwritten, slots renumbered, the audit log rotated (rotation at 1 MiB is D-CLOUD-027 `[S06]`), and the pending record removed. That is the amendment's acceptance test, pre-built.

**Field presence at discard:** every field is in hand at apply time — the wizard rendered both panels from the two manifests, so both operands' provenance is held, and the decision values are the wizard's own. Verified against the schema's field list `[S03 §6]`: each `record.json` field maps to a manifest field or a decision value.

**Residual gaps (minor):** (a) `unit-key` collides for same-basename ROMs in different directories — but that collision is inherited from the flat `{{system}}` savestate layout itself (`es/SaveStateConfigFile.cpp` `[S39]` default), not created by the store; `gpt-revised_plan-r3.md`'s content locator is the fix and is liftable. (b) The store is local: a choice resolved on device A is not restorable on device B. The maintainer's primary case is same-device, one step back, so this is acceptable — but the plan should say it plainly, and it does not quite. (c) The `.cache` home needs the non-disposable sentence; the plan has it, with the D-CLOUD-027 audit-log precedent as support.

### 1.2 `gpt-revised_plan-r3.md` — survives the trace; strongest contract, least concrete layout

**Store:** proposed `/storage/.local/share/rocknix/cloud-saves/` with `discarded/`, `preimages/`, `pending/` areas; record-ID-keyed retained sets plus "a small ordered index" pruned by local commit order (§8.2–8.4).

**The walk:**

1. Read the ordered index; filter by the picker grouping (system + supplied ROM filename + content locator, or unit ID / container label). **Newest first** = reverse commit order — no clock anywhere.
2. Per event, read one record: record identity; picker grouping; original placement (relative paths, core repository, slot or `auto`, destination mapping); payload (every member's sha256, size, stored location); **producer snapshot copied inline at retention time** (device id/label/model/family, emulator/core/build, capture times, clock confidence, explicit unknowns); preview (retained PNG location and hash, or explicit absence); decision (action, which side won, winner map/hashes, winner producer where known); retention reason; **completion (prepared vs finalized)**.
3. Thumbnail: the preview field points at the retained PNG. Producing device: the inline snapshot. Which side won: the decision field — the richest of the four, since it also carries the winner's producer where known.

**What it scans that it does not need:** the index (small by design) and the matching records. §8.3's "does not depend on" list — current manifest, rotating audit log, surviving apply-plan, filename timestamp — is the amendment's requirement stated as a contract, and §8.5 commits V1 to testing the future-reader projection.

**Field presence at discard:** explicitly "copied inline at retention time." This is the only plan that says the producer snapshot must be *copied*, not referenced — which matters because the producer's manifest entry is overwritten on its next capture and the audit log rotates.

**Residual gaps:** (a) the on-disk layout below the three areas is unspecified — `claude-revised_plan-r3.md`'s directory shape is the concrete complement and the two compose without friction; (b) if the ordered index is lost and record IDs are non-sequential, commit order is unrecoverable — fixed by adopting claude's seq-in-the-name, which makes the filesystem itself the index; (c) the new path is invented. The embedded evidence is kind to it — `backuptool` archives `/storage/.config/*` (`docs/conflict-wizard-ia.md` "Where state lives" `[S02]`; `docs/save-manifest-alignment-review.md` `[S04]`), so `.local/share` is outside backups — but the plan is right to make upgrade-survival an acceptance test rather than a claim.

### 1.3 `gemini-revised_plan-r3.md` — fails the trace on ordering and completion

**Store:** `/storage/.cache/cloud_sync/discarded/<path>/` holding `<sha256>`, `<sha256>.png`, and `<sha256>.json` (rom, system, kind, slot, producer{device_id, device_label, core, core_build, captured_at}, winner_side, winner_sha256, reason, resolved_at, run_id) (§2.1).

**The walk:**

1. `<path>` is the discarded *file's* path. "This game's" saves have occupied `savestates/<system>/<romfilename>.state`, `.state1…N`, `.state.auto`, and `<system>/<rom>.srm` — and after a renumber, several of those. The reader must either glob every historical per-path directory for the game, or — safely — scan `discarded/` recursively and filter sidecars by `rom`+`system`: **it reads the whole store to answer for one game.** The plan never traces this.
2. **Newest first:** the only ordering fields are `resolved_at` — a wall clock, unreliable on a device that boots without a network (`clock_synced` exists for exactly this reason `[S03 §6]`) — and `run_id`, shown as a `<uuid>`, which is unordered. **The amendment's "newest first" is not derivable as written.** This is the timestamp-keyed failure the amendment names, one level down: the key is path+hash, but the *order* is timestamp-only.
3. Thumbnail: `<sha256>.png` beside the bytes — present. Producing device: `producer.device_id`/`device_label` — present (no model/family, no `clock_synced`). Which side won: `winner_side` + `winner_sha256` — present; the winner's producer is not recorded (not strictly required by the question).
4. **Multi-member units:** two members land as two per-path records linked only by a shared `run_id`. The plan never says the reader groups by `run_id`, and its own "3 per save unit" pruning on a per-path layout requires the same untraced grouping — so one member's record can be pruned while its sibling survives, leaving half a memcard.
5. **No completion marker.** The plan exempts "incomplete transaction preimages" from pruning (§2.2), but the record has no prepared/finalized field; that distinction lives in the apply journal (§3.5), whose post-completion retention the plan does not specify. The pruner cannot tell a finalized record from an interrupted one from the store alone — it would have to consult an apply record the plan may have removed, which is exactly the dependency the amendment forbids.

**Verdict:** the four fields the amendment enumerates (game, slot, device, side won) are present, but the store fails on ordering, on the completion marker, and on per-path fragmentation. All three are liftable fixes from §1.1/§1.2 — the sidecar's other fields are sound.

### 1.4 `mistral-revised_plan-r3.md` — fails the trace on ordering; shallowest store

**Store:** `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` + `<sha256>.json` sidecar carrying the copy's manifest entry verbatim, `reason`, `winner{side, path, sha256, device}`, the run/transaction id, and the wizard's decision text (§6.1).

**The walk:**

1. Same per-path fragmentation as gemini: the reader scans the whole `discarded/` tree filtering by the sidecar's `rom`+`system`.
2. **Newest first:** the sidecar carries `captured_at`/`captured_local` — the copy's *production* time — and a run/transaction id with no stated ordering property. There is **no resolution-time field at all** and no sequence. Neither "most recently discarded" nor any clock-free order is derivable. Fail as written — the weakest ordering story of the four.
3. Thumbnail: "PNG travels with the state" (`[S03 §4]`) — present by implication; the sidecar records the screenshot path and hash.
4. Producing device: `origin`/device inside the verbatim manifest entry — present **only when the copy has a manifest entry**. For an `unknown`-provenance discard — the entire pre-capture population (`[S03 §4]`) — there is no entry to copy verbatim, and the plan does not say what the sidecar then holds. `claude-revised_plan-r3.md` explicitly preserves `unknown`; this plan is silent.
5. Which side won: `winner{side, path, sha256, device}` — present, and richer than gemini's (includes the winner's device).
6. Multi-member grouping and the completion marker: same two defects as gemini — the stated exemptions (§6.1) have no field to hang on.

**Verdict:** fails the trace on ordering, keying, the unknown-provenance case, and the completion marker. Its own §6.1 already concedes the home is unsettled ("decide it alongside the sidecar shape"). Needs the same lifts as gemini plus an ordering field.

### 1.5 The store that survives — integrated answer

No plan's store is wrong in philosophy; two are right in fact. The store a builder should write is: **`claude-revised_plan-r3.md`'s layout and seq naming** (`retained/<system>/<unit-key>/<device-id>-<seq>/`, the directory name as the clock-free index) **carrying `gpt-revised_plan-r3.md` §8.3's field set** (a superset: inline producer snapshot, completion state, retention reason, content locator) **with gpt's bucket model for pruning** (auto its own bucket; numbered states a game/core collection bucket so renumbering does not fragment retention; one multi-slot apply = one event) **and the non-disposable sentence** wherever it lives. Home: `.cache/cloud_sync/retained/` with the explicit exemption — the audit-log precedent (D-CLOUD-027) already puts irreplaceable data there — unless someone actually runs the `.local/share` upgrade-survival test, in which case gpt's path is the cleaner convention. Acceptance: claude's Gate-8 / gpt's §8.5 reader-projection test, run after manifest overwrite, renumber, log rotation, and plan removal.

---

## 2. Question two: liftable or architectural

I was strict, per the brief. **Conclusion first: no architectural differences remain among the four plans.** After the round-3 concessions they are one architecture in four dialects — same classifier, same write-path ownership, same lifecycle gate, same checked adapter, same retention semantics, same deletion mechanism. Every remaining difference is a field, a path, a keying, an ordering, or a wording that moves between plans without disturbing anything else. The two nearest candidates for "architectural" are examined at the end and both dissolve.

### 2.1 Liftable differences, with the direction each should move

| # | Difference | Direction it should move |
|---|---|---|
| 1 | Store keying: per-unit dir + seq (claude) vs record-id + index (gpt) vs per-path (gemini, mistral) | claude's layout into gemini and mistral; gpt's index becomes the seq-in-name |
| 2 | Store ordering: seq / commit order (claude, gpt) vs `resolved_at` clock (gemini) vs nothing (mistral) | monotonic sequence, never a clock — into gemini, mistral |
| 3 | Completion marker: `phase` (claude), prepared/finalized (gpt) vs none (gemini, mistral) | into gemini, mistral — their own pruning exemptions are unenforceable without it |
| 4 | Record field set | gpt §8.3 is the superset; claude's `record.json` is the near-equivalent; lift gpt's inline-producer-snapshot wording into all |
| 5 | Pruning granularity: per unit-key (claude), per "save unit" (gemini, mistral) vs logical buckets (gpt) | gpt's bucket model into all — renumbering must not fragment retention, and one multi-slot apply is one event |
| 6 | Store home: `.cache` (claude, gemini, mistral) vs `.local/share` (gpt) | either, plus the non-disposable sentence; default `.cache` + sentence (D-CLOUD-027 precedent) unless the `.local/share` survival test is actually run |
| 7 | Container spelling: `unit` field + `rom: null` (claude), unit-level distinction (gpt) vs `kind: "container"` (mistral, adopted by gemini) | claude/gpt — see §5.3 for why mistral's row is incoherent |
| 8 | Manifest publication: manifest-last as load-bearing (claude L4; mistral keeps) vs "a manifest is not a transaction commit" (gpt) | gpt's framing; claude's ordering survives as a measurement-gated option (its own O1 already half-concedes) |
| 9 | `resolves` receipts: kept as O6 (claude) vs removed (gpt) | drop for V1 — gpt's trace (§5.4) shows the plain classifier already downloads a later informed choice, because agreement advances at publication; the amendment's "receipt machinery deeper than one step back is not the primary case" lands on claude's side |
| 10 | Spawn A (local `hashsum` to fill `remote_hash`): dropped (claude) vs kept (mistral §4.3) vs "optimization, never prerequisite" (gpt) | drop — mistral's claimed benefit ("confirm C = A without a listing") is unsound: `remote_hash` is already recorded at upload `[S03 §6]`, and a local hash of what *we* uploaded cannot reveal whether the cloud changed since (gpt is exactly right) |
| 11 | LAN reachability: route-table lookup (claude, gpt, gemini-r3) vs mistral's §1.5 adopting it while §10 lists "a probe replacing `ip route`" as not-to-build | route-table, no ICMP; mistral's §10 attacks the ping probe gemini-r3 has itself dropped — resolve to the converged position and delete the stale bullet |
| 12 | Exit-path deferral wording: "leave that unit pending rather than overwrite an unread head" (gpt) vs "defer verification… leaving the exit push as a fast-path upload only" (mistral §4.3) | gpt's sentence — mistral's can be read as write-then-verify, which every plan including mistral's own §4.3 forbids; fix the wording |
| 13 | Unexplained cloud objects: two full passes then legacy-download (claude §3.3.3) vs immediate one-way when "no prior presence contradicts" (gpt §5.1) | claude's two-pass rule for multi-member units — gpt's immediate transfer can install a half-published memcard inside the payload-before-manifest window; for single files the rules coincide |
| 14 | Capture gating: gpt §3.3 requires capture even when exit sync is disabled/offline/lock-held; claude places capture "between the refresh and the sync" without saying it escapes the `cloudsaves.gameexit` conditional in `es/FileData.cpp.launchGame-excerpt-l740-850.cpp` `[S41]` | gpt's — otherwise every player with the toggle off accrues no provenance |
| 15 | Launch context: exit-time `getCore(true)` (claude) vs context saved at command construction (gpt §3.3) | gpt's — `SaveState::setupSaveState` rewrites `-emulator`/`-core` when a state's config is not the active one and `racommands` is false `[S38]`; that condition is exactly the #10 world |
| 16 | Owner-vs-producer manifest semantics with inline per-entry producer (gpt §4.2) vs nothing (all others) | gpt's, as an additive optional field — see §5.2; this is the single most important lift in this round |
| 17 | Merge adapter contract: full (claude §3.8, gpt §7.4, mistral §8.2) vs gemini §3.5, which handles −99 but says the primitives "are used" without addressing `copyToSlot`'s unconditional `true` or the parent-derived destination `[S38]` | the adapter contract into gemini |
| 18 | Kid/kiosk pending behavior (claude §3.7.7, gpt §7.2) vs silence (gemini, mistral) | into gemini, mistral — the full-UI block collapses `[S13]` and queued conflicts must not silently resolve |
| 19 | Run-id result file (claude §3.9.3, gpt §9.1) vs lighter treatment | either into gemini, mistral — rclone's exit 3/4 collide with the scripts' SKIPPED meanings as `ThreadedCloudSync` renders them `[S40]` |
| 20 | Retirement transport: own-manifest `retired` ring (claude) vs unspecified (gemini, mistral) vs a distinct record type (gpt) | claude's transport (the own manifest is what every device already reads) + gpt's bound rule (a control-state limit stops mutation; it never silently drops intent) |
| 21 | "A retention sweep must never evict the only copy of an unreviewed head" — gemini's sentence | into all four verbatim |
| 22 | Round-trip harness repair: gpt §10.3's itemized defects vs claude's generic Gate 0 | gpt's list into claude's gate — verified in §5.1 |
| 23 | Auto-conflict frequency: "every session" (mistral §2.4, restating the schema) vs the correction that numbered-slot launches restore `.auto` from `.bak` at exit `[S38]` (claude §5, gpt §10.2) | the correction into mistral; the resume-point presentation stands regardless |

### 2.2 The two nearest-architectural candidates, and why they dissolve

**Manifest-last vs manifest-with-payload.** `claude-revised_plan-r3.md` lists manifest-last as load-bearing (L4: "the price of a commit point"); `gpt-revised_plan-r3.md` §6.3 calls the commit point illusory. Gpt is right on the mechanism: rclone transfers are per-file, no backend offers a multi-object commit, and ordering only selects *which* transient mismatch a reader sees (manifest-without-payload or payload-without-manifest). Both plans already require readers to treat either mismatch as pending/torn (claude §3.3.3; gpt §4.3, §6.3) — the member-map completeness guard is what actually protects readers, and both have it. The residual difference is one spawn's price on the changed-exit path, which Gate 4 measures. A pricing question is not an architecture.

**`resolves` vs no receipts.** One optional field. Both systems are coherent with or without it; the main case it serves is already served by the classifier (gpt's §5.4 trace: A's agreement advanced when A published its resolution, so B's later choice arrives as an ordinary "cloud changed" download). The residual case — a *fresh* device holding the loser of someone else's resolution — asks once, conservatively, which the cardinal rule (`issues/issue-11.md` `[S17]`) is content with. Drop it; if the census later shows the case is common, the field is additive and can return.

**Stated plainly:** between any two of these four plans, nothing remains where taking both is incoherent. A builder integrating them never has to choose a camp; they have to choose spellings.

---

## 3. Where all four agree without the corpus settling it

These are unanimous and unsettled — the orchestrator should not mistake four-way agreement for evidence:

1. **Bisync demoted from detector to candidate transport.** The corpus still says bisync detects (`docs/conflict-wizard-ia.md` "Detection" `[S02]`; the futro's #22 ACs `[S05]`; `issues/issue-22.md` `[S23]`). No register row binds it, so no row needs reopening — but the IA and #22's body need the amendment, and the maintainer should see the recommendation explicitly, not discover it.
2. **Queue-and-badge wizard trigger.** IA rev 4 says "a sync that reports conflicts opens the wizard" `[S02]`; all four propose queue-and-badge for unattended passes. This is an IA rev 5 item and a maintainer call — it interacts with "get the user going as quickly as possible," which cuts *for* it.
3. **Retention count = 3.** A product proposal with no corpus basis; the amendment settles "on, and bounded," not the number.
4. **The changed-exit path fits a tolerable budget.** Every number is a prediction; `issues/issue-35.md` `[S27]` records that the round-trip suite has never executed, and no plan has run anything.
5. **`copy --backup-dir` preserves the replaced object.** The corpus shows `--backup-dir` only in `cloud_backup`'s `sync` branch `[S29]`; its behavior with `copy`, under interruption and race, is unmeasured. Gpt's §6.6 failure branch is the right posture if the fixture fails.
6. **Auto states are the commonest conflict.** The schema asserts it `[S03 §4]`; `es/SaveState.cpp` `[S38]` shows numbered-slot launches restore `.auto` from `.bak` at exit, so divergence requires auto-resume sessions. The census settles it; the design stands either way.
7. **ES's process spawn inherits the lifecycle fd across an ES death.** `ProcessStartInfo` is not embedded; `engineering-practices.md` `[S10]` records SIGABRT-and-restart behavior that makes this load-bearing.
8. **The unit table matches what standalone emulators actually write.** Nobody has inventoried PPSSPP/Flycast/Mupen/DuckStation output on a device (known unknown 8, `[S01]`).

---

## 4. Real disagreements, and what settles them

- **Manifest publication order** — settled by the Gate 2 `--order-by` probe and Gate 4 spawn pricing. Settles toward `gpt-revised_plan-r3.md`: no safety difference (the torn-unit guard covers both orders), price only.
- **Store home** — settled by an upgrade-survival test on a device with real prior state (`upgrade-and-install.md` `[S11]`). Either outcome is fine; the exemption sentence is the load-bearing part.
- **`resolves`** — settled by argument, not experiment: the classifier already handles the main case; the amendment discourages the machinery. Settles toward drop.
- **Two-pass legacy escalation vs immediate one-way** — settled by the torn-unit fixture (interrupt an upload after one member; assert no device installs the mixed set). Settles toward claude's wait, which costs nothing.
- **Auto-conflict frequency** — settled by the shadow census; design-neutral.

---

## 5. Load-bearing claims re-tested against the corpus

### 5.1 `gpt-revised_plan-r3.md` §10.3's harness repair list — verified, and it matters

I checked three of its claims against `tools/cloud-round-trip` `[S36]` and the scripts:

- **Archive-name expectations disagree with the uploader.** The harness plants `ROCKNIX-backup-qa.zip` and asserts `f"{device_id}/{ARCHIVE_NAME}" in listing`. `cloud_backup` `[S29]` prepends a date stamp to any archive not already dated, so the real key is `<device_id>/2026_…-ROCKNIX-backup-qa.zip`; the asserted substring is absent. The check fails spuriously. **Verified.**
- **Restore-name mismatch.** `cloud_restore` `[S30]` downloads "under the name it already has" (dated); the harness hashes the undated local path and concludes "the archive did not come back." **Verified.**
- **`rclone.conf` overwritten and never restored.** The harness writes the QA config before the remote assertion; cleanup restores `BACKUPPATH`/`RESTOREPATH`/`BACKUPFOLDER` and `BACKUPFILE_RESTORE_OPTION` but not `rclone.conf` — on a configured device that strands the player's remote. **Verified.**

This list is the difference between Gate 0 producing evidence and Gate 0 producing spurious FAILs chased for a day. It is `gpt-revised_plan-r3.md`'s most concrete unique contribution.

### 5.2 The schema's missing per-entry producer — a real gap only `gpt-revised_plan-r3.md` names

The signed schema carries `device.*` at the top level only; per-entry fields have no producer (`docs/save-manifest-schema.md` §6 `[S03]`), and its rule "nothing stamps a file it did not write" was written against stamping *pre-existing* files. The KEEP BOTH import case is new: device A installs B's state into a free slot and writes an entry for it — under the letter of the schema that entry reads as A-produced, because the manifest's device block is A's. The true producer survives only in the audit log, which rotates at 1 MiB (D-CLOUD-027 `[S06]`), and KEEP BOTH writes no retained record (nothing was discarded). So the merged copy's provenance **evaporates by design** in three of the four plans. Gpt's owner-vs-producer refinement (manifest owner ≠ entry producer; producer facts carried inline) closes it additively. I verified the schema text; the gap is real. Lift it.

### 5.3 `mistral-revised_plan-r3.md`'s container row is incoherent

Its §3.3 schema amendment adds an entry keyed `"dc/shared/savefiles/"` — a *directory* — with a single `"sha256"`. The schema keys entries by path, **one per file** (`[S03 §5]`), and a directory of VMU files has no single stored-bytes hash; the unit's identity is the member *map*, which is mistral's own §4.2 rule. The row contradicts the plan's own classifier. `claude-revised_plan-r3.md`'s `unit` field on per-file entries (and gpt's unit-level distinction) is the coherent spelling; mistral's own argument for `kind: "container"` is further weakened by claude's observation that the wizard's glyph logic keys on `kind` and a memcard is still an in-game save to the player. Fix before the inline-JSON form is lifted anywhere.

### 5.4 The ES primitive defects — verified from source

`getNextFreeSlot()` scans 99999→0 for a numbered slot; an auto-only repository (slot −1) yields −99 `[S37]`, and `setupSaveState` appends `-state_slot <nextSlot>` unconditionally on the auto-resume path `[S38]` — what RetroArch does with −99 is genuinely unknown, and claude's Gate-6 "launch from the auto state" is the right cheap experiment. `copyToSlot()` returns `true` regardless of what `renameFile`/`copyFile` did `[S38]`. `makeStateFilename(fullPath=true)` combines with the *source's* parent directory `[S38]`. `isEnabled()` requires `emulator == "retroarch"` `[S37]`. All four plans' adapter mandates are justified; gemini's is under-specified (§2.1 row 17).

### 5.5 The equality-bootstrap gap — verified, and all four now carry the fix

The signed schema records agreement only on **upload or download** (`[S03 §2]`); its conflict table has no equality row (`[S03 §3]`). A device that upgrades with local = cloud everywhere and no `agreed.json` gets "never agreed → ask" on the first save it touches — an upgrade that is not invisible (`upgrade-and-install.md` `[S11]`). All four plans now write agreement on verified equality. Converged and correct.

### 5.6 Smaller verifications

- `RCLONEOPTS` bypass: a non-empty user value replaces `cloud_backup`'s fallback option set `[S29]`; the shipped default does carry `--filter-from` `[S33]`, so the hazard is user-edited configs — claude's claim is accurate with that nuance.
- `.state.auto.bak` matches `+ /**/*.state*` `[S32]` and matches neither ES regex `[S39]` — synced and invisible; the exclusion is justified.
- `es_savestates.cfg` creation flips three behaviors: compiled `Default()` sets `racommands`/`incremental`/`autosave` true; the XML path hard-codes `racommands = false` and defaults the other two false `[S39]`. The #10 rehearsal gate is justified.
- The exit upload is `copy` with no `--update` `[S29]`; the boot pair is `copy --update` both ways `[S35]` — blindspot 28 `[S07]` stands; D-CLOUD-029 stands.

---

## 6. What the amendments cost each plan

- **`claude-revised_plan-r3.md`: ~zero.** It anticipated both amendments — retention on by default with a count, no undo control, one-step lineage (the eight-generation chain was already cut), a reader-designed store, and Gate 8 as the reader test. Residual friction: the O6 `resolves` receipt is exactly the "receipt machinery" the amendment's second clause cools on.
- **`gpt-revised_plan-r3.md`: ~zero.** Its r2 over-scope (a native recovery route in V1) is withdrawn in §1 with the design re-homed to the separate issue; §8 is the fullest store contract of the four.
- **`gemini-revised_plan-r3.md`: moderate.** Headline-compliant (§2: on by default, count, no undo, done-page sentence), but its store fails the amendment's *consequence* clause — the reader cannot order newest-first, cannot see completion, and must scan the whole tree per game. The cost is a re-keying and two fields, all liftable.
- **`mistral-revised_plan-r3.md`: moderate.** Headline-compliant (§5.2, §6.2), but its store has no resolution-time ordering at all, the same per-path fragmentation, an unknown-provenance hole, and no completion marker; plus three editing defects the amendments did not cause (the container row, the §1.5/§10 probe self-contradiction, the "fast-path upload" wording that can be read as write-then-verify).

---

## 7. What each plan uniquely has (liftable verbatim)

- **`claude-revised_plan-r3.md`:** the concrete store layout `retained/<system>/<unit-key>/<device-id>-<seq>/record.json` with its full field list; the Gate-8 readability protocol (overwrite the manifest, renumber, rotate the log, remove the plan, *then* read); the two-pass unknown→legacy escalation with the torn-unit narrowing; the churn-trace convergence gate (Gate 7); the 0-idle / 3–4-changed spawn accounting; the verdict-table retirement rows ("C only + `retired{path, sha256 = C}` at the cloud head → retire into `-replaced` by copy-verify-delete").
- **`gemini-revised_plan-r3.md`:** the sentence "a retention sweep must never evict the only copy of an unreviewed head"; the named `ip route get <ip>` mechanism (now universal); the most explicit concession ledger (§1) — a model of revision accountability; the compact settled-vs-agreed split (§4).
- **`gpt-revised_plan-r3.md`:** the §10.3 harness repair list (verified in §5.1); owner-vs-producer manifest semantics with the inline producer snapshot (§5.2); capture independent of the sync toggle (§3.3); launch-context-at-construction (§3.3, grounded in `[S38]`); the pruning bucket model (§8.4); manifest parser discipline (reject absolute paths, traversal, unsafe links — §4.5); sync-context binding that notes the five values are insufficient for an account relink (§4.4); "a manifest is not a transaction commit" (§6.3); the explicit no-reopens list (§9.4).
- **`mistral-revised_plan-r3.md`:** the §12 per-plan amendment-cost table (the right format for the orchestrator's integration step); the inline-JSON register-amendment form (with the container row corrected to the `unit`-field spelling); "a SQLite index — all four agree; say so on #20 and close the question" — a genuinely useful closure action; the consolidated not-to-build list (§10).

## 8. What should not be built

- `mistral-revised_plan-r3.md`'s spawn A — its claimed benefit is unsound (§2.1 row 10) and it costs a process start on the watched path.
- `mistral-revised_plan-r3.md`'s directory-keyed `kind: "container"` manifest row (§5.3).
- `gemini-revised_plan-r3.md`'s timestamp-ordered store as written.
- `claude-revised_plan-r3.md`'s `resolves` in V1, and its manifest-last spawn as a *load-bearing* requirement (demote to measured option).
- Any reading of `mistral-revised_plan-r3.md` §4.3 that uploads before verification — the degrade is deferral, never write-then-verify.
- A ping probe on the exit path (all four now agree; D-CLOUD-028's local-answer posture stands); a 99-slot product cap to mask the −99 defect; a second journal beside the frozen plan; SQLite anywhere near the sync tree (`[S32]` excludes it for a reason); a kid-mode resolver; a V1 undo control (the maintainer has settled this).

## 9. Which plan I would build from

**`gpt-revised_plan-r3.md` as the spine.** It is the most internally consistent, the most disciplined about what the corpus settles versus what the council merely agrees, and it carries three catches nobody else has — the harness defects, the owner/producer gap, and capture-independence — each of which I verified against the embedded sources rather than accepted. Its weakness is concreteness, which is exactly `claude-revised_plan-r3.md`'s strength.

Before building, lift into it: from `claude-revised_plan-r3.md` — the store layout and seq naming, the Gate-8 protocol, the two-pass escalation, the churn-trace gate, the spawn accounting, the −99 launch experiment, and the verdict-table retirement rows; from `mistral-revised_plan-r3.md` — the amendment-form and cost-table formats (formats only; fix the container row before lifting content); from `gemini-revised_plan-r3.md` — the unreviewed-head sentence. The merged store is §1.5. The register amendments should go up in `mistral-revised_plan-r3.md`'s inline form with `gpt-revised_plan-r3.md` §9.4's content and the explicit note that bisync's demotion and queue-and-badge are council recommendations needing the maintainer's word, not settled rows.

## 10. Where these plans changed my mind

My earlier revision held four positions this round's plans have corrected, and I concede each on the merits:

1. **The KEEP BOTH auto sub-choice.** All four refuse it; the maintainer's "get the user going as quickly as possible" settles it. The deterministic rule — device keeps `.state.auto`, the cloud copy takes a numbered slot, one sentence on the done page — is right.
2. **The per-path discard store.** My sidecar's fields were necessary but not sufficient: keyed by path it splits a game's history across slots, and it carried no clock-free ordering. `claude-revised_plan-r3.md`'s unit-key + seq and `gpt-revised_plan-r3.md`'s commit-order index are the correction; the amendment's reader requirement is what exposed the gap.
3. **The ops journal justified by `replaces` fidelity.** The maintainer's one-step clause and `mistral-revised_plan-r3.md`'s narrowing (deletion receipts and the pending-apply record are convergence machinery; ancestry fidelity is not) settle it. The journal shrinks to those two jobs.
4. **Cached manifest claims as overwrite permission on the exit path** — already conceded in my round-3 revision; the four r3 plans have now converged on the shape that replaces it (fresh candidate-scoped evidence, or defer the write), and `gpt-revised_plan-r3.md`'s sentence is the canonical statement: leave the unit pending rather than overwrite an unread head.

---

## `corpus.provenance.json`

```json
{
  "artifact": "kimi_peer_review-r4.md",
  "role": "council member, round-4 peer review of the four injected revised approaches",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "sha256 values copied verbatim from the per-source headers; verified at embed time by the Facilitator; not independently recomputed",
  "citation_mapping": "S01 through S42 map in order to the parallel source_file_paths and source_file_hashes arrays",
  "injected_plans": [
    "claude-revised_plan-r3.md",
    "gemini-revised_plan-r3.md",
    "gpt-revised_plan-r3.md",
    "mistral-revised_plan-r3.md"
  ],
  "injected_plan_hashes_provided": false,
  "own_prior_revisions_embedded": false,
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "applied_as_authoritative": true,
    "content": [
      "reversibility is first-class; the depth that matters is one step back; edge cases inform but do not drive; failing closed on unexplained absence is still expected",
      "V1 retains the discarded copy on by default, bounded by a count, ships no undo control; the restore tool is separate and reuses the compare-and-choose surface; the V1 store must be readable by that future tool"
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
    {"description": "kimi-revised_plan-r2.md, kimi-revised_plan-r3.md and kimi_peer_review-r3.md — my own prior artifacts, known here only through the four injected plans' references", "declared_path": null, "sha256": null},
    {"description": "GuiSaveState.cpp (delete hook for retirement records), SaveState.h / SaveStateRepository.h (default arguments), Paths.cpp, setsettings.sh, ES ProcessStartInfo (fd inheritance)", "declared_path": null, "sha256": null},
    {"description": "rclone 1.75.0 documentation or source for --backup-dir with copy, lsjson --files-from, --order-by ordering guarantees", "declared_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md; current issue bodies with the futro's edited acceptance criteria; any executed test result — none exists in the corpus", "declared_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, contents or execution results have been fabricated."
}
```

=== END kimi_peer_review-r4.md ===

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
