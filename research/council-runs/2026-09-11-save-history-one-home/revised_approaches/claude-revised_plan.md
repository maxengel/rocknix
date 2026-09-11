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