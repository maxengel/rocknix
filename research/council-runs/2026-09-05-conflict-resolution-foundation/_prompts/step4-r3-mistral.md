# Council — round 3, peer vote

You are one of five council members. Each of you has now produced a round-3
revised approach to the foundation for cloud-save conflict resolution in
ROCKNIX. The corpus is embedded above, unchanged and hash-verified; the other
four members' round-3 revised plans are injected below.

Vote for **exactly one** of them. You may not vote for your own plan, and your
own plan is not injected — judge the four you are given.

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

## What you are voting for

The winning plan becomes the foundation the maintainer builds on. So vote for
the plan that would be **safest and most buildable if adopted as written**, not
the one that is most impressive or most thorough. Weigh, in this order:

1. **Does it protect player progress, and is a wrong outcome recoverable?** The
   cardinal rule is that no save is lost and that resolution never defaults to
   recency. A plan with an elegant architecture and one silent-overwrite path is
   worse than a plainer plan with none. Recoverable means the discarded bytes are
   retained by default and recorded richly enough for the separate restore tool
   to drive a picker from them later. It does **not** mean a control in version
   one: a plan that ships an undo surface in the resolution flow is over-scoped
   against the amendment, not ahead of it.
2. **Is it grounded?** Claims about the shipped code, EmulationStation's
   helpers, rclone's behaviour and the register's decisions should be correct,
   and hypotheses should be labelled as hypotheses with an experiment named.
3. **Is it actually implementable** by a small team on a busybox handheld,
   inside the stated budgets, against 69 rclone backends of varying capability?
4. **Does it sequence the work** so the cheap experiments that could invalidate
   a design run before the expensive building?
5. **Is it honest about what it does not know**, and about which decided rows
   it needs reopened?

## Your output

- **Name the winner** in your first line, by member short name, unambiguously.
- **Give your reasoning**, comparing the winner against the other three
  specifically. Say what the winner does better and where the others fall short.
- **Say what the winner needs** to satisfy the amendments above, if anything —
  including anything it must give up, not only anything it must add.
- **Record dissent.** Name every important primitive, finding or safeguard that
  a losing plan has and the winner does not fully absorb, by filename. This is
  how good ideas from losing plans survive into the final synthesis, so be
  thorough here even when your winner is clear.
- **Name any remaining defect in the winner** that must be fixed before it is
  built.

Refer to plans by filename (for example `kimi-revised_plan-r3.md`), never by an
invented ordinal.

## Injected revised plans

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

=== START gpt-revised_plan-r3.md ===

# gpt-revised_plan-r3.md

## Recommendation

**Build a small, content-based reconciler around rclone—not a wizard behind an otherwise unchanged sync.** It owns every save-writing path, compares complete save units against a verified local agreement record, and gives EmulationStation explicit outcomes rather than asking it to interpret rclone’s progress text.

Keep the foundations already decided:

- SHA-256 of stored bytes identifies a save version.
- Slots and filenames are locations, not identities.
- Each device publishes only its own manifest.
- Game saves remain shared; save states are organized by core.
- Genuine forks require a player’s decision, never a recency rule.
- The audit log remains append-only text at `/storage/.cache/log/cloud_audit.log`.

Make these amendments:

1. **Retain discarded copies by default, with a count bound, but ship no V1 restore control.** Retained copies include sufficient metadata for the separate, later history-restore picker.
2. **Use our classifier as the authority.** Bisync must earn any production role through a disposable spike; its presence and help text do not prove a safe detect-only interface.
3. **Read current cloud evidence before a proposed overwrite, including at game exit.** If obtaining sufficient evidence is too expensive for the foreground path, leave that unit pending rather than overwrite an unread head.
4. **Coordinate save mutations with the actual emulator lifecycle.** The cloud lock alone does not protect files while a game is running.
5. **Reuse and repair ES’s save-state primitives through a checked adapter.** Their present return values and allocator edge cases are not adequate safety checks.
6. **Propagate explicit, version-specific deletion intent.** Unexplained absence does not authorize deletion. Verified duplicate compaction acts on both sides so it converges.
7. **Keep only immediate agreement, immediate predecessor information where known, active deletion intent, and one in-flight apply record.** Do not build a distributed resolution history.

This is a recommendation for implementation **after the gates below pass**, not a claim that the proposed mechanisms have been tested.

### Evidence and citation convention

`S01`–`S42` identify the embedded sources in order. Each citation resolves to the exact declared path and Facilitator-supplied SHA-256 in `corpus.provenance.json` at the end. Short paths in prose are the suffixes of those declared paths.

I used the embedded text. I did not access a filesystem, recompute hashes, execute commands, or test hardware. The earlier revised plans themselves are not embedded here; the revision-accountability section uses the passages quoted or described in the injected reviews.

---

## 1. What this revision concedes, adopts, and rejects

| Issue | Position in this revision |
|---|---|
| **V1 native recovery requirement** | **Withdrawn.** `claude_peer_review-r3.md`, `gemini_peer_review-r3.md`, and `kimi_peer_review-r3.md` correctly identify the “minimal native recovery route” quoted from `gpt-revised_plan-r2.md` as exceeding the new maintainer decision. Its design moves to the separate history-restore issue. Nothing in V1’s resolution flow puts a discarded copy back. |
| **Retention metadata left dependent on a completed plan or mutable manifests** | **Corrected.** The criticism in `claude_peer_review-r3.md` and `kimi_peer_review-r3.md` is sound: a rotating audit log and a producer’s current manifest cannot serve as the lasting description of a discarded version. V1 writes a self-contained record beside each retained set and keeps it after successful apply. |
| **Cross-device resolution receipts in V1** | **Removed.** I accept the two-device trace in `claude_peer_review-r3.md`, rather than the contrary recommendation in `kimi_peer_review-r3.md`. A later informed choice is allowed to propagate normally; the earlier copy is retained. Preventing that propagation would add policy and history the primary use case does not earn. |
| **Move hooks and generation machinery for lineage fidelity** | **Cut from the required design.** Net moves are recognized by verified content equality. Ambiguous `replaces` values remain unknown. The one required new ES observation point is explicit deletion; no hook is justified merely to reconstruct a deeper ancestry chain. |
| **Budget fallback** | **Adopted from `gemini-revised_plan-r2.md`, as quoted in `claude_peer_review-r3.md`.** Expensive verification may be deferred. The necessary qualification is that the corresponding canonical overwrite is deferred too. |
| **Shared-container distinction and gate-table form** | **Adopted from `mistral-revised_plan-r2.md`, as described in the reviews.** A shared VMU or memory card is presented as a container, not falsely assigned to one ROM. Experiment tables below name the owner and the pass condition. |
| **Source-visible hazards in option handling and temporary files** | **Adopted from `kimi-revised_plan-r2.md`, as credited by `claude_peer_review-r3.md`.** The supplied scripts confirm the allowlist bypass, admission of save-tier conflicted copies, and admission of `.state.auto.bak`. These are implementation inputs, not reasons to trust the rest of any plan without checking it. |
| **Run-bound result records** | **Adopted from `claude-revised_plan-r2.md`, as described in `kimi_peer_review-r3.md`.** An outcome is accepted only for the run ID and sync context the caller requested. Missing or stale output is not success. |
| **A full remote staging mirror, mandatory protected-publication protocol, or unconditional deferral of #10 attributed to GPT** | These attributions in `mistral_peer_review-r3.md` are not the position of this artifact. The earlier text is unavailable to inspect directly, so I will not reconstruct it. **This plan uses candidate-scoped staging, gates preservation without promising linearizability, and keeps #10 in the drop, sequenced last.** |

