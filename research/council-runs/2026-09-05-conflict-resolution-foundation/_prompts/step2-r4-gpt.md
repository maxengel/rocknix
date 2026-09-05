# Council — round 4, peer review of the revised approaches

You are one of five council members. Each of you has produced a revised
approach to the foundation for cloud-save conflict resolution in ROCKNIX. The
corpus is embedded above, unchanged and hash-verified; the other four members'
current revised approaches are injected below.

Review them. You are not revising your own plan in this step and you are not
voting.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

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

## Two questions this round must answer concretely

The plans have converged on the architecture. What is left divides into
differences a builder would have to *choose* between and differences that could
simply be *lifted* from one plan into another. Separating those two is the main
job of this round, and the following two questions are where the separation is
hardest.

**1. Walk the restore tool through each plan's retention store.** For every
plan, state literally what a later reader does to answer "show me the retained
past versions of *this game*, newest first, with a thumbnail, the producing
device, and which side won" — the path it opens, what it must read, and what it
must scan that it does not need. Say whether every field that question needs is
present at the moment of the discard, or whether the reader would have to
consult a manifest, an audit log or an apply record that the plan itself says
may be overwritten, rotated or removed by then. Do not accept a plan's own
assurance that its store is sufficient; trace it.

**2. Sort every remaining difference into liftable or architectural.** A
*liftable* difference is a rule, a field, a path shape or an ordering that could
be moved from one plan into another without disturbing anything else — say
which direction it should move. An *architectural* difference is one where
taking both is incoherent and a builder has to pick. Be strict: most
disagreements at this stage are liftable, and calling one architectural when it
is not is how a decision gets made by argument that should have been made by
integration. If you conclude that nothing architectural remains between two
plans, say so plainly.

## What this round is for

The plans have converged on the architecture. What remains are the places where
they still genuinely differ, the places where all of them agree without the
corpus having settled the point, and now the places where the maintainer's
decisions above cut against what a plan proposes.

- **Find the real disagreements.** Where two plans differ, say whether the
  difference is substantive or only wording. If substantive, state what evidence
  or experiment would settle it, and which way you think it settles.
- **Test the load-bearing claims again.** A confident error that survives into
  the built foundation is the most expensive thing that can happen here.
- **Say which plans the amendments cost, and how much.** Naming a version-one
  requirement the maintainer has just descoped is a real defect; so is retention
  the later restore tool could not read.
- **Name what each plan uniquely has.** For every plan, identify at least one
  element the others lack that would be a real loss if it were dropped, specific
  enough to be lifted verbatim.
- **Name what any plan has that should not be built.** This is a handheld
  running busybox with a five-second budget on the path a player watches.
- **Say which plan you would build from,** and what you would take from the
  others before building. You are not voting; you are making the case.

Where a plan has changed your mind since your own revision, say so and why.

Refer to plans by filename (for example `kimi-revised_plan-r3.md`), never by an
invented ordinal.

## Injected revised approaches

=== START claude-revised_plan-r3.md ===

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

=== END claude-revised_plan-r3.md ===

=== START gemini-revised_plan-r3.md ===

# Round 3 Revised Approach: Cloud-Save Conflict Resolution Foundation

This document specifies the complete, executable foundation for cloud-save conflict resolution in ROCKNIX. It is built on the embedded corpus (S01–S42) and the maintainer’s two binding amendments: **reversibility is first-class but bounded to one step back**, and **V1 ships a headless retention store (no undo UI) designed for a future "time machine" reader**.

This revision settles the remaining disagreements by adopting the strongest, corpus-backed mechanisms from the round-2 plans, conceding refuted positions, and stripping over-scoped machinery.

---

## 1. Concessions and Adoptions

To reach a safe, console-first foundation within the 5-second exit budget, I concede the following refuted positions and adopt the proven corrections from my peers:

