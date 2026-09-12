# Applied tracker text -- reviewer's summary

Prepared 2026-09-12 from `final-issue-draft.md` (the council's Step 5 handoff) as **overridden by
`docs/save-history-consensus-amendment.md`** wherever the two differ. Nothing here has been
written to GitHub by this pass: these are bodies ready to paste. The two children were opened
as **#136** (the guard image) and **#137** (the fold) while this pass was running, and their
numbers are substituted throughout in place of the `#<child-A>` / `#<child-B>` placeholders.

Files:

| File | Is |
| --- | --- |
| `134.md` | the full new body of the epic |
| `22.md`, `23.md`, `25.md`, `21.md`, `135.md` | full new bodies, amendments applied row by row |
| `child-A.md`, `child-B.md` | new children; first line is the proposed title |
| `CHANGES.md` | this file |

**Proposed new title for #134** (the draft's, with the mechanism corrected by the amendment;
the body file carries no title line): *Save history: one home for the earlier versions of a
player's saves -- `Saves/.history/`, hidden, declared, retain-only*. The current title still
says "replaced and discarded saves", which the reason set no longer matches.

## What changed, by file

### `134.md` (epic)

Rewritten whole. Sections: context paragraph; *How this was decided* (D-CLOUD-094's list, the
five existing ticks kept verbatim, (6) ticked because the council ran and was amended); *The
design, on one screen* (home; the retain-only invariant; retain from the stage; the
transaction; where it runs; bounds and their priority; one fleet setting; suspect and the
heal; no lock and what serial play gives the wizard; save states); *Build order* (11 steps
mapped to #21, #22, #23, #25, #136, #137); *Ordered experiments* (E1-E15, venue
and what each unblocks); *Time to play as a gate*; *Decisions that bind*; *Decisions still the
maintainer's* (P-1, P-2, P-3, P-6, P-10, P-11, P-12, P-13 open, one line each; P-4/7/8/9 under
discretion; P-5 withdrawn; P-14 decided); *Acceptance criteria* (ten observable items, each
with its venue).
Register IDs relied on: D-CLOUD-014, 027, 030, 032, 033, 034, 036, 037, 038, 041, 045, 046,
047, 052, 053, 074, 075, 076, 077, 078, 083, 088, 093, 094, 095, 096, 097, 098, 099, 100, 101,
102, 103, 104; D-NET-001; D-UI-022, 023, 039; D-QA-007, 015, 017.

### `22.md` (the reconciler)

- **Preamble** -- retention is `<SAVES_REMOTE>/.history/`, written for every writer under the
  retain-only invariant; the no-lock and serial-play assumption added. D-CLOUD-095, 102, 103.
- **R1** -- MATCH THIS DEVICE TO THE CLOUD added to the enumerated writers; every deletion is a
  `deleted` entry first; `--backup-dir` passed by nothing. D-CLOUD-095.
- **R2** -- `- /.history/**` and `- /README.md` first in the allowlist; store transfers carry no
  allowlist; reserved paths rejected on the list, not by a filter file; `--delete-excluded`
  never passed; `.snapshots` guard dropped. D-CLOUD-088 (P-8), D-CLOUD-052.
- **R4** -- suspect class and its questions; the publish row retains from the stage; the fetch
  row retains nothing; the deletion row copies into the store first; mass absence judged on live
  save units; the divergent row names the missed sync; the ancestry test is **not** built.
  D-CLOUD-030, 037, 047, 075, 095, 100, 102, 103.
- **R5** -- rewritten as a seven-step ordering: evidence and witness, retain from the stage,
  verify, `pending-publish.json -> retained`, head write, correspondence, agreement; pair
  deferral; one bounded suspect fetch as the only download; budget of one more spawn and one
  more upload than a no-history exit. D-CLOUD-028, 046 (P-6), 074, 076, 078.
- **R6** -- an automatic pass is cancelled by a launch (not refused); manual sync still refuses;
  process-group marker and quiescence. D-CLOUD-038, 053, 076, 093 (P-9).
- **R7** -- witness before any store write; a context change means no head is overwritten on the
  strength of a stage copy from the old context. D-CLOUD-040.
- **R9** -- replaced wholesale: layout, `record.json`, invariants I1-I8, rules, the wizard's
  apply, the OFF behaviour, local transaction state. D-CLOUD-095, 096, 099, 100, 041 (P-3), 045.
- **R10** -- 75/69 sentinels, `SKIPPED - A GAME WAS STARTED`, `suspect-unhealed` under 6.
  D-CLOUD-074, 076.
- **Inventory** -- two `--backup-dir` rows added, pointing at #137.
- **Negative scope** -- no coordination protocol in the cloud; no redundant preimages; no
  permanent local history; no ancestry test.
