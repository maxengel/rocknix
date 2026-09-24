# Consensus integration plan

*Base: `claude-revised_plan.md`, as the brief fixes it. Integrated from `gpt-revised_plan.md`, `kimi-revised_plan.md`, `gemini-revised_plan.md`, `mistral-revised_plan.md` and the closing assessments `claude_vote.md`, `gemini_vote.md`, `gpt_vote.md`, `kimi_vote.md`, `mistral_vote.md`. Every claim carries one of three marks: **[corpus]** — settled by an embedded source, cited by path under `research/council-runs/2026-09-11-save-history-one-home/_sources/` or by register ID; **[council]** — a position argued here from the corpus; **[unmeasured → En]** — a hypothesis, with the experiment in §4.5 that settles it. Provenance is in `corpus.provenance.json` at the end. No code.*

**The steer that decides every trade.** The floor is the base's invariant: *nothing becomes the current save in the cloud, and nothing leaves it, unless that version is already in the store.* Above the floor the cheapest sufficient form wins (D-CLOUD-034, D-CLOUD-098): fewest round trips, fewest bytes over the handheld's Wi-Fi, no operation on the launch path, and an exit sync no longer than the invariant strictly requires. Each provision below says what it costs and where it runs — **exit sync** (cancellable by a launch, D-CLOUD-076), **full pass** (startup sync or a manual row), or **never on the device**.

---

## Winning plan as base

The base is carried forward in the following form. Where a blocker or a closing assessment amends a provision, the row says so and §2 gives the amendment.

| # | Base provision | Marking | Status after integration |
|---|---|---|---|
| B-1 | **Home.** `<SAVES_REMOTE>/.history/`, hidden, declared by `Saves/README.md` and `Saves/.history/README.md`; one store, one vocabulary; `--backup-dir` retired at R1; no interim (D-CLOUD-095/097). | [corpus] D-CLOUD-095/097 | **Kept.** |
| B-2 | **Store-first.** *Escrow*: every publication uploads its version into the store, verified, before the head is written from the local stage. *Retain*: a head not known to be in the store is copied into the store before anything overwrites or deletes it — once per save for pre-cutover heads, and for heads a foreign writer produced. No lock, no lease, no conditional write; the transport is D-CLOUD-052's `copy --files-from --ignore-times`, unchanged. | [council]; transport [corpus] D-CLOUD-052 | **Kept as the floor.** Transaction shape amended (§2 B1); deferral as a pair (§2 B2). |
| B-3 | **Layout.** `.history/<unit>/<seq>/`, members at relative paths, `record.json`; `<seq>` carries UTC, device id, run id and a version digest so a listing can answer "is this version here". | [council] | **Amended** (§2 B1, B8): members are stored under content-addressed names; `<seq>` also carries the digest of the version displaced. |
| B-4 | **`reason`**: `published \| replaced \| discarded \| deleted \| suspect`; reader labels by reason. | [council]; labels per D-UI-022 | **Amended** (§2 B8): `legacy` added; migrated set-asides are never imported as `replaced`. |
| B-5 | **Race made visible.** A "cloud changed" verdict whose head record `replaces` a version other than this device's agreement is reclassified divergent. | [council], refinement R-a | **Amended** (§2 F14): the immediate-predecessor test is wrong (`gpt_vote.md`); replaced by an ancestry test, kept as a refinement, not V1-mandatory. |
| B-6 | **Isolation by rule.** `- /.history/**` and `- /README.md` ahead of every include in `cloud_sync-rules.txt`, shipped one image before the writer; store transfers carry no allowlist; a local `.history/` is imported, never deleted unverified; the standing fold repairs old-image damage; the residual stated. | [corpus] for the shipped rules' any-depth includes (`repo/code/cloud_sync-rules.txt`); [council] for the rest | **Kept, strengthened** (§2 B8 fleet boundary): content-addressed member names make the store match no include in the shipped rules, so the guard no longer has to reach every old device to protect the bytes. |
| B-7 | **Bounds.** Two protections (P1 head-equal or pending-referenced; P2 last complete copy of a headless file), then count per save file (default 3, 1–9), age 90 d trust-gated, 256 MiB target; pruning on full passes only; overshoot disclosed; the count applied to shared history is the largest any manifest declares; head-equal entries exempt from the cap pending census. | [corpus] D-CLOUD-036/096 for numbers; [council] for ordering | **Amended** (§2 B3–B6): newest deliberate loser reserved; decided deletion excluded from P2; every byte counts; shared settings by last edit, not maximum; concurrent pruners made safe by owner-scoped deletion. |
| B-8 | **Suspect.** Heal from the capture stage at exit, from the cloud on a full pass, never by a fetch on the exit path; the suspect kept as an exact descriptor; recovery reported after the install succeeds; the second occurrence is a question. | [corpus] D-CLOUD-100 for the class and the heal; [council] for the rest | **Amended** (§2 F13): one bounded fetch of that unit is the fallback when the stage lacks the good copy; the descriptor is called what it is — a version; durable ordering stated for offline heals. |
| B-9 | **Save states**, auto-states included, made true by the per-file bucket. | [corpus] D-CLOUD-099 | **Kept.** |
| B-10 | **Settings.** KEEP EARLIER VERSIONS OF SAVES · VERSIONS KEPT PER SAVE, either directly under SAVE MANAGEMENT or nested behind a verb-bearing row; the switch's dialog states its price. | [corpus] D-UI-039/023 | **Amended** (§3 C-5): nested, behind a verb-bearing row; the "four rows directly" alternative is dropped. |
| B-11 | **Reader (#25).** One store; hide head-equal entries; never offer an incomplete entry; stage and verify before touching a live file; if pruned meanwhile, leave the save unchanged and say so. | [council]; D-CLOUD-077 | **Kept**, plus the `legacy` label (§2 B8). |
| B-12 | **README.** Written only after the saves folder is validated (D-CLOUD-085/091/092); names both hidden folders; calls the caps targets; in V1 promises no menu restore (D-CLOUD-033/077). Mass absence counts live save units, never objects. | [council] | **Kept.** |
| B-13 | **Audit.** Every store mutation writes its line before it acts (D-CLOUD-027). | [council] | **Kept.** |
| B-14 | **Migration.** Copy → verify → record → delete, per file, both directions, standing on every full pass, never a prompt; path-aware fold of displaced history members; imports untrusted for age. | [council]; rule from `00-problem-statement.md` | **Amended** (§2 B8): `reason: legacy`, idempotent receipts, per-artifact removal with late-write conservatism, explicit fleet boundary. |
| B-15 | **Time to play.** Launch path unchanged; exit gains one spawn and one upload of the changed bytes; startup sync longer; measured by #135's cell with latency *and* completion rate. | [council]; estimates unmeasured | **Amended** (§2 B10, F12): the ledger is corrected for record-last and for hashless verification; a freshness bound and measurement are added. |
| B-16 | **Register changes** as refinements by ID; D-CLOUD-052/097/095/014 not reopened. | — | **Kept and extended** (§4.6). |

---

## Dissent primitives integrated into the base

Each primitive names its source file(s), the rule as the consensus adopts it, what it costs, where it runs, and its marking. B1–B10 are the brief's blockers; F11 onward are further defects the closing assessments raised.

### B1 — The transaction shape: bytes first, record last, the record is the commit point

**From:** `kimi-revised_plan.md` (row 2), `gpt-revised_plan.md` (§3.2), `mistral-revised_plan.md` (§2); the base's co-uploaded record is dropped (`gpt_vote.md`, blocking correction 1; `claude_vote.md`, dissent 2).

**Rule.** An entry is written as (1) its member bytes, (2) then `record.json`. A directory that holds a valid record is a complete entry; the record lists every member's relative path, sha256 and size, so a reader that wants to be certain re-checks presence against the listing at no extra request. A directory without a valid record is an **orphan**: invisible to the reader and the pruner's protections, swept by its **owner** (the device whose id is in `<seq>`) on a full pass when its run id is not the current run and no local pending record names it. Non-owners never touch an orphan (see B6, owner-scoped pruning) — which removes the base's two-pass run-count grace rule entirely. **Dedupe:** before uploading a `published` or `replaced` entry, if the newest complete entry of that save file (by listing) has the same version digest *and* is P1-protected (head-equal, or named by this device's own pending record), the upload is skipped; event entries (`discarded`, `deleted`, `suspect`) are never deduplicated, so byte reuse can never erase the event metadata #25 needs (`gpt_vote.md`, correction 5). **Copy, never move**, for anything that leaves the head: a cloud loser on KEEP RIGHT is a server-side copy into its `discarded` entry, verified, and a decided deletion copies before it deletes; `moveto` is never used against the head, because a move opens the absence window D-CLOUD-037 turns into a question.

