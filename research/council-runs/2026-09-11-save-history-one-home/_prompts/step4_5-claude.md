# Council -- consensus integration

The council has settled on a base. `claude-revised_plan.md` is that base, it is
injected below, and **you are not re-opening the choice**. Your job is to produce
`consensus_plan.md`: the base, with the other plans' contributions integrated where
they fit, and the ones that genuinely conflict listed as conflicts rather than
blended into false agreement. The four losing revised plans are embedded above
this brief with the corpus, hash-verified, so you can take a provision from its
source rather than from a ballot's summary of it.

The five members' closing assessments are injected after the base. Read them for
the provisions they say should travel and for the defects they say the base still
carries. Judge those on their merits against the embedded corpus.

## Anti-self-citation constraint

Reason about the substance against the embedded corpus. Do not treat the injected
artifacts as evidence about how councils, models, or this deliberation behave, and
do not describe or characterise the process that produced them.

## The maintainer's decisions that bind this document

The decided register rows D-CLOUD-095..100, D-UI-039, D-QA-015/017 and the plan
of record's rows (in `decision-register-excerpt.md`) are binding. And, given after
the vote, on 2026-09-11, the steer that decides every trade below:

> It seems like if we were to optimize for time to play and minimize bandwidth and
> the number of back-and-forth exchanges, a hybrid is needed. We don't want to have
> to deal with making sync take longer than it should, while obviously balancing
> the sanctity of a game save.

So the invariant of the base -- nothing becomes the current save in the cloud, and
nothing leaves it, unless that version is already in the store -- is the floor, and
**above that floor the cheapest sufficient form wins**: fewest round trips, fewest
bytes over the handheld's Wi-Fi, no operation on the launch path, and an exit sync
no longer than the store's invariant strictly requires. Where the base and a losing
plan meet the floor equally, take the cheaper one and say so.

## Cost discipline, binding on every provision

This is a handheld: busybox, an SD card doing the writing, a Wi-Fi link, and the
two time-to-play numbers of D-CLOUD-098 (interface -> first frame; exit -> next
first frame) measured by the runner on every image.

- **Name the cost of every safeguard you adopt** -- round trips, bytes up and down,
  process spawns, files on the card, seconds on the exit sync -- and what it buys.
- **Prefer the form that removes a rule over the form that adds one.**
- **Do not buy a guarantee the one-player, few-devices model does not need.** No
  lease, no lock service, no version graph.
- **Nothing new on the launch path.** State for each provision whether it runs in
  the exit sync (cancellable by a launch), in a full pass, or never on the device.

## The blockers the base must clear

The closing assessments name defects in the base that must be fixed here, not
deferred. At least these:

1. **The transaction shape.** Bytes first, record last, the record is the commit
   point; an entry without a valid record is an orphan swept on full passes;
   dedupe against the newest entry; copy, never move, for anything that leaves the
   head. State the interrupt outcome at each point.
2. **Deferral as a pair under the admission ceiling.** A publish never goes out
   ahead of what protects the version it displaces; both defer together; the
   ceiling counts store bytes.
3. **Reserve the newest deliberate conflict loser** from routine count pruning.
4. **A decided deletion is not an unexplained absence.** "Never a game's only copy"
   must not make every REMOVE EVERYWHERE result a permanent, cap-exempt entry.
5. **Every stored byte counts against the 256 MiB cap**, or the exemption is
   stated with its measurement.
6. **Shared settings on a shared store.** What one device's count, and OFF, mean
   for the others -- the cheapest sufficient rule.
7. **The `--delete-excluded` audit** of every shipped command and the user's
   RCLONEOPTS path, as a requirement with an experiment, not a residual.
8. **Migration**, in full: today's `Saves-replaced/<stamp>/` folders and the
   device-local `.cache/cloud_sync/replaced/`, folded copy-verify-retire, the
   legacy events classified honestly, no question to the player, and a
   mixed-version fleet boundary.
9. **The `in_store` flag's fragility** when device state is cleared: how a full
   pass repopulates it.
10. **The freshness cost of a longer exit sync**: a launch cancels it more often,
    so more publishes defer and the other device sees a staler cloud. Bound it,
    measure it (#135's cell, store-first against the plain delta, on WebDAV and
    on SFTP), and say what the player sees.

Work through the closing assessments for any further defect and treat it the
same way. Where a fix is claimed but its cost is not stated, state it.

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
**handoff**, give what the issues need: the load-bearing requirements in build
order, the acceptance conditions, the ordered experiments with the hazard each
exposes, the changes to #22 R1-R9, #23 and #25 stated row by row, and the
register rows that need the maintainer's word -- marked as proposals, since
register IDs are the maintainer's to assign.

Keep every claim's marking: what the corpus settles, what is a council position,
and what is unmeasured with the experiment that settles it.

Refer to members and artifacts by filename, never by an invented ordinal.

## The base

### `claude-revised_plan.md`

# Step 3 — Revised approach: one store, store-first, inside `Saves/.history/`

*Seat: the author of `claude-analysis.md`. What follows is the delta I would apply to the plan of record (#21–#25, #35, D-CLOUD-030..053) in place of `repo/docs/save-history-plan-delta.md`, after the Step 2 critique. It stands alone; §1 and §2 record what I conceded and why. Everything cited is by path under `research/council-runs/2026-09-11-save-history-one-home/_sources/` or by register ID. What I infer rather than read is marked. No code.*

---

## 0. The one-paragraph version

Keep the maintainer's home — `Saves/.history/`, hidden, declared in a README (D-CLOUD-095) — and keep the reconciler as its only writer (R1). Replace the delta's mechanism, *retain the old head, then publish*, with a stricter and cheaper invariant I will call **store-first**: **nothing becomes the head, and nothing leaves the head, unless that version is already in the store.** Two operations enforce it. *Escrow*: every publication uploads its version into `.history/<unit>/<seq>/` before the head is written. *Retain*: a head version not known to be in the store is copied into the store before anything overwrites or deletes it — which, once every writer is the reconciler, happens only for pre-cutover heads (once per save) and for heads a foreign writer produced. Store-first closes the two-device race that the delta's ordering leaves open (`gpt-analysis.md`), costs the exit path one extra spawn and one extra upload of the changed bytes on every backend — never a server-side copy it cannot get on SFTP or SMB — and puts nothing between the player and a game. The retention **count is keyed to the save file, not the unit**, so D-CLOUD-099's auto-states cannot evict the manual slot they were decided to protect. The three caps are ordered behind two protections that no cap may violate. Auto-heal (D-CLOUD-100) heals from the capture stage at exit and from the cloud on the full pass, never by a fetch on the exit path, and asks a question the second time a save comes back empty. Migration copies, verifies, then deletes, in both directions, forever, and never asks.

---

## 1. What I concede

Each item names the reviewer and the file that showed the error. Where more than one reviewer made the point I name the sharpest statement.

1. **"Hash-from-the-copy closes the two-device race" — false.** `gpt_peer_review.md` reproduces `gpt-analysis.md`'s schedule: A and B both list H0 and agreement is H0; both retain H0 and verify; A publishes HA, verifies, advances agreement to HA; B publishes HB, verifies, advances to HB. Every check I proposed passes on both devices, and HA was overwritten without being retained. The follow-on is worse: A's next full pass sees L = A = HA, C = HB → "the cloud changed" (`issues/22.md` R4) → fetches HB over HA, and #22's negative scope forbids preimages of one-way fetches, so HA's last copy goes. I called this "covered"; it was not. `kimi_peer_review.md` and `gemini_peer_review.md` made the same correction. My revision adopts escrow (§3.2) and adds detection through `replaces` (§3.3).
2. **"Size-only is the standard D-CLOUD-046 accepts for hashless backends" — wrong reading.** `gpt_peer_review.md`: R4 says "hashless backends by size + sha256 after fetch"; R5 says "size plus a capped re-fetch"; D-CLOUD-052 rejected bisync partly because equal-size, equal-mtime changes are invisible. Verification of a store entry on a hashless backend is size plus a capped re-fetch, or deferral; never size alone (§3.4).
3. **Folding the store entry's verification into the *post*-publish correspondence check — wrong side of the ordering boundary.** `gpt_peer_review.md`. Retention is positively verified before the head is written from it, or the unit defers. Verification may be *supplied* by a transfer that provably fails closed (H1 in §9), not moved after the publish.
4. **Dropping the 90-day age cap outright.** `gemini_peer_review.md` and `kimi_peer_review.md`: the maintainer approved the number four days ago (D-CLOUD-096); the trust-gated sweep should be primary and the drop the fallback. `mistral_peer_review.md` would drop or gate; I take gating (§3.6). I also concede `gpt_peer_review.md`'s point that removing age does not remove timestamp dependence from "oldest first" — so §3.6 orders by something better where it can.
5. **Heal-from-the-stage presented as if D-CLOUD-078 already guaranteed it.** `gpt_peer_review.md`: the corpus establishes that capture keeps content-addressed copies (D-CLOUD-034, D-CLOUD-078), not that the previously agreed version survives a later capture, nor what happens offline. §3.7 states the stage-lifetime requirement as an amendment to #21 (not embedded) and gives the offline and ordering rules.
6. **"If you meant to erase it, erase it again" as the fallback for intentional erasure.** `gpt_peer_review.md`: the heuristic undoes the second erase too. `gemini_peer_review.md` named the loop and the fix; §3.7 adopts a sticky second occurrence that becomes a question.
7. **Move-first migration; treating legacy stamps as UTC; inferring the producer from the local cache.** `gpt_peer_review.md`: the shipped stamp is `date +%Y_%m_%d-%H%M%S` with no `-u` (`repo/code/cloud_backup-set-aside-excerpt.md`), so its zone is unknown; a file in this device's `replaced/` cache may have come from a restore of another device's copy; and a cloud "move" is not a same-filesystem rename on every backend. §7 copies, verifies, records unknowns as unknown, then deletes.
8. **A release note as closure of the mixed-fleet exposure.** `gpt_peer_review.md`: a dormant device can skip the guard image; D-CLOUD-088 lets a custom filter file bypass the shipped rules; D-CLOUD-076 can cancel the import pass. §3.5 states the residual instead of claiming closure, and adds `kimi-analysis.md`'s standing fold as recovery.
9. **The MATCH fixture's direction.** `gpt_peer_review.md`: `repo/docs/es-menu-map.md` establishes only that MATCH THIS DEVICE TO THE CLOUD is "the only action that deletes" and previews first; its implementation is not embedded and its label suggests it changes the device, not the cloud. §6 keeps the proven hazard on `cloud_backup` in sync mode and treats MATCH as a writer under R1 whose deletions retain first, whichever side they land on (`mistral_peer_review.md`).
10. **Five unsupported simplifications** (`gpt_peer_review.md` §7): that a new entry always sorts newest (untrue under a bad writer clock); that a timestamp grace period solves an untrusted-clock problem (it does not); that a recursive listing is one request (pagination and per-directory traversal are backend facts to measure — H3); that Dropbox's per-folder serialisation (D-CLOUD-083) bites only at directory creation (the head folder is still shared); that standalone screenshots are never overwritten (D-UI-022 puts screenshots in the saves tier; nothing in the corpus says they are immutable). All withdrawn; where they matter they reappear below as hypotheses with experiments.

## 2. What I still hold, and why

1. **The count bound must be keyed to the save file, not to the unit.** R4 defines *L* as "this device's hash set for the unit"; R9 makes the unit "game + kind"; D-CLOUD-030 makes slot an attribute, not identity. Under a per-unit count of 3, three exits of auto-state churn evict the manual slot's retained version — the case D-CLOUD-099 was decided to protect. `gemini_peer_review.md`, `kimi_peer_review.md` and `mistral_peer_review.md` accept this. `gpt_peer_review.md` accepts the concern and qualifies the remedy, and the qualifications are right: the unit table (#21, not embedded) may already separate slots, in which case the amendment is a no-op; a path key must not attach one state's history to a slot it later vacates in a way that misleads; and a state and its PNG must be one retention entry, never independently prunable. §3.6 defines the bucket accordingly and attaches the fixture `gpt_peer_review.md` asked for (overwrite a manual state, renumber, several auto exits; the manual version and its PNG must survive together). The reader shows "this game, newest first" (D-CLOUD-033), so the bucket key governs *how many*, not *what the player sees*.
2. **Ship `- /.history/**` (and `- /README.md`) in `cloud_sync-rules.txt` one image before the writer.** Under the shipped file (`repo/code/cloud_sync-rules.txt`) `+ /**/*.srm`, `+ /**/*.state*`, `+ /**/*.sav` and the rest match at any depth, so `.history/<unit>/<seq>/…/Zelda.srm` is *inside* the transfer boundary today: a shipped restore pulls it to the device, and a shipped backup in the chosen `sync` mode moves it into `-replaced/<stamp>/` ("anything replaced (or, in sync mode, removed) in the cloud goes to ${replaced_root}", `repo/code/cloud_backup-set-aside-excerpt.md`) and `prune_replaced_remote` reduces that to one run. `record.json` and `.png` fall through to `- /**` and are left behind as orphans. A guard with no writer is the pattern #22 R2 and `issues/25.md` already use for `.snapshots`. This does not reopen D-CLOUD-097, which forbids widening `Saves-replaced`, not a filter rule. `kimi_peer_review.md` agrees; `gpt_peer_review.md`'s qualification (it is not closure) is taken in §3.5.
3. **The README must not advertise a menu that does not exist.** #25 ships after the writer (D-CLOUD-033: "version one retains … and ships no undo control"). A `Saves/README.md` in V1 that says "the device menu restores from it" is false until #25 lands, and D-CLOUD-077 forbids lying. `gpt_peer_review.md` endorsed this.
4. **The delta contradicts itself on D-CLOUD-047 and is silent on D-CLOUD-042.** It lists "publications and retirements (D-CLOUD-047)" as unchanged while D-CLOUD-047's third sentence says propagated deletions are not retained and `-replaced/` (Gate 7) is their record; the delta retains deletions (`reason: deleted`) and retires `--backup-dir`. D-CLOUD-095 replaces D-CLOUD-042's location clause but not its split-root refusal; `gpt-analysis.md` stated that sharper than I did and I adopt its framing (§8).
5. **Heal from the stage at exit, not by a fetch.** R5: "It is to-the-cloud only … No fetches, no ICMP, no probes on this path." D-CLOUD-100: "the cloud's good copy is kept and restored." These conflict on the exit path and only a local source resolves them without spending the player's time. Held, now stated as an amendment with its preconditions (§3.7). `mistral_peer_review.md`'s alternative — one bounded fetch per suspect unit on the exit card — is workable but changes D-CLOUD-046's push-only contract and adds a download to the one path D-CLOUD-098 measures; I keep it as the fallback for a stage that lacks the good copy, on the *full* pass.
6. **A settings page with more than one row is a submenu whose label carries a verb.** `repo/rules/es-native-ui-excerpt.md`: "A row that opens a page with more than one action is a submenu. Its label carries the verb." The delta's SAVE HISTORY does not. `gpt_peer_review.md` agrees; §3.9 proposes labels and leaves the word choice to the maintainer's confirmation.
7. **The clock hazard is real, and modtime preservation does not dispose of it.** `mistral_peer_review.md` argues rclone copies the source modtime, so an entry's modtime is the save's. But the seq *name* R9 orders by is the writer's clock, the pruner sorts names, and modtime storage is itself backend-dependent (not every backend in `issues/133.md`'s matrix stores one). `gemini-analysis.md` found the hazard; §3.6 gates on it.