Two further disagreements need an explicit answer:

- **Hashless metadata tiers:** I reject using an unchanged manifest claim or size/mtime as sufficient permission to overwrite. They can direct the investigation; they cannot establish the cloud’s current bytes. This follows the same-size failure already documented in the shipped scripts. [S03 §2–3; S29 `backup_system_files`; S30 `restore_system_files`]
- **Manifest-last publication:** I do **not** require a separate manifest upload merely to create an apparent commit point. The manifest is an observation, not an authorization or atomic commit record. The payload and our own manifest may share a batch, provided readers verify the described bytes and treat mismatches as pending. A manifest-last convention alone would not protect against an interrupted or concurrent writer.

---

## 2. What is settled, and what is not

Agreement among reviewers is not evidence of runtime behavior.

| Proposition | Evidence status | Consequence |
|---|---|---|
| Version identity is SHA-256 of stored bytes; numbered-slot duplicates are compacted after re-verification | **Decided:** D-CLOUD-030 | Keep it. Narrow the compaction scope explicitly below. |
| Per-device manifests and local agreement state | **Decided:** D-CLOUD-031 | Keep the placement and ownership; refine the schema’s semantics. |
| V1 retention is on by default, count-bounded, with no V1 undo control | **Authoritative amendment in this brief** | Apply it without reopening the product decision. |
| The exit upload can overwrite a divergent cloud save | **Source-visible:** `--recent` forces `copy`; the ES call supplies no `--update` | #22 must replace this path, not merely add a menu detector. [S29; S41] |
| The boot pair is newest-wins | **Source-visible:** both directions use `copy --update` | D-CLOUD-029 remains the deliberate temporary posture. [S35; S06] |
| ES has allocator and copy-verification defects relevant to KEEP BOTH | **Source-visible**, detailed in §7 | A checked adapter is mandatory. [S37–S39] |
| A manifest-driven reconciler is the better production authority than bisync | **Engineering recommendation, not an executed comparison** | Run the bisync spike; do not claim its failure in advance. |
| `copy --backup-dir` preserves an intervening remote head under races and interruption | **Unmeasured for this use** | A preservation gate is required. No universal atomicity claim. |
| The changed-unit exit path fits an acceptable foreground budget | **Unmeasured** | Measure process starts, requests, bytes, and wall time on H700. |
| Auto states are the commonest conflict | **A schema assertion, not established by the embedded evidence** | Census actual launch habits; keep the resume-point presentation regardless. |
| The proposed standalone save-unit boundaries are correct | **Unmeasured** | Inventory real emulator outputs before enabling automatic treatment. |
| Queueing unattended conflicts is preferable to automatically opening the wizard | **Proposed IA amendment** | Update the IA and issue body, not just a comment. |
| A retention count of three is right | **Product proposal only** | Use three initially if approved; correctness requires a positive bound, not that particular number. |

The corpus does contain reported H700 measurements and device inspections. It does **not** contain executed results for the new classifier, preservation protocol, lifecycle coordination, or compatibility matrix. [S05; S08; S20; S27]

---

## 3. The foundation: one authority over save mutations

### 3.1 Responsibilities

**EmulationStation**

- Owns the player interaction.
- Supplies the actual launched ROM, emulator, and core context.
- Participates in save-lifecycle coordination.
- Uses the checked state allocator/copy adapter.
- Presents typed results and the conflict walkthrough.

**Local reconciler**

- Captures stable local observations.
- Reads current remote evidence through rclone.
- Classifies save units.
- Produces an exact transfer/apply plan.
- Retains preimages and discarded copies.
- Applies only authorized changes and advances agreement after verification.

**rclone**

- Lists and transfers.
- Performs only the exact, policy-approved operations.
- Does not choose a conflict winner.
- Does not rename save-state losers.
- Does not define whether two files represent a genuine fork.

There is no new daemon, shared database, binary-save merger, or distributed consensus service.

### 3.2 Two different locks, for two different hazards

Reuse `take_cloud_lock` for all cloud operations. It already serializes transfer scripts on one device and returns a non-blocking skip. [S29–S30]

Add one **save-lifecycle gate** shared by:

- the emulator session;
- ES save-state deletion and renumbering;
- capture;
- live save installation and compaction.

This addresses a different hazard. The boot script currently runs independently of gameplay, while `SaveState::setupSaveState` can temporarily replace `.state.auto` and `onGameEnded` can restore its `.bak`. A cloud lock does not stop either operation. [S35; S38; S41]

**Acquisition order**

1. A cloud worker acquires the cloud lock non-blockingly.
2. When it needs a stable local snapshot or a live mutation, it acquires the lifecycle gate non-blockingly.
3. If gameplay owns that gate, the worker leaves mutation pending. It does not wait while holding something gameplay needs.
4. The game session performs local capture at its completion, releases the lifecycle gate, and only then requests cloud work.
5. **Capture never waits for the cloud lock and performs no network work.**

Remote listing and candidate downloads into staging do not need to hold the lifecycle gate. Before a live apply, the worker reacquires it and revalidates its inputs.

A qualification is necessary: a bounded apply critical section may include a remote mutation while the relevant local snapshot is held stable. I do not promise that every network wait disappears from that critical section. Instead, perform expensive discovery and staging beforehand, limit the commit’s work, and yield between units. A game launch may wait briefly for an already-started commit, but never behind an unbounded background full pass.

The session’s ownership must survive **ES dying while the emulator remains alive**. An ES-owned Boolean or a marker removed when ES exits is insufficient. The actual launch supervisor or emulator process lifetime must own the gate; the missing launch plumbing must be inspected before choosing the precise implementation. [S10; S41]

### 3.3 Capture is independent of whether sync is enabled or available

Capture must still happen when:

- exit sync is disabled;
- the device is offline;
- another cloud operation holds the cloud lock;
- the emulator exits unsuccessfully after having written a save.

The existing ES sync invocation is gated by the sync setting and current sync activity. Merely inserting capture inside that conditional would lose provenance in ordinary use. [S41]

Capture occurs after ES has completed its own save-state cleanup, and before the next session can mutate the relevant files. It records **newly produced bytes**, not every file whose timestamp happens to be recent.

Use the actual launch context saved when the command was constructed. After #10, selecting a state can change the emulator/core command independently of the configured default; asking `getCore(true)` only at exit is not a sufficient general contract. [S38 `setupSaveState`; S39; S42]

Capture selection must cover the emulator’s actual save locations, including standalone layouts. It must not regress to a ROM-basename upload filter, which D-CLOUD-028 rejected for good reason. Hash supported session outputs, identify newly encountered files, and use a full pass to verify the remaining library. The shadow census determines the cost of this local work.

**Do not rewrite a manifest only to refresh `generated_at`.**

---

## 4. Data model: current state, not a history system

### 4.1 Five records, each with one job

| Record | Purpose | Authority |
|---|---|---|
| **Owned manifest** | Describes this device’s current observed/materialized save occurrences, their version hashes, and known producer metadata | An observation; not proof of current remote contents |
| **Local agreement record** | Records the last verified common save-unit map for this sync context | Classifier baseline |
| **Active retirement notices** | Carry explicit, version-specific deletion intent to devices that were offline | Permission for a matching retirement, never permission to delete a different occupant |
| **One in-flight apply plan** | Holds expected inputs, selected outputs, retained locations, and per-unit completion state | Recovery of an interrupted operation |
| **Retained-copy record** | Describes bytes kept for the later history-restore tool | Historical context only; never classifier authority |

