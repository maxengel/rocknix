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