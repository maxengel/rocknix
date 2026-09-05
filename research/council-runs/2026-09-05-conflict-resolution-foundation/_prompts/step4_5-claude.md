# Council — consensus integration

The council has settled on a base. `claude-revised_plan-r4.md` is that base, it
is injected below, and **you are not re-opening the choice**. Your job is to
produce `consensus_plan.md`: the base, with the other plans' contributions
integrated where they fit, and the ones that genuinely conflict listed as
conflicts rather than blended into false agreement.

The four members' closing assessments of the field are injected after the base.
Read them for the provisions they say should travel and for the defects they say
the base still carries. Judge those on their merits against the embedded corpus.

## Anti-self-citation constraint

Reason about the substance against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave, and do not describe or characterise the process that produced them.

## Two maintainer decisions bind this document

### Reversibility, and where it lives

> The goal is to preserve the sanctity of the user's saves and to empower them
> with the choice to make a decision about a conflict. Undoing that choice is
> also something a user should have the option to do. They likely aren't going
> to be going 8 steps back with the save, but may accidentally make the wrong
> choice with the conflict and want to undo that choice. That's going to be the
> primary use case.
>
> Some of the edge cases around card disconnection, and so on, are good to think
> about, but are edge cases that shouldn't constrain our approach unnecessarily.

> I don't want to add more complexity to the user during conflict resolution.
> The goal there is to get the user going as quickly as possible.

Version one retains the discarded copy, on by default, bounded by a count, and
ships **no undo control**. Restoring one is a separate tool with its own issue,
shaped as the wizard's compare surface pointed at a game's retained past
versions. The store is designed now for that reader; nothing in version one
reads it, so nothing will catch a shape the tool cannot use.

### Cost discipline — new, and binding on every fix below

> Those concerns seem valid. We need to not overcomplicate our solution in a way
> that adds undue complexity, computational, and memory overhead to our
> processes.

This is a handheld: busybox, an SD card doing the writing, and a five-second
budget on the path a player watches after exiting a game. So:

- **Name the cost of every safeguard you adopt** — process spawns, remote round
  trips, bytes copied, bytes held in memory, files kept on the card — and say
  what it buys. A safeguard whose cost you cannot state has not been designed.
- **Prefer the form that removes a rule over the form that adds one.** Where
  holding a case rather than promoting it makes the design smaller, that is the
  better fix, not the more cautious one.
- **Do not buy a guarantee the one-player model does not need.** Machinery for
  simultaneous writers, deep lineage, or version graphs is out.
- Where a fix genuinely costs something and is still worth it, say so plainly
  and state the price. One such fix is named below.

## The blockers the base must clear

The closing assessments identify defects in the base that must be fixed here,
not deferred. At least these:

1. **Capture must not hard-link a save into staging.** A hard link shares the
   inode, so an emulator writing a battery save in place afterwards changes
   bytes already treated as sealed and hashed. Require an independent copy, and
   upload the same bytes that were hashed. *This one costs real work per changed
   save at exit; state the price and pay it.*
2. **Testing that the session lock is free is not holding it.** Specify an
   acquisition-and-hold contract with an explicit lock order, and show that
   capture's independence from the transfer lock cannot deadlock.
3. **Repeated observation is not evidence of completeness.** The base promotes
   an incomplete or mismatched declared multi-file unit to an unknown-provenance
   one-way transfer after two unchanged full passes. An interrupted upload stays
   identically incomplete indefinitely. Remove the promotion and hold the unit,
   while letting unrelated work proceed.
4. **Distinct local backup and restore roots are a shipped, documented
   configuration**, not a hypothetical. Either support the two roles explicitly
   or fail closed for that configuration; never silently treat them as one tree.
   Carry the context binding to pending operations, not only to the agreement
   record.

Work through the closing assessments for any further defect of the base and
treat it the same way. Where a fix is claimed but its cost is not stated, state
it.

## Required shape

```markdown
# Consensus integration plan

## Winning plan as base

## Dissent primitives integrated into the base

## Dissents that conflict with the base

## Step 5 handoff content
```

Under **integrated**, credit each provision by the filename it came from and say
in one line what it costs. Under **conflict**, state both positions and why they
cannot both hold; do not resolve a genuine conflict by averaging. Under
**handoff**, give what the issues need: the load-bearing requirements, the
acceptance conditions, the ordered experiments, and the register rows that need
the maintainer's word — marked as proposals, since register IDs are the
maintainer's to assign.

Keep every claim's marking: what the corpus settles, what is a council position,
and what is unmeasured with the experiment that settles it.

Refer to members and artifacts by filename, never by an invented ordinal.

## The base

=== START claude-revised_plan-r4.md ===

# claude-revised_plan-r4.md — Cloud-save conflict resolution in ROCKNIX: the foundation to build

**Member:** the author of `claude-revised_plan-r3.md`. **Round:** 4, revised approach.
**Corpus:** the 42 sources embedded by the Facilitator, cited as `[Snn]`; `n` is the index into `source_file_paths[]` / `source_file_hashes[]` in the provenance block at the end. I did not re-read or re-hash anything; I did not run anything. The four injected reviews are treated as arguments about substance, cited by filename, and nothing here is drawn from them as evidence about how councils or models behave.
**The maintainer's two amendments** (the purpose restated; where the undo lives) are authoritative and are paid in §1.9, §3 and §4.

This document is meant to be built from without reading anything else. §1 is the foundation; §2 is the small set of genuine picks and their reasons; §3 is the ledger of what changed since round 3 and why; §4 the register consequences; §5 what is settled versus merely agreed; §6 the evidence, in order, that must exist before each part is built.

Throughout, **[L]** marks load-bearing parts — get these wrong and the milestone is unsafe — and **[O]** marks parts that can follow later without making anything unsafe.

---

## 1. The foundation

### 1.1 Ownership — one reconciler owns every writer of the save tree [L]

Today the save tree has four writers and none of them has a conflict rule: the boot pair (`cloud_restore --yes --method=copy --update` then `cloud_backup --yes --method=copy --update`, `[S35]`), the SYNC / UPLOAD / DOWNLOAD rows and the hub's SAVE DATA tick (the same scripts, `[S13]`), and the game-exit `cloud_backup --yes --saves-only --recent`, which is `copy` with no `--update` at all (`[S29]` lines under `--recent`; `[S41]`). Composed, they are a recency resolver (blindspot 28, `[S07]`), which is what the cardinal rule forbids (`[S17]`; `[S09]` *Preserve player progress above all*). D-CLOUD-029 keeps them as shipped until #22 replaces them wholesale (`[S06]`), and the maintainer is the only user until then.

The replacement is one program, `cloud_reconcile`, and **every** path that can write a save — boot, the three rows, the hub tick, the Tools symlinks (`/usr/config/modules/{cloud_backup,cloud_restore}.sh`, `[S09]`), the game exit, #37's future SYNC tile (`[S28]`), and a maintainer at an SSH prompt running `cloud_backup`/`cloud_restore` — reaches the save tree only through it. `cloud_backup`'s and `cloud_restore`'s saves phases become thin delegations to `cloud_reconcile` (their archive phases are untouched; the two scripts stay "structurally in sync" as the rule file demands, `[S09]`). The content scripts never touch saves; the round-trip assertion for that stays (`[S36]`, blindspot 21).

`cloud_reconcile` builds its own rclone argument list. It never sources `RCLONEOPTS`: a non-empty user value replaces the script's whole fallback option set today (`[S29]` `filtered_opts`), and the reconciler's transfers are `--files-from` lists that must not be widened by a user's `--filter-from` edit. The shipped allowlist `[S32]` remains the *outer* boundary on every transfer (passed in addition to `--files-from`), with two rules added ahead of `+ /savestates/**`: `- /**/*.bak` (ES's `.state.auto.bak` matches `+ /**/*.state*` and neither of ES's discovery regexes — `[S38]` `setupSaveState`, `[S39]` `SetupRegEx` — so today it syncs and is invisible), and the `- /savestates/.snapshots/**` rule the alignment review already asked of #25 (`[S04]` §3.1), kept for the future even though V1 retention is local.

**bisync is not the detector and is not a V1 transport.** The classifier below needs inputs bisync does not have — an agreement record per path, unit member maps, the thumbnail rule, retirement records, and `unknown` as a value — so "reading what bisync found" would be reading a coarser verdict and re-deriving ours. Adopting it as bulk transport would add a second listing state under `/storage/.cache/rclone/bisync` beside our agreement record (gpt_peer_review-r4.md §4 names this as the hidden second authority) and keep the `--resync` hazard the futro found (`[S05]` §4 step 2) in reach. Direct `rclone copy --files-from` does everything the reconciler needs. The #22 bisync spike still runs (§6, Gate 11) to record what bisync reports; its outcome cannot change the classifier. **This demotion is a council recommendation, not a decided row** — the IA doc (`[S02]` § Detection), the futro's #22 ACs (`[S05]` §5) and #22's own thread (`[S23]`) all say bisync detects; no register row binds it, so nothing is reopened, but the IA and #22's body need the edit and the maintainer should see the recommendation stated rather than discover it. #9's scope becomes "bisync evaluated as bulk transport only," and its Phase 3 "newer wins" is struck as the alignment review already required (`[S04]` §3.1; `[S16]`).

### 1.2 Identity, agreement, units [L]

**Identity** is D-CLOUD-030 unchanged: a save version is the sha256 of its stored bytes; slot and file name are attributes (`[S06]`; `[S03]` §1). **Shape** is D-CLOUD-031 unchanged: one JSON per device at `savestates/.rocknix/manifest-<device-id>.json`, entries keyed by path relative to the sync root, the local agreement record unsynced (`[S03]` §5).

Three refinements, all additive, all recorded as new rows citing D-CLOUD-031 (§4):

1. **Agreement is also written on verified equality.** The schema records agreement only on upload or download (`[S03]` §2), and its conflict table has no equality row (`[S03]` §3). An upgraded device whose saves already equal the cloud's would otherwise see "never agreed → ask" for every save it touches — an upgrade that is not invisible (`[S11]`). When L = C is proven (§1.5's evidence mechanisms), `agreed.json` records it. kimi_peer_review-r4.md §5.5 verified this gap; all four round-3 plans carry the fix.
2. **Units.** A *unit* is the set of files that must move together. Per entry, a `unit` field names it; at top level, `units: { "<id>": { "kind", "rom", "members": [paths] } }` declares the complete member list, because the per-file entries alone are not a member map (gpt_peer_review-r4.md §2.4). A numbered state's unit is the state plus its PNG; an auto state likewise; an `.srm` is a unit of one; N64 `.eep/.mpk/.sra` for one ROM are one unit; a PSX memcard is a unit with `rom: null` (it is shared across games); a Dreamcast VMU file and a PPSSPP `SAVEDATA/<id>/` directory are units whose members are the files inside. **The thumbnail is a member but not part of the progress identity** (`[S03]` §1 already excludes it): a unit whose state bytes are identical on both sides and whose PNGs differ is *not* a fork (mistral-revised_plan-r3.md's rule, via gpt_peer_review-r4.md §2.4); the PNG is reconciled toward the cloud copy so devices converge, and the audit log says so. Entries stay one per file, `kind` stays `state | auto | save` — a memcard is an in-game save to the player and the wizard's glyphs key on `kind` (`[S02]`). The `kind: "container"` row keyed by a directory with a single sha256 is not adopted: a directory has no stored bytes under D-CLOUD-030 and the schema keys one entry per file (`[S03]` §5); kimi_peer_review-r4.md §5.3 showed the row contradicts its own plan's classifier. The unit table above is a hypothesis about what standalone emulators actually write (known unknown 8, `[S01]`) and is inventoried on a device before capture is built (§6, Gate 12).
3. **Producer is not publisher.** The schema's `device.*` block is top-level (`[S03]` §6); an entry has no producer of its own. When device A KEEP-BOTHs B's state into a free slot and writes an entry for it, that entry reads as A-produced, and B's authorship survives only in an audit log that rotates at 1 MiB (D-CLOUD-027). An optional per-entry `producer` object — `{device: {id, label, model, family}, emulator, core, core_build, core_display_version, captured_at, captured_local, clock_synced}` — is written whenever the publishing device did not produce the bytes. Absent means "the manifest's own device produced it." `unknown` values are preserved, never guessed (`[S11]`). Credit: gpt_peer_review-r4.md §2.4 and kimi_peer_review-r4.md §5.2, which verified the gap against `[S03]`.

Two further per-entry fields: `published_at` (UTC; when this device last published this version at this path — distinct from `captured_at`), and, at top level, a bounded `retired` list (§1.8).

**Where manifests live locally.** Our own manifest is written to `/storage/.cache/cloud_sync/manifest-<id>.json` and staged for upload under the remote path `savestates/.rocknix/manifest-<id>.json`; foreign manifests are downloaded to `/storage/.cache/cloud_sync/manifests/`, not into `/storage/roms/savestates/.rocknix/`. Nothing under the sync root is a manifest, so a legacy `copy --update` pass on a device that has not updated cannot re-upload a stale foreign manifest, and no manifest can ever be compacted, renumbered or deleted by ES. (gpt_peer_review-r4.md §3 lifts this; it was mine in round 3 and stays.)

**Agreement, pending publication, pending apply** live in `/storage/.cache/cloud_sync/` — `agreed.json`, `pending-publish.json`, `pending-apply/<run-id>.json`. The rule for what belongs in `.cache`: **state whose loss fails closed.** Losing `agreed.json` degrades to "never agreed → ask" and the equality bootstrap rebuilds it silently for identical pairs; losing a pending-publish list makes the next full pass re-derive it from the local manifest against the cloud; losing a pending-apply record means an interrupted apply is recovered by hash inspection (§1.7). Retained copies do not meet that rule and do not live there (§1.9, §2 pick 1).

### 1.3 Classification [L]