No record stores a version DAG. `replaces`, when known, remains one immediate predecessor. A missing or ambiguous predecessor is `null`, not reconstructed with speculative move history.

### 4.2 Manifest ownership and provenance

Keep the D-CLOUD-031 path:

`savestates/.rocknix/manifest-<device-id>.json`

But make these semantics explicit in the next schema revision:

- The top-level device is the **manifest owner**.
- An entry’s producer facts describe **who produced those bytes**, where known.
- Importing or re-slotting a version may create an observation in our own manifest without changing its producer.
- Producer facts needed after an import are carried inline, rather than recoverable only by looking up another device’s mutable current manifest.
- An unknown producer remains unknown.
- A content hash can have multiple observations. Equal bytes do not prove a unique author or capture time.
- Readers take a **set of claims**, not a right-biased merge in which the last manifest read wins for a path.

This refines the signed schema’s “nothing stamps a file it did not write” rule without weakening its intent: observing imported data must not falsely claim authorship. [S03 §2, §5–6; S21]

Foreign manifests are downloaded to an **out-of-tree observation cache**, not bulk-restored into the save tree. They are never republished by us. If an existing tree contains foreign manifests, exclude them from every upload and import their contents as observations without treating their presence as permission to overwrite the producer’s remote file.

Before a freshly installed device publishes under an existing device ID, read its previous remote manifest. Hydrate only facts supported by matching bytes; do not replace it blindly with an empty manifest. A detected same-ID fork stops control-file publication. V1 does not need a second device identity or a multi-generation writer protocol to report that condition safely. [D-CLOUD-009; S34]

### 4.3 Save units and complete membership

A file hash identifies bytes. A **save unit** identifies the collection that must be compared and installed coherently.

- **Numbered state:** state payload plus its companion screenshot dependency.
- **Auto state:** resume-point payload plus its screenshot dependency.
- **Ordinary in-game save:** one file where the emulator really uses one file.
- **Multi-file in-game save:** a measured, complete member set.
- **Shared container:** a VMU or memory-card unit that can contain several games.

Keep per-file `kind` as `state`, `auto`, or `save`. Add the shared-container distinction at the **unit** level: a container’s `rom` is nullable and its header names the container. This adopts the useful distinction credited to `mistral-revised_plan-r2.md` without claiming that “container” is a fourth file format.

For every unit, compare a canonical **member map**: relative member path → stored-byte hash, including membership changes. A screenshot is a dependency with its own hash, but remains outside the save version’s identity, as D-CLOUD-030 requires.

Do not assume that every `.eep` and `.mpk` pair, every PPSSPP directory, or every Dreamcast folder is one transaction. The emulator inventory determines those boundaries. If a required member is outside the effective allowlist, that unit is incomplete and cannot be automatically transferred as if complete. [S01 §4.8; S32]

Preserve `rom` as the ROM filename supplied by ES, including the extension. A discovery-regex stem is not a substitute. Record a relative content locator where needed to distinguish identical basenames in different directories; do not pretend that this alone fixes an emulator that writes both games to the same local save path. [S03 §6; S39; S42]

### 4.4 Agreement belongs to a sync context

Keep agreement local under `/storage/.cache/cloud_sync/`, as D-CLOUD-031 specifies.

Bind it to:

- remote name and backend type;
- remote save root;
- normalized local backup and restore roots;
- a local link/context identity that changes when setup switches accounts or namespaces.

The five path/type/name values are necessary but not sufficient for an account relink under the same remote name. Ordinary OAuth token refresh must not invalidate agreement.

A changed context invalidates agreement as overwrite permission. It does not erase retained saves or replay an old pending plan against the new destination.

**Establish agreement on verified equality as well as on verified transfer.** Otherwise, a device upgraded while local and cloud bytes already match never obtains a baseline, and its first later edit unnecessarily becomes “never agreed → ask.” That gap follows directly from the current schema’s transfer-only wording. [S03 §2–3, §9; S11]

### 4.5 Schema and parser discipline

The next schema revision must cover:

- owner versus immutable producer metadata;
- complete unit membership and container identity;
- screenshot hashes and verified pairing;
- current retirement notices;
- agreement established by equality;
- sync-context binding for local control state.

Read schema 1 conservatively and preserve unknown values. Refuse unsupported higher schemas for mutation. Reject absolute paths, traversal components, unsafe links escaping the root, and malformed member sets. Do not turn a parse failure into an empty manifest.

These are schema changes requiring a new refinement of D-CLOUD-031, not merely implementation detail.

---

## 5. Classification and deletion semantics

### 5.1 The classifier works on units

Let:

- **L** be the verified local member map;
- **C** be the current verified cloud member map;
- **A** be the last verified common map in this sync context.

Before this comparison, reconcile unambiguous moves by equal version hashes within the same game/core repository.

| Condition | Outcome |
|---|---|
| L = C | Identical. Establish or refresh agreement from that equality. |
| L ≠ C; A known; L = A | Cloud changed. Eligible for verified download. |
| L ≠ C; A known; C = A | Device changed. Eligible for verified upload. |
| L ≠ C; A known; both differ from A | Genuine fork. Player decision required. |
| L ≠ C; no A | Never agreed. Player decision required. |
| One side has a genuinely new unit; complete evidence confirms absence on the other; no prior presence or retirement contradicts this | One-way transfer. |
| A previously present unit is now absent without recorded intent | Unexplained absence. Hold mutation; do not infer deletion or treat it as a new upload. |
| A matching, explicit retirement targets the unchanged version | Apply the retirement through preservation and verification. |
| A retirement for X encounters Y at a relevant occurrence | Stale operation or delete/edit conflict. Never delete Y under X’s authorization. |
| Listing, membership, manifest, or byte evidence is insufficient | Unknown/pending. Not “identical” and not “no conflicts.” |

For a two-file save:

- A = `(a₀, b₀)`
- L = `(a₁, b₀)`
- C = `(a₀, b₁)`

Both complete maps changed, so this is a conflict. “Mark the unit divergent if any individual file is divergent” misses it and silently synthesizes `(a₁, b₁)`, a save neither device produced.

### 5.2 Explicit deletions propagate; unexplained absence does not

V1 honors an ES deletion across the synced library.

The delete operation records, before removing bytes:

- an operation ID;
- the issuing device and sync context;
- the game/core or save-unit scope;
- the exact version and occurrence being retired;
- whether an equivalent intended occurrence remains.

The live deletion wording must make its synced-library effect clear. Reuse an existing confirmation if there is one; do not add a second confirmation inside conflict resolution.

A remote or peer-side retirement is conditional on the expected version still being present. A new occupant turns it into a stale operation or conflict.

This is the minimal machinery needed to distinguish an intentional delete from a missing card or unexplained missing file. The latter is a reason to stop, not a reason to abandon deletion propagation.

**Depth limit:** retirement notices are current deletion intent, not an ancestry chain. They may need to outlive an offline device; they are not pruned by the discard-history count. V1 does not build acknowledgement vectors or distributed garbage collection. If a control-state limit prevents retaining necessary intent, stop further automatic retirement rather than silently dropping it.

A future intentional restore is a **new publication**, possibly of the same SHA-256 version. A retirement is not a permanent stigma on those bytes.