*   **Concession (Exit-path overwrite):** I concede that relying on cached manifest claims to authorize an exit upload (`kimi-revised_plan-r2.md`) fails the acceptance criterion to *refuse* offline forks. **Adopted:** `gpt-revised_plan-r2.md`’s requirement to read cloud evidence for changed units *before* uploading.
*   **Concession (Unit classification):** I concede that "any member divergent marks the whole unit divergent" (`gemini-revised_plan-r2.md`) fails to detect disjoint-member forks (e.g., A edits `.eep`, B edits `.mpk`). **Adopted:** `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md`’s complete member-map comparison.
*   **Concession (Deletion propagation):** I concede that abandoning deletion propagation because an unmounted card mimics a deletion (`claude-revised_plan-r2.md`, `kimi-revised_plan-r2.md`) violates the maintainer's directive that edge cases inform but do not drive. **Adopted:** `gpt-revised_plan-r2.md`’s version-specific retirement records for explicit ES deletes.
*   **Adopted from `claude-revised_plan-r2.md`:** The strict hashless verification rule (equal size is not an equality verdict; download-and-hash is required before overwriting).
*   **Adopted from `gemini-revised_plan-r2.md`:** The LAN-only reachability fix (`ip route get <ip>`) and the split-root (`BACKUPPATH != RESTOREPATH`) one-way import destination.
*   **Adopted from `mistral-revised_plan-r2.md`:** `kind: "container"` for shared VMU/memcard units, making `rom: null` a strict type rule.
*   **Adopted from `gpt-revised_plan-r2.md`:** The `--files-from` manifest transport (avoiding `--include`'s destructive exclusion behavior) and the `.cache` non-disposable warning.

---

## 2. The Maintainer Amendments: Retention & Undo

The maintainer ruled that V1 must not add UI complexity to the resolution flow. There is no "undo" button in V1. However, discarded copies must be retained (ON by default, bounded by a count), and the store must be designed *now* to support a future "time machine" tool.

### 2.1 The V1 Retention Store
The store lives at `/storage/.cache/cloud_sync/discarded/<path>/`. **Warning:** Despite residing in `.cache`, this directory is *not* a disposable cache and must be exempt from OS-level cache-wiping routines (`gpt-revised_plan-r2.md`).

When a resolution discards a copy (local or cloud), the engine writes:
1.  **The State & Thumbnail:** The discarded bytes (`<sha256>`) and its PNG (`<sha256>.png`). The PNG must travel with the state so the future picker can render it.
2.  **The Context Sidecar:** `<sha256>.json`, written *before* the destructive apply step, containing:
    ```json
    {
      "rom": "Advance Wars.gba",
      "system": "gba",
      "kind": "state",
      "slot": 1,
      "producer": {
        "device_id": "ROCKNIX-ee5013fc56",
        "device_label": "Anbernic-RG35XX-SP",
        "core": "mgba",
        "core_build": "e31759b24e7...",
        "captured_at": "2026-09-05T15:37:28Z"
      },
      "winner_side": "local",
      "winner_sha256": "<winning_hash>",
      "reason": "conflict-loser",
      "resolved_at": "2026-09-06T10:00:00Z",
      "run_id": "<uuid>"
    }
    ```

### 2.2 Retention Bounds
*   **Count:** Default is **3 per save unit** (not global).
*   **Exemptions:** Unresolved conflicts and incomplete transaction preimages are strictly exempt from pruning (`gpt-revised_plan-r2.md`). A retention sweep must never evict the only copy of an unreviewed head.
*   **Done Page:** The wizard's final screen explicitly states: *"Discarded copies are kept and can be recovered later."*

---

## 3. Architecture and End-to-End Flow

### 3.1 Identity and Manifests
*   **Identity:** A save version is the `sha256` of its stored bytes (D-CLOUD-030).
*   **Manifests:** One JSON per device at `savestates/.rocknix/manifest-<device_id>.json` (D-CLOUD-031). Each device writes only its own.
*   **Agreement:** The last agreed hash per path is stored locally at `/storage/.cache/cloud_sync/agreed.json`.
*   **Equality Establishes Agreement:** If Local = Cloud, and no agreement record exists, the engine *writes* the agreement record. Without this, the first change to any legacy save triggers a false conflict (`gpt-revised_plan-r2.md`).

### 3.2 The Lifecycle Gate
To survive ES dying while the emulator lives (`gpt-revised_plan-r2.md`), the lock order is fixed:
1.  Take `take_cloud_lock` (blocks other syncs).
2.  Take local snapshot lock (blocks ES/RetroArch mutation).
3.  Read local hashes.
4.  Release local snapshot lock.
5.  Perform network operations.

### 3.3 Classification (Member-Map)
A save unit (e.g., `.eep` + `.mpk` pair) is classified by comparing its complete member map (Path → Hash) across Local, Cloud, and Agreed.
*   If Local changed and Cloud changed (including disjoint member edits), the unit is **Divergent → Wizard**.
*   If Local changed and Cloud = Agreed, **Upload**.
*   If Cloud changed and Local = Agreed, **Download**.
*   If Local ≠ Cloud and Agreed is unknown, **Divergent → Wizard**.

### 3.4 The Game-Exit Sync (Pre-Upload Evidence)
To satisfy the AC that offline forks are *refused* by the exit pass, the engine must read before writing (`gpt-revised_plan-r2.md`):
1.  Identify locally changed units.
2.  Fetch cloud evidence *only* for those units (`lsjson --hash` on S3/Dropbox; manifest claims on WebDAV).
3.  **Hashless Strictness:** On WebDAV (no hashes/mtimes), equal size is *not* an equality verdict. The engine must download-and-hash the cloud head before authorizing an overwrite (`claude-revised_plan-r2.md`). If this exceeds the 5-second budget, the upload is deferred to the next full pass (`gemini-revised_plan-r2.md`).
4.  Upload safely advanced units using `--files-from` (avoids `--include`'s destructive exclusion).
5.  Leave conflicts pending. Say *"No new saves to upload"* rather than *"The cloud is fully in sync"*.

### 3.5 Resolution and Apply
*   **Auto KEEP BOTH:** Deterministic. The device's resume point stays at `.state.auto`; the cloud copy is moved to the next free numbered slot with its PNG. No extra sub-choice UI is presented.
*   **Merge Primitives:** `SaveStateRepository::getNextFreeSlot()` (which correctly returns `-99` for auto-only repos) and `copyToSlot(move=false)` are used.
*   **Interrupted Apply:** The frozen plan is the journal. A boolean `done` is insufficient. The record must distinguish: prepared operands, local installation complete, remote publication verified, and agreement committed.

### 3.6 Deletion Propagation and Churn
*   **Explicit Deletes:** When ES deletes a state, the engine writes a version-specific retirement record (tombstone) containing the exact `sha256`. This propagates the deletion without treating an unexplained absence (e.g., a detached SD card) as a delete (`gpt-revised_plan-r2.md`).
*   **Compaction Churn:** D-CLOUD-030 compaction applies to the *cloud* copy as well. Retiring the cloud's higher slot via copy-verify-delete into a dated sibling terminates the renumber-churn loop (`kimi-revised_plan-r2.md`).

---

## 4. What the Corpus Settles vs. What the Council Agrees

**Settled by the Corpus (Source-Visible):**
*   `getNextFreeSlot()` returns `-99` for an auto-only repository (S37). The adapter must handle this by allocating from `firstslot`.
*   The exit upload is `copy` with no `--update` (S29). The one-way stopgap is destructive; D-CLOUD-029 stands until #22 replaces it.
*   `RCLONEOPTS` silently replaces `--filter-from` (S29). Option hygiene is load-bearing.
*   Creating `es_savestates.cfg` changes launch behavior (S39). The #10 rehearsal gate is mandatory.
*   Exit-time renumbering is conditional, not every exit (S38, S41).

**Agreed by the Council (Unmeasured / Not in Corpus):**
*   **Bisync's Demotion:** The council agrees bisync should be a candidate transport, not the detector. (Requires the bisync spike to confirm 1.75.0 behavior).
*   **Boot Sync Scheduling:** The boot pass must move under ES's scheduling to avoid racing gameplay.
*   **Queue-and-Badge Trigger:** Unattended passes queue conflicts and badge the UI, rather than forcing the wizard open immediately.
*   **Retention Count:** The default count of 3 per unit is a product proposal, not a corpus-derived limit.

---

## 5. Decision Register Updates

*   **Refine D-CLOUD-031 (Manifest & Agreement):** Add: "Equality establishes agreement. If Local and Cloud hashes match but no agreement record exists, the engine writes the agreement record to prevent false conflicts on legacy saves."
*   **New D-CLOUD-032 (V1 Retention Store):** "Discarded saves are retained ON by default, bounded by a per-unit count (proposed: 3), exempting pending transactions. The store lives at `/storage/.cache/cloud_sync/discarded/` (exempt from cache-wiping) and includes a JSON sidecar with full producer/winner context to support a future time-machine reader. V1 ships no undo UI."
*   **New D-CLOUD-033 (Deletion Propagation):** "Explicit player deletions and D-CLOUD-030 compactions generate version-specific retirement records. Unexplained filesystem absence fails closed. Cloud-side compaction terminates the renumber-churn loop."

---

## 6. Known Unknowns and Experiments (The Gates)

Before freezing the implementation, the following experiments must be executed on the GENERIC_X64 VM and H700 hardware:

1.  **The Bisync Spike:** Run rclone 1.75.0 `bisync` with `--conflict-resolve none`, `--recover`, and `--resilient`. Verify it does not rename savestate losers and handles missing listings gracefully.
2.  **Hashless Exit-Sync Cost:** Measure the time to download-and-hash a 64 KiB `.srm` on the QA WebDAV from the H700. If it exceeds the 5-second budget, enact the `gemini` fallback (defer verification to the full pass).
3.  **The `--backup-dir` Race Fixture:** Interleave two publications on Dropbox/WebDAV. Verify `--backup-dir` atomically preserves the intervening head. If it fails, a protected-publication protocol is required before multi-device ships.
4.  **The #10 Launch-Behavior Rehearsal:** Ship `es_savestates.cfg` and verify that RetroArch's `racommands`, autosave, and incremental behaviors are preserved.
5.  **The 480x320 UI Layout Test:** Render the wizard at the RG351M's resolution. Verify side-by-side thumbnails are recognizable. If not, fallback to a single-column toggle.
6.  **The Cloned-Card Experiment:** Run two live devices sharing one `cloud_device_id` (a supported misconfiguration). Verify the engine warns and refuses rather than corrupting state.

---

## 7. What Should Not Be Built

*   **A V1 Undo Control:** Descoped by the maintainer.
*   **8-Generation Lineage:** `claude`'s deep ancestry requirement is over-scoped. One-step operation context is sufficient.
*   **Cached-Manifest Exit Overwrites:** `kimi`'s permission to overwrite based on stale caches misses the primary offline-fork scenario.
*   **Timestamp-only Discard Stores:** Fails the maintainer's requirement for the future reader tool.
*   **`--include` Manifest Transport:** `gemini`'s approach excludes the payload. Use `--files-from`.
*   **A New Ping Probe:** `gemini`'s ping violates D-CLOUD-028. Keep `ip route` (WAN) and add `ip route get <ip>` (LAN).

=== END gemini-revised_plan-r3.md ===

=== START kimi-revised_plan-r3.md ===

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

=== END kimi-revised_plan-r3.md ===

=== START mistral-revised_plan-r3.md ===

# Revised approach — the foundation I would build

## 1. Executive summary

I would build from `claude-revised_plan-r2.md` as the editing baseline, with the following amendments:

1. **Retention store** — add the discard sidecar of §1.2 from `kimi_peer_review-r3.md` to satisfy the maintainer’s “time machine” requirement.
2. **Deletion propagation** — adopt `gpt-revised_plan-r2.md`’s version-specific retirement records for explicit deletes, conditional on the ES delete hook existing.
3. **Exit path** — keep `claude-revised_plan-r2.md`’s fresh evidence before upload, but add `gemini-revised_plan-r2.md`’s deferral as the measured fallback if the hashless download exceeds the budget.
4. **Split roots** — adopt `gpt-revised_plan-r2.md`’s one-way import destination for `BACKUPPATH ≠ RESTOREPATH`.
5. **LAN reachability** — adopt `gemini-revised_plan-r2.md`’s probe for LAN-only remotes.
6. **Manifest transport** — keep `claude-revised_plan-r2.md`’s manifest-last commit, but drop spawn A if Gate 6 measurement says so.
7. **Schema amendment** — use `mistral-revised_plan-r2.md`’s inline-JSON form for the D-CLOUD-031 refinement, with the content errors corrected.
8. **Recovery route** — move `gpt-revised_plan-r2.md`’s “minimal native recovery route” to the separate restore-tool issue as its seed.

The result is `claude-revised_plan-r2.md`’s architecture with `gpt-revised_plan-r2.md`’s deletion semantics, the maintainer’s retention contract, and every number still gated on hardware.

---

## 2. Identity, lineage, and agreement

### 2.1 Identity

- **A save version is the sha256 of its stored bytes** (D-CLOUD-030). Slot and file name are attributes.
- **Duplicates are compacted after re-verification** (D-CLOUD-030): the higher-numbered copy is removed, only after both files are re-read and the hashes found equal, and the removal is written to the audit log.
- **The thumbnail is not part of the identity** (schema §1). It travels with the state by path; `copyToSlot` already moves both (S38).

### 2.2 Lineage

- **Per device, per path**: the current hash and the hash it replaced at that path on this device (`replaces`), with when, which device, which core and core build.
- **Agreement, per device, per path**: the hash this device last uploaded or downloaded for that path — the last version both sides agreed on, *A*. Kept locally under `/storage/.cache/cloud_sync/`, never synced (schema §2).

### 2.3 Agreement on verified equality

- **Establish agreement on verified equality as well as transfer** (gpt §4.1). The signed schema never writes agreement on verified equality (S03 §9); the first change to any save on a device upgraded to the engine then classifies as “never agreed → ask” (S03 §3). This is an upgrade that is not invisible (S11).
- **Write agreement if absent** (kimi §4.3). A device that upgrades with L = C for every file and no agreement must not prompt on the first change.

### 2.4 Conflict test

Per path, with *L* the local hash, *C* the cloud’s, *A* the agreed one:

| L vs C | A known? | L vs A | C vs A | Verdict | Action |
|---|---|---|---|---|---|
| equal | — | — | — | identical | nothing |
| differ | yes | equal | differ | cloud changed | download, no prompt |
| differ | yes | differ | equal | device changed | upload, no prompt |
| differ | yes | differ | differ | **divergent** | wizard |
| differ | no | — | — | **divergent** (never agreed) | wizard — conservative |
| only one side has it | — | — | — | one-way | transfer, no prompt |

Refinements:
- **A move is not a conflict.** Same hash under a new path is a *move*: no conflict, no new version.
- **Never agreed means ask.** Two pre-existing copies with different content and no shared history are exactly the case the player must decide; there is no recency to fall back on (S01).
- **Auto states are the commonest conflict.** `game.state.auto` is written at exit wherever RetroArch’s auto-save is enabled, so two devices playing the same game diverge on it every session. The wizard should expect this pair most often and make it the fastest decision on the page.

---

## 3. Manifest shape

### 3.1 Shape

- **One JSON file per device at `savestates/.rocknix/manifest-<device-id>.json`** (D-CLOUD-031, refining D-CLOUD-017). Each device writes only its own; readers take the union.
- **Describes in-game saves as well as states** by path relative to the sync root. The allowlist passes nothing beside an in-game save except the save itself (S32), and XML is excluded outside `savestates/` (S31).
- **The local agreement record is kept unsynced** under `/storage/.cache/cloud_sync/agreed.json`, same entry shape minus provenance, one per path, holding the hash this device last uploaded or downloaded (schema §2).

### 3.2 Fields

Top level:

| Field | Type | Meaning |
|---|---|---|
| `schema` | int | `1`. Readers refuse a higher number and treat a missing one as `0` (pre-schema). |
| `device.id` | string | `cloud_device_id` — stable, seeded from the permanent hardware address (D-CLOUD-009). |
| `device.label` | string | `cloud_device_id --label`, folder-safe (`Anbernic-RG35XX-SP`). |
| `device.model` | string | `/proc/device-tree/model`, for display (`Anbernic RG35XX SP`). |
| `device.family` | string | `HW_DEVICE` from `/etc/os-release` (`H700`). |
| `device.os_version` | string | `OS_VERSION` from `/etc/os-release`. |
| `generated_at` | string | UTC, ISO 8601, when this file was last written. |
| `entries` | object | path → entry, path relative to the sync root (`/storage/roms`). |

Per entry:

| Field | Type | Meaning |
|---|---|---|
| `kind` | `"state"` \| `"auto"` \| `"save"` \| `"container"` | numbered savestate; the `.state.auto` resume point; an in-game save (`.srm`, `.sav`, memcard, …); a shared container (VMU, memcard set). |
| `sha256` | string | **The identity of this version** (D-CLOUD-030): sha256 of the bytes as stored — compressed for a state (`savestate_file_compression = "true"`; files begin `#RZIPv`), raw for a save. |
| `size` | int | bytes as stored. A cheap pre-check before hashing, never a substitute for it. |
| `mtime` | string | the file’s modification time, UTC ISO 8601 (ext4 here; second resolution). What rclone compares by; recorded so a listing can be matched without a download. |
| `captured_at` | string | UTC ISO 8601, when this entry was written. |
| `captured_local` | string | the same instant in the device’s local time with offset (`2026-09-05T01:32:46-04:00`) — the wizard shows local time, and the offset is what makes two devices’ local times comparable. |
| `clock_synced` | bool | `timedatectl show -p NTPSynchronized` at capture. A device that booted without a network has a wrong clock; the wizard says so rather than trusting the time. |
| `system` | string | ES system name (`gba`). |
| `rom` | string \| null | the ROM file name with extension, from ES’s game path. For a state this is what `{{romfilename}}` stood for; it is recorded rather than re-derived so a rename of the state cannot detach it from its game. `null` for a container. |
| `emulator` | string | ES’s resolved emulator (`retroarch`, `duckstation`, …). |
| `core` | string | the libretro core name (`mgba`); for a standalone emulator, the emulator name again. Never empty (ES does the same in `SaveStateConfig::getDirectory`). |
| `core_build` | string | our own `PKG_VERSION` pin for that core’s package (D-CLOUD-017), or `"unknown"`. The thing two devices compare to know whether a state will load (#19). |
| `core_display_version` | string \| null | `display_version` from `/usr/lib/libretro/<core>_libretro.info` (`1.61` for snes9x), for humans; never compared. |
| `slot` | int \| null | attribute, not identity. `0` for `game.state`, `n` for `game.staten`; `null` for `auto` and `save`. |
| `screenshot` | string \| null | remote-relative path of the PNG (`savestates/gba/X.state1.png`), so the wizard can fetch the cloud side’s picture with one small copy and never has to derive it from the state’s name. `null` for a save — never a substitute image (S02). |
| `replaces` | string \| null | the sha256 this version replaced at this path on this device, or `null` for the first version seen. One step of lineage; the audit log holds the rest (schema §2). |
| `remote_hash` | object \| null | `{"type": "dropbox", "value": "…"}` as reported by `rclone lsjson --hash` after the upload that carried this version; `null` until then. Lets a later listing say "the cloud still holds this version" without a download. Backend-specific by construction (Dropbox offers only its own type; WebDAV none), so it is only ever compared against a listing of the same remote. |

Rules the fields obey:
- **Absent is not zero.** A field that could not be determined is `null` or `"unknown"`, never `0` or `""`. `clock_synced: false` and `core_build: "unknown"` are values the wizard renders, not errors (S21 thread; `upgrade-and-install.md`).
- **Nothing stamps a file it did not write.** An entry is written by the device that produced the save, at the moment it is produced. A file with no entry anywhere is `unknown` in every provenance field and still has a hash, computed locally, so the conflict test (schema §3) works for it.
- **A move is an update to the key, not a new entry.** After ES renumbers, the capture step finds the same hash under a new path and moves the entry; `replaces` and `captured_at` are unchanged.

### 3.3 Schema amendment

Refine D-CLOUD-031 with the following inline-JSON amendment (mistral’s form, content corrected):

```json
{
  "schema": 1,
  "device": {
    "id": "ROCKNIX-ee5013fc56",
    "label": "Anbernic-RG35XX-SP",
    "model": "Anbernic RG35XX SP",
    "family": "H700",
    "os_version": "20260905"
  },
  "generated_at": "2026-09-05T15:37:28Z",
  "entries": {
    "savestates/gba/Mega Man & Bass (USA).state1": {
      "kind": "state",
      "sha256": "…64 hex…",
      "size": 50816,
      "mtime": "2025-07-29T05:09:49Z",
      "captured_at": "2025-07-29T05:09:50Z",
      "captured_local": "2025-07-29T01:09:50-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Mega Man & Bass (USA).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": 1,
      "screenshot": "savestates/gba/Mega Man & Bass (USA).state1.png",
      "replaces": null,
      "remote_hash": { "type": "dropbox", "value": "…" }
    },
    "savestates/gba/Advance Wars (USA) (Rev 1).state.auto": {
      "kind": "auto",
      "sha256": "…",
      "size": 43011,
      "mtime": "2025-07-29T04:51:38Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Advance Wars (USA) (Rev 1).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": null,
      "screenshot": "savestates/gba/Advance Wars (USA) (Rev 1).state.auto.png",
      "replaces": "…the previous auto state's sha256…",
      "remote_hash": null
    },
    "gba/Advance Wars (USA) (Rev 1).srm": {
      "kind": "save",
      "sha256": "…",
      "size": 65536,
      "mtime": "2025-07-29T04:51:39Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Advance Wars (USA) (Rev 1).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": null,
      "screenshot": null,
      "replaces": "…",
      "remote_hash": null
    },
    "dc/shared/savefiles/": {
      "kind": "container",
      "sha256": "…",
      "size": 131072,
      "mtime": "2025-07-29T04:51:39Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "dc",
      "rom": null,
      "emulator": "flycast",
      "core": "flycast",
      "core_build": "…",
      "core_display_version": "…",
      "slot": null,
      "screenshot": null,
      "replaces": "…",
      "remote_hash": null
    }
  }
}
```

---

## 4. Detection

### 4.1 Detector

- **The detector is our own three-way classifier, not bisync.** Bisync is demoted to a candidate transport; the spike has not run (S01).
- **The detector never runs `--resync` on its own** (S05 futro AC (b)); use `--recover` and `--resilient`.
- **The bisync workdir stays at its default `/storage/.cache/rclone/bisync`** (persistent, `HOME=/storage`) and is named in the script so a future change of `HOME` cannot move it under `/var` (S05 futro AC (d)).

### 4.2 Classification

- **Complete member-map comparison** (claude §2.3.1, kimi §4.3, gpt §4.2). A unit is a map of path → hash over its complete member set. If any member differs, the unit differs; if the member set differs, the unit differs.
- **A thumbnail anomaly is not a progress fork when the state bytes are identical.** D-CLOUD-030 expressly excludes the thumbnail from version identity (S03 §1).
- **A retirement for X encounters Y at a relevant path → conflict or stale operation; never treat the record as permission to remove Y** (gpt §4.3). A stale retirement record cannot remove a path’s later occupant.

### 4.3 Exit path

- **Fresh evidence before upload** (claude §2.5.2, gpt §5.2). The exit path reads cloud evidence for the changed units before uploading. On a hash backend: `lsjson --hash` scoped to the changed paths. On a hashless backend: manifest claims plus download-and-hash.
- **Defer hashless verification if it exceeds the budget** (gemini §4.2). If the download-and-hash exceeds 5 seconds, defer verification to the boot/menu full pass, leaving the exit push as a fast-path upload only. The card must say “waiting” rather than “safe in the cloud”.
- **Spawn A: compute the backend hash locally** (claude §2.5.2 step 4). `rclone hashsum <type>` or busybox `md5sum` on md5 backends, so the *next* exit push for the same game can confirm C = A without a listing. Without it, a second changed session before any full pass defers.
- **Spawn count:** 0 idle, 3–4 changed (claude §2.5.2). The idle path needs no network answer at all; the changed path is measured at Gate 6.

### 4.4 Boot sync

- **Boot sync under ES’s scheduling** (all four). The race with a live session is necessary (S35, S41); nothing embedded says when ES is up relative to the network or how `autostart/102-cloud-saves` hands off. That handoff is a gap to name (§9).
- **Queue-and-badge for unattended passes** (all four). IA rev 4 says “a sync that reports conflicts opens the wizard” (S02); all four queue for boot/exit. This is an IA rev 5 item.

---

## 5. Resolution

### 5.1 Wizard

- **Cloud is always the left column** (S02 rev 3).
- **KEEP LEFT / KEEP RIGHT / KEEP BOTH** (S02 rev 2). KEEP BOTH is savestates only via ES’s own `getNextFreeSlot()`; in-game saves are shown disabled with a reason.
- **KEEP BOTH on an auto-state conflict uses a deterministic rule** (claude §2.3.3, gpt §7.1 criterion 7, mistral §1.3). The device’s resume point stays at `.state.auto`; the cloud copy becomes a numbered state with its PNG. The done page names where the cloud copy went.
- **Nothing transfers until COMPLETE** (S02). The walkthrough is reversible right up to the end; quitting partway leaves both sides exactly as they were.
- **Non-conflicting files are applied before the walkthrough starts** (S02). This is what makes the slot choice safe. Once every cloud-only file has been downloaded, free-on-device and free-on-both are the same thing, and a merge cannot pick a slot the cloud is already using.
- **The done page names each discarded copy per game** (S02 rev 4 AC). The audit line for it is written *before* the apply step deletes anything.

### 5.2 Settings

- **Review decisions before applying** — off by default; turns the summary from a step everyone pays for into one the careful can opt into.
- **Keep discarded saves** — on by default; retains the losing copy so a choice can be undone. A **count selector** sets how many to keep, and stays visible but unselectable while the toggle is off (dim, don’t hide — the capability should be discoverable before it is enabled). The fixed count is also the retention rule, so discarded copies cannot grow without bound on card storage.

---

## 6. Retention and recovery

### 6.1 Retention store

- **Discard store at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>`** (claude §2.4.1). PNG travels with the state (S03 §4).
- **Sidecar per retained copy** (`<sha256>.json` beside it), written *before* the destructive step, carrying:
  - the copy’s manifest entry verbatim (kind, sha256, system, rom, slot, `origin`/device, core, core_build, captured_at/local, clock_synced, screenshot path + sha256);
  - `reason` ∈ {`conflict-loser`, `superseded-by-download`, `compaction`, `es-delete`};
  - `winner` = {side, path, sha256, device};
  - the run/transaction id;
  - the wizard’s decision text.
- **Retention count is per save unit** (gpt §2). A global count of 3 across the whole store would be consumed by three routine one-way downloads of unrelated games; the primary case — “I picked the wrong side for *this* game” — would be gone.
- **Transaction preimages and unresolved candidates are exempt from the count** (gpt §6.3, §8). A retention sweep must not evict the only copy of an unreviewed head.
- **The store’s home is not settled by “outside the sync tree”** (gpt §1.2). The IA doc’s own convention is that `.cache` contents *self-invalidate* (`repo/docs/conflict-wizard-ia.md` [V]); without this sentence, some future cleanup will correctly-by-convention delete the discard store. Decide the store’s home alongside its shape.

### 6.2 Recovery tool

- **The restore tool is a separate issue** (maintainer decision). It is the wizard’s own compare-and-choose surface pointed at a game’s retained past versions, reached from outside the moment of resolution.
- **Move `gpt-revised_plan-r2.md`’s “minimal native recovery route” to the new issue as its seed.** The design work is not wasted — it is the tool’s shape.

---

## 7. Deletion propagation

### 7.1 Explicit deletes

- **Version-specific retirement records** (gpt §4.3). An observed ES delete or move produces a receipt naming the exact version; a detached card produces no record → fail closed; a deliberate delete produces one → propagates.
- **Receipts are propagated as copy-verify-delete into a dated sibling** (D-CLOUD-026). The sibling is a dated directory under the sync root, never inside it (D-CLOUD-014).
- **The delete hook is the one load-bearing hook** (D1). ES’s delete path is the proposed home of explicit-delete retirement records. If the hook does not exist, reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships.

### 7.2 Compaction

- **Direct remote compaction** (claude §2.3.2). After a renumber uploads `state3 = H`, the cloud holds `state3` and `state5` with equal hashes; retiring the cloud’s higher slot by copy-verify-delete into the sibling terminates the loop with no journal at all.
- **The renumber signature is also inferable by hash.** The hash agreement says was at slot k is now at slot k−1.

---

## 8. Adapter over ES’s slot primitives

### 8.1 Defects

- **`getNextFreeSlot()` returns −99 for an auto-only repository** (S37). The auto state sits in the vector with slot −1, the 99999→0 scan finds nothing.
- **`copyToSlot()` returns true whatever `renameFile`/`copyFile` did** (S38). The function executes `Utils::FileSystem::renameFile(...)` or `copyFile(...)` and unconditionally hits `return true;` at the end without checking their success.
- **`makeStateFilename(fullPath = true)` derives the destination from the source’s parent** (S38). A staged cloud state’s copy would land in the stage directory.

### 8.2 Adapter contract

- **Compute destinations from the config templates itself.**
- **Allocate from `firstslot` for an auto-only repository.**
- **Distinguish:**
  - auto-only, supported repository: use its valid first numbered slot;
  - unsupported/disabled repository: refuse;
  - unexpected allocator failure: refuse.

---

## 9. Gaps surfaced to the orchestrator

- `GuiSaveState.cpp` — the delete path is now the proposed home of explicit-delete retirement records (D1).
- `SaveState.h`/`SaveStateRepository.h` — default arguments.
- `Paths.cpp`, `setsettings.sh` — RetroArch `savestate_directory`, `savestate_auto_save`.
- rclone 1.75.0 documentation or source for `--backup-dir` with `copy`, `lsjson --files-from`, `hashsum` on local paths, Dropbox hash type on local files.
- `docs/es-ui-style-guide.md`.
- Current issue bodies with edited ACs.
- Executed hardware, backend, interruption, compatibility, retention-reader, and round-trip results.

---

## 10. What should not be built

- A native undo surface in the resolution flow (gpt §8, §13) — descoped by the maintainer.
- Cross-device resolution receipts synced through manifests (gpt §4.4) — V2; the ordinary outcome is correct and retained (D5).
- The KEEP BOTH auto sub-choice (kimi §4.4 amendment 3) — one more press the maintainer has said not to add (D3).
- Move-observation hooks justified by `replaces` fidelity (kimi §4.1) — keep the delete hook for receipts; treat the move hook as optional (D4).
- `--include`-based manifest transport (gemini §2.5) — a silent no-op transfer per S09; use `--files-from` (D7).
- A probe replacing `ip route` (gemini §4 item 4) — contradicts D-CLOUD-028 (D8).
- Per-file “any member divergent” unit classification (gemini §2.1) — misses the disjoint-member fork (D1).
- “Conservative resurrection” of compacted duplicates (mistral §1.4) — does not converge (D4).
- Withdrawing D-CLOUD-029 by assertion (mistral §2) — the row stands; the maintainer’s toggle posture is compatible with it and needs no row.
- A SQLite index — all four agree; say so on #20 and close the question.
- A generation counter that does more than fail closed on a same-ID manifest fork (gpt §3.3) — a cloned card is an edge case; warn and refuse (kimi §4.1 rule 5) is enough.
- Anything that reads a retention count as permission to evict an unreviewed head — every plan’s store must exempt transaction preimages and pending candidates (gpt says it; the others must).

---

## 11. Decision register amendments

### D-CLOUD-031-A (refines D-CLOUD-031)

**The save manifest is one JSON file per device at `savestates/.rocknix/manifest-<device-id>.json`, describing in-game saves as well as states by path relative to the sync root; the local agreement record is kept unsynced under `/storage/.cache/cloud_sync/agreed.json`.** Refines D-CLOUD-031. Forced by the allowlist: nothing beside an in-game save syncs, and XML is excluded outside `savestates/`. The manifest carries `kind: "container"` for shared VMU/memcard units, with `rom: null`.

### D-CLOUD-031-B (refines D-CLOUD-031)

**Establish agreement on verified equality as well as transfer.** The signed schema never writes agreement on verified equality (S03 §9); the first change to any save on a device upgraded to the engine then classifies as “never agreed → ask” (S03 §3). This is an upgrade that is not invisible (S11). Write agreement if absent (kimi §4.3).

### D-CLOUD-030-A (refines D-CLOUD-030)

**After a sync, two slots of one game holding the same hash are compacted: the higher slot is removed, only after both files are re-read and the hashes found equal, and the removal is written to the audit log. Propagate as moves into dated siblings, capped per run.** Refines D-CLOUD-030. Direct remote compaction converges without any receipt.

### D-CLOUD-029-A (refines D-CLOUD-029)

**The game-exit sync reads cloud evidence for changed units before uploading.** The exit path reads cloud evidence for the changed units before uploading. On a hash backend: `lsjson --hash` scoped to the changed paths. On a hashless backend: manifest claims plus download-and-hash. Defer hashless verification if it exceeds the budget, leaving the exit push as a fast-path upload only. The card must say “waiting” rather than “safe in the cloud”.

### D-CLOUD-027-A (refines D-CLOUD-027)

**The discard store is at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>`, with a `<sha256>.json` sidecar per retained copy carrying the full comparison context.** The store’s home is not settled by “outside the sync tree”; decide it alongside the sidecar shape. Retention count is per save unit, with exemptions for transaction preimages and unresolved candidates.

### D-CLOUD-024-A (refines D-CLOUD-024)

**The wizard ships in the same feature drop as the cloud-sync revamp, with retention ON by default bounded by a count, and no undo control in V1.** The restore tool is a separate issue shaped as the wizard’s compare-and-choose pointed at retained versions.

---

## 12. What the amendments cost

- **`gpt-revised_plan-r2.md`** — Low. Delete “minimal native recovery” from §8 and §13; move §4.4’s resolution receipts and the “completed resolution” operation record to “may follow later”; keep the move/delete/compaction operation records (they are convergence, not lineage). Its store is the closest to the reader requirement; it owes one sentence: the frozen plan’s per-unit record is *retained beside the copies*, not disposed of on completion.
- **`claude-revised_plan-r2.md`** — Low. Add the discard sidecar (§1.2 from kimi); re-justify deletion propagation (§2, D1); its done-page sentence already exists via the futro ACs it carries.
- **`kimi-revised_plan-r2.md`** — Medium. Drop the KEEP BOTH auto sub-choice (D3). Add the discard sidecar; the `origin` data it needs is already in hand at discard time. Narrow the ops journal’s justification to deletion receipts (D4) — the `replaces`-fidelity argument is lineage depth the maintainer has set aside. Separately from the amendments, its exit pass fails the futro’s #22 AC (a) (D2).
- **`gemini-revised_plan-r2.md`** — Moderate. Add the discard sidecar; its “capped per run” on retirement propagation (§3, D-CLOUD-030-A) must be clarified — if the cap *drops* records it reintroduces non-convergence; `gpt-revised_plan-r2.md` §4.3’s rule is the right one: reaching a control-state limit stops mutation rather than silently discarding correctness state.
- **`mistral-revised_plan-r2.md`** — Moderate–high. Add the discard sidecar; correct the four errors in §4.4 before its content is safe to lift anywhere.

=== END mistral-revised_plan-r3.md ===