- **Acceptance** -- venues named on every item; A3, A6, A9, A10, A11 amended; Floor, hand-off
  (E5'), pruner and two-pruner regression cells, count scope, decided deletion, bytes, cache
  clear, heal, orphan quiescence, store shape and delete-excluded added.

### `23.md` (the wizard)

- **Preamble and walkthrough** -- serial play as an assumption the page may use; columns as the
  source has them; one line under each column saying which session was later, by publish
  sequence, naming the console the player named (D-NET-001); the page opens with the cursor on
  the newer version. D-CLOUD-041, 103, 104, 032; D-NET-001.
- **The apply step** -- new bullet: every decision applies through the reconciler with the
  displaced version in the store first; KEEP RIGHT by server-side copy plus verification, never
  a move; no entry for the winner. D-CLOUD-095, 027, 041 (P-3).
- **Retention settings** -- replaced: one verb-bearing row under SAVE MANAGEMENT opening a page
  with two rows, both showing the effective fleet value; dialogs carry the explanation and the
  measured price. D-UI-023, 039; D-CLOUD-032, 036, 096, 098 (P-1, P-11).
- **Acceptance** -- A4 rewritten; missed-sync, fleet-setting, dialog and menu-map items added;
  venues named.

### `25.md` (the reader)

- **Preamble and Shape** -- one store, labelled by `reason`; the `-replaced/` "labelled
  separately" clause and the `.snapshots` clause removed; a restore is a publication that
  retains first and leaves the current save alone if its pick was pruned. D-CLOUD-033, 035,
  077, 095, 100.
- **The label table** -- `published` removed; five reasons remain.
- **Acceptance** -- A5 extended (cache clear on the reader, pruning on the writer); venues named.

### `21.md` (capture)

- **R3** -- `history_keep {on, count, rev}` added at top level; `store_seq` withdrawn.
  D-CLOUD-045.
- **Two new requirements** -- the stage keeps the last agreed version of every save until a newer
  one is agreed (it is now the source of every retained copy); the walker never claims
  `.history/`, `README.md` or the manifests folder. D-CLOUD-078, 095, 100, 102.
- **Acceptance** -- two items added; **all five existing `- [x]` ticks kept exactly as they were**.

### `135.md` (time to play)

- **New section** -- the `time-to-play` cell as #134's E12 needs it: two arms (no history,
  retain-from-stage) plus the one-time `legacy` retain measured once; latency distribution,
  completion rate, startup-sync duration. D-CLOUD-076, 098.
- **Acceptance** -- the four existing items kept (venues added) and four added, including the
  budget row (P-13) and the ON dialog's measured number.

### `child-A.md` (the guard image) and `child-B.md` (the fold)

New bodies from the draft, with titles on the first line, venues on every acceptance item, and
child B carrying copy-verify-retire, the honest `legacy` classification (`legacy_event:
unknown`, `time_trusted: false`), no question to the player, the mixed-version boundary with
P-12 narrowed, and both folders -- cloud `Saves-replaced/` and device
`/storage/.cache/cloud_sync/replaced/`. D-CLOUD-014, 042, 088, 095, 097, 101, 102; D-QA-007,
015, 017.

## Where the draft and the amendment disagreed

The amendment was followed every time.

| # | Draft | Amendment (followed) | Where it lands |
| --- | --- | --- | --- |
| 1 | Store-first in two halves: escrow every publication, and retain any head not in the store | **Retain only** -- nothing leaves the cloud's current save unless that version is already an entry; no publication writes an entry of its own | 134 design; 22 preamble, R4, R5, R9 I1; 23 apply; 25 labels |
| 2 | Retain the head cloud-to-cloud, server-side where possible | **Retain from the console's capture stage** (+1 spawn, +S up, no download); cloud-to-cloud survives only for the one-time `legacy` retain at cutover and for the wizard's cloud loser | 134 design; 22 R4/R5/R9; 21 stage requirement |
| 3 | `in_store` / `store_seq` per entry (P-5), lazy `.history/` listings, a manifest rev 3 field | **Dropped; P-5 withdrawn.** The retain runs whenever a head is about to be replaced and the stage holds it; dedupe makes a repeat harmless | 21 R3; 22 R4/R5/R7/R9 and the cache-clear item; 134 P-5 |
| 4 | `reason` set includes `published` | **`published` removed** -- entries are displaced versions only (`replaced`, `discarded`, `deleted`, `suspect`, `legacy`) | 22 R9; 25 table; 23 apply; 134 design |
| 5 | Ancestry test (F14) as an optional reclassification; the "Race" acceptance item | **Dropped** -- there is no disguised race under serial use | 22 R4, negative scope, acceptance; 134 design and E5' |
| 6 | E5 two devices through the barrier schedule; E6 concurrent pruners as a gate | **E5' the hand-off plus the missed-sync variant; E6 a regression cell** | 134 experiments; 22 acceptance |
| 7 | Wizard unchanged beyond the store-first apply | **Columns as the source has them, a later/earlier line under each by publish sequence, cursor opens on the newer version** (D-CLOUD-104), KEEP BOTH first-class | 23 walkthrough and acceptance; 134 design |
| 8 | Cost ledger: +2 spawns and +S up (hashed), +3 and +S down (hashless); exit spawns 5-6 / 6-7 | **+1 spawn and +S up on every backend, no download, no hashless re-fetch for the retained copy** | 22 R5; 134 time-to-play; 135 |
| 9 | P-12's residual stated over the whole store | **Narrowed** -- the exposed material is the displaced versions the store holds and the one-time `legacy` retain at cutover | child B; 134 P-12 |
| 10 | #135 runs three arms, the third being store-first | **Two arms**, plus the one-time `legacy` retain measured once so a cutover cost is not priced per exit | 135 |
| 11 | `unverified-escrow` added to R10's reasons | **Not added**; the existing `unverified-retention` covers a retained entry that will not verify | 22 R5, R10 |