The actual `GuiSaveState.cpp` deletion call site is not embedded. Its reported location must be inspected before implementing this hook. [S25; S11]

### 5.3 Compaction must converge on both sides

Apply D-CLOUD-030 to **numbered states within one game/core repository**:

- re-read and compare the relevant state bytes;
- retain the lower-numbered occurrence;
- remove the redundant higher-numbered occurrence on whichever side holds it;
- preserve correct screenshot association;
- log the operation.

Do not compact an auto resume point into a numbered state, or equal bytes across different games, cores, or save kinds.

Cloud-side compaction closes the upload/download/compact loop without requiring a move journal. ES’s net renumbering can ordinarily be recognized by equal hashes at changed paths. An ambiguous rename-then-edit loses some lineage detail, not safety: leave `replaces` unknown and classify conservatively.

### 5.4 No V1 cross-device resolution history

Suppose A and B diverge from X:

1. A compares both versions and chooses A’s.
2. B later compares A’s published choice with B’s version and chooses B’s.
3. A, unchanged since its own last agreement, sees the cloud change to B’s choice.

The correct result is an ordinary download of that later informed decision, retaining A’s replaced copy. V1 does not need to force another conflict merely to preserve A’s earlier preference.

A stale wizard cannot publish an old choice blindly: apply revalidates the exact inputs it showed. That is an in-flight operation check, not a permanent `resolves` history.

---

## 6. Transport, verification, and the watched exit path

### 6.1 Current remote evidence is mandatory before overwrite

Use native remote hashes when they can be matched to a verified stored-byte observation.

Use manifest claims, size, and mtime to:

- locate likely versions;
- identify obvious disagreement;
- prioritize required reads.

Do **not** use them alone to certify unchanged content on a hashless backend.

For a hashless unit whose canonical version might be overwritten, fetch its current bytes to a fresh, candidate-scoped location and hash them. The read must not be silently skipped by rclone’s own size comparison. The corpus’s same-size archive defect is precisely the counterexample to relying on a successful copy command here. [S29–S30]

A full verify on a hashless backend may ultimately read the whole eligible save library. Candidate-scoped staging limits what the exit path reads; it does not make that full-pass cost disappear. Use the long-transfer surface when the measured work warrants it.

Computing a backend-native hash locally can be a useful optimization if rclone’s installed version supports it correctly. It cannot reveal whether the cloud has changed since the last observation. Test it; do not make it a prerequisite or use it to eliminate fresh remote evidence.

### 6.2 Exact selections, not a bare manifest include

For exit uploads, the selected set consists of approved changed payloads, their required companions, and our own manifest when dirty.

Use an exact file-list interface, such as a proven `--files-from` mode, against a frozen candidate bundle. Test its behavior with the deployed rclone, filters, nested paths, spaces, and Unicode before adopting it.

Do not add a lone `--include` for the manifest to an otherwise broad save copy. The rule document explicitly warns that an include excludes everything it does not match. [S09]

Enforce these invariants independently of optional `RCLONEOPTS` and user defaults:

- mandatory save membership restrictions;
- no foreign-manifest upload;
- no engine temporary files;
- no ES `.state.auto.bak` transients;
- no other sync clients’ conflict artifacts;
- no restoration outside the intended local root;
- no raw conflict-resolution or delete flags supplied through a customization.

The existing helper places user rules before defaults, and a non-empty options array can replace the fallback containing `--filter-from`. A new default exclusion alone does not close either hole. [S29–S32]

### 6.3 A manifest is not a transaction commit

An owned manifest may ride with the selected payload. It may arrive first.

That is safe only because:

- no reader chooses a cloud head by manifest timestamp;
- no reader advances agreement merely because a manifest arrived;
- a declared unit must be checked as a complete map;
- a manifest/payload mismatch becomes pending evidence;
- producer metadata is attached only to matching bytes.

A separate manifest-last `copyto` may be useful if measurement shows an operational benefit, but it is not a load-bearing commit protocol and does not deserve an extra exit-path process by default.

`remote_hash: null` remains valid. Save a verified native-hash association in local agreement when available; do not create another upload or listing solely to fill a display-independent field.

### 6.4 Exit behavior

**Idle**

1. Complete local capture.
2. Check for dirty payloads, pending required operations, and existing unresolved choices.
3. If there is no new work, start no rclone process.
4. Say **“No new saves to upload,”** not “The cloud is fully in sync.”

If choices or verification are already pending, say so instead.

**Changed**

1. Freeze the candidate units locally.
2. Acquire the cloud lock.
3. Obtain current cloud evidence for those units.
4. Upload only units classified as device-changed or safely new.
5. Leave forks and insufficiently verified units pending.
6. Verify the actual result before advancing agreement.

This satisfies #22’s reported acceptance criterion that a both-sides-changed save is **refused**, not silently resolved, on game exit. Recoverable overwrite is not an alternative interpretation of that criterion. [S05 §5; S23]

**Budget rule**

- Preserve the approximately five-second no-change experience; target zero rclone starts there.
- Measure changed paths against the existing approximately seven-second one-save observation rather than inventing a two-process or five-second guarantee.
- If sufficient verification exceeds the agreed foreground budget, leave that unit pending for the boot/menu full pass.
- The card must say it is waiting, not that the save is safe in the cloud.

Measure process starts, backend requests, bytes read, and wall time separately. `--backup-dir` may add no rclone process while adding costly remote work. [D-CLOUD-028; S09]

### 6.5 Reachability

Keep the exit path’s fast local check; do not replace it with a ping.

For a literal endpoint address, a kernel route lookup can recognize a connected LAN route without a default gateway. For an endpoint not known locally, do not start a DNS-and-ping sequence merely to decide whether to start the real work.

A missing default route does not prove that every hostname-based LAN service is unreachable. The safe response is a truthful pending/skip outcome, with a bounded real operation available on the explicit full pass. Capture still happens.

### 6.6 Preservation and concurrency

Before deliberate replacement, the engine already holds verified input copies and metadata. Add a tested `--backup-dir` guard to replacement transfers in both directions, using unique device/operation components and a non-overlapping destination.

Validate archive-prefix derivation for both path-based and bucket-based remotes; a string that works beside `/ROCKNIX/Saves` is not automatically valid when the configured root is a bucket root.

**What this claims:** recovery of planned preimages, and any additional race preservation demonstrated by the backend test.

**What it does not claim:** cross-device exclusion, compare-and-swap, or linearizable multi-object publication.

The preservation gate has three outcomes:

| Outcome | Action |
|---|---|
| All known inputs and an injected intervening head survive the tested kill/race points | Use the mechanism for that tested backend behavior; document the remaining one-player concurrency assumption. |
| Unsupported or ambiguous preservation behavior | No canonical replacement through that path until a verified alternative exists. Keep the local candidate pending. |
| An injected head disappears from all expected locations | Stop the unsafe path. Investigate a narrowly scoped preservation change or obtain an explicit supported-backend scope decision before release. |

Do not pre-build a protected-publication history for all 69 backends. Equally, do not call a lost update “recoverable” because a lineage record can describe the bytes that vanished.

### 6.7 Bisync’s role

Run the spike against rclone 1.75.0 with:

- genuine both-sides changes;
- compressed `#RZIPv` states;
- renumber-like moves;
- same-size edits;
- excluded files;
- first-run state;
- interrupted runs;
- filter changes;
- `--recover` and `--resilient`.

Observe the actual files and listing state, not just the log.