## 3. The revised delta

### 3.1 The table

| Where | Plan of record / delta | **Revised delta** | Verdict |
| --- | --- | --- | --- |
| Location (#22 R9, D-CLOUD-036/042) | `<SAVES_REMOTE>-discarded/` → delta: `Saves/.history/<unit>/<seq>/` | **`Saves/.history/<unit>/<seq>/<member at its path relative to the saves root>` + `record.json`.** Members keep their relative paths, not basenames (a multi-directory unit with two same-named files collides otherwise — `gpt-analysis.md`). `<seq>` = `<utc-compact>-<device-id>-<run-id>-<version-digest>`: the run id makes two same-device runs collision-free under D-CLOUD-093's orphan trade (`kimi-analysis.md`); the digest (a short hash over the entry's sorted member sha256s) lets a listing answer "is this version in the store" without fetching records. | **Endorse D-CLOUD-095; amend the layout.** |
| Mechanism (#22 R1/R9, D-CLOUD-036/041) | delta: `copyto` the cloud's current version into the store, then publish | **Store-first** (§3.2): escrow the candidate into the store, verify, then write the head from the local stage; retain a head only when it is not known to be in the store (§3.2 "retain"). Own-manifest witness (R7) runs before any store write (`kimi_peer_review.md`). Wizard: the cloud loser on KEEP RIGHT is a server-side **copy** into the store, verified, never a move (`mistral-analysis.md`; refines D-CLOUD-041's mechanics); the device loser on KEEP LEFT is an upload into the store; the winner is published through the store like any publication. | **Replace.** |
| Race detection | — | The record and (if D-CLOUD-045's manifest `replaces` means the head the publisher saw) the manifest carry **`replaces`**; a "cloud changed" verdict whose head record replaces a version other than this device's agreement is reclassified **divergent** and queued for the wizard (§3.3). | **Add (refinement, V1 if free).** |
| `reason` | delta: `discarded \| replaced \| deleted \| suspect` | **`published \| replaced \| discarded \| deleted \| suspect`.** `published` is an escrowed candidate (it becomes an earlier version when superseded); `replaced` is a head retained because the store lacked it (legacy, foreign writer, migrated set-aside). Reader labels: the head-equal entry is not shown as history; `published`/`replaced` → REPLACED BY A SYNC (or, when the same device both produced and replaced it, AN EARLIER SAVE — #25's choice); `discarded` → YOU CHOSE THE OTHER; `deleted` → DELETED; `suspect` → SET ASIDE AS DAMAGED. | **Amend.** |
| `cloud_backup` / `cloud_restore` `--backup-dir` | delta: retired with R1; unchanged until then (D-CLOUD-097) | **Endorse**, plus: the fold of `-replaced/` (cloud) and `.cache/cloud_sync/replaced/` (device) into the store is a **standing** job of every full pass (§7). | **Endorse + amend.** |
| Allowlist (#22 R2) | delta: `- /.history/**` ahead of every include; `.snapshots` dropped | **`- /.history/**` and `- /README.md` ahead of every include; `- /**/*.bak` stays; `.snapshots` dropped. Shipped in `cloud_sync-rules.txt` one image before the writer.** The reconciler's **store transfers carry no allowlist** (their source is a stage directory it wrote); only save transfers carry it — otherwise the rule filters out the reconciler's own escrow (H2). The README also names `savestates/.rocknix/` (D-CLOUD-031) as the other hidden folder, one that *does* sync (`mistral_peer_review.md`). | **Amend.** |
| Bounds (#23, D-CLOUD-096) | count 1–9 default 3 (D-CLOUD-036), 90 d, 256 MiB, never the only copy | **Two protections, then three caps in order** (§3.6): never prune a head-equal entry or one a local pending record references; never prune the last complete entry of a file with no live head. Then: count **per save file** (state + PNG one entry), default 3, range 1–9; age 90 d **only when both the entry's time and the pruner's clock are trusted**; total 256 MiB target, oldest first, exempting protected material. Overshoot is logged and disclosed as a target, never a promise. Pruning runs on full passes only, so exit-only devices overshoot between passes — the README and the setting say so. The count used against shared history is the **largest** any device's manifest declares. | **Amend (refines D-CLOUD-096).** |
| Suspect (#22 R4, D-CLOUD-100) | delta: auto-heal, fetch the cloud's good copy | **Auto-heal from the capture stage at exit; from the cloud only on a full pass; the suspect copy is set aside as a *descriptor* (size, byte value) — exact and free; the recovery is reported only after the install succeeds; a second suspect on the same save after a heal is not healed but asked** (§3.7). | **Amend (refines D-CLOUD-100 and D-CLOUD-046).** |
| Save states | D-CLOUD-099: all, auto-states included | **Endorse**, made true by the per-file bucket. #23's auto rule (cloud resume point → next free slot) is a publication and escrows like any other. | **Endorse.** |
| Settings (#23, D-UI-039) | delta: two rows behind SAVE HISTORY under SAVE MANAGEMENT | Two rows — KEEP EARLIER VERSIONS OF SAVES (switch, on) · VERSIONS KEPT PER SAVE (1–9, default 3, dimmed while off) — **either directly under SAVE MANAGEMENT** (four rows) **or behind a verb-bearing row** (§3.9); the switch's confirmation dialog states its price in seconds from measurement; the menu map is updated in the same change. | **Amend.** |
| #25 reader | one store, reason as label | **Endorse**; add: hide head-equal entries; never offer an entry marked incomplete as a restorable unit; stage-and-verify the chosen entry before touching a live file, and if it was pruned meanwhile, leave the current save unchanged and say so (D-CLOUD-077). | **Endorse + amend.** |
| README | delta: at `Saves/` and inside `.history/` | **Endorse**; content per image (§3.8): V1 says the copies are kept for recovery and that restoring from the device menu arrives in a later update; written only after the saves folder is validated (D-CLOUD-085/091/092), never as the act that creates it. | **Amend.** |
| Public docs | layout table + README text | **Endorse**, plus the soft-cap statement and the store-first rule in one sentence. | **Endorse.** |
| Audit | #23: one line per discard before the apply | **Every store mutation** — escrow, retain, discard, delete, suspect, prune, import — writes its audit line before it acts (D-CLOUD-027; `kimi_peer_review.md`). | **Add.** |

### 3.2 Store-first, precisely

*Escrow.* On a changed exit (R5) or a full pass, for each unit "this device changed" whose fresh head equals agreement: (1) the head-evidence listing, as today, which is also where the own-manifest witness runs; (2) one `copy --files-from` from the local stage uploads the entry — members at their relative paths under `.history/<unit>/<seq>/` and the `record.json`; (3) the entry is verified: on hashed backends by rclone's own post-transfer hash check if H1 confirms it fails closed, otherwise by a listing; on hashless backends by size plus a capped re-fetch, or the unit defers; (4) one `copy --files-from` from the stage writes the head — **the same transport as today** (D-CLOUD-052), so the head write needs no server-side copy and behaves identically on every backend; (5) the head correspondence check, as today; (6) agreement advances and the local `pending-publish.json` moves from *escrowed* to *published*. Members and record travel in one spawn, so the record is not a certificate of completeness; **a reader treats an entry as complete only when every member the record lists is present with the listed size and hash.** (Writing the record in a second spawn would make the record the certificate at the cost of a spawn per publish; D-CLOUD-034 prefers the free form. `mistral-analysis.md`'s principle — a missing or invalid record fails closed — holds either way: an entry without a valid record is not offered.)

*Retain.* A local per-unit flag, `in_store`, records whether the agreed version is known to be in the store. It is true after (6), and after a full pass has seen the version's digest in `.history/<unit>/`. It is false for a version seeded as agreement from a legacy head (the first pass after cutover) or after a context change (R7). **Before anything overwrites or deletes a head whose `in_store` is false, the version is put in the store first**: at exit, from the local stage, which still holds the agreed version (§3.7's stage requirement) — one more upload in the same entries spawn, `reason: replaced`, once per save ever; on a full pass, from the local copy when L = C, or by server-side copy from the head when the head is foreign (C ≠ A) and the wizard's decision or an install will replace it. Where a store listing is cheap (full passes), the flag is corrected from it, so a lost flag costs a redundant entry, not a lost version.

*Why this beats the delta.* The delta reads the old head back into the store before every publish. On SFTP, SMB and FTP (`issues/133.md`), rclone's `copyto` from cloud to cloud streams through the handheld, so the delta moves 3× the save's bytes over Wi-Fi at exit (old down, old up, new up); store-first moves 2× (new up twice), and needs no server-side copy anywhere. On Dropbox, S3 and capable WebDAV the two are within one spawn of each other. And store-first is the one that survives `gpt-analysis.md`'s schedule: A's HA is in the store before it is the head, so B overwriting it loses nothing. This is "recoverable concurrency" in `gpt-analysis.md`'s phrase — the head stays last-writer-wins; every writer's bytes survive.

*What store-first is not.* It is not a coordination protocol in the cloud: no lock, no lease, no conditional write. #22's negative-scope clause "no protected-publication protocol" should be reworded to say exactly that — *publication is made recoverable, not serialised* — so that escrow is not read as forbidden. D-CLOUD-052 is not reopened: the transport is unchanged.

### 3.3 Turning the hidden race into a visible conflict

After the race, A's full pass sees L = A = HA, C = HB. If HB's record (and, if D-CLOUD-045's `replaces` has that meaning, B's manifest entry — the manifest is already read as a claim set on every pass) says HB replaced H0, and A's agreement is HA ≠ H0, then B never saw HA: this is a both-changed pair that the race disguised as "the cloud changed". The reconciler reclassifies it **divergent**, transfers nothing, and the wizard shows cloud HB against device HA. Cost: one `.history/<unit>/` listing plus one small record fetch per cloud-changed unit on the full pass — nothing on the exit path — and zero if the manifest already carries the field. In V1, where #25 does not exist, this is the difference between a version the player can choose now and one they can recover only after #25 ships. I mark it a refinement because the *bytes* are safe without it; I recommend it for V1.

### 3.4 Verification standard

Every record carries the sha256 of the bytes as uploaded, computed locally — never null for an escrowed or uploaded entry (D-CLOUD-030). A migrated entry from a hashless cloud (§7) that has not yet been fetched to hash carries `sha256: null, verified: false` and is neither counted as protection nor offered until hashed. Verification before the head is written: hashed backends by hash correspondence (H1 or a listing); hashless by size plus capped re-fetch within R5's admission ceiling. **The ceiling counts the escrow's bytes as well as the head's, and a unit that defers defers both** (`mistral_peer_review.md`). A unit that cannot be verified within the ceiling waits for the full pass; the old head stands.

### 3.5 Isolation by rule, and the honest residual

Moving the store inside the saves root changes its protection from *by construction* to *by rule* (`gpt-analysis.md`, `claude-analysis.md`). The rules are: `- /.history/**` and `- /README.md` first in `cloud_sync-rules.txt`, shipped one image before the first writer; the reconciler's own outer boundary (R2) carries them; store transfers do not carry the allowlist at all (H2). The local side is symmetric: the reconciler treats a local `.history/` (the residue of an old-image restore) as an import source — each file whose path and hash the cloud store already holds is removed locally, each other file is uploaded first — never as clutter to delete unverified (`gpt_peer_review.md` on `kimi-analysis.md`).

The residual, stated: an old-image device with the non-default `BACKUPMETHOD=sync` (D-CLOUD-014), or a custom filter file (D-CLOUD-088), or `--delete-excluded` in RCLONEOPTS (`kimi-analysis.md`), that backs up after `.history/` exists will move history members whose extensions match into `Saves-replaced/<stamp>/.history/…` and leave the records and PNGs behind. The standing, path-aware fold (§7, `kimi-analysis.md`) puts those members back where they were on the next new-image full pass. Two such old-image runs with no new-image pass between them let `prune_replaced_remote` delete the first stamp, and those members are lost. This is bounded by the maintainer's fleet (two handhelds today, D-UI-022) and recorded as an accepted residual in the same spirit as D-CLOUD-076's, with the release order — guard image, then writer image, then old images retired — as the mitigation, not the proof.

### 3.6 Bounds: two protections, then three caps

**Protected, never pruned:** (P1) any entry whose version equals the current head, and any entry a local pending record references — this is transaction material, and it is the reconciler's "record of the last known good state" for a save (D-CLOUD-078); (P2) the newest *complete* entry of a save file whose unit has no live member in the head — D-CLOUD-096's "never the only copy of a game", made precise. P1 is why a bad writer clock cannot get the current version evicted: the head-equal entry is protected regardless of where its name sorts.

**Caps, in order, over the rest:** (C1) **count per save file** — the bucket is the member's path relative to the saves root, with a state and its PNG one entry; default 3, range 1–9 (#23's selector); the count applied to shared history is the largest any device's manifest declares (`gpt_peer_review.md`'s ownership question; an additive manifest field under D-CLOUD-045 — schema not embedded, gap G3). (C2) **age 90 days**, applied only when the entry's recorded time is trusted (`clock_synced` — the attribute #23 already displays as "time not trusted") *and* the pruner's own clock is trusted; imported entries (§7) are untrusted and are aged from their import time by the pruner's clock. (C3) **256 MiB total**, oldest first across the store, over unprotected entries only. If protected material alone exceeds 256 MiB — one oversized unit, or many deleted games — nothing is pruned and the overshoot is logged; the README, the public page and the setting call the number a target. Pruning runs on full passes only (a remote round trip the exit sync should not pay, the same reasoning `repo/code/cloud_backup-set-aside-excerpt.md` gives for `--recent`), so a device that only ever exits overshoots C1 and C3 until its next full pass.

**Ordering within a file.** Seq names sort by the writer's clock. Where records form a consistent `replaces` chain the pruner orders by it; where they do not, by name. A bad-clock writer's *earlier* entries can be mis-ordered and evicted first; its current version cannot (P1).

**Concurrent pruners.** Two devices may prune the same file. Both apply the same rules over the same listing, so they choose the same victims; P1 and P2 hold on each. An entry another device is mid-upload appears incomplete; an incomplete entry is removed only after this device has seen it incomplete on two of its own full passes with no local pending reference — run-count, not time, because time is untrusted. Residual: an upload spanning two of a peer's full passes is deleted under it; the uploader's pending record retries.

**Head-equal entries and the footprint.** Because retain is lazy (first overwrite, not seeding), the store holds head-equal entries only for saves changed since cutover, not for the whole library. Whether they should count against C3 is a census question (D-CLOUD-036 already defers the PPSSPP directory case to the census gate); I exempt them pending Gate 2's measurement and flag it.

### 3.7 Suspect saves: heal locally, ask the second time

A save is suspect when it is zero length or all one byte and the agreed version was neither (D-CLOUD-100). The sequence at exit: audit line; write the suspect *descriptor* — `reason: suspect`, size, byte value, no member bytes, since a uniform file is exactly reconstructible from those two numbers (the cheapest sufficient form, D-CLOUD-034; #25 shows it as SET ASIDE AS DAMAGED and can reconstruct on request); install the agreed version from the capture stage over the suspect file by temp-and-rename; publish nothing for the unit; report the recovery on the card only after the install succeeds. **Precondition, as an amendment to #21:** the stage keeps the last agreed version of each save until a newer version is agreed — this is D-CLOUD-078's "one last-known-good at rest" applied to the stage, and it is also what §3.2's retain needs. If the stage lacks the agreed version, the unit is marked *suspect-unhealed*, nothing publishes, and the next full pass fetches and installs the good copy and reports then. Offline at exit: the local heal proceeds; the descriptor is written when a pass is online.

**The loop.** A player who erases their save in-game produces a uniform file; the heal undoes it; the player erases again. The second suspect capture of the same save after a heal is **not healed**: the unit is queued as a question on the wizard's absence surface (D-CLOUD-037's shape): this save has come back empty twice — keep it empty, or put back the last good copy? An explicit restore of a uniform version through #25 does not loop, because the classifier compares against the *agreed* version, and after that restore the agreed version is itself uniform. A head that becomes uniform in the cloud while the device's agreed copy is good ("the cloud changed" to a suspect version) is not installed; it is queued as a question.

**History OFF.** OFF stops adding earlier versions; it does not disable escrow (transaction material, pruned once superseded), does not purge existing entries (they leave under C2/C3 only), does not stop the suspect descriptor (an audit record of a few hundred bytes, not a version) and does not stop the heal. The wizard's done page says "Discarded saves were not kept." (#23) truthfully, because no *version* was kept.

### 3.8 The README

Two files, `Saves/README.md` and `Saves/.history/README.md`, written by the reconciler on a full pass when absent or when their content differs from the image's, only after the saves folder has passed D-CLOUD-085/091/092's validation, so that writing a README can never create a misspelled destination. They say: what the folder is; that `.history/` holds earlier versions of saves so a mistake can be undone; that `savestates/.rocknix/` holds the sync's own records and both are best left alone; that the caps are targets; and — in V1 — that restoring from the device menu arrives in a later update. The text changes with #25. Mass-absence detection (R4) counts live save units, never listed objects, so README, `.history/` and manifests cannot make an empty cloud look populated (`gpt_peer_review.md`).

### 3.9 Settings

Two rows, D-UI-023-shaped: KEEP EARLIER VERSIONS OF SAVES (switch, on) with a line under it that is its price in seconds once measured; VERSIONS KEPT PER SAVE (1–9, default 3), dimmed while the switch is off. SAVE MANAGEMENT today holds two rows (`repo/docs/es-menu-map.md`); with these it holds four. If the maintainer judges four "a few" (D-UI-039), they sit there with no nesting. If not, they nest behind a row whose label carries a verb per `repo/rules/es-native-ui-excerpt.md` — MANAGE EARLIER VERSIONS OF SAVES, or a shorter form the maintainer prefers; SAVE HISTORY is a noun and "history" is not in D-UI-022's vocabulary. The vocabulary refinement: *earlier versions* is the store's noun; *discarded saves* remains the wizard's word for its own losers and appears as the reason label, not as the store's name. The menu map is updated in the same change.

---

## 4. Foundation versus refinement

**Foundation — get these wrong and a player loses a save or waits for us:**

- F1. Store-first: escrow before the head, retain before the first overwrite of an unstored head, both verified before the head changes (§3.2, §3.4).
- F2. The isolation rules shipped one image before the writer; store transfers exempt from the allowlist; local `.history/` imported, not deleted (§3.5).
- F3. P1 and P2 before any cap; count per save file (§3.6).
- F4. Heal from the stage at exit, never a fetch; the stage-lifetime requirement; recovery reported only after the install (§3.7).
- F5. Migration by copy → verify → record → delete, both directions, standing, never a prompt (§7).
- F6. Nothing new on the launch path; the exit addition is one spawn and one upload, cancellable (§5).

**Refinements — improve the result; can follow:**

- R-a. `replaces`-based reclassification of a disguised race as divergent (§3.3).
- R-b. Chain-ordered pruning; run-count grace for incomplete entries (§3.6).
- R-c. The manifest-carried count for shared pruning (§3.6).
- R-d. The suspect descriptor's reconstruction in #25; the cloud-side suspect question (§3.7).
- R-e. Server-side copy from the store to the head where a backend supports it and Gate 4 shows a gain (§5).
- R-f. Reader label AN EARLIER SAVE versus REPLACED BY A SYNC (§3.1).
- R-g. The settings row's measured price line (§3.9).

---

## 5. Time to play (D-CLOUD-098, #135)

**Interface → first frame.** Unchanged. Nothing in this delta runs before a launch. A launch cancels an automatic startup or exit sync in any phase (D-CLOUD-076; the refusal in #22 R6 is stale text, `gpt-analysis.md`), so the store's listings, pruning, imports, retain-before-install and cloud-side heals — all full-pass work — lengthen a pass the player may cancel, and add no wait. The one obligation the delta inherits rather than creates: a cancelled multi-member local install must leave a complete unit before the game starts (#22 A7), which #22 must satisfy by staging every member and renaming last.

**One game's exit → the next game's first frame.** Worst case unchanged: the cancellation budget (SIGTERM, two seconds, SIGKILL at 1.5 s, D-CLOUD-076). What changes is how often a launch meets a still-running sync, because the sync is longer. The ledger for one changed save, spawns in brackets: today's R5 — head evidence [1], head upload [1], correspondence [1], capped re-fetch on hashless [0–1]. With store-first — head evidence [1], **entries upload [1, new]**, head upload [1], correspondence [1], re-fetch [0–1]. So **+1 spawn and +1× the changed bytes uploaded**, on every backend; once per save, +1× more for the legacy retain. On an H700 over Wi-Fi I estimate the added spawn and round trip at half a second to a second and a half and the added bytes at a fraction of a second for a battery save or a numbered state (8–128 KB; 28–51 KB plus a ~48 KB PNG, D-CLOUD-036), and seconds for a PPSSPP directory — *estimates*, to be replaced by #135's `time-to-play` cell on the VM pair against the QA backends with and without a bandwidth cap, and by Gate 4 (A10). Two things must be measured together, as `gpt_peer_review.md` insists: the latency distribution and the completion rate of the exit sync, because a fast next frame bought by cancelling every backup satisfies the number and not the player.

**What keeps it off the launch path.** The heal reads the stage, not the cloud. Retain is lazy and local (from the stage). Pruning, listings, the `replaces` check, imports, and the foreign-head copy are full-pass only. The escrow is in the exit sync, which a launch cancels; a cancelled escrow leaves the head untouched and the pending record says *escrowed*, so the next pass finishes from where it stopped.

**The startup sync** (`kimi_peer_review.md`). Its backup half now escrows; its full-pass half lists `.history/<unit>/` for changed units, prunes and imports. It is longer, and D-CLOUD-072's contract (no wait without a route, cancellable, "no route means no wait") is unchanged. Measured in the same cell.

---

## 6. Failure modes and ordering hazards, under store-first

- **Interrupted run.** Killed after a partial entries upload: an incomplete entry, no valid record or a record whose members are missing; invisible to readers; removed after two of a device's full passes see it incomplete; the head untouched. Killed after the entry is complete and before the head: the pending record says *escrowed*; the next pass writes the head from the stage (or from the store, R-e); a lost pending record costs nothing — the next classifier verdict is "this device changed" again, and the entries upload is skipped when the listing shows the digest. Killed mid-head on a multi-member unit: #22 A8's hold — the head's unit is incomplete, no device installs it, completion resumes from `pending-publish.json`; the store entry is the coherent source to complete from. Killed after the head, before agreement: the next pass sees L = C and confirms. Power loss on the device: local state is temp-and-rename (D-CLOUD-078); the stage is content-addressed. An orphaned rclone that outlives the lock holder (D-CLOUD-093) may finish its copy after a new run starts: the new run's fresh listing precedes its writes, and the run id in `<seq>` keeps the two runs' entries apart; a duplicate version is deduplicated by digest by the pruner. "Process killed" is not "remote operation aborted" (`gpt_peer_review.md`); the fixture kills only the parent and releases the child later.
- **Two devices publishing.** Distinct `<seq>` (device id, run id): no collision. Head race: closed for bytes by escrow; made visible by `replaces` (R-a). Concurrent pruning: §3.6.
- **README inside a `sync`-mode folder under the allowlist.** Excluded by rule on new images; under the shipped rules it falls through to `- /**` and is neither restored nor, absent `--delete-excluded`, deleted (recollection of rclone's exclude semantics — H5 tests it). Regenerated if deleted.
- **`.history/` versus rclone's `--backup-dir` overlap rule.** Never engaged: the store is written by `copy`, never named as a `--backup-dir`; and the head is written from the local stage, so no `copy` has a source inside its own destination (which is why R-e is optional and per-file `copyto` if taken).
- **Every writer that still exists before R1.** §3.5: the shipped scripts see the store as saves; the guard image closes the default paths; the fold recovers the rest; the residual is stated.
- **Pruning racing a publish.** P1 protects the in-flight and current version; run-count grace protects incomplete entries; a #25 restore stages and verifies its entry before touching a live file and leaves the save unchanged if the entry vanished.
- **A device restoring `.history/` by accident.** Old-image restore under the shipped rules pulls matched members into the device's `.history/`; the reconciler imports what the cloud lacks and removes what it has (§3.5).
- **Providers.** Dropbox: no MD5 but its own hash, mapped as R4 already does; per-folder write serialisation (D-CLOUD-083) applies to the head folder and to each entry folder — low-level retries stay at 10, and I withdraw the claim that contention is confined to directory creation; its 30-day versions are a backstop the design does not lean on (D-QA-017). WebDAV/SFTP/SMB/FTP: keep nothing, so the store is the only history; no hash on some, so size plus capped re-fetch; no server-side copy assumed, which store-first never needs.
- **Legacy set-asides are not coherent snapshots** (`gpt_peer_review.md`). A stamp holds only the members a run overwrote; an import of a multi-file unit may be partial; the record marks `complete: false` and the reader never offers it as a restorable unit (§7).
- **Metadata concealing mass absence; README creating a typo folder.** §3.8.
- **The wizard's pre-pass.** Its pushes escrow like any publication; a quit does not undo them (#23); the entries exist and are harmless (`kimi_peer_review.md`).
- **MATCH THIS DEVICE TO THE CLOUD.** A writer of the saves tree, so under R1 it acts through the reconciler; whichever side it deletes on, each deletion retains first (`reason: deleted`) — from the store if the version is there, by upload or copy if not. Its implementation is a corpus gap (G4).

---

## 7. Migration

Rule (`upgrade-and-install.md`, cited by the commission): read both, write the new one; a prompt is a failure mode. Both legacy homes are folded by the reconciler on every full pass, forever, by **copy → verify → record → delete, per file**.

**Cloud `Saves-replaced/<stamp>/<path>`.** Per file: obtain the hash (backend hash mapped on hashed backends; on hashless, fetch to hash, within a per-pass budget, deferring the rest — the source waits); skip if the store already holds that version for that file; otherwise copy (server-side where possible, else through the device) into `.history/<unit>/<seq>/<path>` with a record: `reason: replaced`, `imported_from: <stamp>/<path>`, `producer: unknown`, `time: <stamp>, zone unknown, untrusted`, `complete:` true only if the unit table says every member is present; verify; write the record; then delete *that file* from the stamp. Path-aware (`kimi-analysis.md`): a source at `<stamp>/.history/<unit>/<seq>/<member>` is a displaced history member and goes back to `.history/<unit>/<seq>/<member>`, not to a new entry. Never purge a stamp directory: a late write from an old image running now survives to the next pass; empty stamp directories are removed after their files are gone. Imported entries are untrusted for C2 and aged from import time, so a 100-day-old legacy version is not deleted the moment it arrives (`gpt-analysis.md`).

**Device `/storage/.cache/cloud_sync/replaced/<stamp>/<path>`.** The manual RESTORE row passes no `--update` (`repo/code/cloud_restore-set-aside-excerpt.md`), so a newer local save can have been replaced by an older cloud copy and the loser exists nowhere else. Per file: hash locally; if the head or the store holds it for that path, delete locally; otherwise upload to the store with `reason: replaced`, `producer: unknown`, `imported_by: <this device>`; verify; record; delete. Full passes only. D-CLOUD-036's cross-device consistency is why the cloud, not a read-both adapter, is the destination.

**`Saves-discarded/`** was never shipped (D-CLOUD-042 planned it); nothing to migrate.

**Mixed fleet.** Old images keep writing `-replaced/`; the fold absorbs; the residual is §3.5's. When the last old image is retired and `-replaced/` is empty, the folder is removed.

---

## 8. Register changes

No row is reopened against its purpose. These are refinements, each citing the row it refines:

- **D-CLOUD-036** — location superseded by D-CLOUD-095 (already); default count 3 stands; its ordering rule generalises to store-first.
- **D-CLOUD-041** — mechanics refined: the cloud loser is copied into the store, not moved (no absence window, D-CLOUD-037); winner and loser both pass through the store.
- **D-CLOUD-042** — the location clause is superseded by D-CLOUD-095; the split-root refusal clause stands (`gpt-analysis.md`).
- **D-CLOUD-045** — additive: manifest `history_keep` for C1's ownership; confirm `replaces` semantics (G3).
- **D-CLOUD-046 / #22 R5** — the changed exit gains one spawn (entries upload) and one upload of the changed bytes; no fetches; numbers from Gate 4 and #135, not chosen.
- **D-CLOUD-047** — third sentence refined: propagated deletions are retained as `deleted` through the store; compactions retain nothing (the bytes exist); Gate 7 is moot for saves.
- **D-CLOUD-096** — refined: P1/P2 precede the caps; count per save file; age trust-gated; 256 MiB a target with disclosed overshoot; pruning on full passes.
- **D-CLOUD-099** — endorsed; made true by the per-file bucket.
- **D-CLOUD-100** — refined: heal from the stage at exit and from the cloud on the full pass; descriptor instead of bytes; recovery reported after install; the second occurrence is a question.
- **D-UI-022** — *earlier versions* is the store's noun; *discarded saves* stays the wizard's word.
- **#22 R2, R9** — rules and layout as §3.1; store transfers carry no allowlist. **#22 R6, R10** — stale text: refusal → cancellation (D-CLOUD-076); exit codes 3/4 → 75/69 (D-CLOUD-074) (`gpt-analysis.md`). **#22 negative scope** — "no preimages of one-way fetches" → "no *redundant* preimages" (retain-before-install only when `in_store` is false — `gemini-analysis.md`, narrowed); "no protected-publication protocol" → "no coordination protocol in the cloud; publication is recoverable, not serialised".
- **#21** — the stage keeps the agreed version until superseded (F4).
- **Not reopened:** D-CLOUD-052 (transport unchanged), D-CLOUD-097 (a filter rule is not a widening of `-replaced/`), D-CLOUD-095, D-CLOUD-014 (store-first is its generalisation: nothing is overwritten or deleted without a record).

---

## 9. Hypotheses and the experiments that settle them

All on the VM pair against `issues/133.md`'s matrix (WebDAV, MinIO, SFTP, SMB, FTP, one non-Dropbox hosted account); nothing on an owner's device or account (D-QA-015/017).

- **H1** rclone's post-transfer hash check on hashed backends fails closed → the entries upload verifies itself. *Corrupt a body through a proxy; assert the run reports failure and the head is not written.*
- **H2** `--files-from` paths are or are not subject to `--filter-from` exclusions → whether the reconciler's store spawns must omit the allowlist (design says omit regardless). *Upload an entry with and without the rules file.*
- **H3** Recursive listing cost of `.history/` at 1k/5k/20k objects per backend (pagination; per-directory PROPFIND) → whether pruning lists per changed unit with a rotating full sweep.
- **H4** Dropbox per-folder serialisation with concurrent entry-folder and head-folder writes at `--low-level-retries 10` → on the hosted non-Dropbox account for the analogous behaviour; the Dropbox case stays Dropbox's to find (D-QA-017).
- **H5** Old image `af2db4ab09` against a seeded `Saves/README.md` + `.history/`: copy-mode backup (expect nothing deleted), sync-mode backup (expect matched members moved to `-replaced/`, records and PNGs left), restore (expect matched members restored into device `.history/`), `--delete-excluded` variant; then the guard image (expect nothing touched). *Expected-failure baseline, then success.*
- **H6** The exit and startup ledgers' seconds and completion rates with and without escrow, bandwidth-capped (#135's cell); the legacy retain's one-time cost; the first pass after cutover on a 300-save fixture.
- **H7** #21's stage keeps the agreed version until superseded — a requirement to verify in #21's text (G1).
- **H8** `clock_synced` is available at capture and at the pruner (#23 displays it; its source is not embedded).
- **H9** D-CLOUD-045's `replaces` names the head the publisher saw (G3); if so R-a is free.
- **H10** An interrupted `copy` leaves each destination file old or new on every backend in the matrix (asserted for rclone's rename by D-CLOUD-076/077; confirm on SMB and FTP).

**Decisive fixtures beyond #22's:** `gpt-analysis.md`'s schedule carried through A's next pass (HA must be in the store, and with R-a the pair must queue as divergent); overwrite a manual state, renumber, three auto exits (manual version and PNG survive together); protected material over 256 MiB, an oversized unit, exit-only operation, two devices with different counts (no fixture passes by deleting protected data); pause after entry verification, prune from the peer, remove local pending state, resume; prune while a reader fetches its chosen entry; partial legacy stamps, a failed legacy run, equal stamps from two devices, a late legacy write during import; history off with a suspect and a retention failure injected; the erase-twice loop; kill only the lock-owning parent before a local rename, start a launch, release the child.

---

## 10. Corpus gaps to surface

G1 — #21, its unit table and stage lifetime (F4 and §2.1 depend on it). G2 — the complete `cloud_backup`/`cloud_restore` scripts and the MATCH and `FileData::launchGame` call paths. G3 — `docs/save-manifest-schema.md` (`replaces`, additive fields). G4 — `docs/conflict-wizard-ia.md` (the question surface for the second suspect). G5 — `upgrade-and-install.md` and `engineering-practices.md` in full. G6 — no measurement of any retention operation exists in the corpus; every second above is an estimate until H6 runs. Also: `kimi_peer_review.md` as injected ends mid-way through its provenance table; its arguments were complete and I relied on them as embedded.

---

## `corpus.provenance.json`

```json
{
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
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md"
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
    "4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2"
  ],
  "provenance_basis": "Embedded source contents and the Facilitator's sha256 values, verified at embed time. No filesystem access, re-reading, re-hashing or experiment was performed by this seat.",
  "manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
  "corpus_gaps": [
    "Issue #21, its unit table and the capture-stage lifetime contract were not embedded (F4 and the per-file bucket's no-op condition depend on them).",
    "The complete cloud_backup and cloud_restore scripts and the MATCH and launch call paths were not embedded.",
    "docs/save-manifest-schema.md (the meaning of `replaces`; additive fields) was not embedded.",
    "docs/conflict-wizard-ia.md was not embedded.",
    "upgrade-and-install.md and engineering-practices.md were not embedded in full.",
    "No measurement of any retention operation or of retain-before-publish latency exists in the corpus; all seconds in this document are estimates pending #135's VM cell and Gate 4.",
    "kimi_peer_review.md as injected is truncated inside its provenance table; its substantive sections were complete."
  ],
  "peer_review_note": "gemini_peer_review.md, gpt_peer_review.md, kimi_peer_review.md and mistral_peer_review.md were read as injected. No hashes were supplied for them and none have been fabricated. The concurrent-publisher counterexample is credited to gpt-analysis.md, as gpt_peer_review.md, kimi_peer_review.md and gemini_peer_review.md attribute it; mistral_peer_review.md attributes it to gemini-analysis.md."
}
```

## Closing assessments

### `claude_vote.md`

**Winner: `kimi-revised_plan.md`.**

## Why kimi, in one paragraph

Judged on the brief's order — progress first, then grounding, buildability inside D-CLOUD-098, sequencing, simplicity — `kimi-revised_plan.md` is the plan a small team could take into #22/#23/#25 as written with the fewest ways to lose a copy and the clearest statement of what is load-bearing, what ships with the store, what can wait, and which cheap experiment (E1–E8) would invalidate each design assumption before anything expensive is built. It concedes its own Step-1 errors by name (the TOCTOU "fails safe" claim, the clock-independent count, the modtime mitigation, the fabricated `reason: replaced` on imports), and every closure it adopts is costed against D-CLOUD-034. It reopens the fewest binding rows (D-CLOUD-041/046/047/100 as refinements, #22's C1 narrowly, D-CLOUD-042 as a citation fix) and explicitly declines to reopen D-CLOUD-052, -099, -097, -032 and -036's range. `gpt-revised_plan.md` is the closest competitor and is in several places *safer*, but it buys that with machinery the brief tells me to discount (a causal-revision shared-settings protocol, per-entry completion receipts, a pruning contract that must be *proved* on a two-pruner fixture) and it partially reopens the maintainer's same-day auto-heal ruling. `gemini-revised_plan.md` is a correct list of adoptions with no migration of the existing set-asides and no transaction shape. `mistral-revised_plan.md` has grounding errors that would mislead the implementer.

## Kimi against each of the other three

### Against `gpt-revised_plan.md`

Where gpt is stronger, and I want that recorded (see Dissent): member-relative paths inside an entry instead of R9's basenames; completion as a fact separate from the record; the two-pruner contract; "a suspect cloud head is never installed over a known good local copy"; the MATCH inventory with an honest refusal to invent its direction; planner validation of reserved paths independent of any filter file.

Where kimi is the better plan to *adopt as written*:

- **Simplicity of the shared-settings answer.** Both see the real problem (`claude_peer_review.md`'s point, as both cite it): a count of 3 on device A prunes what device B at 9 was told is kept. Kimi's answer is one manifest field already read on every pass (D-CLOUD-045) plus `max()`. gpt's answer is a causal-revision protocol with pending offline edits, "ON wins and larger count wins" for incomparable changes, and a later edit that supersedes both — and gpt itself says "the exact manifest field design is an implementation prerequisite." D-CLOUD-034 says the cheapest sufficient form wins; kimi's is cheaper and, with the drawer-device caveat I record below, sufficient.
- **Fidelity to D-CLOUD-100.** The maintainer ruled auto-heal for *both* patterns ("zero length or all one byte"). Kimi keeps the heal for the uniform case and fixes what is actually wrong with it — the once-message asserts damage as fact (D-CLOUD-077) — and adds the second-time escalation from `gemini_peer_review.md` so an intentional erase is not fought forever. gpt turns the uniform-at-full-size case into a wizard question, which is a reopening of a same-day ruling and adds a question to a flow the maintainer wants to be quick (D-CLOUD-033). gpt argues it by ID, which is permitted; kimi's is closer to what was decided and just as safe for the bytes.
- **Protecting the deliberate loser at shallow counts.** Kimi keeps "the newest N routine entries *plus* the newest `reason: discarded` entry." gpt reserves the deliberate loser *within* the allowance and says plainly that at a count of one it will not also preserve the routine preimage. Under criterion 1 that is a policy path in gpt that drops a copy; kimi's N+1 does not.
- **Sequencing.** Kimi §7 separates *load-bearing* (get it wrong and a player loses a save or waits) from *ships with the store* from *can follow later*, and §8 names eight experiments with the hazard each is expected to reveal on the shipped image first (E1's "expected result written as the hazard"). gpt's §10 is a release-gate table — necessary evidence, but framed as what must be true before shipping rather than what to run before building. The brief's criterion 4 asks for the latter.
- **Two catches gpt lists only as gaps.** Kimi puts the `--delete-excluded` audit in the body as a requirement with an experiment (E2): if any shipped command or user `RCLONEOPTS` passes it, `- /.history/**` becomes a deletion instruction against the store. gpt mentions it only in its provenance gaps. Kimi also requires the README be written only after the destination is validated so a housekeeping write cannot create the misspelled root D-CLOUD-085/091/092 exist to catch.

### Against `gemini-revised_plan.md`

Gemini adopts the right things (retain-on-fetch, top-of-file exclusions including `- /README.md`, standing fold, copy-not-move, per-file count, pub-chain ordering, soft caps, admission ceiling counting retain bytes, bounded heal fetch) and states three honest hypotheses. But adopted as written it fails the commission on two of its five questions and has one drop-a-copy path:

- **No answer to Q4 (migration).** Its only migration item is the *repair* fold of `-replaced/<stamp>/.history/...`. Nothing folds the existing legacy stamps into the store, and the local `/storage/.cache/cloud_sync/replaced/` is never mentioned — yet the shipped `cloud_restore` comment says that folder can hold the newer local save an older cloud copy replaced (`repo/code/cloud_restore-set-aside-excerpt.md`). Worse, §1.2 says the reconciler "folds them back ... and deletes the legacy `-replaced/` folder": if the folder is deleted after folding only the nested items, the un-folded legacy stamps in it are lost. That is the path the brief says disqualifies an elegant store.
- **No answer to Q2's interruption cases.** There is no transaction shape (bytes-first, record-last), no interrupt-point walkthrough, no statement of what an entry without a record means to #25. Kimi has all three.
- **Ungrounded assertion.** "Because MATCH bypasses the standard classifier" is not in the corpus; `repo/docs/es-menu-map.md` shows only that MATCH is "the only action that deletes." Kimi and gpt both say the call path is a gap.
- **No bounds precedence.** Gemini trust-gates the age cap but never resolves "never a game's only copy" against 256 MiB — the arithmetic that gpt and kimi both name.

### Against `mistral-revised_plan.md`

Mistral has the right skeleton and a few primitives worth keeping (below), but it would mislead the implementer in ways that touch binding rows:

- **§5 lists AGE CAP and TOTAL SIZE CAP as rows in the SAVE HISTORY submenu**, and says "the settings page" states they are soft. D-CLOUD-096 and D-UI-039 say those caps "are ours, not rows." Adopted as written this stacks two rows the maintainer removed.
- **§7 is self-contradictory**: it cites D-CLOUD-077 and gpt's intentional-erasure point, then keeps the wording "was damaged when the game closed" — the exact assertion the point was about. It also makes the detector "format-aware," the broader validator gpt withdrew and the maintainer did not ask for.
- **§9's mitigation is ungrounded**: "Retain and verify in the background after the card says the player may go (D-CLOUD-038)." Retain precedes publish by the plan's own row 2; nothing can be retained after the sync has reported done, and D-CLOUD-038 is the launch gate, not a background-work permission.
- **§11 reopens D-CLOUD-052** for the concurrency residual. D-CLOUD-052 is the transport verdict; the residual lives in R5/D-CLOUD-046. Kimi explicitly and correctly does *not* reopen 052.
- **§12 item 4 adopts a refuted claim** — that the auto rule "overwrites any existing slot 4." `issues/23.md` says the cloud's resume point goes "in the next free numbered slot" and reserved slots are rechecked at COMPLETE. gpt refutes this; kimi does not repeat it.
- **§10's "release gate: upgrade both devices before syncing"** is a player-facing instruction about our internals; the commission calls a prompt a failure mode. gpt and kimi treat the mixed-fleet boundary as a release-engineering problem, not a player message.

## Dissent — what the winner must absorb from the losing plans

By filename, so the synthesis can pick these up:

**From `gpt-revised_plan.md`:**
1. **Member-relative paths, not basenames.** R9's "members at their basenames" can collide inside a multi-directory unit (the PPSSPP directory case D-CLOUD-036 defers to the census; the N64 saves the allowlist now admits at two depths, D-CLOUD-086). Kimi calls payload naming "a backward-compatibility choice"; it should be a requirement. One overwritten member is a dropped copy.
2. **Completion is a separate fact from the record.** Kimi's record is the commit point and is written before the publish; if the publish never completes the record says `replaced` about a version that is still the head. Add a completion marker (or `applied: pending` until verified) so #25 never labels an attempted replacement as a completed one.
3. **The two-pruner contract** (gpt §5.6): only explicit completed entry IDs are deletion targets, never a recursive purge of a unit; uncertainty about ordering, listings or last-usable-copy yields retention; if the properties cannot be shown on the two-pruner fixture, destructive cleanup is disabled and the overrun reported. Kimi says pruning is full-pass under `L_T`, but `L_T` is device-local and two devices' full passes can prune concurrently.
4. **A suspect cloud head is never installed over a known good local copy.** Kimi covers both-suspect and no-good-counterpart; it does not state the asymmetric case.
5. **MATCH THIS DEVICE TO THE CLOUD inventoried into R1** without inventing its direction, and **planner validation** that reserved paths never appear in a saves transfer or deletion list regardless of a custom filter — the D-CLOUD-088 refinement (users control which saves; not the namespace guard).
6. **Idempotent import receipts and a fresh 90-day grace** for imports (gpt §6.5 steps 4–6). Kimi's "stamp time untrusted → never age-pruned" achieves the grace indirectly but leaves legacy entries first in line for size pruning and gives the importer no retry ledger.
7. **D-CLOUD-093 refinement:** quiesce the operation's process group before admitting another live-tree writer or a game; a released lock is not proof that rclone's children stopped. Kimi has the experiment (E5) but not the requirement.
8. **Walker audit:** `cloud_capture` and every whole-tree operation must distinguish live saves from control metadata. Kimi has E7 as an experiment; make it a requirement.
9. **Audit lines for ordinary retains and prunes**, not only heals (D-CLOUD-027 lineage).

**From `gemini-revised_plan.md`:**
10. **Soft-cap disclosure.** Because pruning runs only on full passes, an exit-only device overshoots count and size between passes; the README and the public page must not promise a hard ceiling, and the admission ceiling must not block a publish because the store is temporarily oversized. Kimi implies this (§2.4) but does not require the wording.
11. **`- /README.md` at the top** — kimi has it (row 4, credited to mistral); noting that gemini's placement "at the absolute top" is the right position.

**From `mistral-revised_plan.md`:**
12. **Own-manifest witness before any retention write** (mistral §2 item 4, originally `kimi_peer_review.md`'s): a cloned card (R7, A11) must refuse before writing store entries for a publish it will not make. Kimi's revised plan does not state this ordering explicitly; gpt's Guard phase does.
13. **A named label for `reason: legacy`** in #25 (mistral's UNKNOWN). Kimi says "their own honest label" without naming it.
14. **The startup sync's backup half now retains too** (mistral §12 item 3): the boot pass gets longer, raising cancellation probability under D-CLOUD-072/076. Kimi's completion-rate measurement (§6) covers the consequence; the cause should be named in the plan.

## Remaining defects in `kimi-revised_plan.md` to fix before it is built

1. **Basename layout** (dissent item 1) — mandate member-relative paths or a member map in the entry.
2. **Record-before-publish truthfulness** (item 2) — add the completion fact.
3. **Orphan sweep by age.** Row 2 sweeps record-less entries "once older than the maximum bounded retain duration," but kimi's own §1.3 says no ordering rule may lean on modtime until E3 lands, and no other timestamp exists for an orphan. As written, a second device could sweep the members of a retain that is in flight from a slow or wrong-clocked device. Sweep by run-id liveness (the `<run-id>` now in `<seq>`) or after a trusted observation, never by copied modtime.
4. **Fleet-max on settings** has a drawer-device residual: a handheld unused for a year pins the fleet's count at 9. Either accept and state it, or weight a manifest by its `published_at` freshness (D-CLOUD-045) — still one field and a comparison.
5. **Two concurrent pruners** (item 3) — adopt gpt's minimal contract.
6. **Witness before retain** (item 12) — make explicit.
7. **Suspect cloud head** (item 4) — state it.
8. **One loose cost claim:** "on backends with server-side copy, copy and move cost the same" is stated as fact in row 2; it is E3's hypothesis and should be labelled so in the row.
9. **Exit-card framing:** "the exit card — where D-CLOUD-098 permits spending the player's attention" reads `repo/rules/time-to-play.md` loosely; the rule says rigour belongs *after the card has said the player may go*. The heal fetch is defensible because a launch cancels it (D-CLOUD-076) and the card names it (D-CLOUD-077) — say that, not that the card is a permitted cost.
10. **Row 5 label:** kimi proposes MANAGE SAVE HISTORY over the delta's SAVE HISTORY on the submenu-carries-the-verb rule; the words are the maintainer's and `repo/docs/es-menu-map.md` must move in the same change (D-UI-039). Flag, not decide.

None of these changes kimi's shape; each is a paragraph in a row, and all fail toward retention. That is why it is the safest plan to hand to the maintainer as the change to #22, #23 and #25.

### `gemini_vote.md`

**Winner:** `claude-revised_plan.md`

**Reasoning:**
`claude-revised_plan.md` provides the most robust, implementable, and architecturally sound solution. Its introduction of the "store-first" (escrow) invariant is a paradigm shift that elegantly solves the concurrent publisher race. By ensuring no version becomes the cloud head without first being secured in the store, it completely eliminates the vulnerable window where a head can be overwritten before being retained. 

Furthermore, `claude` excels in its mechanical sympathy for rclone and the time-to-play budget (D-CLOUD-098):
1. **Bandwidth Efficiency:** `claude` correctly proves that on streamed backends (SFTP, SMB), store-first (2 uploads) is strictly cheaper and faster than the delta's retain-before-publish (1 download + 2 uploads). 
2. **Exit-Path Optimization:** By introducing the local `in_store` flag and amending #21 to keep the last agreed version in the local stage, `claude` eliminates cloud downloads on the exit path entirely—even for legacy retains and auto-healing suspect saves.
3. **Race Detection:** Using the `replaces` lineage to detect disguised races post-hoc and reclassify them as divergent conflicts is a brilliant, zero-cost application of existing metadata.
4. **Allowlist Precision:** `claude` astutely catches that the reconciler's store transfers must *omit* the allowlist (H2), otherwise the new `- /.history/**` rule would block the reconciler's own writes.
5. **Count Scoping:** Keying the count bound to the member path perfectly solves the auto-state churn problem (D-CLOUD-099) without violating the unit definition.

`gpt-revised_plan.md` offers a strong alternative with its conditional retain-before-install backstop, but its reliance on downloading the old head on streamed backends makes it too slow for the exit path. `kimi-revised_plan.md` and `mistral-revised_plan.md` provide good syntheses but miss the opportunity to restructure the transaction to avoid the TOCTOU race entirely.

**Record of Dissent:**
- **Accounting for all bytes (`gpt-revised_plan.md`):** `gpt` correctly argues that the 256 MiB cap must account for *all* stored bytes. `claude` proposes exempting head-equal entries pending Gate 2's measurement. `gpt`'s principle must prevail: exempting classes of files makes the cap a lie. They must be counted, even if their protected status (P1/P2) causes an allowed and logged overshoot.
- **MATCH implementation (`gpt-revised_plan.md`):** `gpt` emphasizes that `MATCH THIS DEVICE TO THE CLOUD` is a corpus gap and its deletion direction is unknown. While `claude` assumes it acts as a standard R1 writer and flags it as a gap, `gpt`'s caution is warranted: we must verify its actual call path and behavior before assuming it safely routes through the reconciler's retention logic.
- **Active `--delete-excluded` audit (`kimi-revised_plan.md`):** `kimi` rightly demands an active grep/audit of the shipped scripts for `--delete-excluded` (E2). `claude` notes it as a residual condition to test (H5), but `kimi`'s posture is safer: its presence anywhere in the shipped scripts would turn the new exclusion rule into a catastrophic deletion instruction against the history store.

**Remaining Defects in the Winner:**
1. **`in_store` Flag Fragility:** The `in_store` flag relies on local state. If `/storage/.cache/` is cleared, `in_store` becomes false for all saves. The plan must explicitly state that a full pass repopulates these flags from a single, cheap `.history/` directory listing *before* any overwrites occur. Otherwise, a cache clear will trigger a storm of redundant uploads from the local stage to the store on subsequent syncs.
2. **Manifest Schema Amendment:** `claude` proposes that the shared count policy is the maximum declared in any device's manifest. This elegantly solves the shared-settings problem, but it requires adding the count setting to `docs/save-manifest-schema.md` (D-CLOUD-045). This schema change must be explicitly listed as a prerequisite before implementation begins.

### `gpt_vote.md`

Winner: **claude** (`claude-revised_plan.md`).

I vote for its **verified pre-publication escrow** as the foundation—not for every optimization surrounding it. It is the only supplied plan that requires a newly published version to be recoverable from the cloud **without the originating device ever returning**. That outweighs its additional transfer cost. However, its pruning, membership checks, and auto-heal rules need blocking corrections before implementation.

Source references below use the corpus’s supplied numbering, S01–S17. Their declared paths and Facilitator-provided hashes are recorded in the provenance section.

## Why this is the strongest foundation

Consider two devices that agree on H0:

1. Both inspect H0 and retain H0.
2. A publishes HA and verifies it.
3. B publishes HB over HA.
4. A’s next pass sees local = agreement = HA, cloud = HB, and therefore classifies this as “the cloud changed.”

That follows directly from #22’s R4/R5 rules. Neither a device-local lock nor a fresh listing makes the subsequent cloud write conditional. [S11]

`gemini-revised_plan.md`, `kimi-revised_plan.md`, and `mistral-revised_plan.md` repair the **subsequent local overwrite** by retaining HA before A installs HB. That is useful, but it depends on A surviving and syncing again. In the intervening period HA is absent from the cloud; losing A then loses progress that had successfully been published.

`claude-revised_plan.md` instead requires HA’s coherent bytes to be verified in `.history/` **before HA becomes the head**. This is recoverable publication, not serialization. It can use the existing copy transport rather than introduce a cross-provider lock service or replace D-CLOUD-052. Its additional cost is real and must be measured, but it buys a stronger property than the other plans’ delayed repair. [S04: D-CLOUD-034/036/052; S13]

Other useful aspects of `claude-revised_plan.md` are:

- Separate transfer rules for live saves and the history store, avoiding an exclusion that blocks the reconciler’s own retention writes.
- Member-relative paths rather than basenames, avoiding collisions within multi-directory units.
- Preservation of both cloud and device legacy set-asides, with verification before source removal.
- Correct README wording before #25 exists, destination validation before housekeeping writes, and mass-absence checks based on live saves rather than control files.
- Explicit acknowledgment that server-side copy, positive verification, cancellation, and listing costs require experiments rather than assumptions.

Those are practical improvements to the existing reconciler, not reasons to build another synchronization service. [S08–S13]

## Comparison with the other plans

### `kimi-revised_plan.md`

This is the strongest alternative for migration, retention semantics, and reader behavior. Its honest `legacy` reason, protection for the newest deliberate conflict loser, partial-unit handling, capture-walker test, and layout-migration requirement should survive into the final plan.

Its decisive shortcoming is the expressly accepted cloud-recovery gap between B overwriting HA and A’s next sync. Recoverability versus conditional-put serialization is not the only choice: pre-publication escrow supplies stronger cloud recovery while retaining the existing transport.

It also does not finish the concurrent-pruning protocol. A valid record, a local lock, and chain-based victim ordering do not by themselves prevent a peer from deleting an entry while another device relies on it. Its claim that chain ordering removes clock dependence “entirely” is too strong when its fallback uses untrusted time.

### `gemini-revised_plan.md`

Its copy-not-move rule, paired retention/publication deferral, and explicit recognition of the exit-time recovery-fetch conflict are sound.

But it calls retain-on-fetch a guarantee without retaining `kimi-revised_plan.md`’s important originating-device residual. Its standing fold also ends by deleting a legacy folder: without a per-object, quiescence-aware removal rule, that can destroy a late arrival from an old writer. It does not adequately specify migration of the unique copies in the device’s `.cache/cloud_sync/replaced/`. Those copies can be the only remaining newer local save. [S09]

Grounding is weaker in two further places:

- The menu map does not establish that MATCH bypasses the classifier; its implementation is not embedded.
- The plan treats SFTP/SMB retention as streamed in one section, then hypothesizes zero-device-transit copying on those backends in another. That capability must be an experimental branch, not two conflicting planning baselines. [S05; S17]

### `mistral-revised_plan.md`

It usefully includes `legacy`, witness-before-retain ordering, and audit coverage, but it carries the same delayed-retention concurrency gap and several concrete errors:

- Its streamed-backend ledger omits the upload of the retained bytes into cloud history. For equal-sized old and new versions, the stated streamed path already needs old-down, old-up, and new-up—before additional verification downloads. Its “2S” total and resulting worst-case timing are therefore not usable.
- It says the auto-state rule overwrites an existing slot 4. #23 specifies a **next free/reserved slot**, rechecked at COMPLETE. [S12]
- Its README promises a device restore menu before #25 ships. [S13]
- Its suspect message still asserts damage as fact while claiming to address intentional erasure.
- “Upgrade both devices before syncing” is advice, not an enforced mixed-fleet safety barrier.

These are important because adopting the plan literally would produce incorrect expectations, implementation behavior, or budgets.

## Dissent: safeguards to retain from the losing plans

### From `kimi-revised_plan.md`

1. **Protect the newest deliberate conflict loser separately from routine churn.**  
   Per-file buckets stop auto-states consuming manual-slot history, but they do not stop repeated overwrites of the *same* save from consuming its most recent wizard loser. Preserve its proposed “newest routine N plus newest deliberate loser” protection, with an explicit age/size policy. This directly serves D-CLOUD-032’s one-step-back requirement. [S04]

2. **Use an honest legacy event classification.**  
   `claude-revised_plan.md` imports legacy artifacts as `replaced`, but the shipped cloud set-aside also contains sync-mode deletions. Preserve `reason: legacy`, unknown producer/event information, and untrusted stamp time. Importer identity is not producer identity. [S08–S09]

3. **Distinguish partial legacy evidence from abandoned uploads.**  
   Preserve the instruction not to manufacture a coherent unit from a run stamp’s partial contents. Extend it so intentionally preserved partial legacy artifacts cannot be swept as failed uploads merely because they remain incomplete.

4. **Make capture and layout movement explicit integration points.**  
   Carry forward the capture-walker fixture for an accidentally downloaded local `.history/`, and the requirement that TIDY UP’s layout migration carries the history store. Exclusion from transfer alone does not prove exclusion from capture, counting, or classification. [S04: D-CLOUD-089; S05; S11]

5. **Resolve fleet-wide retention settings, especially OFF.**  
   The winner absorbs manifest-max counts but not a complete shared-store ON/OFF policy. Preserve the question: what does one device’s OFF mean when another requires retention? Also define how obsolete device claims cease controlling the effective setting.

6. **Preserve the explicit suspect exceptions.**  
   Both-suspect/no-verified-good-counterpart must hold rather than claim recovery. A deliberately restored uniform version needs authorization tied to that version/publication, so it is not immediately healed away. Preserve honest wording for heuristic findings and repeat-suspect escalation.

7. **Keep clock-aware pruning and the edited-rules audit as release requirements.**  
   Neither causal ordering nor required namespace protection should be demoted to polish. The winner identifies custom-filter hazards, but must turn that finding into a concrete upgrade/invocation policy and acceptance test.

### From `gemini-revised_plan.md`

- **Retain-before-install remains a useful defensive boundary.** A cached `in_store` flag cannot substitute for a presently valid, protected cloud entry when a local version is about to be destroyed.
- **Keep the bounded recovery-fetch alternative.** If the required local stage lifetime cannot be established from #21, a narrowly bounded fetch on the exit path is a legitimate alternative to indefinite deferral. It requires an explicit D-CLOUD-046 refinement and measurement; an exit card does not make network time free.
- **Distinguish policy overshoot from physical storage failure.** Exceeding a soft history target should not itself stop a safely retained publication. Failure to create and verify the required retained copy must still stop it.

### From `mistral-revised_plan.md`

- Preserve its **bytes-first, verified-record-last commit-marker alternative**, also present in `kimi-revised_plan.md`. The winner’s co-uploaded record can work only if every consumer independently establishes completeness. Record-last is the simpler baseline against which that optimization should earn its savings.
- Preserve **format-aware suspicion as a proposed follow-up experiment**, not as already established format knowledge. It could reduce false recoveries, but “uniform” alone is not proof of damage.
- Preserve its **stage-first, bounded-fetch fallback** as another implementation option if #21 cannot supply the winner’s proposed local recovery source.

The winner already absorbs the losing plans’ witness-before-retain and generalized audit requirements; those do not need a second mechanism.

## Blocking corrections to `claude-revised_plan.md`

### 1. Store membership must be proven, not inferred from a directory name

The proposal sets `in_store` after finding a version digest in a listing. That is unsafe: an interrupted upload can leave the correctly named directory with missing members or an incomplete record.

A digest-bearing name is a locator, not a completion certificate. An optimization may skip retention only when it identifies a **verified, coherent entry whose continued availability is protected for the operation**. Run identifiers must also have an established uniqueness contract; #22 naming a `run-id` does not prove its collision resistance.

### 2. Pruning currently breaks the escrow guarantee

The clearest counterexample is:

- A verifies HA’s escrow and pauses before publishing.
- B’s pruner sees H0 as the current head.
- A’s pending record exists only on A, so B does not protect HA.
- Under count/size pressure, or unfavorable timestamp ordering, B deletes HA.
- A publishes HA from its local stage.

The intended store-first invariant has now failed.

“Both pruners choose the same victims” assumes the same snapshot, which concurrent devices do not have. Nor do two observations of an incomplete entry prove that its writer has abandoned it.

Before implementation, specify a cloud-visible or owner-scoped finalization/reclamation rule that protects outstanding publications and deletions. Where abandonment or safe reclamation cannot be established, **defer deletion**. A last-second recheck alone does not close this race.

The same policy must protect the last recoverable copy, deliberate losers, and retained partial legacy artifacts. Soft caps are not permission to guess about these protections. [S04: D-CLOUD-036/078/096; S11: R9]

### 3. Remove the proposed predecessor-mismatch classifier shortcut

`replaces != agreement` does **not** prove a concurrent branch.

For example, A agrees HA and remains unchanged while B legitimately publishes:

**HA → HB → HC**

HC’s immediate predecessor is HB, not HA. A later seeing HC is an ordinary cloud-only change, not evidence that B never saw HA.

Use positively established branching evidence, or leave the identity classifier unchanged. Do not add frequent false conflicts through an unproven interpretation of the unembedded manifest schema. [S04: D-CLOUD-045; S11: R4]

### 4. Auto-heal needs a durable ordering contract, including OFF and offline operation

As written, the winner permits local healing offline while saying the suspect descriptor is written when a pass becomes online. It does not establish the durable pre-replacement preservation needed for that interval.

Before replacing anything:

- Preserve the exact suspect version durably under an explicitly approved ordering rule.
- Establish the identity and lifetime of the known-good recovery source.
- Report recovery only after a complete local unit is installed.
- Define behavior when either preservation or recovery verification fails.

A descriptor capable of reconstructing every byte **is a retained version**. Calling it an audit record does not reconcile it with “Discarded saves were not kept.” Either retain ordinary members using the existing format, or explicitly specify and approve the encoding, reader support, and OFF semantics.

Offline local preservation also needs an explicit argument against the relevant cloud-first requirements—not an implicit reinterpretation of D-CLOUD-036/041/100. [S04; S12–S13]

### 5. Separate publication state from retention reason

An escrow that never reached the head is not “REPLACED BY A SYNC” merely because it differs from today’s head.

The schema must distinguish pending/never-published material from actual earlier versions. It must also preserve a wizard decision’s reason, winning side, and time even when its loser’s bytes were already escrowed. Byte deduplication must not erase the event metadata #25 requires. [S11: R9; S13: A5]

### 6. Correct the cost and launch-safety claims

The “+1 spawn, +1 upload” ledger omits required pre-publication verification work on a genuinely hashless backend. The escrow verification cannot be folded into the later head verification: they lie on opposite sides of the safety boundary.

Measure the actual ledger, including record verification, any escrow re-fetch, head correspondence, legacy retention, and process startup. Compare old and new payload sizes separately; store-first is not universally cheaper when they differ.

Likewise, cancellation does not automatically mean zero added game-to-game delay. It includes termination and any necessary completion/recovery of local multi-member installation. Per-file temp-and-rename alone does not prove that the **unit** is coherent before the first frame. The D-CLOUD-093 orphan-child case needs particular attention. [S04: D-CLOUD-046/075/076/093/098; S06; S11: A7/A10; S15]

### 7. Mixed-fleet safety and migration cannot be closed by accepting the residual on the maintainer’s behalf

The early exclusion image and standing fold are worthwhile mitigations. They do not prevent two old sync-mode runs from destroying a displaced history member before repair.

Make the compatibility experiment a release gate, including custom filters and `--delete-excluded`. If required, test whether non-save payload names can provide additional protection against the shipped old allowlist. Do not claim protection against arbitrary old writers without a demonstrated barrier.

Migration source removal must be per verified artifact, with late writes handled conservatively. Correct the legacy reason, and keep imported partial artifacts separate from abandoned-transfer garbage. [S08–S10]

### 8. Finish the policy and register edits before coding

Keep the two settings nested under a verb-bearing row; do not ship the winner’s alternative of placing them directly in SAVE MANAGEMENT without an explicit reopening of the agreed delta. Resolve the effective count, OFF semantics, cap exceptions, and protection for deliberate losers.

Record actual amendments to the affected decisions rather than labeling substantive changes “refinements” and assuming approval. Also sweep #22’s stale launch-refusal and sentinel text against D-CLOUD-076 and D-CLOUD-074. [S02; S04; S05; S07; S11]

## Work sequence

The cheapest potentially disqualifying experiments should precede the wizard and full reader:

1. Obtain the missing #21 contract, manifest schema, full writer paths, and rules-migration implementation.
2. On isolated VM backends, test namespace isolation, positive copy verification, interrupted entry visibility, and the publication/pruner barrier above.
3. Exercise concurrent publishers, parent-only kills with surviving children, local multi-member recovery, partial legacy imports, and repeated old-image syncs.
4. Measure both time-to-play metrics **and successful sync completion rates** across hashed and hashless/streamed cases.
5. Only then finalize the storage protocol and build the #23/#25 surfaces around it.

All proposed experiments belong on GENERIC_X64 and the QA-only backend matrix first. No owner-device or owner-cloud testing is proposed; the dedicated QA handheld remains an open decision. [S16–S17; S04: D-QA-007/015/017]

**Bottom line:** retain `claude-revised_plan.md`’s pre-publication escrow, remove its unsafe shortcuts, and settle reclamation before building the UI.

## `corpus.provenance.json`

The following records the embedded corpus, not filesystem reads or independently recomputed hashes. Earlier-round analyses and reviews mentioned inside the candidate plans were not separately available and are not treated as independently verified evidence.

```json
{
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "Embedded read-at-time corpus only; no filesystem access and no experiments performed",
  "hash_basis": "The Facilitator's sha256 values, verified at embed time; not recomputed by this member",
  "facilitator_manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
  "citation_order": "S01 through S17 correspond to the parallel arrays below",
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
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md"
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
    "4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2"
  ],
  "injected_plan_filenames": [
    "claude-revised_plan.md",
    "gemini-revised_plan.md",
    "kimi-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "plan_hash_note": "No hashes were supplied for the injected revised plans; none are fabricated",
  "corpus_gaps_surfaced_to_orchestrator": [
    "Issue #21: capture-stage lifetime, unit table, capture exclusions, and recovery-source guarantees",
    "The complete save-manifest schema, including the precise meanings of pub and replaces",
    "The full backup, restore, MATCH, launch, and child-process lifecycle implementations",
    "cloud_sync_helper handling of edited or custom rules files",
    "The complete conflict-wizard IA, upgrade-and-install rules, and engineering-practices rules",
    "Measured backend capabilities and retention/time-to-play results; the proposed experiments have not been run"
  ]
}
```

### `kimi_vote.md`

**Vote: `claude-revised_plan.md`**

---

## Reasoning

I weighed the four plans against the brief's ordering: protect player progress first, then groundedness, buildability, sequencing, and simplicity. `claude-revised_plan.md` is the only plan with **no identified path that drops a copy**, and it achieves that with *less* machinery than the alternatives, not more.

### Why `claude-revised_plan.md` wins on protection of player progress

Its core replacement — **store-first** ("nothing becomes the head, and nothing leaves the head, unless that version is already in the store") — closes the two-device race from `gpt-analysis.md`'s schedule *for bytes*, with no residual: A's HA is escrowed and verified before it becomes head, so B overwriting it loses nothing. Every publish (exit push, full pass, wizard apply, #25 restore, MATCH) travels one code path: upload the entry from the local stage, verify, then write the head from the same stage.

Compare the alternatives' race handling:

- **`gpt-revised_plan.md`** recommends the conditional retain-before-install backstop and states its residual honestly: HA is not recoverable from the cloud alone until A next syncs, and if A's local copy disappears first (lost card, continued play), HA is gone. The brief is explicit that "a plan with an elegant store and one path that drops a copy is worse than a plainer plan with none." Gpt's plan has such a path; claude's does not. Gpt withdrew escrow as "insufficiently costed" — but claude's revision *does* cost it (§5: +1 spawn, +1× changed bytes, admission ceiling counts escrow bytes, defer-together, measurement via H6/#135), which removes the basis for that withdrawal.
- **`gemini-revised_plan.md`** adopts the same backstop but overstates it as "the cheapest sufficient form to *guarantee* recoverability" — it does not guarantee it, and gpt's own statement of the residual proves it. Overstating a safety property in a plan of record is worse than stating a weaker one honestly.
- **`mistral-revised_plan.md`** keeps the delta's retain-the-old-head mechanism and adds the fetch backstop — same loss window as gpt, stated less precisely.

Claude's mechanism is also *cheaper exactly where the store matters most*. The gap analysis (§2.5) and D-QA-017 establish that WebDAV/SFTP/SMB keep no versions — the store is those users' only history. On those backends, retain-old-head streams the old save down and back up through the handheld (3S of Wi-Fi traffic per publish, as mistral's own ledger shows); store-first moves 2S and never needs a server-side copy anywhere. On Dropbox/S3, gpt's server-side copy saves ~1S of upload — negligible at 8–128 KB per save, and PPSSPP-sized units defer under the admission ceiling either way.

Beyond the race, claude's protection stack is the most complete: P1/P2 (never prune head-equal or pending-referenced entries; never prune the last complete entry of a file with no live head) ahead of the three caps; per-file count keying that makes D-CLOUD-099 true instead of letting auto-state churn evict the manual slot it was decided to protect; the erase-twice heal loop broken by a second-occurrence question; copy → verify → record → delete migration in *both* directions (including the device-local `.cache/cloud_sync/replaced/`, which gemini's plan never mentions); and a standing, path-aware fold for old-image damage with the residual stated rather than claimed closed.

### Why it wins on groundedness and buildability

The concessions section (§1) corrects ten specific errors against the corpus, and its load-bearing claims are checkable and correct: the shipped `cloud_sync-rules.txt` really does match `.history/` members at any depth (`+ /**/*.srm`, `+ /**/*.state*`) while `record.json` and PNGs fall through to `- /**`; #22 R6's refusal text really is stale against D-CLOUD-076; the delta really does contradict D-CLOUD-047's third sentence while listing it as unchanged. The mechanism reuses D-CLOUD-052's transport unchanged (no reopening), needs no coordination protocol, and its one piece of new local state (`in_store`) fails safe — a lost flag costs a redundant entry, not a lost version. The F1–F6 / R-a–R-g split is exactly the "safest if adopted as written" structure: a small load-bearing core, everything else explicitly following. H1–H10 are cheap, decisive VM experiments sequenced before the expensive building, matching D-QA-007/015/017.

### Where the others fall short, specifically

- **`gemini-revised_plan.md`** is a well-chosen amendment list, not a buildable plan: no migration procedure for the local set-aside cache, no pruning-race protections, no heal-loop handling, no README-truthfulness rule (V1 must not advertise #25), no audit coverage, no settings mechanics. Its one distinctive mechanism — amending D-CLOUD-046 to permit a bounded fetch per suspect unit on the exit path — spends download time on the one path D-CLOUD-098 measures, for a case claude covers from the capture stage without touching R5's push-only contract.
- **`gpt-revised_plan.md`** is the strongest loser and nearly tied on thoroughness, but it is more machinery for a weaker guarantee: two code paths (publish-retain plus fetch-backstop with a "continued protection must be established" witness condition that is subtle to implement correctly), a manifest-carried shared-policy revision system, and the stated loss residual. Its backend-dependent cost profile (1S–3S) is worst on the backends that need the store most.
- **`mistral-revised_plan.md`** keeps the 3S mechanism, and its mitigation — "retain and verify in the background after the card says the player may go" — collides with D-CLOUD-076 (a launch cancels the sync, stranding the publish the card implied was done) and D-CLOUD-077 (the outcome line would claim completion before verification). It lacks concurrent-pruner protections and its D-CLOUD-052 row restates the residual less precisely than gpt does.

---

## Dissent: what the losing plans have that the winner does not fully absorb

These must survive into the final synthesis.

**From `gpt-revised_plan.md`:**
1. **Reserve the latest deliberate conflict loser against routine count churn** (§5.2). Claude's per-file count protects a manual slot from *auto-state* churn, but repeated overwrites of the *same* file after a wizard decision can evict the wizard loser — D-CLOUD-032's stated primary use case. Not absorbed.
2. **Decided deletion vs. unexplained absence in only-copy protection** (§5.4). Claude's P2 makes the last entry of any file with no live head permanent — including REMOVE EVERYWHERE results, which become permanent cap-exempt copies. Gpt's refinement (decided deletions expire under ordinary policy; unexplained absences keep only-copy protection) is more correct and must refine claude's P2 and D-CLOUD-096's wording.
3. **Orphan process quiescence before launch** (§8.5, refining D-CLOUD-093). Lock release is not proof that orphaned writers ended; track and stop the process group before a game starts. Claude only separates entries by run-id.
4. **Two-pruner fallback** (§5.6, §10): if the pruning-safety properties cannot be proved on the two-pruner fixture, *disable destructive cleanup* for the affected entries and report the overrun. Claude has run-count grace but no explicit disable-fallback.
5. **Shared-policy authority via causal revisions** (§5.7): ON wins and the larger count wins on incomparable changes, but a later explicit edit supersedes — avoiding the eternal-maximum ratchet in claude's "largest declared count."
6. **Completion is a separate fact from retention** (§3.2): readers must distinguish a recoverable earlier copy, a copy retained before an *interrupted* operation, and debris. Claude's member-verification rule covers completeness but not the operation-outcome distinction.
7. **Legacy/unknown `reason` for migrated entries** (§3.1): a `-replaced/` stamp can contain sync-mode *deletions*; importing everything as `reason: replaced` fabricates an event. (Also in `mistral-revised_plan.md` §1.)
8. **Narrower auto-heal for nonzero uniform files at plausible full size** (§7) and **truthful recovery wording** ("looked incomplete," not "was damaged," per D-CLOUD-077). Claude heals all first-occurrence uniform files and keeps D-CLOUD-100's wording.
9. **Planner-level rejection of reserved paths** regardless of custom filter or hostile `--files-from` (§6.2), and the R1 census gate explicitly exercising MATCH with hostile inputs (§10). Claude guards by filter rule and H2; the planner-enforced boundary is stronger.
10. **Request-based cost accounting** (§8.2–8.3, `k + 4` requests, metadata and retries in the admission ceiling) and the **multipart S3 ETag ≠ MD5** caution (§8.4) — both should inform claude's H6 and H1.
11. **Idempotent import receipts** mapping source → verified destination for migration retry (§6.5 step 4).

**From `gemini-revised_plan.md`:**
12. **The rules-file upgrade hypothesis** (§5.2): whether `cloud_sync_helper` actually delivers the `- /.history/**` guard to devices with user-edited rules files on upgrade. If it does not, the standing fold is the *only* defense for those devices. Claude's H5 tests old-image behavior but does not name this specific upgrade-path audit.
13. **Bounded exit-path fetch for auto-heal as a fallback position** (§3.2) — claude explicitly rejects it in favor of full-pass fetches; the disagreement and its D-CLOUD-046/D-CLOUD-098 framing should be recorded for the maintainer, not silently dropped.

**From `mistral-revised_plan.md`:**
14. **Both-suspect and good-copy-unavailable cases named as wizard questions** (§7) — claude covers the cloud-head-suspect and stage-missing cases; mistral's enumeration is a useful checklist for the suspect fixtures.
15. **The auto-rule double-churn and wizard pre-pass retention disclosures** (§12) — claude absorbs both (§3.1, §6), so these are confirmations, but mistral's framing of the slot-4 overwrite as a store-churn source belongs in the H6 measurement plan.

---

## Remaining defects in the winner that must be fixed before building

1. **The digest-skip can skip into an unprotected entry.** Claude's retain path says "the entries upload is skipped when the listing shows the digest." But if the digest-visible entry is itself pruning-eligible, skipping the upload leaves the version protected only by an entry another device's pruner may delete — gpt's "continued protection must be established" condition applies to claude's skip too. Fix: skip only when the found entry is protected, or re-protect/refresh it.
2. **Wizard-loser eviction by same-file churn** (gpt dissent #1) — the per-file count alone does not preserve D-CLOUD-032's primary undo case. Absorb the deliberate-undo reservation into C1.
3. **P2 permanence for decided deletions** (gpt dissent #2) — absorb the decided-vs-unexplained split.
4. **The count ratchet** (gpt dissent #5) — "largest declared count" can never decrease; adopt a supersede rule.
5. **Migration misclassifies sync-mode deletions** (gpt/mistral dissent #7) — add the `legacy`/`unknown` reason before the fold writes anything.
6. **The #21 stage-lifetime dependency is unverified.** Heal-from-stage (F4) and lazy retain-from-stage both rest on an amendment to a document outside the corpus (claude's own G1/H7). If #21's stage does not keep the agreed version until superseded, the exit-path retain and heal costs change shape. This must be settled before F4 is treated as foundation — claude flags it honestly, but it is the plan's single largest unverified load-bearing assumption.
7. **Orphan quiescence before launch** (gpt dissent #3) should be absorbed as a D-CLOUD-093 refinement alongside claude's run-id separation.

None of these defects loses a save as the plan is written (the worst, #1, requires a specific prune-skip race and is fixable in one rule); they are amendments, not re-architecture. That is precisely why `claude-revised_plan.md` earns the vote: the strongest safety invariant on the table, the simplest uniform mechanism, honest accounting of what it does not know, and a foundation small enough to build first.

### `mistral_vote.md`

I vote for **kimi-revised_plan.md**.

## Reasoning

### Strengths of kimi's plan

1. **Protects player progress.** It closes the concurrent-publisher race with retain-on-fetch-when-absent-from-store, a minimal backstop that costs only one small upload in the rare race. It keeps the newest deliberate conflict loser against routine count churn, preserving D-CLOUD-032's "one step back" use case. It stages and verifies a restore candidate before touching any live file, so a pruning race leaves the current save unchanged. It migrates both legacy set-asides with copy–verify–record–verify–remove, never move-first. These are the load-bearing safeguards the commission's Q1 asks for, and kimi's plan is the only one that states each of them explicitly as a rule.

2. **Grounded in the corpus.** It names every register row it refines by ID, cites the exact text it amends, and marks every unmeasured hypothesis with the experiment that settles it. The TOCTOU race is not hand-waved; it is reproduced from `gpt-analysis.md` and closed with a mechanism whose cost is named. The clock hazard is not dismissed; it is gated by `clock_synced` and ordered by publication chain, not time. The standing fold is not claimed as a no-loss guarantee; the residual is stated plainly.

3. **Implementable on a busybox handheld.** The exit path adds one spawn and one upload on hashed backends, deferring as a pair when the admission ceiling counts retain bytes. The heal fetch is bounded and cancellable, riding the exit card where D-CLOUD-098 permits spending the player's attention. Pruning runs on full passes only, never on the exit path. The count scope is settled with #21's unit table, not a new census. No SQLite index, no distributed lease, no conditional-put transport.

4. **Sequences the work.** The experiments are cheap and decisive: dot-component matching (E1), `--delete-excluded` audit (E2), backend capabilities (E3), concurrent publishers (E4), orphan rename (E5), count scope (E6), capture walker (E7), and time-to-play (E8). The first four are VM-only and can run before any code is written.

5. **Honest about what it does not know.** Corpus gaps are surfaced: the full scripts, MATCH's call path, #21's unit table, the manifest schema, `cloud_sync_helper`'s handling of user-edited rules files. The maintainer's questions on bounds priority and decided-deletion aging are flagged as semantics confirmations, not reopenings.

### Where the others fall short

- **claude-revised_plan.md** proposes store-first with escrow on every publish. It closes the race, but at a cost the corpus does not justify: one extra spawn and one extra upload of the changed bytes on *every* backend, including SFTP and SMB where it streams through the device. The exit path is the one D-CLOUD-098 measures, and the plan does not prove the added latency fits the budget. It also leans on unproven backend capabilities (server-side copy, modtime preservation) and a manifest field (`replaces`) whose semantics are a corpus gap. The count scope is settled only after #21's unit table is read, but the plan does not flag that as a prerequisite.

- **gemini-revised_plan.md** proposes retain-before-install on fetch, which is the right backstop, but it does not name the cost or sequence the experiments. It leans on pub-chain ordering without proving the manifest carries the field, and it does not state the migration procedure for both legacy set-asides. The standing fold is not path-aware, so it cannot repair history members moved into `-replaced/`. The count scope is not settled with #21's unit table, leaving auto-state churn unprotected.

- **gpt-revised_plan.md** proposes the same backstop, but it overclaims closure: it does not state the residual that `HA` is unrecoverable from the cloud alone in the window between B's overwrite and A's next sync. It also proposes a shared-cloud policy carried through manifests, which is workable but not the cheapest sufficient form (D-CLOUD-034) — a fleet-max count is simpler and meets the same safety bar. The migration procedure is not stated as copy–verify–record–verify–remove, so it risks move-first. The count scope is not settled with #21's unit table, leaving the maintainer's headline case unprotected.

### Dissent from the losing plans

- **claude's store-first escrow** is a stronger alternative if the requirement is cloud-only recoverability immediately after every acknowledged publication. It is not the cheapest sufficient form for the exit path, and it does not prove the added latency fits the budget.
- **gpt's shared-cloud policy** is a workable refinement for fleet-wide consistency, but it is not the cheapest sufficient form. kimi's fleet-max count meets the same safety bar with one field and a `max()`.
- **gemini's pub-chain ordering** is the right way to order versions, but it depends on a manifest field whose semantics are a corpus gap. kimi's fallback to record time marked untrusted is the safe default.
- **gpt's staging-and-verify for restores** is the right safeguard, and kimi adopts it.
- **claude's and kimi's count-per-(unit, member path)** is the only scope that protects the manual slot from auto-state churn. The others leave the maintainer's headline case unprotected.

### Remaining defect in kimi's plan

The standing fold's residual — two consecutive old-image `sync`-mode runs with no new-image pass between can destroy a stamp — must be mitigated by the release order: ship the exclusion rule one image ahead of the store, and retire old images as soon as the fleet window closes. This is not a design flaw; it is a rollout gap the orchestrator must close.

## Summary

kimi's plan is the safest and most buildable. It closes the data-loss windows with minimal cost, grounds every claim in the corpus, sequences the work so the cheap experiments run first, and is honest about what it does not know. The others either overclaim closure, overpromise latency, or leave the maintainer's headline case unprotected.