Per unit, with *L* the local member map (path → sha256 over the unit's non-thumbnail members), *C* the cloud's, *A* the last agreed map:

| L vs C | A | Verdict | Action |
|---|---|---|---|
| equal | — | identical | write agreement if absent (equality bootstrap); reconcile PNG toward cloud if only PNGs differ |
| differ | L = A | cloud changed | download the whole unit; write agreement |
| differ | C = A | device changed | upload the whole unit; write agreement after verification |
| differ | L ≠ A and C ≠ A | **divergent** | queue for the wizard; transfer nothing |
| differ | A unknown | **divergent (never agreed)** | queue; the conservative branch, per #11 |
| device only, A absent | — | new here | upload |
| cloud only, A absent | — | new there | download (to its path, or to the next free slot if the path is occupied by a different hash — §1.7) |
| cloud only, A recorded presence, an applicable `retired` record exists (§1.8) | — | deleted elsewhere | retire locally: copy to retention, verify, remove |
| device only, A recorded presence, applicable `retired` record | — | deleted here (propagating) | retire in the cloud: copy-verify-delete into the `-replaced` sibling |
| one side only, A recorded presence, **no** applicable record | — | **unexplained absence** | **hold and report**: transfer nothing, delete nothing, count it on the row/done page |
| declared in a manifest but members incomplete or hash-mismatched in the cloud | — | torn (in flight or interrupted publication) | wait; do not install; escalate to `unknown`-provenance one-way only after two consecutive full passes see the same incomplete set |
| Dropbox "conflicted copy" / Syncthing `.sync-conflict-` | — | another client's artefact | never a version; not moved (D-CLOUD-022; `[S23]` last comment) |

Moves are folded out first: the same hash at a different path **within the same (system, rom, core repository, kind)** is a move, planned as a permutation over the whole set (never one occupant renamed over another), applied only after the current file at the source is re-read and matches. D-CLOUD-030 makes the slot an attribute; it does not say which path wins, so this document does: the cloud's layout wins on the device that pulls, because the other device already published its renumber. Bytes are identical, so the choice is lossless; it is logged. Unmatched files are classified individually by the table above. gpt_peer_review-r4.md §2.5 is right that hash equality does not establish intent; the scoping and the re-read are what make inference safe.

"Cloud changed" and "device changed" are the silent transfers the IA promises (`[S02]` § Scope); everything in the two divergent rows and the hold row asks or waits. **The exit path applies this table only to the units it can produce fresh cloud evidence for** (§1.5); a unit whose cloud head cannot be read is neither uploaded nor downloaded — it is left pending. That sentence (gpt-revised_plan-r3.md's, via kimi_peer_review-r4.md row 12) replaces any reading of round 3 that let a cached manifest claim authorise an overwrite.

### 1.4 The lifecycle gate [L]

Nothing may mutate a game's units while a session that can write them is in flight. ES mutates the save tree before launch (`setupSaveState` renames `.state.auto` to `.bak` and copies the chosen state over it, `[S38]`), the emulator writes throughout, and ES mutates again after exit (`onGameEnded` restores the `.bak`, `renumberSlots` compacts, `[S38]`, `[S41]`). The gate must bracket all of it, not just `process.run()`.

- ES takes a **session lock** (`flock` on `/var/run/cloud_session.lock`; `/var/run` is tmpfs so it cannot go stale across a reboot, the same reasoning as `take_cloud_lock` in `[S29]`) before its pre-launch mutations and releases it after capture (§1.5) has hashed the sealed copies.
- **Survival of an ES death.** `engineering-practices.md` records ES abort()ing on an assert and being restarted by its supervisor while the display fell back to the carousel (`[S10]`); an emulator can outlive ES. The lock must remain held while the emulator runs. Whether `ProcessStartInfo` lets the child inherit the lock fd is not in the corpus (it is not embedded). Gate 3 tests it; if the fd is closed on exec, the fix is a one-line wrapper that takes the lock and `exec`s the emulator command. In addition, the presence of `<rom>.state.auto.bak` is treated by the reconciler as "session in flight or interrupted": that game's units are excluded from mutation and reported until ES's own restore has run.
- **The reconciler's mutation of the tree** (pre-pass installs, wizard applies, retirements, compactions, recovery) requires the session lock to be free; the boot worker and menu rows try it non-blocking and report SKIPPED (exit 3's meaning today, `[S40]`) if a game is running.
- **Uploads read sealed copies, never live files.** Capture hard-links or copies each changed member into `/storage/.cache/cloud_sync/stage/<run-id>/<sync-root-relative path>`, hashes the sealed copy, and the upload transfers from the stage. Re-hashing a live file "just before" uploading it does not close the window; sealing does.

gpt_peer_review-r4.md §2.3 called this contract the strongest of the four and asked that it be lifted into every plan; it stays, with one correction taken from the same review: a checkpoint is not proof that nothing happened after it (§1.7).

### 1.5 Capture and the exit path [L]

**Capture runs on every game exit, regardless of the exit-sync toggle, the network, or the lock.** Today the whole `cloud_backup` call is gated on `cloudsaves.gameexit == "1"` and on no sync running (`[S41]`); if capture inherits that gate, a player with the toggle off accrues no provenance (gpt-revised_plan-r3.md's rule, via kimi_peer_review-r4.md row 14). ES calls `cloud_reconcile --capture --game <path> --system <s> --emulator <e> --core <c> --run-id <id>` unconditionally after `onGameEnded` and the repository refresh, and only then, if the toggle is on, `--exit-push`.

**The emulator and core passed are the ones actually executed.** `setupSaveState` rewrites `-emulator` and `-core` in the launch command when the chosen state's config is not the active one and `racommands` is false (`[S38]` `_changeCommandlineArgument`); `getEmulator(true)`/`getCore(true)` at exit (`[S42]`) return the configuration, not necessarily what ran. ES freezes the effective values at command construction and passes those. Standalone emulators pass their own name as `core` (`[S03]` §9).

**Capture** (no rclone, no network): for the launched game's units plus any file under the sync root whose mtime falls inside the session window or whose size changed, hash the sealed copies, update the own manifest (temp-and-rename, `[S03]` §5), record `published_at: null` for new versions in `pending-publish.json`. mtime and size are an optimisation for choosing what to hash on the exit path, never a proof of "unchanged": the project has seen equal-size changes (#53, `[S04]`) and its clocks are not trusted (`clock_synced`, `[S03]` §6). Every full pass (§1.6) hashes the whole tree, so a write missed on exit is caught by the next boot — the same division of labour the shipped `--recent` path relies on (`[S29]`, `[S09]`). gpt_peer_review-r4.md §2.1 is conceded on this point.

**The idle exit path spawns no rclone process** when three things are true: the changed set is empty, `pending-publish.json` is empty, and no `pending-apply` record exists. *Captured* and *published* are separate facts; a failed or deferred upload stays in the pending list and is retried on the next exit and every full pass. That is the retry property the shipped `--recent` window (keyed to a *successful* backup stamp, D-CLOUD-028) had, preserved — gpt_peer_review-r4.md §2.1 showed why a naïve zero-spawn idle path loses it.

**The changed exit path** must (a) produce **fresh cloud-head evidence** for each unit before writing it, (b) transfer only units whose cloud head equals the agreed one, (c) produce **correspondence evidence** that the remote object now holds the sealed bytes before advancing agreement, and (d) **defer** anything it cannot do within the budget. The mechanism per backend class:

| Step | Hashed backend (Dropbox, S3/MinIO) | Hashless backend (the QA WebDAV: no hashes, no modtimes, `[S04]` D-QA row) |
|---|---|---|
| Evidence | `rclone lsjson --hash --files-from <changed paths>` on the remote; compare each native hash to `agreed.json`'s `remote_hash` | `rclone copy --files-from <changed paths>` of the cloud heads into a scratch dir, `sha256sum`; compare to agreed sha256 |
| Expected native hash | `rclone hashsum <type> --files-from` over the sealed stage (rclone's local backend computes any hash type) | not available |
| Upload | `rclone copy --files-from <eligible + manifest> --ignore-times --no-traverse <stage> <remote>` | same |
| Correspondence | `rclone lsjson --hash --files-from <eligible>` on the remote; advance agreement for a path only if the observed native hash equals the locally computed one and the size matches; record `remote_hash` | `rclone check --download --one-way --files-from <eligible> <stage> <remote>`, reading the whole output for the "0 differences" line (the D-CLOUD-026 precedent, `[S06]`); `remote_hash` stays `null`, `agreed.json` records `verified_by: "download"` |
| Spawns | up to 4 | 3, and the bytes twice |

Why the second step exists: after uploading a *new* local hash H, observing native digest R and recording "H ↔ R" proves only that the remote holds *some* object with digest R. The correspondence has to be proven by digesting the sealed bytes with the same algorithm — otherwise the mapping is assumed at exactly the point the design claims to verify it (gpt_peer_review-r4.md §2.2). This is the one place I keep a local native-hash spawn: kimi_peer_review-r4.md (row 10) rejected mistral-revised_plan-r3.md's use of it as a *substitute* for a remote observation, which is unsound and is not what it does here. `--ignore-times` is mandatory on every decided transfer: selecting a file with `--files-from` or `copyto` does not force it past rclone's own comparison, and the shipped archive paths pair a selected transfer with `--ignore-times` for exactly this reason (`[S29]`, `[S30]`).

**Budget and deferral.** D-CLOUD-028's contract — nothing changed answers in ~5 s, one spawn — is *improved* on the idle path (zero spawns) and *exceeded* on the changed path (up to four spawns plus three remote round trips on Dropbox; the corpus's one-save precedent is ~7 s, "most of it Dropbox's commit," `[S09]`). This needs an explicit refinement of D-CLOUD-028 (§4), and a measured ceiling (§6, Gate 4). Above the ceiling — or whenever evidence or correspondence cannot be obtained — **the unit is left pending, never written**: the boot or menu pass finishes it. The player's card says what happened ("2 saves sent · 1 waiting for the next sync"), never FAILED. Deferral rather than a weaker proof is the point on which gemini_peer_review-r4.md, gpt_peer_review-r4.md and mistral_peer_review-r4.md converged against round 3's "wait however long"; I concede it.

**Exit codes are typed.** `cloud_backup` today exits with rclone's own status (`clean_exit ${BACKUP_STATUS}`, `[S29]`), so rclone's exit 3 ("directory not found") reaches `ThreadedCloudSync` and is rendered as SKIPPED – ANOTHER CLOUD SYNC IS RUNNING (`[S40]`) — a live defect. `cloud_reconcile` never passes rclone's code through: 0 done · 3 lock held · 4 no route · 5 conflicts queued (nothing lost) · 6 items held or deferred (nothing lost) · 1 failed, plus a result file `/storage/.cache/cloud_sync/runs/<run-id>.json` the UI reads for the sentence it shows. Lifted from kimi-revised_plan-r3.md via gemini_peer_review-r4.md.

Reachability stays local and instant: `ip route get <resolved remote address>` for a literal address, the default-route test for a hostname (a hostname can resolve via hosts or local DNS without a default route — gpt_peer_review-r4.md's caution); no ICMP on the exit path (D-CLOUD-028's posture, `[S06]`).

### 1.6 Full passes and the queue [L]

The boot pass, the SYNC row, UPLOAD, DOWNLOAD and the hub tick all run `cloud_reconcile --full` (UPLOAD/DOWNLOAD restrict the *actions* to one direction; the classification is identical, so "upload" never clobbers a cloud change — it queues it). A full pass: takes `take_cloud_lock`; checks the session lock; hashes the whole tree; downloads every foreign manifest (small, `[S03]` §5); lists the remote with `--hash` (one spawn) or downloads heads on hashless backends; classifies every unit; applies the silent rows of the table — this is the **pre-pass** the IA requires before any wizard opens (`[S02]` § Flow; futro AC on #23, `[S05]` §5) — then writes the queue.

**Unattended passes never open the wizard.** Conflicts are queued in `/storage/.cache/cloud_sync/queue.json` and shown as a count on the CLOUD SETTINGS rows and the hub ("3 conflicts waiting"); the wizard opens from the row, which is where a player who has just come back to the device is. IA rev 4 says "a sync that reports conflicts opens the wizard" (`[S02]`); a boot pass that opened a wizard over the carousel, or a game-exit pass that opened one under a player heading for the next game, works against "get the user going as quickly as possible." **This is an IA rev 5 item and a maintainer call**, agreed by all four round-3 plans and settled by nobody (§5).

Kid and kiosk mode collapse the whole GAME SETTINGS block (`[S13]`). Queued conflicts wait; silent rows still run; nothing resolves on a kid's behalf.

**Held items** (unexplained absence, torn units, deferred uploads) are counted on the same rows and re-evaluated on every pass. V1 offers no wizard decision for them; nothing present on only one side is ever destroyed. The maintainer's amendment — fail closed on an unexplained absence, cheaply, without abandoning deletion propagation — is exactly this row.

### 1.7 The wizard's apply — checked adapter, preconditions, phases, recovery [L]

Presentation is IA rev 4 (`[S02]`) with the futro's ACs (`[S05]` §5): system by system then game by game; cloud always left; screenshot or glyph; date/time/device+model/core+build per side; no size, no play time; KEEP LEFT / KEEP RIGHT / KEEP BOTH; KEEP BOTH savestates only; nothing applies until COMPLETE; quitting discards decisions; laid out at 480×320 first; the compatibility badge waits for #19 (D-CLOUD-025). Two IA corrections:

- **"Nothing transfers until COMPLETE" is qualified:** *no conflict-resolution changes apply until COMPLETE; the non-conflicting transfers the pre-pass already completed are not rolled back by quitting.* The IA's "both sides exactly as they were" is not true after the pre-pass it also requires (gpt_peer_review-r4.md §2.6).
- **Auto states are a fixed rule, not a sub-choice.** KEEP BOTH on `.state.auto`: this device keeps its `.state.auto`; the cloud copy is installed in the next free numbered slot; one sentence on the done page. No further question.

**The checked adapter.** ES's primitives are read, not called raw, because each has a defect the source shows: `getNextFreeSlot()` scans 99999→0 for a numbered slot and returns −99 for a repository holding only an auto state (`[S37]`), and `setupSaveState` then appends `-state_slot -99` on the auto-resume path (`[S38]`) — what RetroArch does with that is unmeasured (Gate 3); `copyToSlot()` returns `true` whatever `renameFile`/`copyFile` did and derives its destination from the *source's* parent (`[S38]`); `isEnabled()` requires `emulator == "retroarch"` (`[S37]`), so standalone emulators have no slots. The adapter therefore: computes the next free slot itself from the numbered states it can see, from `firstslot`; **reserves slots in memory for the whole walkthrough** so two KEEP BOTHs on one game in one session get two slots before either is installed (kimi-revised_plan-r3.md, via gpt_peer_review-r4.md §4); writes files itself by rename from the stage into the game's repository directory, state and PNG together; re-reads and hashes what it wrote before declaring success; and disables KEEP BOTH (dimmed, with the reason) for non-RetroArch units and for in-game saves.

**COMPLETE re-checks its preconditions against the world, not against local memory:** for every queued unit, the local members, the cloud head (a fresh listing), the unit map, each reserved destination slot, and any pending retirement must still equal what the wizard showed. Agreement being unchanged is not enough — agreement is local, and the cloud can have moved while the player was choosing (gpt_peer_review-r4.md §2.6). A precondition that fails sends that unit back to the queue with a one-line reason; the rest apply.

**Apply, per unit, in phases written to `pending-apply/<run-id>.json`:**

1. `prepared` — the retained record and payload for the discarded side are written and `fsync`ed (§1.9), the audit line is written (D-CLOUD-027; before anything is deleted — the futro's AC).
2. `staged` — the winner's members are complete in the stage and hashed.
3. `installed` — members renamed into place; each re-read and hashed.
4. `published` — the unit uploaded with correspondence evidence (§1.5), agreement advanced, the retained record rewritten `finalized`.

**Recovery inspects hashes at every phase.** A crash between a rename and the phase-record update leaves the record saying `prepared` while a file has already moved; the record is a checkpoint, not proof that nothing later happened (gpt_peer_review-r4.md §2.3, correcting round 3's "prepared → nothing happened"). On the next launch of the reconciler — before any game is allowed to start, since the session lock is checked — every `pending-apply` record is walked: each member's current hash is compared with both the winner's and the loser's maps; a coherent winner is finished, a coherent loser is left and the record cancelled, a mixed set is repaired from the stage or the retained copy (both exist by phase 1). **Recovery works offline** — everything it needs is local by construction. A recovered decision authorises exactly its recorded operands; if the cloud has moved meanwhile, phase 4 fails its precondition and the unit is reclassified, never re-asked merely because a process died.

### 1.8 Deletion, moves, compaction [L]

**Explicit deletions propagate.** When ES deletes a state (`GuiSaveState` → `remove()` → `renumberSlots()`, `[S02]`, `[S25]`), ES calls `cloud_reconcile --retire <path> <sha256>`, which appends `{path, sha256, at, seq}` to the own manifest's top-level `retired` ring and records the resulting permutation as moves. Other devices apply a retirement (table row, §1.3) **only if** the cloud head at `path` still has that sha256 **and** no manifest declares that path+sha with `published_at` later than the record's `at`. That second clause is what makes restoring a retired version safe: a restore from the retention store is a **republication of the same version** (D-CLOUD-030: same bytes, same identity), written with a fresh `published_at`, and an old retirement cannot consume it. kimi-revised_plan-r3.md's "restore is a new version" contradicted D-CLOUD-030 and gpt_peer_review-r4.md §2.5 was right to say so; this is the corrected rule. Where the clocks involved are `clock_synced: false`, the record is held, not applied.

**The `retired` ring is bounded (last 64 records) and its bound is now safe.** In round 3 a record that aged out could let a late device *resurrect* a deleted state; that failure no longer exists because unexplained absence is **held and reported**, never resolved by resurrection or deletion. Forgetting a retirement now costs a held item on the late device's row, not a wrong transfer. This is the kimi-revised_plan-r3.md rule that gpt_peer_review-r4.md §2.5 asked me to lift in place of resurrection; lifted, and it is also what the maintainer's amendment describes. The ring's lifetime is control state and is not tied to the retention count (§1.9); they do different jobs.

**Cloud-side removals are copy-verify-delete into `<SYNCPATH>-replaced/<date>/`** — D-CLOUD-014's sibling convention — never `rclone move` (D-CLOUD-026). That directory is also where a cloud object replaced by an upload can be kept via `--backup-dir` on `copy`; whether `--backup-dir` with `copy` preserves the replaced object under interruption and a two-writer race is **unmeasured** — the corpus shows it only in `cloud_backup`'s `sync` branch (`[S29]`) — and is Gate 7. Nothing in V1 depends on it: the local retention store is the reversibility mechanism; `-replaced/` is a bonus.

**Compaction** is D-CLOUD-030 unchanged: after a sync, one game holding one hash in two slots keeps the lower slot; both files are re-read and the hashes compared before the higher slot is removed; the removal is logged and written as a retirement record so other devices converge instead of re-downloading the duplicate.

### 1.9 The retention store [L]

This is the reversibility the maintainer named as first-class, at the depth he named — one step back — with no undo control in the resolution flow. **V1 retains the discarded copy of every conflict decision, on by default, bounded by a count, and ships no control that restores one.** The done page names each discarded copy per game and says the copies are kept. Restoring one is a separate tool (its own issue), reusing the wizard's compare-and-choose surface pointed at a game's retained past; §1.9.4 says what it needs, and Gate 2 proves the store can drive it before any UI exists.

#### 1.9.1 Home — `/storage/.local/share/rocknix/cloud-saves/retained/` (see §2, pick 1)

`HOME=/storage` on the device (`[S05]` substrate table), so this is XDG's default data home. The directory is created on first use. It is outside the sync root, outside `backuptool`'s archive (`/storage/.config/*`, `[S04]`), and outside `.cache`, whose documented contract in this repo is *state that persists but can be regenerated* (`[S02]` § Where state lives). A retained copy cannot be regenerated; it is, by construction, the only copy of what the player discarded. **Nothing under `rocknix/cloud-saves/` is ever cleared by a schema-version rebuild, an update, or a cleanup; a `README` in the directory says so.** Survival across an in-place update on a device with real prior state is Gate 2's first assertion (`[S11]`).

#### 1.9.2 Layout

```
retained/<system>/<unit-key>/<device-id>-<seq>/record.json
retained/<system>/<unit-key>/<device-id>-<seq>/files/<sync-root-relative path of each retained member>
retained/.seq                      # persisted monotonic counter, this device's
```

- `<unit-key>` is the ROM's path relative to `/storage/roms/<system>/`, with extension, percent-encoded so that `/` and any byte outside `[A-Za-z0-9._-]` are `%XX`; for a shared container (memcard, VMU) it is the container's own sync-root-relative path encoded the same way. Reversible and collision-free; the round-3 "ROM filename made path-safe" was not (gpt_peer_review-r4.md §1, kimi_peer_review-r4.md §1.1).
- `<seq>` is a persisted per-device monotonic counter, zero-padded to 8 digits. Order is by `seq`, never by a clock — a device that booted without a network has a wrong clock, which is what `clock_synced` exists to say (`[S03]` §6). The store is **device-local**: a decision made on device A is restorable on A, not on B; this is the maintainer's primary case and is stated plainly rather than implied (kimi_peer_review-r4.md §1.1's residual). The `<device-id>` prefix exists so that a store copied onto another card is still readable; records with a foreign prefix are ordered by `resolved_at` and marked *imported* by the reader.
- Members are stored under their **original sync-root-relative paths** beneath `files/`, so two members with the same basename from different directories cannot collide (kimi-revised_plan-r3.md's layout, lifted at gpt_peer_review-r4.md's and gemini_peer_review-r4.md's urging). The thumbnail is a member.

#### 1.9.3 `record.json`

```json
{
  "schema": 1,
  "resolution_id": "<run-id>",
  "seq": 17,
  "resolved_at": "2026-10-08T21:14:02Z",
  "resolved_local": "2026-10-08T17:14:02-04:00",
  "clock_synced": true,
  "phase": "finalized",
  "game": { "system": "gba", "rom": "Metroid Fusion (USA).gba", "unit_key": "Metroid%20Fusion%20%28USA%29.gba" },
  "unit": {
    "id": "savestates/gba/Metroid Fusion (USA).state2",
    "kind": "state",
    "core": "mgba", "core_build": "e31759b24e7…",
    "slot": 2,
    "members": [
      { "path": "savestates/gba/Metroid Fusion (USA).state2",     "sha256": "…", "size": 50816, "retained_as": "files/savestates/gba/Metroid Fusion (USA).state2",     "role": "state" },
      { "path": "savestates/gba/Metroid Fusion (USA).state2.png", "sha256": "…", "size": 47687, "retained_as": "files/savestates/gba/Metroid Fusion (USA).state2.png", "role": "thumbnail" }
    ]
  },
  "retained_side": "device",
  "retained_operand": {
    "device": { "id": "ROCKNIX-ee5013fc56", "label": "Anbernic-RG35XX-SP", "model": "Anbernic RG35XX SP", "family": "H700" },
    "emulator": "retroarch", "core": "mgba", "core_build": "e31759b24e7…", "core_display_version": "0.11-dev",
    "captured_at": "2026-10-01T02:11:40Z", "captured_local": "2026-09-30T22:11:40-04:00", "clock_synced": true
  },
  "winner": {
    "side": "cloud",
    "members": [ { "path": "savestates/gba/Metroid Fusion (USA).state2", "sha256": "…" } ],
    "live_paths": [ "savestates/gba/Metroid Fusion (USA).state2", "savestates/gba/Metroid Fusion (USA).state2.png" ],
    "producer": { "device": { "id": "ROCKNIX-1a2b3c4d5e", "label": "Anbernic-RG-SP", "model": "Anbernic RG-SP", "family": "H700" }, "core": "mgba", "core_build": "e31759b24e7…" }
  },
  "action": "KEEP LEFT",
  "reason": "wizard decision",
  "thumbnail": { "retained_as": "files/savestates/gba/Metroid Fusion (USA).state2.png", "sha256": "…" }
}
```

Rules: every field is in hand at apply time (both operands' provenance is what the wizard rendered; the decision is the wizard's own), so nothing is looked up later. `unknown` is preserved wherever the manifest had it — an `unknown`-provenance discard records `unknown`, not a guess. `thumbnail` is `null` for an in-game save; the picker shows the glyph (`[S02]`). `phase` is written `prepared` at step 1 of the apply and rewritten `finalized` at step 4; a record still `prepared` after recovery is exempt from pruning and reported. `resolved_at` is displayed; `seq` orders (gemini-revised_plan-r3.md's field plus the sequence, per gpt_peer_review-r4.md §3). `retained_as` points into this directory; the original `path` is provenance, never a locator.

#### 1.9.4 Pruning and the reader

**Count** is per *bucket*, counting **finalized, coherent retained units**, not members: buckets are (system, unit-key, `auto`), (system, unit-key, numbered states of one core repository), and (system, unit-key, `save`) — so renumbering does not fragment retention and one multi-slot apply is one event (gpt-revised_plan-r3.md's bucket model, via kimi_peer_review-r4.md row 5). Prune oldest `seq` first. **A retention sweep must never evict the only copy of an unreviewed head** (gemini-revised_plan-r3.md's sentence, lifted verbatim) — a `prepared` record, or a record whose winner never reached `published`, is exempt. Routine one-way overwrites (cloud changed, device unchanged) are **not** retained in V1: they are not a wrong choice by this player, and the maintainer's primary case is the wrong wizard choice. **The default count of 3 is a product proposal with no corpus basis**; the amendment settles "on and bounded," the maintainer sets the number, and the byte cost (states are tens of KB on this device, `[S03]` §1, but PPSSPP and PSX saves are not) is measured in the shadow census (Gate 12) rather than asserted trivial.

**The future reader.** For "this game, newest first": open `retained/<system>/<unit-key>/`, sort directory names by `seq` descending, read one `record.json` per row — game, slot, producing device (the retained operand's snapshot), which side won and what won, the retained PNG by `retained_as`. It scans nothing else; it consults no manifest, no audit log, no pending record. To restore: show the retained unit on one side and the live unit (read from the tree) on the other in the wizard's own compare surface; apply through the same checked adapter with the same `record.json` written for the overwritten live copy, so the restore is itself one step reversible; publish as a republication (§1.8). **Gate 2 is a test-only reader** run after the producer's manifest entry has been overwritten, slots renumbered, the audit log rotated, the clock set backward and every pending record removed — the store must still answer. All four reviews agree this layout survives the amendment's reader test; the corrections they asked for (collision-free paths, encoded key, finalization in the record, sequence-domain rule, retained-relative thumbnail) are in §1.9.2–1.9.3.

#### 1.9.5 What V1 deliberately does not record

No ancestry beyond `replaces` (one step, already in the schema); no chain of who-resolved-what across devices (`resolves` receipts are dropped — §3); no copy of the winner's bytes (the live tree holds the winner; the next resolution or restore retains it if it loses). The maintainer's primary case is "I picked wrong just now"; the record answers it completely.

### 1.10 Cutover and coexistence [L]

- **Every writer in §1.1 switches in the same image.** A migration on the tree is not needed: entries are keyed by path relative to the sync root, existing files are `unknown` with a locally computed hash (`[S03]` §4), and the equality bootstrap writes agreement for everything that already matches, so an upgraded device asks only about genuine forks. New code reads the old tree; the tree does not change shape.
- **Old firmware is not made safe by new firmware.** A device still on the previous image runs `copy --update` both ways at boot (`[S35]`) and `copy` with no `--update` at exit (`[S29]`) over the same cloud folder; it is a recency resolver against every other device and nothing a new device does can stop it. New devices *detect* the damage (a cloud head that changed without a publication is an `unknown`-provenance change and classifies normally) but cannot undo a cloud overwrite the old device made without `--backup-dir`. I withdraw round 3's suggestion that downgrade or mixed-firmware coexistence is non-destructive (gpt_peer_review-r4.md §2.7). Until every device the player owns runs the new image, the guarantee is per-device; the maintainer accepted this period under D-CLOUD-029.
- **Old code reading new data:** the manifests and the two new allowlist rules are additive; `.bak` exclusion only stops a file ES never reads from travelling.
- **Stamps and rows.** The three save rows keep their per-row `last-<name>` stamps (D-UI-017/018/020) — written by `cloud_reconcile` under the same names, so GAME SETTINGS reads them unchanged. The replaced-mechanism inventory the futro demanded (`[S05]` §4): `--update`'s newer-on-destination skip → the classifier's cloud-changed row; restore-before-backup ordering → the full pass classifies before it acts; the lock → `take_cloud_lock` unchanged; the `--recent` window → session-window hashing plus the pending list; the stamps → unchanged names.
- **Liveness at boot** stays `ping google.com` today (`[S35]`) — wrong in both directions per the rule file (`[S09]`); the boot pass adopts the route test above. Belongs to #7 (`[S04]` §3.7); fixed here because the boot pass is being rewritten anyway.

### 1.11 Separable and optional [O]

- **#10 per-core directories (D-CLOUD-017).** Nothing above depends on the layout; `core` is a field and entries are paths. #10 is riskier than "a config change": the XML path in `SaveStateConfigFile` hard-codes `racommands = false` and defaults `incremental`/`autosave` to false (`[S39]`), while the compiled `Default()` sets all three true — so shipping any `es_savestates.cfg` switches every RetroArch launch from the `.auto`/`-autosave 1` mechanism to `-state_file` (`[S38]`), and `racommands = true` cannot be expressed in XML at all. #10 therefore needs an ES change, not only a file, and RetroArch's `savestate_directory` must move with it (`[S04]` §3.2). It is separable from V1 and gated on Gate 9. kimi_peer_review-r4.md §5.6 verified the flag behaviour; the consequence that XML cannot restore the default is mine.
- **The compatibility badge** waits for #19 (D-CLOUD-025); the manifest carries `core_build` either way.
- **Manifest-last publication as a two-spawn option** — measured, not load-bearing (§2, pick 2).
- **bisync as bulk transport** — only if the spike shows a measured benefit.
- **The SQLite history index** — closed: not built; the text audit log (D-CLOUD-027) and the retention store are the two records. All four round-3 plans agree; say so on #20.
- **Cloud-side `-replaced/` browsing** and the restore tool itself — #25's futro, after the wizard ships.

---

## 2. Picks — the differences a builder had to choose between

Where the reviews found a difference that could be lifted, I lifted it (§3). These six are the ones where taking both was incoherent. Each names the choice and the reason a builder can act on.

**1. Store home: `/storage/.local/share/rocknix/cloud-saves/`, not `/storage/.cache/cloud_sync/`.** gemini_peer_review-r4.md and mistral_peer_review-r4.md back the move; gpt_peer_review-r4.md's reviewed plan originated it; kimi_peer_review-r4.md would keep `.cache` with an exemption sentence unless the survival test is run. Both directories survive an update today (`[S02]`: `.cache` is not wiped). The pick is about contract: the corpus itself defines `.cache` as *regenerable* state and the IA doc's advice for it is "store a schema version and rebuild when it does not match" (`[S02]`) — the retained copy is the one thing that must never be rebuilt. A directory whose documented rule invites a future cleanup to treat it as disposable is the wrong home for the only copy of a discarded save. D-CLOUD-027's audit log in `.cache/log` is not a counter-precedent: logs are support artefacts; the retained copy is player data. Everything whose loss fails closed stays in `.cache` (§1.2). Gate 2 asserts survival.

**2. Transport: one spawn, `--files-from` carrying payload and manifest; manifest-last is an option, not a requirement.** gemini_peer_review-r4.md and kimi_peer_review-r4.md argue one spawn; gpt_peer_review-r4.md would start with explicit payload-before-manifest ordering and combine only after the mechanism is demonstrated. The substance: rclone transfers per file, no backend offers a multi-object commit, so ordering only selects *which* torn state a concurrent reader sees, and every reader must already refuse a unit whose declared members are incomplete or mismatched (§1.3's torn row). The commit point I called load-bearing in round 3 was cosmetic; the second spawn costs ~1 s (`rclone version` alone is 1.0 s on the H700, `[S09]`) on a path a player watches. I take gpt's caution as the gate rather than the design: Gate 6 interrupts an upload after one member and asserts no device installs the mixed set and the pending state clears when the rest arrives. If that fixture fails, ordering returns as a spawn we then know we need.

**3. Exit-path budget: defer, never wait indefinitely, never weaken the proof.** gemini_peer_review-r4.md read round 3 as "if it takes 9 s the player waits 9 s"; gpt_peer_review-r4.md and mistral_peer_review-r4.md hold that above the budget the unit waits for the background pass. Deferral wins because it is the only option that keeps all three constraints — fresh evidence before writing, correspondence after, and a bounded wait on a watched path — without dropping one. The ceiling is measured (Gate 4) and refined into D-CLOUD-028 (§4).

**4. Unexplained absence: hold and report, never resurrect, never delete.** Round 3 resurrected. gpt_peer_review-r4.md §2.5 asked for kimi-revised_plan-r3.md's rule; the maintainer's amendment describes exactly this: fail closed cheaply, keep deletion propagation for *recorded* intent. Consequence for the builder: the `retired` ring's bound is now safe (§1.8).

**5. bisync: not the detector, not a V1 transport, spike informational.** mistral_peer_review-r4.md calls this architectural and pending the spike. It is architectural, and I settle it now rather than after the spike, for the reason in §1.1: the classifier's inputs do not exist in bisync, so no spike result can make bisync the detector; the only thing the spike can decide is whether bisync is ever a cheaper bulk mover, which is an optimisation question for later. Needs the maintainer's word (§5).

**6. Container representation: per-file entries plus a `unit` field, not `kind: "container"` keyed by a directory.** Reason in §1.2 item 2; kimi_peer_review-r4.md §5.3 showed the directory-keyed row contradicts D-CLOUD-031's one-entry-per-file rule and D-CLOUD-030's identity.

Between this document and the corrected forms of `kimi-revised_plan-r3.md` and `gpt-revised_plan-r3.md` as the reviews describe them, I do not believe any difference remains where taking both is incoherent; the differences are spellings, and I have adopted theirs wherever a reviewer asked.

---

## 3. Ledger — conceded, adopted, refused, misread

**Conceded (refuted, by reviewer and file):**

- *Manifest-last as a load-bearing commit point* — gemini_peer_review-r4.md §3 and §7, kimi_peer_review-r4.md §2.2, gpt_peer_review-r4.md §3. Demoted to a measured option (§2 pick 2).
- *The `resolves` receipt* — all four reviews. Dropped: the classifier already downloads a later informed choice as an ordinary cloud change because agreement advanced at publication; the residual case (a fresh device holding the loser of someone else's resolution) asks once, which the cardinal rule is content with; and the amendment cools on receipt machinery deeper than one step.
- *Automatic resurrection on unexplained absence* — gpt_peer_review-r4.md §2.5. Replaced by hold-and-report (§1.8).
- *"Prepared means nothing happened"* — gpt_peer_review-r4.md §2.3. Recovery inspects hashes at every phase (§1.7).
- *The circular remote-hash bridge and the exit-zero degradation* — gpt_peer_review-r4.md §2.2. Correspondence is now proven by a locally computed native hash or by `check --download`; there is no degradation, only deferral (§1.5).
- *Zero-spawn idle forgetting a failed upload; size/mtime as an indefinite skip* — gpt_peer_review-r4.md §2.1. Captured and published are separate facts; full passes rehash everything (§1.5).
- *Retention members "by basename"; lossy unit key; finalization only in the pending record; unspecified sequence domain* — gpt_peer_review-r4.md §1, kimi_peer_review-r4.md §1.1. All four corrected in §1.9.
- *Downgrade / mixed-firmware coexistence claimed non-destructive* — gpt_peer_review-r4.md §2.7. Withdrawn (§1.10).
- *COMPLETE precondition on local agreement only* — gpt_peer_review-r4.md §2.6. Now against the cloud head, the unit map and the reserved slots (§1.7).
- *`getCore(true)` at exit as the launch context* — kimi_peer_review-r4.md row 15, from gpt-revised_plan-r3.md. Frozen at command construction (§1.5).
- *Capture inside the exit-sync gate* — kimi_peer_review-r4.md row 14, from gpt-revised_plan-r3.md. Unconditional (§1.5).
- *"Wait however long" on the exit path* — gemini_peer_review-r4.md §2. Defer (§2 pick 3).
- *`.cache` as the retention home* — gemini_peer_review-r4.md §3 and §8, mistral_peer_review-r4.md §1.2. Moved (§2 pick 1).
- *Round 3's move rule as bare "same hash elsewhere → move → re-key"* — gpt_peer_review-r4.md §2.5. Scoped, re-read, planned as a permutation (§1.3).

**Adopted (credited):**

- Path-preserving retained payloads and in-memory slot reservations — kimi-revised_plan-r3.md, via gpt_peer_review-r4.md §4 and gemini_peer_review-r4.md §8.
- Typed exit codes and the run-id result file — kimi-revised_plan-r3.md, via gemini_peer_review-r4.md; the `clean_exit ${BACKUP_STATUS}` collision verified against `[S29]` and `[S40]`.
- Inline producer snapshot; owner-vs-producer manifest semantics; capture independent of the toggle; frozen launch context; the harness repair list; the pruning bucket model — gpt-revised_plan-r3.md, via gpt_peer_review-r4.md and kimi_peer_review-r4.md (§5.1 verified three of the harness defects against `[S36]`, `[S29]`, `[S30]`).
- `resolved_at` beside the sequence; "a retention sweep must never evict the only copy of an unreviewed head" — gemini-revised_plan-r3.md, via gpt_peer_review-r4.md §4 and kimi_peer_review-r4.md row 21.
- The thumbnail-anomaly rule — mistral-revised_plan-r3.md, via gpt_peer_review-r4.md §2.4; the inline-JSON form for the schema amendment — mistral-revised_plan-r3.md, via gemini_peer_review-r4.md, with the container row corrected.
- Hold-and-report — kimi-revised_plan-r3.md, via gpt_peer_review-r4.md §2.5.
- The `racommands`/`incremental`/`autosave` flip in the XML path — kimi_peer_review-r4.md §5.6, against `[S39]`.

**Kept over a reviewer's objection, with the reason:**

- The two-pass escalation for torn multi-member units (§1.3) — gpt_peer_review-r4.md §3 would transfer immediately when no prior presence contradicts; kimi_peer_review-r4.md row 13 shows immediate transfer can install half a memcard inside the payload-before-manifest window. Waiting costs nothing.
- The local native-hash spawn on the changed exit path (§1.5) — kimi_peer_review-r4.md row 10 says drop it; the objection was to mistral-revised_plan-r3.md's use of it as a substitute for a remote observation. Here it is the correspondence proof gpt_peer_review-r4.md §2.2 requires, alongside a fresh observation. If Gate 4 shows rclone's own post-transfer hash check can be demonstrated to fail closed, the spawn becomes optional.

**Refused as beyond what the problem earns:** any V1 undo control; ancestry beyond `replaces`; a database; a generic binary merger or progress heuristic; a slot cap to mask the −99 defect; a daemon; protected/immutable publication objects (the conditional fork gpt_peer_review-r4.md attributes to gemini-revised_plan-r3.md — not earned until Gate 7 fails, and nothing here depends on it); ICMP on the exit path; retaining routine one-way overwrites in V1.

**Misread:** mistral_peer_review-r4.md §3 attributes to my plan "protected-publication protocol in V1; 8-generation lineage; cached-manifest exit overwrites." gpt_peer_review-r4.md places the protected-publication fork in gemini-revised_plan-r3.md; kimi_peer_review-r4.md §6 records that the eight-generation chain was already cut in round 3 and that round 3 read cloud evidence before writing. Rather than argue provenance, this document states the positions positively: no protected publication (§3 refusals), one step of lineage (§1.9.5), fresh evidence before every write (§1.5). The vote is on the text. mistral_peer_review-r4.md §1.1 also marks `gemini-revised_plan-r3.md`'s store as the failure and does not trace kimi's flat layout; gemini_peer_review-r4.md §1 and gpt_peer_review-r4.md §1 both find kimi's flat operation-keyed directory forces a scan of every operation for one game. The integrated store above is keyed by game, so the disagreement is moot for a builder of this document.

---

## 4. Register consequences — refinements, no reopenings

No decided row is reopened. New rows to append, each citing the row it refines:

| New row (ID assigned when appended) | Refines | Content |
|---|---|---|
| Retention amendment | D-CLOUD-024, D-CLOUD-027; IA rev 4's *keep discarded saves* default | Records the maintainer's amendment verbatim: V1 retains the discarded copy, on by default, bounded by a count, no undo control; done page names discards and says copies are kept; the restore tool is a separate issue reusing the wizard's surface; the store is designed for that reader (§1.9). IA rev 5 flips the default and removes the "off by default" line (`[S02]` § Settings). |
| Store home | D-CLOUD-027 (as the `.cache` precedent) | Retained copies live under `/storage/.local/share/rocknix/cloud-saves/`, never cleared; `.cache/cloud_sync/` holds only state whose loss fails closed. |
| Schema rev 2 | D-CLOUD-031, D-CLOUD-017 | Additive: per-entry `unit`, `producer`, `published_at`; top-level `units` and bounded `retired`; agreement written on verified equality; foreign manifests cached outside the tree; the `schema` integer stays `1` because nothing has yet written rev 1 to a cloud. |
| Exit-path budget | D-CLOUD-028 | Idle exit: zero rclone spawns. Changed exit: fresh cloud evidence before any write, correspondence before any agreement advance, up to four spawns on a hashed backend, three plus bytes on a hashless one; above a measured ceiling the unit is left pending for the next full pass. The "nothing changed ≈ 5 s" contract is preserved. |
| Deletion semantics | D-CLOUD-030 | Explicit deletions propagate via `retired` records with the applicability rule of §1.8; a restore of a retired hash is a republication of the same version; unexplained absence is held and reported; the cloud's layout wins for a moved version. |
| Write-path ownership | D-CLOUD-029 | Confirms the cutover replaces every writer listed in §1.1 in one image; names the mixed-firmware period as per-device-guaranteed only. |

Not register rows but required edits: IA rev 5 (queue-and-badge; the COMPLETE qualification; the auto rule; the default flip; the SQLite question closed); #22's body (bisync demoted; typed exit codes; the writer inventory); #9's scope; #20 (no index); #21 (unconditional capture; frozen context; core-pins file per `[S03]` §9; no second spawn — the manifest rides the `--files-from` list); #23 (done-page wording); #25 (the restore tool's shape and Gate 2 as its precondition); #35 (the fixtures in §6).

---

## 5. What the corpus settles, and what the council merely agrees on

**Settled by the corpus:** identity (D-CLOUD-030) and shape (D-CLOUD-031); the shipped write paths are newest-wins (`[S29]`, `[S35]`, blindspot 28); the ES primitives' behaviour (`[S37]`, `[S38]`, `[S39]`); no `es_savestates.cfg` ships and the XML path changes launch behaviour; the allowlist's real behaviour (futro fixture, `[S05]`); `--include` excludes everything unmatched and `lsjson --stat` cannot report absence on bucket remotes (`[S09]`); rclone 1.75.0 with bisync and its `--resync` default (`[S05]`); the budget numbers on the H700 (`[S09]`, D-CLOUD-028); the QA WebDAV has neither hashes nor modtimes (`[S04]`); `cloud_device_id` and `--label` (`[S34]`); exit 3 lock / exit 4 no route and how ES renders them (`[S29]`, `[S40]`); kid/kiosk hides GAME SETTINGS (`[S13]`); ES knows emulator and core at exit (`[S42]`) and can rewrite them at launch (`[S38]`); `cloud_backup` passes rclone's exit code through (`[S29]`); the schema has no equality row and no per-entry producer (`[S03]`).

**Agreed by all round-3 plans, settled by nobody — flagged so a reviewer remains to catch them:**

1. bisync's demotion (§1.1, §2 pick 5) — needs the maintainer's word and an IA/#22 edit.
2. Queue-and-badge as the trigger (§1.6) — IA rev 5, maintainer's call.
3. The retention count of 3 — a proposal; the maintainer's number.
4. That the changed exit path fits a tolerable budget — every figure is a prediction; the round-trip suite has never executed (`[S27]`).
5. That `copy --backup-dir` preserves the replaced object under interruption and race — unmeasured; nothing in V1 depends on it.
6. That auto states are the commonest conflict — the schema asserts it (`[S03]` §4); `[S38]` shows numbered-slot launches restore `.auto` from `.bak` at exit, so divergence needs auto-resume sessions on both devices. The census settles it; the design stands either way.
7. That ES's child process inherits the session-lock fd across an ES death — `ProcessStartInfo` is not embedded; Gate 3.
8. That the unit table matches what standalone emulators write — Gate 12.
9. That `/storage/.local/share` behaves as `/storage/.cache` does across an in-place update — both are under mutable `/storage`, so the expectation is strong, but Gate 2 asserts it.

---

## 6. Evidence, in order — what must be proven before each part is built

Nothing below is a claim about a result; each is the experiment whose result gates a part.

| # | Gate | Device / venue | Gates which part |
|---|---|---|---|
| 0 | **Repair the round-trip harness and run it** (`[S36]`): it overwrites `rclone.conf` before asserting the remote and never restores it; its archive-name assertions disagree with the dated uploader (`[S29]`) and restorer (`[S30]`); its content fixture predates D-CLOUD-019. GENERIC_X64 VM against WebDAV **and** MinIO; never the maintainer's configured handheld. | VM | everything — no evidence exists until the instrument works |
| 1 | **The cardinal-rule fixture:** two devices agree H0; B publishes HB; A edits HA offline; A exits, boots, presses SYNC, UPLOAD, DOWNLOAD, the hub tick, and runs `cloud_backup`/`cloud_restore` from a shell. Neither candidate is overwritten anywhere. Then: failed upload → unchanged exit → retry happens; an equal-size, equal-mtime byte change enters the changed set. | VM pair, then H700 pair | §1.1, §1.3, §1.5, §1.10 |
| 2 | **The retention reader test** (§1.9.4): a test-only reader answers "this game, newest first" after manifest overwrite, renumber, log rotation, clock set backward, pending records removed; multi-member unit, repeated hash, same-basename members from two directories; the store survives an in-place update on a device with real prior state. | VM, then RG35XX SP | §1.9, the restore tool's issue |
| 3 | **Lifecycle and recovery on hardware:** does the emulator child hold the session lock after ES is killed? Boot pass overlapping a game launch. Kill after each filesystem effect and before its checkpoint; restart without network; a complete unit exists before any launch. Launch from an auto-only repository and observe what RetroArch does with `-state_slot -99`. | H700 | §1.4, §1.7 |
| 4 | **Price the changed exit path:** spawns, remote requests, bytes, seconds on the H700 pair against Dropbox and against the QA WebDAV (loopback-bound per D-QA-002 — reach it from a VM, or via an explicitly safe arrangement, never an undocumented LAN rebind); confirm `lsjson --hash --files-from` and `hashsum --files-from` behave as assumed; set the ceiling. Also test whether rclone's own post-transfer hash check can be shown to fail closed (if yes, the local hashsum spawn becomes optional). | H700, Dropbox + QA | §1.5, the D-CLOUD-028 refinement |
| 5 | **Deletion and renumber convergence:** delete a state on A, renumber, sync repeatedly across two devices; every surviving version exists exactly once; restore a retired hash from retention and confirm the old retirement cannot remove it; an unexplained absence is held on the row and touched by nothing. | VM pair | §1.8 |
| 6 | **Torn-unit fixture:** interrupt a one-spawn upload after one member; no device installs the mixed set; pending clears when the rest lands; escalation only after two full passes. | VM | §2 pick 2 |
| 7 | `copy --backup-dir` under interruption and a two-writer race, Dropbox and WebDAV. | H700 + VM | the `-replaced/` bonus only |
| 8 | **#19 bench** (`[S08]`): same-chipset control first (RG35XX SP ↔ RG-SP), then cross-chipset, then loud/silent. | bench | the badge's severity |
| 9 | **#10 rehearsal:** create an `es_savestates.cfg`; confirm the launch mechanism change (`racommands`) and whether both layouts stay discoverable; RetroArch's `savestate_directory` moves with it. | H700 | §1.11 #10 |
| 10 | 480×320 recognisability of side-by-side thumbnails (RG351M), before 640×480 (`[S24]`). | RG351M | the wizard's layout |
| 11 | The bisync spike (`[S05]` §2): output shape with `--conflict-resolve none`; `--recover`/`--resilient` vs `--resync`; a device-side rename; an interrupted run. Informational. | VM, then RG35XX SP | nothing in V1 |
| 12 | **Shadow census** on the maintainer's library: how often auto states diverge; what PPSSPP, Flycast, Mupen and DuckStation actually write (the unit table); retained bytes per bucket at count 3. | RG35XX SP | §1.2 units, the count |

The problem statement's known unknowns (`[S01]` §4) map onto these: 1 → Gate 8; 2 → Gate 11 (and §1.1's answer that bisync's agreement state is not used); 3 → Gate 12 and §1.7's fixed auto rule; 4 → §1.6's pre-pass plus §1.7's COMPLETE re-check, Gate 6; 5 → Gate 9 and §1.11; 6 → #21's core-pins file (`[S03]` §9) and §1.5's frozen context; 7 → assumed, warned by `cloud_sync_helper`, unchanged; 8 → §1.2 units and Gate 12; 9 → Gate 10; 10 → the per-device lock is unchanged, and the fresh-evidence rule of §1.5 plus the COMPLETE re-check are what make two devices online at once a queued conflict rather than a clobber; 11 → Gate 0.

**Build order:** Gate 0 → §1.2 schema rev 2 and #21 capture (after Gate 12's inventory) → §1.5/§1.6 reconciler with the writer cutover (after Gates 1, 4) → §1.9 store (after Gate 2) → §1.7 wizard apply (after Gates 3, 6) → §1.8 deletion (after Gate 5) → badge (after Gate 8) → #10 (after Gate 9) → the restore tool, in its own futro.

---

## `corpus.provenance.json`

```json
{
  "artifact": "claude-revised_plan-r4.md",
  "role": "council member, round-4 revised approach (the artifact the council votes on)",
  "prior_artifact_by_this_member": "claude-revised_plan-r3.md (not embedded; known here only as the four injected reviews describe it)",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "sha256 values copied verbatim from the per-source headers; verified at embed time by the Facilitator; not recomputed by this member",
  "citation_mapping": "S01 through S42 map in order to the parallel source_file_paths and source_file_hashes arrays",
  "injected_reviews": [
    "gemini_peer_review-r4.md",
    "gpt_peer_review-r4.md",
    "kimi_peer_review-r4.md",
    "mistral_peer_review-r4.md"
  ],
  "injected_review_hashes_provided": false,
  "peer_material_use": "Reviews treated as arguments about substance against the embedded corpus and the maintainer's amendments; not used as evidence about how councils or models behave. Round-3 plans of other members are not embedded and are cited only as the reviews report them.",
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "applied_as_authoritative": true,
    "content": [
      "reversibility is first-class; the depth that matters is one step back; edge cases inform but do not drive; failing closed on unexplained absence is expected and cheap",
      "V1 retains the discarded copy on by default, bounded by a count, ships no undo control; done page names discards and says copies are kept; the restore tool is a separate issue reusing the wizard's compare-and-choose surface; the V1 store must be readable by that future tool"
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
  "gaps_for_orchestrator": [
    {"material": "ES ProcessStartInfo / launcher implementation (fd inheritance across exec), GuiSaveState.cpp delete action, SaveState.h / SaveStateRepository.h, Paths.cpp, setsettings.sh", "reason": "Needed to verify the session-lock survival claim, the delete hook point, default arguments, the hard-coded savestates root and RetroArch's directory handling", "declared_source_path": null, "sha256": null},
    {"material": "rclone 1.75.0 documentation or source for --files-from with lsjson/hashsum/copy, --ignore-times semantics, local-backend hash types, --backup-dir with copy under interruption", "reason": "The transport and correspondence mechanisms in §1.5 are hypotheses about rclone behaviour until Gate 4 measures them", "declared_source_path": null, "sha256": null},
    {"material": "The four other members' round-3 plans and this member's own round-3 plan", "reason": "Not embedded; cited only as the injected reviews describe them; no claim about their exact wording is made", "declared_source_path": null, "sha256": null},
    {"material": "Any executed result of the round-trip suite, the bisync spike, the #19 bench, or a two-device fixture", "reason": "None exists in the corpus; every gate in §6 is unrun", "declared_source_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, contents, or execution results have been fabricated."
}
```

=== END claude-revised_plan-r4.md ===

## Closing assessments

=== START claude_vote-r4.md ===

**Winner: `kimi-revised_plan-r4.md`.**

## Reasoning

The four plans have converged on one architecture — content-hash identity (D-CLOUD-030), per-device manifests read as a set of claims, a context-bound local agreement record, a home-built three-way classifier with rclone as transport, write paths that read cloud evidence before overwriting and defer when they cannot, a lifecycle gate spanning the emulator's process, a checked adapter over ES's slot primitives, default-on count-bounded retention with a self-contained record, queue-and-badge, deterministic auto KEEP BOTH, and no undo control in version one. `gpt-revised_plan-r4.md` and `kimi-revised_plan-r4.md` both say so explicitly. So this vote is choosing the document a builder is handed on Monday, and the question is which one has already decided the most, is grounded correctly, and has the fewest places where a careless reading produces a silent loss.

**`kimi-revised_plan-r4.md` is the most decided document.** Its §1 states the whole design in twelve sentences a builder can hold in their head. §4 gives a literal root, a literal directory layout, an encoding rule for the key (`percent-encode every byte outside [A-Za-z0-9._-]`, raw names kept in the record), a literal rule for the sequence (persisted counter, incremented under the cloud lock, seeded above the on-disk maximum, zero-padded), a literal `record.json` field list, a step-by-step reader walkthrough, and the reader-destruction test as a schema gate. §5 names six picks and settles each with a reason and a gate. §6 names exactly which register rows gain a refining row and which stand unchanged. §7 separates what the corpus settles from what the council merely agrees on, each council-agreed item with its gate. §8 orders thirteen hardware gates. §9 lists what is not built and separates load-bearing from optional. That is the shape the brief asks for: literal paths, field lists, orderings, acceptance conditions, gate sequences.

**Its grounding checks out against the embedded ES sources.** I verified its four adapter traps against `es/SaveStateRepository.cpp` and `es/SaveState.cpp`: `isEnabled` requires `"retroarch"`; an auto state registers with `slot = -1` and the 99999→0 scan in `getNextFreeSlot` never matches it, so an auto-only repository returns −99; `copyToSlot` ignores the return of `renameFile`/`copyFile`; `makeStateFilename(slot, true, …)` combines with `getParent(fileName)` of the *source*; the `.png` is moved alongside. Its concession that `defaultCoreDirectory` *replaces* rather than adds a scan is correct against `es/SaveStateConfigFile.cpp` (`copy->directory = pInfo->defaultCoreDirectory`), as is the `racommands = false` finding in the XML reader — both of which make #10 an ES patch, not a config file. Its transient-slot fixture is real: `setupSaveState` copies the loaded state to `mNewSlotFile` mid-session and `onGameEnded` may remove it, and `+ /**/*.state*` in `repo/.../cloud_sync-rules.txt` admits it. Its harness findings are real: `repo/tools/cloud-round-trip` overwrites `rclone.conf` and never restores it, and its archive assertions do not match the dated names `repo/.../sources/cloud_backup` and `cloud_restore` actually write and restore.

**Against `gpt-revised_plan-r4.md`:** this is the closest rival and is, in places, more complete (see dissent). It loses on leanness and on how much shape it leaves to the implementer. Its `record.json` is a table of *categories*, not fields. Its game key is "a hash of a canonical descriptor" — an indirection the reader must unwind. It proposes a manifest **schema 2** with an inline producer snapshot on *every* entry, a placement observation, a unit descriptor, and retirement notices carrying operation IDs, pinned pending operations, and a rule that "must distinguish deletion of Y from relocation of Z" — a heavier reopening of D-CLOUD-031 than the milestone earns, and closer to the lineage machinery the maintainer's amendment says is not the primary case. It adds a `preimages/` store area, a "last-verified witness" of the device's own manifest, a parser-discipline layer, and a split-root import mode. Each is defensible; together they make the Monday document larger than the problem. Many of its rules are framed as constraints ("must obtain current cloud evidence", "use a tested exact-file selection mechanism such as `--files-from`") rather than decisions. It is the better *specification*; `kimi-revised_plan-r4.md` is the better *build document*.

**Against `gemini-revised_plan-r4.md`:** correct in outline and free of any silent-overwrite path I can find, but too thin to build from without re-deriving most of the shape. Its `record.json` is a bullet list of categories. It places the store under `/storage/.cache/cloud_sync/retained/` and asserts it "is exempt from cache-clearing sweeps and is excluded from `backuptool` archives" without a gate — `repo/docs/conflict-wizard-ia.md` defines `.cache` as the home of state that can be regenerated, and the alignment review verified only that `.cache` escapes the archive, not that nothing sweeps it. It does not cite the corpus. It has no register treatment at all (criterion 5). It handles the auto-only −99 case by "prompt for keep-one," where allocating from `firstslot` is correct and cheaper. It omits the `RCLONEOPTS` filter bypass, forced transfers, the transient-slot fixture, capture context frozen at launch, typed exit outcomes, the census, the 480×320 gate, kid/kiosk, and the bisync spike. Its seven gates put the cheap, independent #19 bench last. A competent implementer would have to make a dozen decisions it does not make.

**Against `mistral-revised_plan-r4.md`:** it is not a document a builder can be handed. It opens and closes with meta-chatter ("I'll produce a revised approach…", "This approach integrates…"), its JSON carries `//` comments, and it cites round-3 plans the builder does not have as the source of its content. More importantly it contains two defects that would produce silent loss or invisibility if built as written. §7.2 implements *unexplained absence* as "tombstone with `reason: unexplained_absence`" — but §7.1 defines tombstones as a bounded list in the **synced** per-device manifest, so an unexplained local absence on device A would propagate as a deletion to device B. That inverts fail-closed. §8 item 3 says "derive destination from staging directory, not source parent" — that is the bug, not the fix: the merged state would be installed *into* the staging directory and vanish from the savestate manager; the correct rule (`kimi-revised_plan-r4.md` §3.7, `gpt-revised_plan-r4.md` §7.3) is to derive it from the game's live state directory. It also moves `agreed.json` out of `/storage/.cache/cloud_sync/` without reopening D-CLOUD-031, uses the cloud lock itself as the lifecycle gate (so a running game would make every cloud script report "another sync is running"), counts "compute local hashes" as an rclone spawn, and never states the KEEP RIGHT cloud-loser fetch — so its done page's "kept on this device" would be false for cloud losers.

## What the winner needs to satisfy the amendments

`kimi-revised_plan-r4.md` already matches both maintainer decisions: retention on by default and count-bounded (§1.9, §4), no undo control in version one (§3.6, §9), a done page that names what was discarded and says the copies are kept — and, correctly, does *not* promise recovery — and the restore tool as a separate issue that reuses the compare-and-choose surface (§4, last paragraph). Its store survives the future-reader requirement: keyed by system and game/unit, ordered by a clock-free commit sequence, carrying the producer snapshot, the retained PNG with its own hash, the original slot and path, the decision, and which side won; the reader walkthrough needs no manifest, audit log, or pending record.

Two adjustments, not additions: it should **give up** the peer-review crediting and the `claude_peer_review-r4.md §…` style citations throughout §2, §3 and §4 — the builder does not have those files, and the content is already stated inline; replace them with the corpus citations the plan also gives. And it should mark N = 3 and the tombstone window (64 events / 90 days) as the proposals they are, in one place a builder will read, so the census (its gate 5) is understood to set them.

## Dissent — provisions the winner must absorb from the losers

From **`gpt-revised_plan-r4.md`**:
- **Owner versus producer in the live manifest** (§4.2; also `gemini-revised_plan-r4.md` §2). The winner's manifest refinements (§3.1, §6) do not carry a producer for an *imported* copy — a cloud state installed by KEEP BOTH into a numbered slot on device A gets an entry under A's top-level `device` block, and the alignment review's "origin in the audit log" rotates at 1 MiB (D-CLOUD-027). The wizard's later "device + model" and #37's tile badge (`issues/issue-37.md`) would misattribute. Add a per-entry producer snapshot for imported copies (only imported copies need it; do not bloat every entry).
- **The unknown-provenance loser record** (§8.2): "copy the manifest entry verbatim" is insufficient when no entry exists; the record must carry known identity and placement with explicit unknown producer fields.
- **The failures-not-ruled-out table** (§11) with its cheapest experiments: same-basename ROMs sharing a state path; a state load later overwriting SRAM chosen independently in the wizard; a correct-looking PNG belonging to another state version; case/Unicode/path-syntax aliasing; full or read-only storage after a "successful" copy; a disappearing storage root; same pin with differing build flags; a stale UI result reused after a context change. None is in the winner's gates.
- **The full write-path inventory table** (§9.1): the hub SAVE DATA tick, the Tools entries (`/usr/config/modules/*.sh`), direct `cloud_backup`/`cloud_restore` save phases, and the future #37 tile all route through the coordinator; the winner names boot, the SYNC row and game exit only.
- **Source-visible fixes to file immediately** (§11): the `RCLONEOPTS` bypass of the mandatory allowlist (a non-empty `RCLONEOPTS` replaces the fallback options in `cloud_backup`/`cloud_restore`; user rules precede defaults in `cloud_sync_helper`), the native-rclone exit-code collision with the scripts' 3/4, and the mains returning only the save-phase status.
- **Typed outcome codes with numbers** (§7.5: 5 = needs decision, 6 = pending) — the winner names typed outcomes but not the codes ES will parse.
- "**Do not rewrite an unchanged manifest merely to advance `generated_at`**" (§3.3) — otherwise every no-change exit manufactures an upload.
- **Two stable partial listings cannot certify a complete save** (§5) — the completeness rule for legacy multi-file cloud sets needs a closed member set or emulator-specific evidence.
- **Split roots** (§9.2): the shipped `cloud_sync.conf` advertises a different `RESTOREPATH` as a feature; refuse bidirectional reconciliation of unequal roots rather than merely warning.
- **Local preimage before a one-way download overwrites a local file** (§5, §8.1 `preimages/`) — belt-and-braces the winner lacks; cheap.
- **Core pins from the build system's actual package resolution, verified in the installed artifact** (§3.3; blindspot 12 in `repo/docs/blindspot-register.md`).

From **`gemini-revised_plan-r4.md`**:
- Owner/producer (§2), as above.
- **Gate 6's fallback**: if `copy --backup-dir` does not preserve the replaced object atomically on a backend, fall back to explicit copy-verify-delete for retirements (D-CLOUD-026's shape) rather than only "fail closed and queue" — the winner's pick 5 should say which of the two the builder does.
- The one-line **auto-only handling** contrast is worth recording so nobody copies gemini's "prompt for keep-one": allocate from `firstslot`.

From **`mistral-revised_plan-r4.md`**:
- A **`verified` flag on agreement entries** (§3) — the winner says agreement advances only on verified equality; recording the flag makes a partially-verified record inspectable.
- The **done-page mockup** (§10.3) — the winner's wording is right; mistral's is the only rendered layout, minus its stray `[ COMPLETE ]` button.
- **"Downgrade safety is not guaranteed — old scripts overwrite by recency"** (§11.2) stated plainly as a release-note fact; the winner implies it but does not say it.

## Remaining defects in the winner that must be fixed before it is built

1. **`<unit-key>` uses `<rom-stem>`** (§4). The schema's `rom` field and ES's `{{romfilename}}` are the ROM file name *with* extension (`repo/docs/save-manifest-schema.md` §6). Key on the full `rom` (percent-encoded) to avoid stem collisions and to match what the manifest records.
2. **No producer for imported copies in the live manifest** — see dissent; a #37 badge or a later wizard panel reads the wrong device.
3. **No rule for the loser's producer snapshot when no manifest entry exists** — see dissent.
4. **Boot cutover is ambiguous** (§3.4): "the autostart shim stays a no-op until the ES side lands" and "the lock prevents a double run during transition" describe two different transitions. D-CLOUD-029 says the shipped paths stay as they are until #22 replaces them; make the boot pass cut over in #22 atomically with the exit pass and the SYNC row, and say so in one sentence.
5. **`copyToSlot`'s `makeStateFilename(slot)` default `fullPath`** is unknown (`SaveState.h` not embedded) — if the default is `false`, `destState` is a bare filename renamed into the process's working directory. The winner lists this as a gap; promote it to a blocking item of gate 6, because the adapter cannot be written without it.
6. **Tombstoned deletions applied without a retention-store copy** (§3.9): the only safety net for a mistaken ES delete becomes the cloud `--backup-dir` sibling, reachable only from a computer. Acceptable under the amendment's scope, but say so where a builder will read it, and consider gpt's bounded local preimage until propagation finishes.
7. **Capture's mtime+size negative filter** (§3.2): mtime is second-resolution on ext4 (schema §6), so a same-size rewrite inside the same second as the last capture is missed until the full pass. Non-destructive delay, but state the consequence beside the rule.
8. **Strip the peer-review citations** before handing over — see above.

---

*Provenance.* Judged against the 42 sources embedded above (manifest read `2026-09-05T17:32:51Z`), cited by their declared paths with the Facilitator's embed-time sha256 values; I did not re-read or re-hash any file, ran no commands, and touched no hardware. The four injected round-4 plans are not part of the source manifest and carry no hashes; I judged their claims on the merits against the corpus and the two maintainer amendments in the brief, not as evidence about councils or models.

```json
{
  "artifact": "peer-vote-r4",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "hash_basis": "copied from the per-source headers; verified at embed time by the Facilitator",
  "injected_plans_judged": ["gemini-revised_plan-r4.md", "gpt-revised_plan-r4.md", "kimi-revised_plan-r4.md", "mistral-revised_plan-r4.md"],
  "injected_plans_have_declared_hashes": false,
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
  ]
}
```

=== END claude_vote-r4.md ===

=== START gemini_vote-r4.md ===

**Winner:** `claude-revised_plan-r4.md`

**Reasoning:**
`claude-revised_plan-r4.md` is the most actionable, concrete specification for a builder to pick up and implement. It excels by providing literal JSON schemas (e.g., the exact `record.json` in §1.9.3), exact `rclone` command invocations with flags for both hashed and hashless backends (§1.5), and a highly specific, mechanical classification table (§1.3). This leaves almost no ambiguity for the developer. 

Compared to `gpt-revised_plan-r4.md`—which is exceptionally well-reasoned and provides excellent architectural boundaries—Claude goes one step further into implementation reality by writing out the exact JSON structures and shell commands. GPT relies on descriptive tables for its data contracts (e.g., §8.2), which requires the builder to invent the JSON keys and nesting. 

Compared to `kimi-revised_plan-r4.md`, Claude provides a slightly more rigorous breakdown of the apply phases and recovery mechanics (§1.7), ensuring that recovery inspects actual hashes rather than trusting a potentially stale phase marker. 

`mistral-revised_plan-r4.md` acts as a solid summary but lacks the depth of execution mechanics, edge-case handling, and rigorous gating present in Claude and GPT.

**Satisfaction of Amendments:**
Claude perfectly integrates the maintainer's amendments:
- **Reversibility & Undo:** It places the retention store in `/storage/.local/share/rocknix/cloud-saves/retained/` (safe from `.cache` wipes and `backuptool` archives), makes it on by default, bounds it by a count, and explicitly designs the store so the future reader can do a simple directory sort by `seq` without scanning other games or manifests (§1.9.4). It explicitly states V1 ships no undo control and leaves the restore tool for a separate issue.
- **Edge Cases & Unexplained Absence:** It explicitly handles "unexplained absence" by holding and reporting (§1.8 and §1.3), matching the "fail closed is expected and cheap" guidance without building massive distributed-system machinery to solve it.

**Dissent (Ideas to absorb from losing plans):**
- **From `gpt-revised_plan-r4.md`:** The explicit parser discipline (§4.5) to reject absolute paths, traversal, and unsafe symlink escapes is a necessary security guard that must be added to Claude's manifest parser.
- **From `gpt-revised_plan-r4.md`:** The invariant that "Two stable partial listings cannot certify a complete save" (§5) is a crucial safeguard against staging a permanently partial upload. Claude handles torn units, but GPT's phrasing is a stronger rule for the builder.
- **From `kimi-revised_plan-r4.md`:** The exact tracing of the ES code regarding `defaultCoreDirectory` (§2.1.1) proving that #10 requires an ES patch, not just a config file. Claude mentions this in §1.11, but Kimi's exact code citation is the definitive proof the builder needs to justify the patch.

**Remaining Defect in the Winner:**
In §1.5, Claude's plan states that for hashless backends (like the QA WebDAV), it will `rclone copy --files-from <changed paths> ... into a scratch dir, sha256sum` to verify the cloud head before uploading. Downloading the entire cloud head just to verify if it changed could be extremely slow and bandwidth-intensive for large saves (e.g., PPSSPP or Dreamcast) on the game-exit path. While it is the only way to be absolutely sure on a hashless backend, it risks blowing past the exit-path budget. The implementation must add a strict size limit or timeout for this hashless verification, falling back to deferral (leaving the unit pending for the background pass) if the file is too large, to avoid hanging the device on game exit.

=== END gemini_vote-r4.md ===

=== START gpt_vote-r4.md ===

**Winner: claude — `claude-revised_plan-r4.md`.**

I would use this as the builder’s foundation, **after correcting the blockers below**. It is not safe to implement entirely literally yet. Its advantage is that it specifies more of the safety-critical work: every write entry point, concrete storage paths, retained-record fields, verification mechanisms, apply phases, result codes, and acceptance gates.

The decisive distinction is not architecture—all four substantially converge on an application-owned reconciler using rclone—but how much an implementer must still invent.

Source citations below use **S01–S42**, mapped to the exact declared paths and Facilitator-verified SHA-256 values in `corpus.provenance.json`. I evaluated the embedded text; I did not access files, recompute hashes, or execute tests. References within the plans to earlier reviews are not independent evidence for this vote.

## Why this document wins

### Its strongest provisions

Three parts make `claude-revised_plan-r4.md` the strongest starting document:

1. **It enumerates the write-path replacement completely.** Boot, game exit, save rows, hub actions, Tools, direct script invocation, and the future save-manager tile all reach one reconciler. That matters because the shipped overwrite behavior exists in the scripts themselves, not just in the SYNC menu action. The default copy mode does not make conflicting overwrites safe. [S29, S30, S35, S41; D-CLOUD-029]

2. **It specifies correspondence verification rather than merely requesting “verification.”** Its hashed-backend path compares a fresh remote digest with the expected digest of the sealed payload; its hashless path requires downloaded-content verification. That explicitly addresses the otherwise circular act of associating a newly observed remote hash with the local SHA-256 one hoped to upload. Its rclone command compositions remain hypotheses to test, but the proof obligation is clear. [S09, S10, S29, S30]

3. **Its retention store most nearly satisfies the future-reader requirement as written.** It records the discarded operand’s producer, original slot and paths, retained-relative payload and thumbnail locations, member hashes, winning side, decision, completion state, and clock-independent local ordering. The proposed reader test deliberately removes dependence on mutable manifests, pending records, and the rotating audit log.

Those are concrete implementation decisions, not rewards for document length.

### Against `kimi-revised_plan-r4.md`

This is the strongest alternative. It is **better than the winner on sync-context binding**, explicitly distinguishes a claims-set union from a map merge, correctly rejects `defaultCoreDirectory` as a dual-directory scan, and includes the cloned-card experiment.

I nevertheless prefer `claude-revised_plan-r4.md` because several important contracts remain less settled in `kimi-revised_plan-r4.md`:

- Its remote-verification rule does not specify the new-upload digest correspondence as concretely.
- Its manifest refinements do not provide the same explicit per-entry producer contract. Retaining “the entry plus the enclosing device block” can preserve the *publisher*, rather than the original producer, after KEEP BOTH unless this distinction is wired into the manifest first.
- Its retention key uses a ROM stem rather than a full game locator. Different games in different subdirectories can consequently share a bucket unless further qualification is added.
- Its deletion section simultaneously promises hold-and-report for unexplained absence and describes automatic resurrection after tombstone expiry, plus a “resurrection + hold-back” hook fallback. A builder needs one normative rule.
- Its central sequential offline-fork test appears as the final capstone. The winner puts that cheap, potentially invalidating experiment near the beginning.

**Retention verdict:** substantially suitable, but not yet an unambiguous reader contract. Fix game-key collisions, resolve producer versus publisher explicitly, and specify the auto-state versus numbered-state pruning buckets in the normative store section.

### Against `gemini-revised_plan-r4.md`

This plan has good priorities: explicit cloud-loser fetching, unconditional capture, pending-upload retries, sync-context invalidation, and session-lifetime exclusion.

Its disadvantage is not brevity; it is that several consequential choices remain implicit:

- “ROM filename made path-safe” is not a collision-free key specification.
- The retained-record contract does not explicitly require the original ROM locator and slot.
- Tombstone expiry is coupled to the retention window, although deletion-control state and retained conflict candidates have different purposes.
- The checked adapter treats the auto-only allocator failure as a reason to offer keep-one. The source shows an allocator defect, not evidence that numbered slots are unavailable. [S37]
- The transfer and apply descriptions leave forced transfers, durable recovery state, and several COMPLETE preconditions less explicit.

**Retention verdict:** conditionally suitable. Its producer snapshot, complete-member map, retained-relative preview, and pre-overwrite cloud-loser fetch are strong. It still needs precise game/slot identity and key encoding. Keeping irreplaceable data under `.cache` is not automatically a failure—the corpus says that directory survives updates—but its exception from regenerable-cache treatment must be enforced and tested, not merely declared. [S02, S11]

### Against `mistral-revised_plan-r4.md`

This plan has useful field examples, an explicit producer snapshot, and a sound high-level requirement to verify native hashes against the payload.

However, it contains two particularly dangerous literal instructions:

- The merge adapter says to derive the destination **from the staging directory**. The destination must be the game’s actual repository directory. Otherwise an operation can successfully copy and verify files in staging without installing anything players can use. `SaveState::makeStateFilename()` and `copyToSlot()` make this distinction load-bearing. [S38]
- Unexplained absence is implemented as a **tombstone**. Without a rigorously separate non-deleting type, that turns missing evidence into deletion authority—the opposite of hold-and-report.

It also specifies classification per path while calling multi-file saves “units,” without fully defining the complete-unit classifier. Its example `link_identity` is the device ID, which does not distinguish two accounts linked under the same remote name.

**Retention verdict:** the required information is mostly named, but the store is not sufficiently specified as written. `<member-files...>` and `retained: true` are not unambiguous payload locators. It needs explicit original-versus-retained paths, sequence allocation rules, and a mandatory verified cloud-loser fetch before overwrite.

## What the winner needs for the maintainer’s amendments

`claude-revised_plan-r4.md` already adopts the substantive policy correctly:

- Default-on, count-bounded retention.
- No V1 undo control.
- A done page naming discards and saying their copies are kept.
- A separate future compare-and-choose restore tool.
- No deep ancestry or cross-device resolution-receipt system.

Its store **survives the future-reader requirement**, subject to the durability corrections below.

The final handoff should preserve that scope:

- **Do not add an undo button, history browser, or additional decision to the resolution flow.**
- Keep the restore-tool design and issue separate; retain the **test-only reader** as a V1 schema acceptance test.
- Treat the proposed count of three as a product proposal, not an already approved number.
- Say “copies are kept” only after their bytes and metadata have been durably verified. If retention cannot be completed, defer the affected destructive action; do not silently disable retention.
- Keep temporary transaction recovery separate from user-visible history. Journaling an interrupted operation does not require building a version-history product.

The default reversal must also be propagated into the IA and implementation issues, rather than leaving the old default-off instructions in circulation. [S02, S03; D-CLOUD-027, D-CLOUD-031]

## Dissent: provisions that must travel from the losing plans

### From `kimi-revised_plan-r4.md`

1. **Sync-context-bound agreement.** This is the winner’s most important omission. Bind agreement to the remote/backend, remote root, local roots, device identity, and a real link/account identity or locally maintained relink epoch. A context change must also invalidate queued plans and observations derived from the old context.

2. **Claims-set union.** Retain every relevant claim rather than choosing a manifest by map-merge order. However, qualify the wording: two different manifest claims alone do not prove a current fork—one may be stale. Current bytes plus agreement determine the verdict.

3. **The `defaultCoreDirectory` finding.** It substitutes a directory; it does not add a second scan. The XML path also changes `racommands`, while repository discovery scans the selected directories non-recursively. The winner’s #10 rehearsal should explicitly require both-layout discovery and launch-behavior parity, with an ES patch expected. [S37, S39]

4. **Sequence recovery and allocation.** Allocate the retention sequence under the relevant lock and recover it above existing records if the counter is missing or damaged. A bare persistent `.seq` file is an incomplete specification.

5. **The cloned-card experiment.** `cloud_device_id` deliberately trusts the stored value. Copying `/storage` can therefore duplicate the supposed single-writer identity. Test detection and safe refusal; do not assume hardware-derived initialization prevents later cloning. [S34; D-CLOUD-009]

6. **Separate conflict retention from mechanical retirement.** Verified-identical compaction must not consume the retention budget for actual conflict losers. The winner should make this explicit, particularly where its general retirement handling says “copy to retention.”

### From `gemini-revised_plan-r4.md`

1. **Make the cloud-loser fetch an explicit apply branch and acceptance test.** On KEEP RIGHT, obtaining a cloud thumbnail for display does not mean the cloud save itself has been retained. Fetch and verify the complete discarded unit locally before overwriting its remote head.

   The winner’s `prepared` phase largely implies this already; the dedicated branch removes a likely wrong reading.

2. **Keep the reader query as the store’s acceptance contract.** “This game, newest first, correct thumbnail, producing device, winning side” is the right test—not merely that record files exist. The winner incorporates most of this and should retain it unchanged through implementation.

The other major safeguards in `gemini-revised_plan-r4.md`—pending-work retries, lifecycle exclusion, protected incomplete records, and deterministic auto KEEP BOTH—are already substantially absorbed.

### From `mistral-revised_plan-r4.md`

1. **Use an explicit per-version producer snapshot contract.** Its schema example makes the producer object concrete. The winner’s optional-object convention needs particularly careful treatment of imported and unknown-origin files; a mandatory explicit producer object, allowing honest unknown values, would reduce attribution ambiguity.

2. **Carry the native-hash bridge into the acceptance tests.** Exercise both a newly established SHA-256/native-hash association and reuse of an existing association. The winner specifies the mechanism more clearly, but both cases should be tested independently.

I would **not** import its staging-directory destination rule or its unexplained-absence tombstone.

## Remaining blockers in `claude-revised_plan-r4.md`

### 1. Bind agreement to context, and settle the two-local-roots case

A warning that `BACKUPPATH != RESTOREPATH` is insufficient once agreement authorizes silent overwrites. The shipped configuration actually advertises different roots as a way to avoid replacement on restore; this is not merely an invented card-disconnection scenario. [S33]

Before reconciliation starts, either support those distinct roles explicitly or fail closed for that configuration. Do not silently interpret them as one tree. Apply the context binding carried from `kimi-revised_plan-r4.md` to pending operations as well as `agreed.json`.

### 2. A hard link is not a sealed upload snapshot

The winner permits capture to “hard-link or copy” a file into staging. A hard link shares the inode: a later in-place emulator write can change the supposedly sealed payload.

Require an independent copy, or a specifically proven snapshot mechanism. Hash the immutable staged bytes and upload those same bytes.

Also turn “the session lock is free” into an actual acquisition-and-hold contract, with an explicit lock order. Checking availability and then proceeding is not exclusion. Capture’s independence from the cloud-transfer lock must not introduce a deadlock.

### 3. Never promote a known torn unit merely because two passes saw it

The classifier currently allows an incomplete or mismatched declared unit to become an unknown-provenance one-way transfer after two unchanged full passes.

**Repeated observation is not evidence of completeness.** An interrupted PPSSPP upload can remain identically incomplete indefinitely.

Remove that promotion. Hold the affected unit until completeness can be established, while allowing unrelated work to continue. Honest legacy single-file handling can remain; it must not erase evidence that a declared multi-file unit is incomplete.

### 4. Make recovery durable, and apply it to non-conflicting installations too

The claim that losing `pending-apply` state necessarily fails closed is not established. Losing the only record identifying a partially installed unit can leave no reliable way to know what needs repair.

Require durable operation records and complete staged operands before the first installation effect. Do not subject unresolved recovery state to ordinary cache invalidation.

The same checked installation and offline-before-launch recovery contract must cover **non-conflicting pre-pass transfers**, not only wizard decisions. This is transaction safety, not an expansion into deep history. [S10, S11]

### 5. Rewrite the retirement rules as one consistent algorithm

Three corrections are needed:

- The one-sided retirement rows appear to target the side that is already absent. State the action against the concrete surviving operand.
- `published_at` versus retirement wall-clock time is not a reliable causal ordering, even when both devices report NTP synchronization. Use a narrowly scoped publication/retirement event relationship so restoring identical bytes is not consumed by an old retirement. This does not require a deep lineage graph.
- Reconcile “cloud layout wins” with D-CLOUD-030’s lower-slot compaction rule in one whole-repository move plan. Do not let the two rules alternately undo each other.

The retirement-expiry guarantee must also distinguish previously agreed absence from a genuinely untracked legacy copy. Bounded control state cannot justify an unlimited convergence claim.

### 6. Correct the post-write and concurrency guarantees

Fresh cloud evidence is necessary, but **read–check–write is not compare-and-swap**. The winner’s assertion that it makes simultaneous devices produce queued conflicts rather than clobbers is too strong.

Likewise, if correspondence verification fails *after* an upload, the system cannot truthfully say the unit was “never written.” It needs a durable uploaded-but-unverified outcome: retain operands, do not advance agreement, and re-observe before retrying.

Run the paused-between-read-and-write race experiment. Do not automatically add a distributed publication protocol because of an edge case, but do not claim one’s guarantees without implementing one.

### 7. Correct the remaining source and decision claims

- The schema **does have an equality row**; what it lacks is an explicit agreement-seeding action on that row. [S03]
- Caching foreign manifests outside the updated device’s sync tree prevents that device from republishing them. It does **not** prevent an older device from downloading and republishing the manifests through its broad savestates filter. [S29, S30, S32]
- D-CLOUD-028’s changed-path spawn/probe contract and D-CLOUD-031’s local manifest/agreement details are materially refined. Obtain and record those approvals explicitly rather than presenting everything as unchanged.
- The context, rclone verification composition, lifecycle ownership, and #10 launch behavior remain experiments, not established hardware results.

**Build gate:** repair the harness first, then prove the sequential offline fork and failed-upload retry, complete-unit retention, and offline interruption recovery before enabling the new write paths. That order preserves the winner’s main advantage: discovering a false safety assumption before building an expensive UI around it. [S36]

---

## `corpus.provenance.json`

```json
{
  "artifact_type": "round-4 peer vote",
  "winner": "claude",
  "winning_plan": "claude-revised_plan-r4.md",
  "corpus_mode": "Facilitator-supplied verbatim embedded read-at-time corpus",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "SHA-256 values copied from source headers; verified at embed time by the Council Facilitator, not by this member",
  "citation_mapping": "S01 through S42 correspond, in order, to the parallel source_file_paths and source_file_hashes arrays",
  "reviewed_plans": [
    "claude-revised_plan-r4.md",
    "gemini-revised_plan-r4.md",
    "kimi-revised_plan-r4.md",
    "mistral-revised_plan-r4.md"
  ],
  "reviewed_plan_hashes_provided": false,
  "peer_material_use": "Plans evaluated as proposals against the embedded corpus and authoritative maintainer amendments; not evidence about councils, models, or deliberation behavior. Earlier plans and reviews referenced inside them were not independently consulted.",
  "maintainer_amendments": {
    "source": "orchestrator brief in this prompt",
    "applied_as_authoritative": true,
    "separate_declared_source_path": null,
    "sha256": null
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
  "gaps_for_orchestrator": [
    {
      "material": "ES process-launch implementation, descriptor inheritance, GuiSaveState delete handler, and filesystem copy/rename implementations",
      "reason": "Required to establish lifecycle-lock ownership, delete-hook placement, and installation durability rather than assuming them",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 implementation or authoritative documentation for the proposed files-from, native-hash, download-verification, and backup-dir compositions",
      "reason": "The proposed transport and preservation mechanisms have not been demonstrated by the embedded corpus",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "RetroArch launch wrapper, setsettings.sh, backuptool, configuration defaults, cloud_setup, and tools/cloud-test-backend",
      "reason": "Needed for the namespace rehearsal, retention-home verification, relink-context implementation, and harness repair",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current issue bodies and executed results for the proposed hardware and regression gates",
      "reason": "Embedded issue artifacts are predominantly comments, and the required execution evidence is not supplied",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No unavailable source path, hash, file content, or test result has been fabricated"
}
```

=== END gpt_vote-r4.md ===

=== START kimi_vote-r4.md ===

**Winner: `claude-revised_plan-r4.md`**

## Reasoning

The brief asks me to choose the document a builder is handed on Monday — the one with the fewest unanswered questions and the fewest places a wrong reading produces silent data loss — and to prefer literal paths, field lists, orderings, acceptance conditions and gate sequences. On that standard the contest is between `claude-revised_plan-r4.md` and `gpt-revised_plan-r4.md`; both are far ahead of the other two, and claude wins on the literalness axis the brief explicitly names.

**claude vs gpt.** Both share the architecture (application-owned classifier, content identity, per-device manifests, lifecycle gate, checked adapter, hold-and-report, version-specific tombstones, retention on-by-default with no V1 undo). The difference is specification depth at the points where misreading is expensive. Claude gives: the exact retention path template with a percent-encoded, collision-free unit-key and a persisted `.seq` counter; a complete literal `record.json` (members with roles and `retained_as` locators, retained operand's producer snapshot, winner with `live_paths`, phase prepared/finalized); the full classification table including the torn-unit and unexplained-absence rows; per-backend-class exit-path mechanics with spawn counts and the correspondence proof; typed exit codes with the verified live defect (`clean_exit ${BACKUP_STATUS}` lets rclone's exit 3 reach `ThreadedCloudSync` and render as SKIPPED-lock — checked against S29/S40); the phased apply with the "a checkpoint is not proof" correction and offline hash-inspection recovery; the exact allowlist additions (`- /**/*.bak`, the snapshots rule); the exact content of each new register row; and a §5 that separates corpus-settled facts from council-agreed proposals, flagging the bisync demotion and queue-and-badge as maintainer calls. Gpt matches most of this in contract form but more often as tables and prose than as copy-pasteable literals, and its "Reopen D-CLOUD-031" framing is slightly off register protocol (additive refinements to a schema no cloud has ever received are new rows citing the old, not a reopening — claude's observation that the schema integer stays 1 because nothing has written rev 1 is the cleaner treatment). Gpt has real edges — parser discipline, the unknown-unknowns table, split-root design, explicit claims-set semantics — but those are sections the final synthesis can lift wholesale, which is exactly what the brief says happens to losing plans' provisions. The reverse is not true: claude's literal store and apply specification is the thing that cannot be reconstructed from gpt's document without re-deciding it.

**claude vs gemini.** `gemini-revised_plan-r4.md` has good bones and two ideas worth lifting (below), but it keeps the lossy "ROM filename made path-safe" unit-key that the reviews showed collides, keeps the store in `/storage/.cache/cloud_sync/retained/` against the corpus's own contract that `.cache` holds regenerable state (S02), asserts an exemption from cache-clearing that exists nowhere in the corpus, has no register-consequences section, no typed exit codes, no torn-unit or retirement-applicability rules, and — decisively — no citations and no provenance block against a brief that requires path+sha citation. Too much is left to the implementer.

**claude vs mistral.** `mistral-revised_plan-r4.md` is an attribution synthesis ("from gpt-revised_plan-r3.md §4.4") rather than a build spec; its classification table is the schema doc's pre-review table without the new rows; it moves `agreed.json` out of `/storage/.cache/cloud_sync/` with no argument against D-CLOUD-031; it has no corpus citations and no provenance block. A builder handed it would have to re-derive nearly every contract.

## What the winner needs to satisfy the amendments

Very little — it is already compliant: retention on by default, count-bounded with the number explicitly deferred to the maintainer, no undo control anywhere in the resolution flow, the done page naming discards and stating copies are kept, one-step depth with `resolves` receipts explicitly dropped citing the amendment, and a store proven readable by a non-existent tool via Gate 2's destruction test. Nothing must be given up. The only amendment-adjacent refinement: the done-page wording should name each discarded copy per game (claude says this; mistral's mock wording is the best concrete phrasing to lift).

## Dissent — what the losing plans have that the winner must absorb

**From `gpt-revised_plan-r4.md`:**
- **Sync-context binding on the agreement record (§4.4)** — the single most important lift. Claude's `agreed.json` has no remote/root/link binding, so CHANGE CLOUD FOLDER (a shipped row, S13) turns "local unchanged, cloud differs" into a silent "cloud changed → download" overwrite from a stranger folder. This is an unguarded silent-loss path in the winner. (gemini has the same idea, less fully.)
- **Parser discipline (§4.5)** — manifests and listings as input, not commands: duplicate keys, traversal, symlink escapes, case/normalization collisions, unbounded counts. Claude has nothing equivalent.
- **The unknown-unknowns table (§11)** — ten named failures with cheapest experiments, directly answering the problem statement's question 3. Two are not covered anywhere in claude: a loaded old savestate restoring old SRAM that then autosaves over the newer SRAM the wizard kept, and cloned-card duplicate device IDs (gpt's unexpected-own-manifest witness).
- **Split-root design (§9.2)** — S33 explicitly advertises `RESTOREPATH != BACKUPPATH`; gpt designs one-way staging/import and refuses bidirectional reconciliation, where claude only inherits the schema's assumption-plus-warning.
- **Claims-set union made explicit (§4.3)** — two manifests claiming different hashes at one path must be preserved as two claims matched to verified bytes, contradicting the schema's "merge of maps" sentence; this needs the register note gpt gives it and claude leaves implicit.
- Smaller lifts: `preimages/` as temporary transaction protection distinct from retention; "once a publication has begun, do not abort safe completion for a cosmetic stopwatch"; never rewrite an unchanged manifest to advance `generated_at`; the outcome-aggregation defect (both script mains return the save-phase status even when the system phase fails, S29/S30); the temporary *numbered* incremental state (S38 `mNewSlotFile`) as a phantom-upload vector the lifecycle marker must cover alongside `.state.auto.bak`; and the more conservative bisync framing (optional transport adapter, classifier always ours) as the documented fallback if the maintainer declines claude's demotion.

**From `gemini-revised_plan-r4.md`:**
- **The explicit cloud-loser fetch** — on KEEP RIGHT the cloud loser's bytes and PNG must be fetched and verified into the store *before* publication replaces the cloud head. Claude's phase 1 writes "the retained record and payload for the discarded side" but never says when a cloud-side loser's bytes are downloaded; gemini (and gpt) name it. This must become an explicit apply phase, or the done page's "copies are kept" is false for KEEP RIGHT.
- The crisp claims-set phrasing and the sync-context binding (as above).

**From `mistral-revised_plan-r4.md`:**
- The done-page discard wording mock ("DISCARDED (kept on this device): …") as concrete UI copy.
- Its "Not To Build" list as a negative-scope checklist for the implementation issue (mostly shared with claude §3, but a useful consolidation).

## Remaining defects in the winner that must be fixed before it is built

1. **No sync-context binding on agreement** — the CHANGE CLOUD FOLDER silent-overwrite path above. Must be added to schema rev 2 and the classifier before any write path ships.
2. **The cloud-loser fetch is not an explicit apply phase** — without it, KEEP RIGHT's retention promise is unfulfillable.
3. **No parser-discipline section** for manifests, listings, and retained records.
4. **No unknown-unknowns section**; at minimum the savestate-load→SRAM-overwrite coupling and the cloned-device-ID case need named experiments in the gate list.
5. **Split roots** are assumed away with a warning; either adopt gpt's one-way-import rule or gate the assumption explicitly.
6. **Claims-set semantics** must be stated and carried as a register refinement to the schema's "merge of maps" wording.
7. **The bisync demotion is the plan's largest unsettled dependency** — it contradicts the IA doc and #22's thread (no register row, so nothing is reopened, but the maintainer's word is required), and the plan needs the written fallback (bisync as optional transport behind the home classifier) if the answer is no.

=== END kimi_vote-r4.md ===

=== START mistral_vote-r4.md ===

I vote for **kimi-revised_plan-r4.md**.

## Reasoning

The kimi plan is the one I would hand to a builder on Monday. It is the most complete specification of the foundation, with the fewest unanswered questions and the fewest places where a wrong reading produces silent data loss. It also aligns most closely with the maintainer’s two binding amendments: reversibility as one-step retention, on by default, no V1 undo control; and the restore tool as a separate issue.

### Where kimi’s plan is stronger

1. **The retention store is specified for its future reader.** The store’s layout, keys, ordering, and record contract are all written so that the future restore tool can answer *"show me the retained past versions of this game, newest first, with a thumbnail, the producing device, and which side won"* without scanning unrelated games, trusting mutable manifests, or relying on the rotating audit log. The other three plans either omit the store’s physical layout or leave its discovery path unspecified. The kimi plan’s reader test (§4) is the acceptance gate that proves the store survives the amendment’s requirement.

2. **The write-path replacement is complete.** The kimi plan replaces every writer of the save tree — boot, SYNC/UPLOAD/DOWNLOAD rows, the hub tick, the Tools symlinks, the game-exit pass, the future #37 SYNC tile, and a maintainer at an SSH prompt — with one coordinator that reads current cloud evidence before writing. The other three plans either omit one or more writers or leave the replacement mechanism unspecified. The kimi plan’s typed outcomes and exit codes (§3.4) are also the most concrete, with a clear mapping from rclone’s native exits to the scripts’ reserved skip codes.

3. **The lifecycle gate is specified.** The kimi plan owns the gate across the emulator’s process lifetime, surviving an EmulationStation crash-and-restart, and excludes the save tree from every sync pass while a game runs. The other three plans either omit the gate or leave its ownership unspecified. The kimi plan’s sealed stage copies (§3.5) are also the most concrete, with a temp name matching neither ES regex.

4. **The classifier is specified.** The kimi plan’s three-way classifier over complete member maps is the most concrete, with a table that folds out moves first and qualifies them (§3.3). The other three plans either omit the classifier or leave its verdict table unspecified. The kimi plan’s unit descriptor (§3.1) is also the most concrete, with `kind: container` confined to single-file multi-game saves and multi-file containers expressed as declared units over per-file entries.

5. **The tombstone rule is specified.** The kimi plan’s bounded `retirements` list in the per-device manifest, with explicit applicability/consumption semantics (§3.9), is the most concrete. The other three plans either omit tombstones or leave their lifetime unspecified. The kimi plan’s resurrection consequence is also stated plainly: a forgotten tombstone plus a late device means the file returns as device-only and is uploaded without a prompt — non-destructive, self-correcting, at worst a later conflict the wizard shows.

6. **The picks are settled.** The kimi plan’s six picks (§5) — store home, store keying, tombstone lifetime, manifest transport, protected publication, retention count — are the most concrete. The other three plans either omit one or more picks or leave them unspecified.

### Where the other plans fall short

- **claude-revised_plan-r4.md** is the second-strongest plan, but it omits the retention store’s physical layout and leaves its discovery path unspecified. It also omits the lifecycle gate’s ownership and leaves the write-path replacement mechanism unspecified. Its tombstone rule is less concrete, and its picks are less settled.

- **gpt-revised_plan-r4.md** is the third-strongest plan, but it omits the retention store’s physical layout and leaves its discovery path unspecified. It also omits the lifecycle gate’s ownership and leaves the write-path replacement mechanism unspecified. Its classifier is less concrete, and its tombstone rule is less concrete.

- **gemini-revised_plan-r4.md** is the weakest plan. It omits the retention store’s physical layout and leaves its discovery path unspecified. It also omits the lifecycle gate’s ownership and leaves the write-path replacement mechanism unspecified. Its classifier is less concrete, its tombstone rule is less concrete, and its picks are less settled.

### What the kimi plan needs to satisfy the amendments

The kimi plan already satisfies the maintainer’s two amendments. It retains the discarded copy on by default, bounded by a count, and ships no undo control. The done page says what was discarded and that the copies are kept on this device. The store is designed for the future restore tool, and the reader test (§4) is the acceptance gate that proves it.

The kimi plan also already states the resurrection consequence of a forgotten tombstone: the file returns as device-only and is uploaded without a prompt — non-destructive, self-correcting, at worst a later conflict the wizard shows. This is the maintainer’s "fail closed on unexplained absence, cheaply, without abandoning deletion propagation" requirement.

### Dissent — what the other plans have that kimi’s plan does not fully absorb

1. **claude-revised_plan-r4.md’s manifest-last transport.** The kimi plan adopts `--files-from` with payload and manifest together, but claude’s manifest-last second spawn is an optional, measured optimization. The kimi plan’s reader coherence check is the safety, not ordering. The claude plan’s manifest-last spawn is not load-bearing, but it is a measured option the kimi plan could adopt after the transport gate passes.

2. **gpt-revised_plan-r3.md’s agreement context binding.** The kimi plan adopts the binding, but gpt’s register refinement (§2) is more concrete. The kimi plan’s `sync_context` block could be made more explicit about the remote’s non-secret identifying fields.

3. **gemini-revised_plan-r3.md’s protected publication protocol.** The kimi plan adopts the sibling `--backup-dir` mechanism, but gemini’s protected publication is a conditional requirement. The kimi plan’s race fixture (gate 6) decides whether the protocol is needed; if it is, the kimi plan’s warn-and-refuse same-ID is the fallback.

### Remaining defect in the kimi plan

The only remaining defect is that the `#10 per-core namespacing` rehearsal (§3.10) is not embedded. The rehearsal’s three questions — whether the non-`racommands` launch path works, whether an ES patch scanning both the flat and per-core directories preserves discovery of existing states, and whether losing the `.auto`/`.bak` dance changes observable behavior — are not inspectable from the embedded corpus. The rehearsal is a gate, not a defect in the design, but it is a gap in the evidence.

---

## Summary

The kimi plan is the most complete specification of the foundation, with the fewest unanswered questions and the fewest places where a wrong reading produces silent data loss. It aligns most closely with the maintainer’s two binding amendments, and it is the one I would hand to a builder on Monday. The other three plans either omit key parts or leave them unspecified. The kimi plan’s retention store, write-path replacement, lifecycle gate, classifier, tombstone rule, and picks are all concrete and specified for their future readers. The only remaining gap is the `#10` rehearsal, which is a gate, not a defect in the design.

=== END mistral_vote-r4.md ===