The default `--conflict-resolve none` is not, by itself, proof of a non-mutating detector API. The embedded material supplies flags and design expectations, not the required run. [S05; S16; S23]

Bisync may later earn a bulk-transport role if it simplifies the implementation without bypassing the unit classifier or creating a second agreement authority. Otherwise, use exact rclone copy operations.

There is no production `bisync … || bisync --resync` path. No code edits bisync’s private listing files to manufacture agreement. Its workdir, if used, is explicit, persistent, and bound to the sync context.

---

## 7. The wizard, safe merging, and interruption

### 7.1 Presentation

Keep the established IA:

- system → game walkthrough;
- cloud always left;
- actual state screenshot or appropriate glyph;
- date/time, device/model, emulator/core/build;
- no size or play-time comparison;
- KEEP LEFT / KEEP RIGHT / KEEP BOTH;
- KEEP BOTH disabled with a reason for in-game saves and unsupported state formats.

For a shared memory card, the heading names the container. It must not imply that the choice affects only the game most recently played.

Retain an **explicit choice** requirement; do not preselect a side by time, size, compatibility, or progress heuristics.

For an auto-state conflict:

- KEEP LEFT makes the cloud version the resume point.
- KEEP RIGHT keeps the device version as the resume point.
- KEEP BOTH keeps the device’s `.state.auto` and places the cloud version in a numbered slot with its PNG.

The KEEP BOTH explanation and done page name that outcome. There is no resume-side sub-choice.

### 7.2 Trigger and cancellation wording

Proposed IA revision:

- **Explicit SYNC:** after the non-conflict preparation completes, open the wizard if choices are needed.
- **Boot/game exit:** leave a durable pending result and visible indication; do not ambush the player with a walkthrough.
- **Kid/kiosk mode:** do not silently resolve because the settings route is hidden. Preserve the pending work until an authorized user enters full UI. [S13]

Clarify the contradictory “nothing transfers” wording:

> Cancelling before COMPLETE discards the walkthrough’s decisions. It does not apply any conflict resolution. Non-conflicting sync work completed before the walkthrough remains completed.

Preview downloads into staging are not canonical resolution, and need not be undone.

### 7.3 Pre-pass and slot safety

Before allowing KEEP BOTH, require a complete, verified inventory for the affected game/core repository and finish downloading its cloud-only states.

This establishes the free-slot premise for that snapshot. It does not prevent another device creating a slot later. Apply therefore revalidates cloud inputs and destination occupancy.

An interrupted pre-pass cannot open the wizard with “probably complete” inventory. Resume preparation or leave it pending.

Allocate multiple KEEP BOTH outputs as one collision-checked plan, or sequentially with a repository refresh after each installation. Repeated calls against an unchanged repository must not reserve the same slot twice.

### 7.4 Checked ES adapter: acceptance contract

The adapter must satisfy all of these:

1. **Use ES’s repository/config naming conventions**, including `firstslot`, rather than inventing an independent slot convention.
2. Refresh inventory at the appropriate boundary.
3. Handle an enabled **auto-only repository**: its non-empty vector contains no non-negative slot, so today’s allocator returns `-99`; allocate from `firstslot` instead.
4. Validate the proposed slot against actual occupancy. The scan to 99999 is not an unlimited-allocation proof, and does not justify a product cap of 99.
5. Copy first and verify destination bytes and screenshot; only then retire a source.
6. Do not trust `copyToSlot`’s `true` after an attempted copy or rename. The function discards those operations’ return values.
7. Ensure the destination is the **real configured repository**, not the staging directory. `makeStateFilename` derives a full path from `fileName`’s parent.
8. Reject unsupported standalone save-state allocation rather than forcing it through a repository enabled only for RetroArch.
9. Keep auto-state and numbered-state semantics separate.
10. Check save-state/PNG pairing, and never display an old or substitute image as the chosen version’s screenshot.

These requirements are grounded in the supplied implementations. The headers defining default arguments are missing and must be inspected. [S37–S39]

Prefer repairing the shared primitive or adding an explicit destination-aware checked adapter over duplicating its template logic in shell. Stage locally under an engine-controlled temporary name when necessary; exact transfer selection must exclude that temporary file even though the broad save allowlist would admit it.

### 7.5 Apply is a recoverable operation, not an atomic cloud transaction

At COMPLETE:

1. Freeze choices, expected input maps, output paths, and retained locations.
2. Revalidate the local and cloud inputs and destination reservations.
3. Verify required preimages and retained metadata are durable.
4. Write an audit **intent** record before destructive work.
5. Apply one coherent unit at a time.
6. Verify resulting payloads and companion files.
7. Advance agreement for verified units.
8. Finalize retained-copy records and the typed result.
9. Prune only eligible completed retention entries.

The frozen plan is the apply journal. Do not build a second overlapping journal.

Power loss after COMPLETE is not equivalent to cancelling the walkthrough. Recovery examines the durable plan and actual before/after hashes. It completes or safely stops the interrupted unit before that unit is offered for play. It never overwrites an unexpected new local version to make the journal look complete.

A multi-file local installation need not pretend that several filesystem renames are atomic. Quiescence, durable preimages, and recovery before gameplay supply the required boundary.

The two minimum kill points, adopted from `gemini-revised_plan-r2.md`, are:

- after local replacement but before remote publication;
- after remote publication but before agreement advances.

---

## 8. Retention designed for the later reader

### 8.1 V1 contract

**V1 keeps discarded copies by default and provides no restore control.**

The done page names the discarded copy or set, names what won or where KEEP BOTH placed the additional state, and says that the discarded copies are kept **on this device**.

The retention setting remains outside the conflict walkthrough. If the player deliberately disables post-completion retention, transactional preimages still remain until apply has been verified; the done page must describe the actual outcome rather than claim copies were kept.

### 8.2 Store location

Use a dedicated durable data location, proposed as:

`/storage/.local/share/rocknix/cloud-saves/`

with separate `discarded/`, `preimages/`, and `pending/` areas.

This is a **proposed new path**, not an existing corpus artifact.

Reasons:

- outside the save and content transfer roots;
- outside the settings-backup convention described in the corpus;
- not under a directory whose documented convention permits regeneration or invalidation as a cache.

The real backup and cleanup tooling is not all embedded, so exclusion and upgrade survival remain acceptance tests. [S02 “Where state lives”; S04; S11]

If implementation retains the earlier `.cache/cloud_sync/discarded` placement instead, it must explicitly exempt that subtree from cache invalidation. My recommendation is to avoid giving irreplaceable data a disposable-cache home in the first place.

### 8.3 Record shape

Use a unique record ID, not a timestamp as identity. Each finalized retained set includes:

| Data | Required content |
|---|---|
| **Record identity** | Schema, record ID, operation ID, resolving device, sync-context reference |
| **Picker grouping** | System, supplied ROM filename and content locator where known; unit ID and unit kind; shared-container label where applicable |
| **Original placement** | Original relative paths, core repository, numbered slot or `auto`; final destination mapping when relevant |
| **Payload** | Every retained member’s stored-byte SHA-256, size, and local stored location |
| **Producer snapshot** | Device ID, label/model/family, emulator/core/build, capture times, clock confidence, and explicit unknowns—copied inline at retention time |
| **Preview** | Retained PNG location and hash, or an explicit absence; no lookup of the game’s latest thumbnail |
| **Decision** | KEEP LEFT / KEEP RIGHT / KEEP BOTH or non-conflict replacement reason; which side won, winner map/hashes, and known winner producer metadata |
| **Retention reason** | Conflict loser, verified one-way replacement, explicit deletion, or redundant occurrence retirement |
| **Completion** | Prepared versus finalized state, with verification results sufficient to distinguish a complete retained set from interrupted work |