**Members are content-addressed** (`gpt_vote.md` asked that non-save payload names be tested; `kimi-revised_plan.md` §1.7 made naming a compatibility choice; the base's digest-in-name idea): each member is stored as `<sha256>` with no extension; the record maps paths to hashes. Two consequences, both free: two same-named files in one unit cannot collide (`gpt-revised_plan.md` §3.1), and — from the shipped rules file as embedded — a bare hex name matches none of `+ /**/*.srm`, `+ /**/*.state*`, `+ /**/*.sav`, `+ /**/*.auto`, `+ /**/*.dsv*`, `+ /**/*.eep|mpk|sra|fla` (each needs a literal `.ext`) and none of the root-anchored `+ /savefiles/**`, `+ /savestates/**`, `+ /screenshots/**`, `+ /n64/save/*`, `+ /psx/memcards/*`, `+ /dc/shared/savefiles/**`, `+ /psp/PPSSPP/**`, `+ /backup/*` (each needs a first component that is not `.history`), so every store object falls through to `- /**` **[corpus]** `repo/code/cloud_sync-rules.txt`. Under the shipped allowlist an old image neither restores nor mirrors-away a store member. That the installed rclone evaluates these patterns as read here is **[unmeasured → E1]**.

**Interrupt outcomes** (power loss, link loss, SIGKILL): *before the members* — nothing has changed anywhere; *during the members* — an orphan, head untouched, swept by its owner later; *after the members, before the record* — likewise an orphan (the members are not yet protection); *after the record, before the head write* — a complete entry; `pending-publish.json` says `escrowed`; the next pass writes the head from the stage (or by server-side copy from the entry where E3 shows a gain) and skips the escrow by dedupe; a lost pending record costs a redundant entry, never a version; *during the head write on a multi-member unit* — #22 A8's hold; the entry is the coherent source to complete from; *after the head, before agreement* — the next pass sees L = C and confirms; *link loss anywhere* — bounded by D-CLOUD-075's timeouts and reported as partial (D-CLOUD-077). **[corpus]** for A8/D-CLOUD-075/077; **[council]** for the sequence.

**Cost.** Record-last as two spawns adds **+1 spawn (~1 KiB up) per publish** on the exit sync, roughly 0.3–1.5 s on a handheld's Wi-Fi **[unmeasured → E12]**. Whether one spawn can be made to order the record last (`--transfers 1` with an ordering that places `record.json` after every member) is **[unmeasured → E4]**; if E4 passes on every backend in `issues/133.md`'s matrix, the one-spawn form replaces the two-spawn form and the +1 spawn is recovered. Content-addressed names cost nothing in transfer; the reader and the fold map names through the record, which they already read. **Runs in:** exit sync and full pass (escrow); full pass (orphan sweep).

### B2 — Deferral as a pair under the admission ceiling

**From:** `mistral-revised_plan.md` (§2.4 as cited in `kimi-revised_plan.md`), `gemini-revised_plan.md` (§3.1), `gpt-revised_plan.md` (§8.3), `kimi-revised_plan.md` (row 2).

**Rule.** R5's admission ceiling counts, per unit: the escrow's bytes, the head's bytes, the record, and on hashless backends the verification re-fetches of both — members and PNGs included. A unit over the ceiling defers **escrow and publish together** to the next full pass; a publish never leaves the device ahead of the entry that protects the version it displaces. Overshoot of the store's *size target* is not a reason to block a publish (`gemini-revised_plan.md` §2.3; `gpt_vote.md`); a failed or unverified escrow is (`gpt_vote.md`).

**Cost.** Fewer large units clear the exit sync (PPSSPP directories, `issues/133.md`'s streamed backends); they publish at the next full pass. The numbers come from Gate 4 and E12, not chosen **[corpus]** D-CLOUD-046. **Runs in:** exit sync.

### B3 — Reserve the newest deliberate conflict loser

**From:** `kimi-revised_plan.md` (row 8, "newest N routine plus newest `reason: discarded`"), preferred over `gpt-revised_plan.md` §5.2's within-allowance form (`claude_vote.md`, `gpt_vote.md` dissent 1).

**Rule.** A new protection P3: the newest complete `discarded` entry of each save file is never deleted by the count cap and is not counted against it. It leaves only when a later `discarded` entry supersedes it, or under the age cap with trusted time, or under the size cap — it is not immortal. This keeps D-CLOUD-032's primary use case ("one step back" from a mis-press) from degrading to "three exits back" when the same file is overwritten by routine syncs after a wizard decision.

**Cost.** At most one entry per file that has ever had a wizard decision — a battery save or a state plus PNG, 8–128 KB or ~80–100 KB (D-CLOUD-036's sizes) — counted against 256 MiB. **Runs in:** full pass (pruning).

### B4 — A decided deletion is not an unexplained absence

**From:** `gpt-revised_plan.md` (§5.4), carried by `kimi-revised_plan.md` (§3 bounds, the question to the maintainer) and `kimi_vote.md` (dissent 2).

**Rule.** P2 — "never a game's only copy" (D-CLOUD-096) — protects the newest complete entry of a save file whose head is absent **and whose absence is unexplained**: the file has agreement on record and the newest entry's reason is not `deleted`. A `deleted` entry (a REMOVE EVERYWHERE, a save-state DELETE, or a MATCH deletion — all decided, all writing `retired`, D-CLOUD-047/053) is an ordinary earlier version: it leaves under the age cap with trusted time or under the size cap. A `legacy` entry of a headless file has no agreement and an unknown event; P2 does not apply and it ages from its import time (see B8). Without this, every deliberate removal becomes a permanent, cap-exempt cloud copy, which is neither a bounded history nor what a player meant by "remove everywhere". D-CLOUD-096's clause is thereby made precise; the maintainer's confirmation is a proposal in §4.6.

**Cost.** None in transfer; one field already in the record. **Runs in:** full pass.

### B5 — Every stored byte counts against the 256 MiB target

**From:** `gpt-revised_plan.md` (§5.3), `gemini_vote.md` (record of dissent); the base's pending exemption of head-equal entries is withdrawn.

**Rule.** The size accounting is the listing's total under `.history/`: members, PNGs, records, escrowed head-equal entries, `legacy` imports, suspect descriptors, orphans awaiting sweep. Protected material (P1–P3, pending recovery) is counted and, when it alone exceeds the target, produces a logged and disclosed overshoot rather than a deletion. Consequence, stated: because every current version is an escrowed, protected entry, the room for *earlier* versions is 256 MiB minus the footprint of current versions. Gate 2's census (which D-CLOUD-036 already reserves for the PPSSPP directory case) measures that footprint; if it approaches the target the number is the maintainer's to revisit — an exemption is not ours to grant. **[corpus]** the maintainer's "256 MB across everything" (D-CLOUD-096).

**Cost.** None beyond the listing pruning already needs. **Runs in:** full pass.

### B6 — Shared settings on a shared store, and concurrent pruners

**From:** carriage through the manifest — `kimi-revised_plan.md` (row 5), D-CLOUD-045's per-device manifests already read on every pass; tie rule — `gpt-revised_plan.md` (§5.7, "ON wins, larger count wins" on incomparable edits); the ratchet defect — `claude_vote.md` (defect 4), `kimi_vote.md` (defect 4); owner-scoped reclamation — the consensus's answer to `gpt_vote.md`'s blocking correction 2 and `gpt-revised_plan.md` §5.6's two-pruner contract.

**Rule — one fleet-wide setting.** The own manifest carries `history_keep: {on, count, rev}` (additive under D-CLOUD-045; schema not embedded — gap G3). A pass reads every manifest (it does already, as a claim set) and adopts the entry with the highest `rev` as the effective setting; on equal `rev`, ON beats OFF and the larger count wins. A player's edit writes `rev = max_seen + 1`. This is "the last explicit edit wins across the fleet", which matches a one-player, few-devices model, needs no clock, no lease and no offline-pending machinery, and cannot ratchet: a drawer device's stale manifest carries a lower `rev` and is outvoted. The settings page shows the effective value and applies an edit locally at once and to the fleet at the next pass.

**Rule — OFF.** OFF means the store gains nothing new — no escrow, no retain, no wizard-loser copies — on every device, from the next pass; existing entries are not purged and leave under the age and size caps only; the suspect descriptor (a record of two numbers, required by D-CLOUD-100's set-aside) is still written; the wizard's done page says "Discarded saves were not kept." (#23). OFF is therefore the player opting out of the floor, and the switch's confirmation dialog says exactly what that gives up (time-to-play rule: "a setting that trades speed for safety says its price"). This is one of the two readings the closing assessments hold (§3 C-3); it is the one the maintainer's steer selects, and it goes to the maintainer as a proposal.

**Rule — owner-scoped pruning.** A device deletes only entries whose `<seq>` carries its own device id. Every device computes the same victim set from the same listing (order per B-7's chain rule below) and deletes its own share. Two pruners never choose the same victim; an entry another device is mid-upload is never a non-owner's target; a device's outstanding escrow (a complete entry not yet the head) is protected from every other device by construction, and from its owner by its own pending record — which closes `gpt_vote.md`'s counterexample (A escrows HA and pauses; B prunes under pressure; HA survives because B does not own it). The race-loser case (A publishes HA, B overwrites with HB, HA is head nowhere and in no chain) is protected from B for the same reason, and released by A on its next full pass, where A knows from its pending record that HA was published and now applies its own caps to it. Guard against the mirrored last-copy race: each device also never deletes its *own* newest complete entry of a headless file, so two devices cannot each delete "because the other's survives".

**Cost.** ~40 bytes per manifest; zero round trips (manifests already read). Owner-scoping costs an overshoot: a drawer device's entries beyond the count stay until it next runs; a device lost forever leaves its entries (bounded by its count per file plus its share of the size target), counted and disclosed. It removes rules: no run-count grace, no cross-device protection table, no coordination. **Runs in:** full pass. `gpt-revised_plan.md` §5.6's fallback — if the two-pruner fixture (E6) still finds a loss, destructive cleanup is disabled for the affected entries and the overrun reported — stays as the acceptance condition.

### B7 — The `--delete-excluded` audit as a requirement with an experiment

**From:** `kimi-revised_plan.md` (§2.6, E2), `gemini_vote.md`.

**Rule.** (1) Every shipped rclone invocation in `cloud_backup`, `cloud_restore`, the reconciler and the layout migrator is audited for `--delete-excluded`; the full scripts are a corpus gap (G2), so the audit is a listed task, not an assertion. (2) The reconciler never passes it and never sources `RCLONEOPTS` (#22 R2) **[corpus]**. (3) `cloud_sync_helper` strips `--delete-excluded` from a user's `RCLONEOPTS` on upgrade with one log line — the same shape as D-CLOUD-088's rule-file insertion and D-CLOUD-083's retry migration **[corpus]** for the precedent. Why it is load-bearing: with `- /.history/**` in the rules and `BACKUPMETHOD=sync`, `--delete-excluded` turns the guard into an instruction to delete the store on the destination; whether the deletion lands in `--backup-dir` first is **[unmeasured → E2]**.

**Cost.** One string check in the helper; one VM run. **Runs in:** never on the device (audit); helper at upgrade.

### B8 — Migration in full, with an honest event and a mixed-version boundary

**From:** the base's copy → verify → record → delete both directions; `reason: legacy` — `kimi-revised_plan.md` (§1.4, §4), `gpt-revised_plan.md` (§3.1), `mistral-revised_plan.md` (§1, §6); idempotent receipts and a fresh grace — `gpt-revised_plan.md` (§6.5 steps 4–6); per-artifact removal with late writes handled conservatively — `gpt_vote.md` (correction 7), against `gemini-revised_plan.md` §1.2's whole-folder deletion; partial legacy artifacts kept distinct from abandoned uploads — `gpt_vote.md` (dissent 3); the standing fold — `kimi-revised_plan.md` (§2.2, §4.3).

**Rule — cloud `Saves-replaced/<stamp>/<path>`.** On every full pass, per file: obtain its hash (backend hash mapped through the manifests on hashed backends, R4; fetch-to-hash within a per-pass budget on hashless ones, deferring the rest — the source waits). If a complete entry for that path already holds that version, delete the source after confirming the entry is complete. Otherwise copy it — server-side where E3 shows the backend can, else through the device — into `.history/<unit>/<seq>/<sha256>`, then write the record: `reason: legacy`; `legacy_event: unknown` (a stamp holds sync-mode deletions as well as replacements — "anything replaced (or, in sync mode, removed)", `repo/code/cloud_backup-set-aside-excerpt.md` **[corpus]**); `producer: unknown`; `legacy_time: <stamp>` as written, zone unknown (the stamp is `date +%Y_%m_%d-%H%M%S` with no `-u` **[corpus]**), `time_trusted: false`; `imported_at` and `imported_by`; `complete: false` unless the unit table (#21, gap G1) says every member is present. Write an idempotent local receipt (source path + hash → destination `<seq>`); a lost receipt is re-derived from the listing's digests. Verify the record; then delete **that one source file**, and only if its listing entry (size, hash) still matches what was imported — a late write from an old image running now is left for the next pass. Never purge a stamp directory; remove it when empty. **Path-aware repair:** a source at `<stamp>/.history/<unit>/<seq>/<name>` is a displaced history member; if the original entry's record exists and lists that hash it goes back to its original place, else it becomes a new `legacy` entry. **Age:** imports are aged from `imported_at` by the importer's clock, trust-gated (§B-7), so a hundred-day-old legacy version is not deleted on arrival. **Incomplete imports** are marked `complete: false`, never offered as a unit by #25, and are not orphans: they have records, so the orphan sweep cannot take them.

**Rule — device `/storage/.cache/cloud_sync/replaced/<stamp>/<path>`.** The manual RESTORE row passes no `--update`, so this folder can hold the only copy of a newer local save an older cloud copy replaced **[corpus]** `repo/code/cloud_restore-set-aside-excerpt.md`. Per file on a full pass: hash locally; if the head or a complete store entry holds that version for that path, delete the local file; else upload it as a `legacy` entry (`imported_by: <this device>`, producer unknown — the file may itself have arrived by a restore of another device's copy), verify, record, then delete. `Saves-discarded/` never shipped; nothing to migrate **[corpus]** D-CLOUD-042/#22.

**Rule — the fleet boundary.** Release order: (i) a guard image — the two exclusion lines at the top of `cloud_sync-rules.txt`, the helper's `--delete-excluded` strip, no writer; (ii) the writer image (R1 cutover); (iii) old images retired. Content-addressed names mean a device on the *shipped* image `af2db4ab09` (E1's baseline) cannot include a store member under the shipped rules, whether or not it received the guard, so the exposure narrows to two configurations: a user-named filter file (D-CLOUD-088) whose includes reach `.history/`, and `--delete-excluded` with `BACKUPMETHOD=sync`. In those, two old-image sync-mode runs with no new-image pass between can let `prune_replaced_remote` delete a stamp holding displaced members before the fold repairs it **[corpus]** for the pruner; the fold converts that from permanent loss to a bounded race. This residual is **stated for the maintainer to accept or reject** (§4.6), not accepted on their behalf (`gpt_vote.md`); no player is told to upgrade devices in an order (`mistral-revised_plan.md` §10's release gate is rejected, §3 C-9).

**Cost.** One server-side copy or one streamed transfer per legacy file, once; a receipt file per import on the card; the standing fold's listing of `-replaced/` on each full pass (one request when empty). **Runs in:** full pass only; never exit, never launch.

### B9 — Repopulating `in_store` when device state is cleared

**From:** `gemini_vote.md` (defect 1), `gpt_vote.md` (correction 1: membership proven, not inferred from a name).

**Rule.** `in_store` is derived state, not primary. The primary record is a per-entry `store_seq` in the own manifest (additive under D-CLOUD-045, gap G3): the `<seq>` where the published version was escrowed. The cloud's copy of the own manifest survives a cleared `/storage/.cache/` and is already read on every pass for the own-manifest witness (R7) **[corpus]**, so a full pass after a cache clear recovers every flag at zero additional round trips. Where the manifest has no `store_seq` — a legacy head, a foreign publisher, a first pass after a context change (R7) — the flag is unknown, and it is resolved **lazily, once, before the first overwrite of that head**: one listing of `.history/<unit>/` answers it, because record-last makes "a directory whose name carries the digest *and* that contains `record.json`" a completeness certificate visible in a listing, and the retain case concerns the *current head*, whose entry is head-equal and therefore P1-protected by every pruner — the skip is safe (`kimi_vote.md` defect 1 answered). If the listing shows no entry, the retain runs: at exit from the stage if the stage holds the agreed version (F13's #21 requirement); if the stage is gone too (the cache clear takes the stage with it — `.cache/cloud_sync/stage`, R9 **[corpus]**), by one server-side copy of the head into the store where E3 shows the backend can, else the unit defers to the full pass. No storm: a cache clear costs one listing per unit at its first overwrite, spread over time, not a bulk upload.

**Cost.** ~20 bytes per manifest entry; one listing per unit on the rare unknown path; nothing on the launch path. **Runs in:** exit sync (the lazy listing) and full pass.

### B10 — The freshness cost of a longer exit sync

**From:** `gpt_vote.md` (measure completion rates, not only latency), `kimi-revised_plan.md` (§6), `mistral-revised_plan.md` (§12 item 3: the startup sync's backup half lengthens too).

**Rule.** A longer exit sync meets a launch more often (D-CLOUD-076 cancels it), so more publishes wait for the next pass and the other device sees a staler cloud. Bounds: (i) the ordering inside the exit sync is *escrow, then head*, so a cancel after the entry is complete leaves `pending-publish.json` at `escrowed` and the next pass finishes with a head write and no re-escrow — the wasted work is at most the spawn in flight; (ii) units are admitted smallest first, so a battery save publishes before a large state when both changed (a council position, cheap, to be measured); (iii) a deferred publish completes at the next startup sync (D-CLOUD-072) or the next exit. **What the player sees:** the card ends `SKIPPED - A GAME WAS STARTED` (D-CLOUD-076) and the next card reports the combined publish; the other device, if it plays the same game meanwhile, meets a divergence and the wizard asks (#23) — a question, never a silent overwrite, which is the plan of record's protection (D-CLOUD-076's accepted residual). **Measurement:** #135's `time-to-play` cell runs three arms — no history, the delta's retain-old-head, and store-first — on WebDAV and on SFTP with and without a bandwidth cap, reporting the exit sync's latency distribution *and* its completion rate, plus the startup sync's duration **[unmeasured → E12]**. **Budget:** a register row for "exit sync, one changed battery save, hashed backend" is proposed with the number filled from E12, never chosen (#135).

**Cost.** None beyond the runner's cell. **Runs in:** exit sync (ordering); never on the device (measurement).

### F11 — Own-manifest witness before any store write

**From:** `mistral-revised_plan.md` (§2 item 4), `kimi-revised_plan.md`, the base's mechanism row. A cloned card (R7, A11) refuses with `duplicate-device-id` before it writes a single entry; otherwise a device that will not publish pollutes the store with escrows nobody owns. **Cost:** none; the witness runs in the head-evidence listing already spawned. **Runs in:** exit sync and full pass. **[corpus]** for R7/A11.

### F12 — The exit ledger, corrected

**From:** `gpt_vote.md` (correction 6: hashless escrow verification cannot ride the head check; record verification counts), `gpt-revised_plan.md` (§8.2 request-based accounting; §8.4 S3 multipart ETag is not MD5), `mistral-revised_plan.md` (§9 ledger form), `claude_vote.md` (defect 8: "copy and move cost the same" is E3's hypothesis).

| Step | Today (R5) | Store-first, hashed backend | Store-first, hashless / streamed |
|---|---|---|---|
| Head evidence + own-manifest witness | 1 spawn | 1 | 1 |
| Escrow members (+S up) | — | **+1** (rclone's post-transfer hash check verifies, if E3 shows it fails closed) | **+1**, plus **+1 re-fetch (+S down)** or defer |
| Record (~1 KiB) | — | **+1** (0 if E4 passes) | **+1** (0 if E4 passes; the re-fetch spawn verifies it) |
| Head write (+S up) | 1 | 1 | 1 |
| Head correspondence | 1 (0–1 re-fetch hashless) | 1 | 1 + re-fetch (+S down) |
| Legacy retain, once per save | — | +1 spawn, +S up from the stage | same |
| **Added per changed save** | — | **+2 spawns, +S up** | **+3 spawns, +S up, +S down** |

Estimates for a battery save or a numbered state on a handheld's Wi-Fi: **+1–3 s** on hashed backends, more on streamed **[unmeasured → E12]**. Against the delta's retain-old-head on streamed backends (old down, old up, old-verify down, new up: 4S) store-first is 3S with verification, 2S without — the base's "2× versus 3×" is corrected to that. D-CLOUD-046's "3–4 spawns" becomes 5–6 hashed and 6–7 hashless; the "nothing changed ≈ 5 s" contract and the zero-spawn idle exit are unchanged **[corpus]**. Server-side copy from the entry to the head (the base's R-e) saves S of upload where a backend supports it and is taken where E3 shows the gain. A provider hash is used for correspondence only where E3 establishes it maps to the stored bytes; a multipart S3 ETag is not assumed to be an MD5. Low-level retries stay at 10 (D-CLOUD-083); the launch budget is not met by cutting them.

### F13 — Auto-heal: stage first, one bounded fetch as the fallback, durable ordering, truthful report

**From:** stage-first — the base; bounded fetch on the exit pass as the fallback — `gemini-revised_plan.md` (§3.2), `kimi-revised_plan.md` (row 7), `mistral-revised_plan.md` (§11, "heal from the stage first, fetch only if the stage lacks the good copy"); durable ordering, offline and OFF — `gpt_vote.md` (correction 4); the erase-twice question — the base and `gemini_peer_review.md` as cited by `kimi-revised_plan.md`; both-suspect and no-good-copy as questions — `mistral-revised_plan.md` (§7), `kimi-revised_plan.md` (row 7); suspect cloud head never installed over a good local copy — `gpt-revised_plan.md` (§7), the base.

**Rule.** At exit, a save classified suspect (zero length, or all one byte, where the agreed version was neither — D-CLOUD-100 **[corpus]**): (1) audit line; (2) the suspect **descriptor** — `reason: suspect`, size, byte value — written durably to the local pending store (it *is* a version: exactly reconstructible, shown by #25 as SET ASIDE AS DAMAGED, uploaded to `.history/` when a pass is online, counted); (3) the agreed version installed from the capture stage by temp-and-rename; (4) nothing published for the unit; (5) the recovery reported on the card only after (3) succeeds. **Precondition, an amendment to #21 (gap G1, E13):** the stage keeps the last agreed version of every save until a newer version is agreed — D-CLOUD-078's one last-known-good, applied to the stage. **Fallback:** if the stage lacks the agreed version, the exit pass makes **one bounded fetch of that unit only** into staging (D-CLOUD-075's timeouts; a launch cancels it, D-CLOUD-076; the card names it, D-CLOUD-077), then (3)–(5); if the fetch cannot complete, the unit is marked *suspect-unhealed*, nothing publishes, and the next full pass heals. This is a narrow refinement of D-CLOUD-046/R5's "no fetches on the exit path", taken because leaving a zero-length save in place until the next boot is not "the last known good state in place" (D-CLOUD-077) — the reasoning §3 C-4 records. **Questions, not heals:** both sides suspect; no verified good counterpart; a both-changed pair where one side is suspect; a head that turns suspect in the cloud while the device's agreed copy is good (never installed). **The loop:** the second suspect capture of the same save after a heal is not healed but queued on the wizard's absence surface (D-CLOUD-037's shape): keep it empty, or put back the last good copy. A version restored through #25 becomes the agreed version, so a restored uniform file is not re-healed. **Wording:** D-CLOUD-100's sentence is the maintainer's; a truthful variant for the heuristic case ("looked empty" / "looked damaged" rather than "was damaged", D-CLOUD-077) is proposed in §4.6, not assumed.

**Cost.** Zero network on the primary path; one download of one unit on the rare fallback; a few hundred bytes for the descriptor. **Runs in:** exit sync; full pass for the unhealed case.

### F14 — The disguised race, as a corrected refinement

**From:** `gpt_vote.md` (correction 3) refutes the base's immediate-predecessor test with HA → HB → HC (HC's `replaces` is HB, not A's agreement HA, yet nothing branched). **Rule.** The refinement R-a survives only in its correct form: a "cloud changed" unit is reclassified divergent when the device's agreed version is **not an ancestor** of the cloud head along the `replaces` chain — positive branching evidence (HA and HB both replacing H0). The chain is read from the listing alone because `<seq>` carries both the version digest and the displaced-version digest (B1); a break in the chain (a `legacy` or foreign entry with `rdigest = 0`) yields *unknown* and the identity rule stands — no false conflict. Bytes are safe without R-a (HA is escrowed); R-a is what lets the wizard offer HA now rather than #25 later. **Cost:** one listing per cloud-changed unit on the full pass; nothing on exit. **Runs in:** full pass. **Status:** refinement, not V1-mandatory; the classifier's identity rule is unchanged unless it is built (D-CLOUD-030).

### F15 — Orphan quiescence before a launch (D-CLOUD-093 refinement)

**From:** `gpt-revised_plan.md` (§8.5), `kimi_vote.md` (defect 7), `claude_vote.md` (dissent 7). D-CLOUD-093 releases the lock when the shell dies; its children may still be renaming files into the saves tree **[corpus]**. **Rule.** The reconciler writes its process-group id beside the lock; a launch, and a new reconciler run, kill and wait that group when its owner is dead, within D-CLOUD-076's two-second budget, before proceeding. **Cost:** one small file on tmpfs; a bounded kill+wait only on the orphan case. **Runs in:** launch gate (bounded, already budgeted by D-CLOUD-076) and pass start. Fixture E7.

### F16 — Planner validation of reserved paths, the walker audit, and MATCH

**From:** `gpt-revised_plan.md` (§6.2, §6.3), `kimi-revised_plan.md` (E7), `mistral-revised_plan.md` and the base on MATCH. **Rules.** (a) The reconciler's transfer and deletion lists never contain `.history/**`, `README.md` or a manifest path as a *save*, regardless of any filter file — a check on the list, not a filter (refines D-CLOUD-088: the player controls which saves move, not the namespace). (b) `cloud_capture` and every whole-tree walk (root-emptiness, layout migration, TIDY UP, CHANGE CLOUD FOLDER) distinguish live saves from control metadata; a downloaded local `.history/` is never claimed as this device's saves (#21, gap G1). (c) MATCH THIS DEVICE TO THE CLOUD — "the only action that deletes", preview then confirm **[corpus]** `repo/docs/es-menu-map.md` — is inventoried into R1 without inventing its direction (gap G2); whichever side it deletes on, each deletion goes through the store first (`deleted`), by server-side copy or upload where the version is not already there. **Cost:** (a) a list check; (b) a walker rule; (c) one copy per MATCH deletion, on a manual, minutes-scale action that runs in `GuiCloudTransfer`, not a card. **Runs in:** full pass / manual.

### F17 — Rules-file upgrade path

**From:** `gemini-revised_plan.md` (§5.2), `kimi_vote.md` (dissent 12), `claude_peer_review.md` §7.5 as cited by `kimi-revised_plan.md`. **Rule.** Whether `cloud_sync_helper` delivers the two guard lines to a user-*edited* copy of the shipped rules file on upgrade is **[unmeasured → E15]** and a requirement: it must, with a log line, leaving a user-*named* filter file alone (D-CLOUD-088). Content-addressed names make this belt-and-braces for members; it still protects the README. **Cost:** helper logic at upgrade.

### F18 — Reader truthfulness and vocabulary

**From:** `kimi-revised_plan.md` (row 6), `gpt-revised_plan.md` (§2 reader row), `mistral-revised_plan.md` (§6, a named label for `legacy`), the base's R-f. **Rules.** #25 hides head-equal entries; labels `published`/`replaced` as REPLACED BY A SYNC or AN EARLIER SAVE (an escrow that never became the head is still an earlier save the player made — truthful either way); `discarded` → YOU CHOSE THE OTHER; `deleted` → DELETED; `suspect` → SET ASIDE AS DAMAGED; `legacy` → a label the maintainer chooses (proposal: KEPT BY AN OLDER SYNC); never offers `complete: false`; stages and verifies before any live write; leaves the current save unchanged and says so if the entry vanished (D-CLOUD-077); a restore is a publication through the reconciler, which re-checks the entry's presence at head-write time and re-escrows from the stage if it is gone. **Cost:** one listing per restore. **Runs in:** manual, requires the network (#25).

### F19 — Settings: nested, verb-bearing, with the measured price

**From:** `gpt_vote.md` (correction 8: nest, do not place four rows directly), `kimi-revised_plan.md` (row 5, MANAGE SAVE HISTORY), the base (§3.9). **Rule.** Two rows behind one verb-bearing row under SAVE MANAGEMENT: KEEP EARLIER VERSIONS OF SAVES (switch, on) · VERSIONS KEPT PER SAVE (dimmed while off); the entering row's label carries a verb per `repo/rules/es-native-ui-excerpt.md` — proposal MANAGE EARLIER VERSIONS OF SAVES, the words the maintainer's (D-UI-022: "history" is not in the vocabulary); the switch's dialog states the measured seconds ON costs and what OFF gives up; the effective fleet value is shown; `repo/docs/es-menu-map.md` moves in the same change (D-UI-039). Range: D-CLOUD-036 says 1–9 default 3; D-CLOUD-096 says "3 to 5" as starting points — the consensus keeps 1–9 default 3 and asks the maintainer to confirm (`gpt-revised_plan.md` §5.1).

### F20 — Soft-cap disclosure and audit coverage

**From:** `gemini-revised_plan.md` (§2.3), `kimi-revised_plan.md` (§2.4), `gpt-revised_plan.md`. Pruning runs on full passes only (the reasoning the shipped script gives for `--recent` **[corpus]**), so an exit-only device overshoots count and size between passes; the README, the public page and the settings dialog call the caps targets. Every store mutation — escrow, retain, discard, delete, suspect, prune, import, fold — writes its audit line before it acts (D-CLOUD-027), not only heals.

---

## Dissents that conflict with the base

Genuine conflicts, not blended. Each states both positions, why both cannot hold, and what the consensus does — where the maintainer's steer or a binding row decides it — or that the maintainer's word is needed.

**C-1 — Uniform-at-full-size: heal or ask.** `gpt-revised_plan.md` §7: a nonzero uniform file at a plausible full size is a *question* unless format evidence shows corruption, because an in-game reset produces exactly that and "was damaged" is then false. The base, `kimi-revised_plan.md` and `mistral-revised_plan.md`: heal both patterns, as D-CLOUD-100 decides, with the second occurrence a question. Both cannot hold: one adds a question to a flow D-CLOUD-033 wants quick; the other heals an intentional erase once. D-CLOUD-100 is binding and same-day; the consensus keeps the heal, absorbs the intentional-erase case through the second-occurrence question (one extra heal, then a question), and proposes only the wording change (§4.6). `gpt-revised_plan.md`'s argument is recorded for the maintainer should they reopen D-CLOUD-100 by ID.

**C-2 — Retain-before-install: unconditional check or conditional on `store_seq`.** `gpt_vote.md` (dissent from `gemini-revised_plan.md`): "a cached `in_store` flag cannot substitute for a presently valid, protected cloud entry when a local version is about to be destroyed" — check presence every time. The base: retain only when `store_seq`/`in_store` is unknown or false. They differ on a listing per fetched unit. Under store-first, the local agreed version was either escrowed by this device or was a head another device escrowed; if that entry has since left the store, it left under the count or age policy — re-uploading it buys a version the policy has already retired, at a listing per fetch. The steer decides: conditional. The residual (a version the player's own count let go is not re-retained) is policy, not loss.

**C-3 — What OFF means.** `gpt-revised_plan.md` §5.7 and `gpt_vote.md`: OFF stops optional long-term history but not "mandatory transaction recovery" — escrow continues as transaction material, pruned once superseded. The consensus (§2 B6): OFF stops escrow too. Both cannot hold: one keeps the exit-sync cost and race recoverability under OFF; the other removes both. #23 already reads OFF as "the same decisions apply, nothing is retained" **[corpus]**, and the steer prefers the shorter exit sync when the player has opted out. The consensus recommends its reading and **asks the maintainer's word** (proposal P-1), because D-CLOUD-032's "an option the player controls" and the floor's status are both theirs to weigh.

**C-4 — A fetch on the exit path for the heal.** The base: never; a stage miss waits for the full pass. `gemini-revised_plan.md`, `kimi-revised_plan.md`, `mistral-revised_plan.md`: one bounded fetch per suspect unit on the exit pass. Both cannot hold as written. The consensus integrates the fetch **as the fallback only** (F13), because a zero-length save left in place until the next boot violates D-CLOUD-077's "last known good state in place" more than one bounded, cancellable download violates R5's push-only contract; the refinement to D-CLOUD-046 is proposed by ID. `kimi-revised_plan.md`'s framing that the exit card is "where D-CLOUD-098 permits spending the player's attention" is not adopted; `repo/rules/time-to-play.md` says rigour belongs after the card has said the player may go, and the fetch is defensible because a launch cancels it and the card names it (`claude_vote.md`, defect 9).

**C-5 — Settings placement.** The base offers "four rows directly under SAVE MANAGEMENT" as an alternative to nesting. `gpt_vote.md`: nest, as the delta says, or reopen it explicitly. Both cannot hold. The delta's nesting follows D-UI-039 and the menu map's pending note **[corpus]**; the consensus nests (F19) and drops the alternative.

**C-6 — Shared count: fleet maximum or last edit.** `kimi-revised_plan.md` row 5 and `mistral_vote.md`: pruners apply the *maximum* declared count. `gpt-revised_plan.md` §5.7: a causal revision with conservative ties. `claude_vote.md`/`kimi_vote.md`: the maximum ratchets (a drawer device pins 9). Maximum and last-edit-wins cannot both hold. The consensus takes last-edit-wins with a revision counter and `gpt-revised_plan.md`'s tie rule (B6) — one field, one comparison, no ratchet — and asks the maintainer to confirm that one player's latest choice should govern every device (proposal P-1).

**C-7 — The suspect copy: descriptor or bytes.** `gpt_vote.md` correction 4: a descriptor that reconstructs every byte is a retained version and must be called one; `mistral-revised_plan.md` and `kimi-revised_plan.md` retain the bytes. The consensus keeps the descriptor (exact for both patterns, a few hundred bytes instead of up to 128 KB of zeros) and calls it a version (F13); this resolves the wording objection, not by averaging but by adopting `gpt_vote.md`'s premise and the base's mechanism.

**C-8 — Cheaper store-first: `mistral-revised_plan.md` §9's "retain and verify in the background after the card says the player may go".** The base and D-CLOUD-076/077: nothing runs after the card that the card has not reported; a launch cancels the group; the outcome line never claims completion before verification **[corpus]**. Both cannot hold. Rejected (`claude_vote.md`, `kimi_vote.md`).

**C-9 — Player-facing cap rows and a player-facing upgrade order.** `mistral-revised_plan.md` §5 lists AGE CAP and TOTAL SIZE CAP as rows; §10 gates the release on "upgrade both devices before syncing". D-CLOUD-096 and D-UI-039 say the caps are ours, not rows **[corpus]**; the commission says a prompt about our internals is a failure mode **[corpus]** `00-problem-statement.md`. Rejected on both counts; the fleet boundary is release engineering (B8).

**C-10 — Reopening D-CLOUD-052.** `mistral-revised_plan.md` §11 lists D-CLOUD-052 as reopened for the concurrency residual. The base and `kimi-revised_plan.md`: the transport is unchanged and the residual lives in R5/D-CLOUD-046. Not reopened; store-first uses the decided transport **[corpus]** D-CLOUD-052.

**C-11 — Whole-folder deletion after the fold.** `gemini-revised_plan.md` §1.2: fold displaced members back, then "delete the legacy `-replaced/` folder". B8: per-artifact removal only, never a folder purge. Both cannot hold; a purge after folding only the nested items loses every un-folded legacy stamp in the folder (`claude_vote.md`, `gpt_vote.md`). Rejected.

**C-12 — Format-aware suspicion.** `mistral-revised_plan.md` §7: a format-aware uniform-byte detector. D-CLOUD-100 names two patterns and `gpt-revised_plan.md` withdrew the broad validator. Not adopted; kept as a follow-up experiment the maintainer may want later (`gpt_vote.md`).

**C-13 — The predecessor-mismatch classifier.** `gpt_vote.md`: remove it. `kimi_vote.md`, `gemini_vote.md`: keep it. Resolved by correction rather than choice (F14): the immediate-predecessor test goes; the ancestry test stays as a non-mandatory refinement. Recorded here because the objection was to the rule's *form*, and the corrected form should be judged on E5, not assumed.

---

## Step 5 handoff content

### 4.1 The store contract (what every issue builds against)

```
<SAVES_REMOTE>/.history/<unit>/<seq>/
    <sha256>          one file per distinct member content; bare hex, no extension
    record.json       written last; a valid record is the commit point
<seq> = <utc-compact>-<device-id>-<run-id>-<vdigest>-<rdigest>
        vdigest = short hash over the entry's sorted member sha256s
        rdigest = vdigest of the version this one displaced, or 0 when unknown
<SAVES_REMOTE>/README.md ; <SAVES_REMOTE>/.history/README.md
```

`record.json`: `schema`; `reason ∈ {published, replaced, discarded, deleted, suspect, legacy}`; unit key, `kind`, `system`, `rom`; `members[] = {path relative to the saves root, sha256, size}`; slot at the time (or null); `producer`, device label, `core`, `core_build`, `captured_at`, `clock_synced`; `replaces` (vdigest, and `pub` if known); for `discarded`: the decision, winning side, `decided_at`; for `deleted`: the retirement's `pub`; for `suspect`: `pattern = {size, byte}` and no members; for `legacy`: `legacy_source`, `legacy_event: unknown`, `legacy_time` (zone unknown), `imported_at`, `imported_by`; `time_trusted`; `complete`; the run id. A reader may treat an entry as complete when its record is valid; it may re-verify member presence against the listing for free.

**Invariants.** I1 nothing becomes the head, and nothing leaves it, unless the version is a complete entry (floor). I2 bytes before record; record before head. I3 copy, never move, from the head. I4 own-manifest witness before any store write. I5 a device deletes only entries it owns. I6 P1 (head-equal; own pending), P2 (unexplained-headless newest complete; own newest complete of any headless file), P3 (newest `discarded` per file) precede C1 (count per save file), C2 (age 90 d, trusted both sides), C3 (256 MiB, oldest first over own unprotected). I7 no store operation on the launch path; pruning, fold, listings and the ancestry check on full passes only. I8 every mutation audited first.

### 4.2 Load-bearing requirements, in build order

1. **Prerequisites (before any store code).** Read #21's unit table and stage lifetime (G1) and amend #21: the stage keeps the agreed version until superseded; the capture walker never claims `.history/`. Read `docs/save-manifest-schema.md` (G3) and add `store_seq` per entry and `history_keep{on,count,rev}` at top level (additive, D-CLOUD-045). Audit the full scripts, the layout migrator and MATCH (G2) for `--delete-excluded`, `--backup-dir` targets and call paths.
2. **Guard image.** `- /.history/**` and `- /README.md` at the top of `cloud_sync-rules.txt`; the helper strips `--delete-excluded` from `RCLONEOPTS` and adds the guard to a user-*edited* rules file (E15); `- /savestates/.snapshots/**` dropped once its no-writer premise is confirmed against the cutover inventory. No writer yet. Not a widening of `-replaced/` (D-CLOUD-097 stands).
3. **Escrow transaction** in the reconciler (R5/R9): entries spawn, record spawn (or E4's one-spawn form), verification per backend class, admission ceiling counting store bytes, deferral as a pair, `pending-publish.json` states `escrowed → published`, `store_seq` written to the own manifest, dedupe rule, audit lines.
4. **Retain path** for unstored heads: `store_seq` lookup, lazy listing, from-stage upload at exit, server-side copy on the full pass, defer otherwise.
5. **Pruning** on full passes: listing, chain order from `<seq>`, P1–P3, C1–C3, owner-scoped deletion, own-orphan sweep, size accounting of every byte, overshoot logging.
6. **Standing fold** of `-replaced/` and the local cache (B8), receipts, path-aware repair.
7. **Suspect class and heal** (F13), the second-occurrence question, the bounded fallback fetch.
8. **Wizard apply through the store** (#23): KEEP LEFT uploads the device loser as `discarded`, then installs the cloud head locally; KEEP RIGHT copies the cloud loser as `discarded` (server-side where possible), escrows the device version, writes the head; KEEP BOTH and the auto rule publish through escrow.
9. **Settings** nested (F19), the fleet setting (B6), the menu map, the switch's measured price line.
10. **README and public docs** (B-12, F20).
11. **Reader (#25)** after Gate 2 (A5).

### 4.3 Changes to the issues, row by row

**#21** — add: the stage keeps the last agreed version of each save until a newer one is agreed; the walker distinguishes live saves from control metadata and never claims `.history/` or a README.

**#22**
- **R1** — add MATCH THIS DEVICE TO THE CLOUD to the enumerated writers (direction from the code, gap G2); every deletion it makes goes through the store first.
- **R2** — the outer boundary carries `- /.history/**` and `- /README.md` ahead of every include, `- /**/*.bak` stays, `.snapshots` dropped after the inventory; **store transfers carry no allowlist** (their source is a stage directory the reconciler wrote); the planner rejects reserved paths from any save list regardless of filter file; `--delete-excluded` never passed.
- **R4** — add the `suspect` class with its outcomes (heal from stage; fallback fetch; questions for both-suspect, no good copy, suspect cloud head, second occurrence); "cloud unit declared incomplete" now also covers an entry with `complete: false`; mass absence is judged on live save units; the ancestry reclassification (F14) as an optional refinement; the deletion row's action becomes "copy into the store as `deleted`, then act" and drops the `-replaced/`/Gate 7 clause.
- **R5** — the exit push becomes: head evidence + witness → escrow members → record → verify → head write → correspondence → agreement and `store_seq`; spawn budget 5–6 hashed, 6–7 hashless, numbers from Gate 4/E12; the ceiling counts store bytes; deferral as a pair; smallest unit first; **one bounded fetch of a suspect unit when the stage lacks the good copy** as the only download; idle exit spawns nothing.
- **R6** — stale text: a launch *cancels* an automatic sync (D-CLOUD-076), not "refuses"; add the process-group marker and quiescence (F15).
- **R7** — the witness precedes any store write; a context change sets every `store_seq` unknown.
- **R9** — replace wholesale with §4.1's contract and I1–I8; local transaction state unchanged under `/storage/.cache/cloud_sync/`.
- **R10** — codes 3/4 → 75/69 (D-CLOUD-074); add reason `unverified-escrow`.
- **Negative scope** — "no local retention of anything" → "no *permanent* local history; the stage's agreed version is transaction state"; "no preimages of one-way fetches" → "no *redundant* preimages: a local version about to be overwritten is retained only when its `store_seq` is unknown or false"; "no protected-publication protocol" → "no coordination protocol in the cloud; publication is made recoverable, not serialised"; "no undo control" and "no `--resync`" unchanged.
- **Replaced-mechanism inventory** — `-replaced/` (cloud) and `.cache/cloud_sync/replaced/` (device): folded by the standing job, then removed when empty and the last old image is retired.
- **Acceptance** — see §4.4; the existing retention items now read "in `.history/`".

**#23** — the two retention rows nest behind a verb-bearing row under SAVE MANAGEMENT; labels per F19; the switch's dialog states the measured price and what OFF removes; the effective fleet value is shown; the done page's footer unchanged; A4 rewritten: the loser's members and record are complete in `.history/` before the head changes (KEEP RIGHT by copy, KEEP LEFT by upload), and the winner is escrowed before it becomes the head; with the switch off nothing is retained and no escrow runs (pending C-3).

**#25** — reads `.history/` only; labels per F18 including `legacy`; hides head-equal; never offers `complete: false`; stages and verifies before any live write; a restore is a publication (re-check the entry at head-write time; re-escrow from stage if gone); the `-replaced/` "labelled separately" clause and the `.snapshots` guard clause go; A5 gains "after a cache clear on the reading device and with the writing device's entries pruned under its own caps".

### 4.4 Acceptance conditions (all on the GENERIC_X64 pair against `issues/133.md`'s self-hosted matrix; nothing on a person's device or cloud — D-QA-007/015/017)

- **Floor.** For every writer in R1, the head never changes without a complete entry of the new version present first; no head version is deleted or overwritten without a complete entry of it present first — asserted by listing between each spawn (kill-between-spawns fixture).
- **Race.** `gpt-analysis.md`'s schedule as reproduced in the closing assessments, carried through A's next pass: HA is a complete entry before B overwrites it; with F14 built, the pair queues as divergent; without it, HB installs and HA is restorable by #25's test reader.
- **Pruner vs escrow.** A escrows and pauses; B runs a full pass under count and size pressure; HA survives; B's log shows no attempt on an entry it does not own.
- **Two pruners.** Two devices prune concurrently over a seeded store with different counts, a headless unexplained file, a headless `deleted` file, a headless `legacy` file, a newest `discarded`, an in-flight upload; no protected entry is deleted; if any fixture deletes one, destructive cleanup is disabled for that class and the overrun reported.
- **Count scope.** Overwrite a manual state, renumber, exit N+1 times with auto-state churn; the manual version and its PNG are restorable together from the second device; after a wizard decision on the same file, N further routine overwrites leave the `discarded` entry in place.
- **Decided deletion.** REMOVE EVERYWHERE, then a full pass with a trusted clock advanced 91 days: the `deleted` entry is gone; an unexplained headless file's newest entry is not.
- **Bytes.** Protected material seeded over 256 MiB: nothing protected is deleted; the overshoot is logged; the total in the log equals the listing's total.
- **Fleet setting.** Set 9 on A offline, OFF on B online, connect A: the effective value after both pass is the higher-`rev` edit; equal `rev` resolves ON/larger; a stale manifest never raises the count.
- **`--delete-excluded`.** Forced in `RCLONEOPTS` on the shipped image against a seeded store, copy and sync modes; then the guard image: the helper has stripped it and the store is untouched.
- **Old image.** `af2db4ab09` against a seeded `Saves/README.md` + `.history/` with content-addressed members: copy backup, sync backup, restore, MATCH (as implemented) — nothing under `.history/` transferred, moved or deleted (the expected pass); with a user filter that includes `+ /**`, the expected damage is recorded and the guard image's fold repairs it.
- **Migration.** Fixtures: partial multi-file stamps, sync-mode deletions, unique local-cache copies, duplicate basenames, a stamp changing during import, hashless stamps, oversized imports; interruption after every copy / record / receipt / removal; a second run is idempotent; no source file is removed unverified; imports carry `legacy`, `complete` correctly, and are not aged on arrival.
- **Cache clear.** Clear `/storage/.cache/`; the next full pass recovers `store_seq` from the own manifest with no `.history/` listing; a legacy head's first overwrite lists once and retains once.
- **Heal.** Zero-length and uniform candidates heal from the stage offline and report only after the install; stage missing → one bounded fetch, cancelled by a launch, healed at the next pass; both-suspect, no-good-copy, suspect cloud head → questions; erase twice → question; a #25-restored uniform version is not re-healed.
- **Orphans.** Kill only the lock-owning parent before a local rename, start a launch, release the child: the child is quiesced before the first frame; the unit is complete.
- **Reader.** Gate 2/A5 from a second device after manifest overwrite, renumber, audit rotation, clock set backward, local pending removed, cache cleared, and the writer's entries pruned; incomplete and `legacy` entries labelled honestly; a restore whose entry is pruned mid-way leaves the save unchanged and says so.
- **Time to play.** E12's three arms report latency distributions and completion rates on WebDAV and SFTP; the launch-path number is unchanged from baseline; the exit-sync number for one changed battery save on a hashed backend is the proposed budget row.
- **Labels and map.** Every new row is two lines or fewer (D-UI-023), uses D-UI-022's names, appears in `strings` on the binary, and `es-menu-map.md` is updated in the same change (D-UI-039).

### 4.5 Ordered experiments and the hazard each exposes

| # | Experiment (VM pair, `issues/133.md` backends) | Hazard it exposes | Settles |
|---|---|---|---|
| E1 | Shipped image `af2db4ab09` against a seeded store with content-addressed members and both READMEs: copy/sync backup, restore, MATCH; then a user filter with broad includes; then the guard image | Old writers restore, mirror away or shred the store; whether bare-hex names fall to `- /**` as read | B1, B8, B-6 |
| E2 | Grep the full scripts (G2); force `--delete-excluded` in `RCLONEOPTS` on the shipped and guard images | The guard becomes a deletion instruction; whether `--backup-dir` catches it | B7 |
| E3 | Per backend: server-side copy, hash availability and correspondence (incl. S3 multipart ETag), post-transfer hash check fails closed under a corrupting proxy, modtime preservation on `copyto` | Unverified escrow; a wrong cost model; the base's R-e gain | F12, B9 |
| E4 | One-spawn record-last ordering (`--transfers 1` + ordering) on every backend, killed mid-transfer | Record before members; a truncated record read as valid | B1 |
| E5 | Two devices with distinct ids through the barrier schedule and A's next pass; with and without F14 | HA lost; false conflicts from the ancestry test on a linear chain | B-2, F14 |
| E6 | A escrows and pauses; B prunes under pressure; then two concurrent pruners over the seeded protections | Escrow deleted before head write; mirrored last-copy deletion | B6 |
| E7 | Parent-only kill before a rename; launch; release the child; a server-side operation completing after client death | A rename after the first frame | F15 |
| E8 | Manual-slot overwrite + auto churn; same-file churn after a wizard decision; decided deletion aging; headless legacy file | Manual slot evicted; wizard loser evicted; permanent `deleted` entries | B3, B4 |
| E9 | Seed a device with a downloaded `.history/`; run `cloud_capture --full` | History claimed as saves | F16 |
| E10 | Migration fixtures of §4.4 with interruption at every step; a stamp changing under an old image | A legacy version lost; a source removed unverified; a torn unit offered | B8 |
| E11 | Cache clear → next full pass; legacy head's first overwrite | Upload storm; retain skipped into an unprotected entry | B9 |
| E12 | #135's `time-to-play` cell: no history / delta / store-first, WebDAV and SFTP, bandwidth-capped and not; startup-sync duration; completion rates | Exit sync over budget; freshness lost to cancellation; launch path touched | B10, F12 |
| E13 | Heal fixtures of §4.4, including a stage that lacks the good copy and an offline heal | A dead save left in place; a false recovery message; a heal loop | F13; #21's stage requirement (G1) |
| E14 | Gate 2/A5 reader from a second device under §4.4's perturbations | A store a reader cannot drive | F18 |
| E15 | Upgrade a device with a user-edited rules file and one with a user-named filter file | The guard never reaches edited files; a user's own filter altered | F17 |

### 4.6 Register rows that need the maintainer's word (proposals — IDs are theirs to assign)

- **P-1 (refines D-CLOUD-032/036/096).** The history setting is one fleet-wide value carried in the manifests, last explicit edit wins, ties ON and larger; OFF stops escrow and every new entry from the next pass, purges nothing, and is disclosed in the switch's dialog as opting out of the floor. *(C-3, C-6.)*
- **P-2 (refines D-CLOUD-096).** Protections before caps: P1 head-equal and own-pending; P2 the newest complete entry of an *unexplained* headless save (a decided deletion or a legacy import ages out normally); P3 the newest deliberate conflict loser; then count per save file (a state and its PNG one entry), age trust-gated, 256 MiB as a target over every stored byte with disclosed overshoot; pruning on full passes; a device deletes only its own entries. Confirm the count range (1–9 default 3, D-CLOUD-036) against "3 to 5" (D-CLOUD-096).
- **P-3 (refines D-CLOUD-041).** The cloud loser is preserved by copy plus verification, never a move; winner and loser both pass through the store.
- **P-4 (refines D-CLOUD-042).** D-CLOUD-095 supersedes the location clause only; the split-root refusal stands.
- **P-5 (refines D-CLOUD-045).** Additive manifest fields `store_seq` and `history_keep{on,count,rev}`; manifests remain claims, the listing the head.
- **P-6 (refines D-CLOUD-046 / #22 R5).** The changed exit gains the escrow and record spawns and one upload of the changed bytes; the ceiling counts store bytes and defers escrow and publish together; one bounded fetch of a suspect unit is the only download, when the stage lacks the good copy; numbers from Gate 4 and E12.
- **P-7 (refines D-CLOUD-047).** Propagated deletions are retained through the store as `deleted` before they act; compactions retain nothing; `-replaced/` is no event's record; Gate 7 is moot for saves.
- **P-8 (refines D-CLOUD-088).** The player's filter controls which saves move; reserved paths are removed from every save list by the reconciler regardless; the helper strips `--delete-excluded` and adds the guard to an edited shipped rules file.
- **P-9 (refines D-CLOUD-093).** The reconciler records its process group; a launch or a new run quiesces a dead owner's group before proceeding.
- **P-10 (refines D-CLOUD-100).** Heal from the stage at exit, from the cloud on a full pass, one bounded fetch as the fallback; the suspect kept as an exact descriptor and shown as a version; the recovery reported after the install; the second occurrence a question; and — the maintainer's call — whether the sentence may say "looked empty / looked damaged" rather than "was damaged" for the heuristic case (D-CLOUD-077).
- **P-11 (refines D-UI-022/039).** *Earlier versions* is the store's noun; *discarded saves* stays the wizard's word and the reason label; the entering row's verb-bearing label and the `legacy` label are the maintainer's words.
- **P-12 (accepts or rejects a residual).** In a fleet with an old image using a user-named filter that reaches `.history/`, or `--delete-excluded` with `sync`, two old runs with no new-image pass between can lose displaced history members before the fold repairs them; mitigations are the release order and the fold; the residual is bounded by the fleet (two handhelds, D-UI-022) and is for the maintainer to accept, not the plan.
- **P-13 (a budget row, #135).** Exit sync for one changed battery save on a hashed backend: the number from E12; a run over it fails the suite.
- **Not reopened:** D-CLOUD-052 (transport), D-CLOUD-095, D-CLOUD-097 (a filter rule is not a widening), D-CLOUD-099, D-CLOUD-014 (store-first is its generalisation: nothing is overwritten or deleted without a record), D-CLOUD-030 (identity), D-CLOUD-033 (no undo control in the wizard), D-QA-015/017.

### 4.7 Time to play, stated (D-CLOUD-098, #135)

**Interface → first frame:** unchanged — nothing in this plan runs before a launch; a launch cancels any automatic pass in any phase (D-CLOUD-076) and the only launch-time addition is F15's bounded quiescence of a *dead* owner's children, inside D-CLOUD-076's two-second budget. **One game's exit → the next first frame:** worst case unchanged (the cancellation budget); the exit sync is longer by F12's ledger (+2 spawns, +S up on hashed backends; +3 spawns, +S up, +S down on hashless; estimated +1–3 s per changed small save, **[unmeasured → E12]**), cancellable, ordered so a cancel wastes at most the spawn in flight, and bounded by P-13 once measured. Rigour that the player is not waiting for — pruning, folding, listings, the ancestry check, imports, cloud-side heals — runs on full passes only.

### 4.8 Corpus gaps surfaced to the orchestrator

G1 — `issues/21.md`: the unit table, the capture walker, the stage lifetime (F13, F16, the count bucket's no-op condition). G2 — the complete `cloud_backup`/`cloud_restore`, `cloud_sync_helper`, the layout migrator, MATCH and `FileData::launchGame` (B7, F15, F16). G3 — `docs/save-manifest-schema.md` (`pub`, `replaces`, additive fields; B6, B9, F14). G4 — `docs/conflict-wizard-ia.md` (the question surfaces for F13). G5 — `upgrade-and-install.md` and `engineering-practices.md` in full (quoted by the commission, not embedded). G6 — no measurement of any retention operation, backend capability or first-frame time exists in the corpus; every second above is an estimate until E3/E12 run. The Step 1 analyses and Step 2 reviews named inside the revised plans were not embedded here; their arguments are taken as the revised plans and closing assessments reproduce them.

---

## `corpus.provenance.json`

```json
{
  "artifact": "consensus_plan.md",
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "Embedded read-at-time source corpus only; no filesystem access; no file re-read, no hash recomputation, no experiment run by this member.",
  "source_manifest_named_by_prompt": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step4_5-source-manifest.json",
  "hash_basis": "All values in source_file_hashes are the Facilitator's sha256 values verified at embed time; the arrays correspond by index.",
  "manifest_read_timestamps_utc": {
    "sources_1_to_17": "2026-09-11T19:31:42Z",
    "sources_18_to_21": "2026-09-11T22:22:08Z"
  },
  "source_file_paths": [
    "research/council-runs/2026-09-11-save-history-one-home/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-plan-delta.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-gap-analysis.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/decision-register-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/time-to-play.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/es-native-ui-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_backup-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_restore-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_sync-rules.txt",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/22.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/23.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/25.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/134.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/135.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/131.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md",
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/gpt-revised_plan.md",
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/kimi-revised_plan.md",
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/gemini-revised_plan.md",
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/mistral-revised_plan.md"
  ],
  "source_file_hashes": [
    "f7d770768b3bf81985b7415b4d82f8ee9ef26965a98eb6c47c166f54db673b27",
    "1d320545319eba2e8852d830d52f76ab3a417e48e365d01fe79231bade77da8b",
    "d1107b7e1790b8e8aab177411b96bb3828f69e389fbc8e33c36ce616f67105aa",
    "46ccfb71ef85537639501c2973a5b02fd81b6d5772662608ead073b209ea2726",
    "6d7813f91e37510f5578f35adec3f9372ed34e1ce5d871fcc0f34e392b202911",
    "97d2fbba79fa42f22def37e4ff90e18149fc9fbc216d255d091da3dc187075da",
    "32be1ee4164c9d1f09e7a9e9c8c25f526e70802f75901e456097bdb5c02d46e4",
    "e5b57d74b83046fc7ebf44b4129c68815a575b35553e938c2ae377c685852509",
    "c0dacd8aa1eb1a4df2986447a853cc3c47b666b6234127e61783a151faa448bd",
    "bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e2d69ea018b8c9d5484d",
    "b05b7095a31dd11f63cc342129fd3b765a19b9ba4b4a91b4b9aa1877c7658b27",
    "1ca065c449e0b3695f1ab4e9573ad5bd4a92b21ae23c869bba8730fcefdebfc1",
    "14a3cee5592021447395db3e59dfaf27ec09de77f1fb85fe5c10cfde9da28d1b",
    "d7ffb5a4648964d458b18a4a5427b1bb5d8fd356bb31fd06182d2d08c33a2071",
    "3998a6e46d8cdd903deb97b2da23afb78ad1b237061328f4402291c03e0ff137",
    "b8034bb7ab57d7ffb7d5aa4cf16d0974f0bf8d731c983e864081296fa6ccc17c",
    "4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2",
    "f75aa71c71ebeff2d7df48a6d5a5f8096bb76e80a9d21dd60241faa6297c35ac",
    "4b835cc5402b0b8c728f4179484d5c62fa3b0c02355de1e46eb569bcbad75ad6",
    "6a6f42c732ebd9fe7518d669f5eb555a0dc312f2da0c85800e3df20251cda8e8",
    "415cc96f6fb6204f38143beb61704a036ad58a6c9bf4241a2a20d4a567927251"
  ],
  "injected_without_declared_path_or_hash": {
    "base": "claude-revised_plan.md (injected verbatim in the orchestrator brief)",
    "closing_assessments": [
      "claude_vote.md",
      "gemini_vote.md",
      "gpt_vote.md",
      "kimi_vote.md",
      "mistral_vote.md"
    ],
    "note": "No path or hash was supplied for these; none has been fabricated, and they are cited by filename only. Step 1 analyses and Step 2 peer reviews named inside the revised plans were not embedded in this step and are cited only as the embedded plans and assessments reproduce them."
  },
  "corpus_gaps_surfaced_to_orchestrator": [
    "issues/21.md: unit table, capture walker, stage lifetime (G1).",
    "Complete cloud_backup, cloud_restore, cloud_sync_helper, layout migrator, MATCH and FileData::launchGame implementations (G2).",
    "docs/save-manifest-schema.md, including the meaning of pub and replaces and the additive fields proposed here (G3).",
    "docs/conflict-wizard-ia.md (G4).",
    "upgrade-and-install.md and engineering-practices.md in full (G5).",
    "No measurement of any retention operation, backend capability (server-side copy, hash correspondence, modtime preservation, post-transfer verification), or first-frame time exists in the corpus; every second stated is an estimate pending E3 and E12 (G6)."
  ],
  "activity_statement": "No code was written or run, no file was written, no test was performed, and no handheld or cloud account was accessed. Layouts, fields and rules proposed above are design proposals, not additional claimed source files."
}
```