## Judgement calls, flagged

1. **The console names in the wizard's later/earlier line.** The amendment first cited
   `D-CLOUD-106`, which does not exist in `docs/decision-register.md`; it was corrected to
   **D-NET-001** (the device name is the player's, stored as typed) while this pass was running,
   and #23 and #134 now cite that row. The line reads *PLAYED LATER ON <DEVICE NAME>* / *PLAYED
   EARLIER ON <DEVICE NAME>*, and #23 says its exact words are a proposal like P-11's labels.
2. **The one-way fetch has no preimage, and the amendment does not say so.** With `store_seq`
   gone I applied the invariant: the local copy a fetch overwrites is this device's agreed
   version, which is exactly the version the console that published the new head displaced and
   retained from its own stage. #22 R4's fetch row and the negative scope say that, and point
   the pre-cutover case at the one-time `legacy` retain and #137's fold. **This is my
   derivation, not the amendment's text.**
3. **A context change and a cache clear.** The draft handled both with `store_seq` lookups and a
   `.history/` listing. Without that field I used the mechanism #22 R7/A3 already has: a record
   whose context does not match is absent, so differing pairs queue and no head is overwritten
   on the strength of a stage copy the device cannot vouch for. Acceptance items A3 and "Cache
   clear" are rewritten accordingly. **Also a derivation.**
4. **The spawn numbers.** The amendment gives "+1 spawn and +S up"; the current #22 R5 says a
   changed exit spawns 3-4 on hashed backends. I wrote 4-5 and labelled it arithmetic pending
   Gate 4 and E12, rather than carrying the draft's 5-6/6-7 (which priced the escrow).
5. **One `### Changed 2026-09-12` section per issue**, at the end, one line per amended part --
   rather than a section after every row, which would repeat the same heading eight times in
   #22. Each line cites the register IDs.
6. **ASCII transliteration.** Every file is ASCII, as asked. Text kept from current bodies is
   verbatim in wording, but its punctuation is transliterated: em dash to `--`, en dash to `-`,
   the not-equals sign to `!=`, the right arrow to `->`, the middle dot to `-`, the multiplication
   sign to `x`, the section sign to the word "section", and curly quotes to straight ones.
   Nothing else in an unchanged sentence was touched.
7. **`af2db4ab09`** (the shipped image E1 tests against) is carried from the draft. It was not
   verified against the build record in this session.
8. **The draft's "Document edits" list (10 items) and its register-row table are not reproduced
   in any issue body** -- they are instructions to whoever applies the change, not issue text.
   #134's last acceptance item is the documentation gate; the list itself stays in
   `final-issue-draft.md`, and P-1..P-14 live in #134's *Decisions still the maintainer's* and
   in D-CLOUD-101.
9. **Milestones and labels are untouched** -- these files are bodies only. #134 carries no
   milestone; #21/#22/#23/#25 carry *Cloud Saves: Visual Conflict Resolution*; #136 and #137
   were opened with `cloud-saves` and are already attached as sub-issues of #134
   (`.claude/rules/issue-tracking.md`). Whether the two children and #134 should also carry the
   milestone is the maintainer's call.

## Unresolved, and who resolves it

- The eight open proposals (P-1, P-2, P-3, P-6, P-10, P-11, P-12, P-13) and the confirmation of
  P-4/P-7/P-8/P-9 -- the maintainer, as #134's checklist.
- The `N seconds` in #23's ON dialog and P-13's budget row -- E12, on the VM pair.
- The exact words of the two later/earlier lines, item 1 above (a proposal, like P-11's labels).
- Corpus gaps the draft declared and this pass did not close, because the files were not in the
  council's corpus: the full `cloud_backup` / `cloud_restore` / `cloud_sync_helper` / layout
  migrator / MATCH scripts (child A's audit task), the launch-time check in the live
  `FileData.cpp` (#22 R6), `docs/save-manifest-schema.md`'s existing `pub`/`replaces` shape
  (#21 R3), and `docs/conflict-wizard-ia.md` rev 5 (named, not drafted).