The record does **not** depend on:

- a current manifest still mentioning the loser;
- the rotating audit log;
- the active apply-plan file surviving forever;
- a filename timestamp being correct.

Keep this record beside the bytes after successful apply. Remove the in-flight plan only after the finalized records and agreement updates are safely in place.

**Yes: a later restore tool can drive a picker from this store.** It can group by game or container, show the old side’s metadata and screenshot, identify the original slot and winning side, and compare the retained version with the then-current one without reconstructing history.

### 8.4 Count and pruning

Propose an initial count of **three completed discard events per logical retention bucket**, not three globally.

- An in-game unit or shared container has its own bucket.
- An auto resume point has its own bucket.
- Renumberable numbered states use a game/core collection bucket rather than an ephemeral slot path.
- One walkthrough apply affecting several numbered slots in that bucket retains its discarded set as one event, with each original slot recorded.

This avoids losing a game’s recovery copy because three unrelated games synced, and avoids renumbering moving retention between arbitrary path keys.

Routine transport preimages do not consume the conflict-discard allowance. Keep the immediate verified replacement preimage separately; do not let routine downloads evict the latest player-decision recovery set.

Prune by local commit order in a small ordered index, not by wall-clock timestamps. A wrong RTC must not make a newly discarded copy appear oldest.

**Unresolved candidates and incomplete transactions are exempt from rolling-count pruning.** If storage cannot accommodate required preservation, stop the affected sync mutation. Do not free space by deleting the only unreviewed copy.

### 8.5 Separate history-restore issue

Create a separate issue, without inventing its number here:

- enter from outside the conflict-resolution moment;
- choose a game/container and a retained version;
- reuse the compare-and-choose surface against the current version;
- restore through the same verification and preservation engine;
- treat restoration as a new explicit publication, even if its bytes equal an older version.

V1 implements the store contract and tests its future-reader projection. It does not implement this screen.

---

## 9. Migration and explicit decision changes

### 9.1 Cut over all save writers together

D-CLOUD-029 stands. There is no interim `--update` patch presented as conflict safety.

Capture can be developed in **shadow mode outside the synced tree** while the shipped paths remain. Do not publish a new control format into a tree still handled by unrestricted legacy bulk transfers and call that a safe partial rollout.

At activation, route all save-writing entry points through the same engine:

- boot;
- game exit;
- UPLOAD / DOWNLOAD / SYNC rows;
- the hub’s SAVE DATA actions;
- Tools/script entry points;
- #37’s save-state-manager sync action;
- any later shutdown pass.

No raw method flag or old ES command may bypass the classifier.

| Existing behavior | New home |
|---|---|
| Cloud-before-local ordering in two-way sync | Classify the verified L/C/A maps before any write; apply only the approved direction |
| Cloud lock | Preserved in the shared coordinator |
| Exit window | Hash-selected dirty units; mtime is not overwrite authority |
| Fast offline answer | Local route check, after capture |
| Save-only exit operation | Preserved; no system archive work on exit |
| Last-run stamps | Typed, verified results written to the established local status locations |
| Allowlist and restore exclusions | Mandatory engine invariants, not optional user arguments |
| Conflict-client exclusions | Enforced in the saves tier as well as content |
| Default copy safety | Exact approved transfers plus preservation; no unchecked mirror behavior |

The supplied scripts pass raw rclone exit codes through to a UI that reserves 3 and 4 for skips, and their final exits can mask a system-phase failure. Normalize script outcomes rather than preserving those ambiguities. [S29–S30; S40]

Each result contains a caller-issued run ID and sync-context ID. A missing, stale, malformed, or mismatched result is **unknown/failed**, never success. Keep raw rclone codes as diagnostic data.

### 9.2 Keep #10 in this drop, last

D-CLOUD-017 still earns its place. A sync detector cannot recover a state that one core already overwrote locally before capture.

But shipping `es_savestates.cfg` is not just a directory edit:

- compiled `Default()` enables autosave, incremental states, and `racommands`;
- XML parsing changes those defaults and hard-codes `racommands = false`;
- ES scans configured directories rather than recursively discovering every new core directory;
- RetroArch’s writer must use the same layout. [S37–S39; S04]

Therefore:

1. Rehearse the actual launch behavior first.
2. Preserve auto-resume, numbered-slot loading, and incremental-state behavior deliberately.
3. Read both legacy flat and new per-core layouts.
4. Write new, known-producer states into the core layout.
5. Keep old states honestly `unknown`; do not assign them to whichever core is default today.
6. Move known data only by copy, verification, then removal.

If the rehearsal fails, do not ship the naive XML. Bring the demonstrated obstacle to the maintainer as a proposed change to the drop’s scope. The directory decision itself need not be reversed.

### 9.3 Preserve split-root import behavior

The shipped config explicitly documents different `BACKUPPATH` and `RESTOREPATH` values as a way to restore elsewhere. [S33]

- Two-way reconciliation requires one coherent local root and refuses a split-root configuration as a two-way sync.
- An explicit download to the separate restore root remains a **one-way import**.
- It does not advance the main root’s agreement record.
- A populated import destination still receives preservation and conflict checks; “import” is not permission to overwrite arbitrary existing data.
- Do not silently rewrite the owner’s chosen paths.

### 9.4 Register actions

Use new append-only refinement rows; the labels below are proposals, **not assigned decision IDs**.

| Existing decision or specification | Required change |
|---|---|
| **D-CLOUD-031** | Reopen/refine the schema semantics: verified equality establishes agreement; union means claims rather than last-map-wins; distinguish owner from producer; add complete unit membership, screenshot binding, retirement intent, and local context binding. The disjoint-member fork and equality-bootstrap traces justify reopening it. |
| **D-CLOUD-030** | Refine compaction scope to numbered states in one game/core repository, on both sides, after verification. Do not collapse auto and numbered roles. SHA-256 identity itself is unchanged. |
| **D-CLOUD-028** | Refine the exit implementation: hash-selected changes and zero network work when idle; current remote evidence is allowed on changed units; defer expensive safe work rather than overwrite unread heads. Keep the local, immediate offline posture. |
| **D-CLOUD-014 / D-CLOUD-015** | Explicitly retire unchecked save-tier mirroring as an automatic writer. A legacy `sync` setting cannot authorize unclassified removals or overwrites. Default upgraded configurations continue on guarded sync; a deliberately requested operation requiring additional mirror deletions is refused rather than silently executed. No new mirror UI is added in V1. The justification is the shared-library/progress rule, not a detached-card edge case. |
| **D-CLOUD-024 and IA rev 4; #25 scope** | Record the authoritative amendment: retention on by default, count-bounded; no V1 restore control; the later restore tool is separate. Amend the IA for queued unattended conflicts and precise cancellation wording. Retention was not decided by D-CLOUD-027. |
| **#9 / #22 / IA bisync mechanism** | Request explicit approval to make our unit classifier authoritative and #9 a transport/spike dependency rather than an unconditional bisync-adoption dependency. No register row currently decides the detector, but this still changes the stated approach and needs more than a body edit. |
| **Explicit deletion propagation** | Add a new policy row covering version-specific intent, stale-target refusal, and unexplained absence. This extends behavior; it is not implied by a file disappearing. |

**No reopening requested:** D-CLOUD-009 identity; D-CLOUD-017 core-based layout; D-CLOUD-025 hardware compatibility gate; D-CLOUD-026 copy–verify–delete; D-CLOUD-027 audit location/rotation; D-CLOUD-029 temporary shipped posture.

---

## 10. Proof program

### 10.1 Before production implementation: ordered gates

Disposable probes are allowed to answer substrate questions. They are not evidence that the eventual integrated implementation works.

| Order | Experiment and device | Owner / before | Required result or branch |
|---|---|---|---|
| **0** | Obtain the missing sources; run pure fixtures for unit-map classification, equality bootstrap, stale retirement, record projection, and exact selection | #20 / #22, before schema revision is accepted | Disjoint-member edits conflict; equality establishes A; stale retirement never removes another version; retained records alone supply picker data |
| **1** | Repair and execute `tools/cloud-round-trip` on a disposable GENERIC_X64 VM against loopback WebDAV and MinIO | #35, before #22 | Actual keys and bytes agree with assertions; positive transfers accompany exclusion tests; no false success |
| **2** | On the reported H700 pair, trace new-game, numbered-slot, and auto-resume launches using disposable content; record files, hashes, actual command/core, and ES cleanup | #21 / #24, before capture and adapter design is finalized | Establish which bytes exist during and after launch; reproduce auto-only allocation behavior; determine capture’s safe point |
| **3** | rclone 1.75.0 bisync, exact-selection, checksum, and `copy --backup-dir` probes: VM → WebDAV/MinIO; H700 → disposable Dropbox prefix | #9 / #22, before transport selection | Record real mutations, listing state, unsupported interfaces, verification behavior, and interruption results |
| **4** | Two-H700 interleaved writes on Dropbox; two disposable clients for the loopback backend; kill at preservation/publication boundaries | #22, before replacement transfers are enabled | Every injected head remains available, or take the failure branch in §6.6; no unearned atomicity claim |
| **5** | H700 shadow census across actual launch habits, including repeated sessions and a same-size save change | #21 / #22, before exit-path activation | Measure local scan/hash cost, rclone starts, requests, bytes, wall time, unknown rate, and forks by kind; set the foreground deferral threshold |
| **6** | Same-chipset compatibility control on RG35XX SP ↔ RG-SP; then RG351M/RG353M directed pairs, same build/core; version mismatch and corruption tests | #19, before badge severity is designed | Record loud refusal, visibly wrong load, or successful continued operation. Repeat with a second core; do not generalize one core to all |
| **7** | #10 launch/layout rehearsal on H700, then another family: compiled-default behavior versus proposed config, legacy and new layouts both populated | #10, before per-core writing is enabled | Writer and reader agree; auto/incremental behavior preserved; no false provenance or hidden legacy state |
| **8** | Physical RG351M recognition and controller walkthrough, plus 640×480 validation | #23, before UI acceptance | Pictures are recognizable, choices are unambiguous, long names and unknown metadata fit; otherwise add inspection/zoom without swapping source roles |
| **9** | Integrated clean-install and upgrade fault campaign on VM, then H700: pre-pass interruption, multi-choice KEEP BOTH, ES death with emulator alive, apply kills, retry, full storage | #22–#24, before release | Original and selected bytes remain recoverable, no stale result says success, no wrong-slot writes, no re-launch into a partially installed unit |

D-QA-002 remains binding: the QA WebDAV stays on loopback. Do not expose its credential on the LAN merely to make a hardware test convenient. Use the VM for that backend and a disposable real-remote prefix for hardware. [S06]

### 10.2 The eleven known unknowns, explicitly resolved or gated

| Known unknown | Plan and interim behavior |
|---|---|
| **1. Chipset compatibility and loud/silent failure** | Gate 6. Same-chipset control first, then same-build cross-chipset tests and a second core. A matching build pin is context, not universal proof of compatibility. Until measured, show compatibility as unverified rather than safe. |
| **2. Bisync, compressed states, rename, interruption, agreement overlap** | Gate 3. Inspect real files and bisync state. Our agreement remains the only classifier authority regardless of the result; ordinary exact rclone transfers are the fallback. |
| **3. Auto-state conflict frequency** | Gates 2 and 5. Numbered-slot launches can restore the pre-session auto file; the schema’s “every session” claim is not generally established. Label `auto` as a resume point regardless of frequency. |
| **4. KEEP BOTH pre-pass sufficiency and interruption** | Gates 0 and 9. Complete relevant inventory, positive pre-pass completion, apply-time revalidation, unique reservations. Interrupted preparation leaves the wizard closed/pending. |
| **5. Missing `es_savestates.cfg` and two-consumer layout** | Gate 7. Inspect actual launcher configuration and preserve launch semantics, not just paths. Read old layout while writing new. |
| **6. Build pins and actual emulator/core capture** | Before #21, verify generated pins against the installed packages and build override resolution. Inspect the emitted artifact on H700. Gate 2 proves launch-context wiring, including core overrides. Unknown mappings stay unknown. |
| **7. `BACKUPPATH == RESTOREPATH`** | Gate 0 plus VM import tests. Require equality for two-way reconciliation; preserve split-root one-way import without advancing main agreement. |
| **8. Standalone multi-file layouts** | Before automatic classification, inventory PPSSPP, Dreamcast VMU, N64, and PSX outputs on devices that run them. Prove member boundaries and allowlist completeness. Unknown layouts remain pending, not independently merged per file. |
| **9. 480×320 recognizability** | Gate 8 on the physical RG351M. VM frames prove layout, not human recognition. Add a larger inspection view if needed while preserving cloud-left/device-right semantics. |
| **10. Two devices online at once** | Gate 4, plus lifecycle and ES-death tests in Gate 9. No distributed-lock claim. Required preimages and tested preservation are the V1 safety floor. |
| **11. Never-run round-trip suite** | Gate 1. Fix the harness before treating it as evidence. Keep it off a configured player device. |

### 10.3 The round-trip harness needs repair before its first authoritative run

The supplied harness is not merely “waiting to be run.”

Source-visible problems include:

- It overwrites `rclone.conf` before asserting the selected remote, and does not restore it.
- Its archive-name expectations disagree with the uploader’s date-prefix behavior.
- It expects restore at the original undated name while the restore script keeps the selected remote name.
- It looks for a generated tar archive that its archive fixture does not create.
- Many script invocations omit `--yes`, discard output, and have no operation timeout.
- Some checks use basename presence rather than exact remote keys and bytes.

These are visible in the embedded harness and scripts. They are not executed failures I observed. [S29–S30; S36]

Use a disposable VM initially. If the harness is later permitted on populated hardware, it must inspect existing configuration before any overwrite, explicitly preserve and restore it even on failure, and independently guard every destructive test path.

### 10.4 Additional failures worth the cheapest experiment

| Failure not adequately settled by the current design | Cheapest revealing experiment |
|---|---|
| Same basename in two ROM directories maps to one local state path | Launch two disposable same-basename contents; inspect actual output paths before involving sync |
| Backend case folding or Unicode normalization creates false new/missing pairs | Round-trip case variants and normalized/decomposed names through a disposable backend prefix |
| A legitimate save-unit member is excluded by `*.db` or another broad rule | Plant a measured unit with that member; assert the engine refuses incomplete-unit synchronization |
| Thumbnail is stale while the state changed | Change only the state, then only the PNG; assert no mismatched preview is presented as authoritative |
| Temporary `.auto` or `.bak` bytes leak during a session | Launch a numbered state while requesting boot/menu sync; inspect transferred keys and hashes |
| A cloned card creates two writers for one manifest ID | Boot two disposable installations with the same stored ID; force differing own-manifest state; verify refusal, not last-writer-wins |
| Staging and destination are on different filesystems | Put them on different mounts; interrupt installation; verify copy-and-check rather than assumed atomic rename |
| Wrong clock prunes the newest discard | Move time backward between two resolutions; verify pruning follows commit order |
| Save root disappears or is replaced with a different populated root | Simulate the change in a VM; verify missing/foreign-root evidence does not authorize deletion |
| Empty or stale result file produces success | Kill before result publication and replay a result from another run ID |
| Save manifests arrive before their payload or remain after a failed upload | Deliberately reorder/interrupt publication; readers must report pending evidence, not a clean sync |
| Thirty conflicts induce wrong-side muscle memory | Controller-only walkthrough with repeated and mixed save kinds, including unknown provenance |
| A compatibility test “loads correctly” but corrupts a later save | Continue execution after load, write an in-game save in a disposable test, and reload it |

---

## 11. Build order and scope boundary

### Load-bearing V1

Build in this order:

1. **Repair the evidence base:** harness, missing-source inspection, pure classifier and store fixtures.
2. **Accept the schema and IA refinements.**
3. **Implement lifecycle coordination and shadow capture**, including build-pin emission and actual launch context.
4. **Implement the unit classifier, exact rclone adapter, typed results, retained-copy store, and recoverable apply.**
5. **Replace every save-writing path together.**
6. **Implement the checked KEEP BOTH adapter and wizard.**
7. **Enable per-core writing after #10’s rehearsal**, keeping legacy reads.
8. **Run integrated upgrade, interruption, two-device, and physical UI acceptance.**

The following must ship with the wizard:

- retention on by default, with self-contained retained metadata;
- no V1 undo control;
- content-based unit classification;
- equality bootstrap;
- current remote evidence before overwrite;
- correct handling of unknown evidence;
- safe ownership of manifests;
- lifecycle coordination;
- checked slot allocation and copy verification;
- recoverable interrupted apply;
- exact version-specific deletion and convergent compaction;
- truthful per-run results.

### Explicitly not V1

- history-restore UI;
- multi-generation resolution receipts;
- vector clocks or a version DAG;
- a shared or local SQLite history index;
- a full remote staging mirror as the default architecture;
- a daemon;
- semantic merging of binary game saves;
- automatic progress/recency heuristics;
- a 99-slot product cap;
- a separate auto-state KEEP BOTH decision;
- move hooks solely for ancestry fidelity;
- distributed deletion-acknowledgement vectors;
- universal linearizable publication across all rclone backends;
- automatic `--resync`;
- a legacy transfer bypass when the new guard cannot run.

The recommendation is deliberately small in persistent machinery: **current observations, one agreement baseline, explicit deletion intent, one in-flight plan, and bounded retained copies with their own metadata.** That is enough to protect the decision the player just made without turning the handheld into a version-control client.

---

## 12. Gaps to surface to the orchestrator

Before implementation, obtain:

1. **`GuiSaveState.cpp`**, the save-state headers, and filesystem copy/rename utilities: delete hook, default arguments, return semantics, and timestamp behavior.
2. **`Paths.cpp`, RetroArch configuration, `setsettings.sh`, ES system configuration, and full launch/startup plumbing**: shared lifecycle ownership, boot handoff, and #10’s two-consumer layout.
3. **rclone 1.75.0 source or authoritative documentation** for bisync, `copy --backup-dir`, exact file-list filtering, native hashing of local files, and relevant backend behavior. The corpus cannot establish rclone’s future roadmap.
4. **The defaults files, content scripts, `cloud_setup`, `backuptool`, and `tools/cloud-test-backend`**: mandatory filtering, account-context invalidation, retention-store exclusion, and harness safety.
5. **The current issue bodies.** The embedded issue files predominantly contain comment-thread output. The futro supplies reported acceptance changes, but their exact current bodies are not independently present.
6. **`docs/es-ui-style-guide.md`** for final visual design.
7. The earlier revised plans if a verbatim audit of their claims is required. Here they are known only through the injected reviews.

No missing source has been assigned a fabricated declared path, hash, or test result.

---

## `corpus.provenance.json`

```json
{
  "artifact": "gpt-revised_plan-r3.md",
  "delivery": "inline; no filesystem artifact was created by this member",
  "role": "council member, round-3 revised foundation",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "SHA-256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 map in order to the corresponding same-index entries of source_file_paths and source_file_hashes; S01 is array index 0",
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
  "injected_reviews": [
    {
      "filename": "claude_peer_review-r3.md",
      "sha256_provided": null
    },
    {
      "filename": "gemini_peer_review-r3.md",
      "sha256_provided": null
    },
    {
      "filename": "kimi_peer_review-r3.md",
      "sha256_provided": null
    },
    {
      "filename": "mistral_peer_review-r3.md",
      "sha256_provided": null
    }
  ],
  "prior_revised_plans_embedded": false,
  "revision_accountability_basis": "Quoted passages and attributions in the injected reviews; earlier plan files were not independently inspected",
  "peer_material_use": "Idea attribution and substantive critique only; not evidence of runtime behavior or of council/model behavior",
  "authoritative_prompt_amendments_applied": [
    "Preserve saves and empower player choice; one-step reversibility is the primary case; edge cases inform rather than unnecessarily constrain the approach",
    "V1 retains discarded copies ON by default with a count bound, ships no undo control, and names retained discards on the done page",
    "History restore is a separate later tool using the compare-and-choose surface; V1 retention records must support that future reader"
  ],
  "gaps_for_orchestrator": [
    {
      "material": "GuiSaveState.cpp, SaveState.h, SaveStateRepository.h, and filesystem copy/rename utility implementations",
      "reason": "Explicit-delete hook, default arguments, failure behavior, and timestamp preservation require inspection",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Paths.cpp, setsettings.sh, actual RetroArch and ES system configuration, full launch supervisor and startup/network handoff",
      "reason": "Lifecycle ownership and per-core layout must be proven against both the writer and reader",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 authoritative documentation or source for bisync, copy with backup-dir, exact file-list filtering, local backend-native hashing, and backend publication behavior",
      "reason": "These proposed interfaces and preservation claims are not established by the embedded help excerpts or existing mirror-mode use",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, and tools/cloud-test-backend",
      "reason": "Upgrade, filtering, account-context invalidation, retention-store exclusion, and test-environment safety need direct verification",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current standalone issue bodies and docs/es-ui-style-guide.md",
      "reason": "The embedded issue material mainly contains comments; current acceptance bodies and the full visual-design guide are not present",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Earlier revised plan artifacts, including gpt-revised_plan-r2.md",
      "reason": "Available here only through review quotations and descriptions, not as complete source artifacts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Executed results for the proposed classifier, preservation protocol, lifecycle gate, compatibility matrix, and integrated wizard",
      "reason": "No such results were supplied; all corresponding gates remain unpassed in this artifact",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "proposed_path_policy": "New runtime paths in the plan are explicitly proposals, not asserted corpus sources or existing artifacts",
  "missing_source_policy": "No missing declared source paths, hashes, contents, or execution results have been fabricated"
}
```

=== END gpt-revised_plan-r3.md ===

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
