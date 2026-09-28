# Research Notes — the whole fix round for #307/#308 (D-WORKFLOW-060)

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1; the seats through the council Facilitator)
**Date:** 2026-09-28
**Subject:** the eight fix streams' first deliveries and follow-ups, as they stand on the tree the candidate is cut from
**Spec:** #307 (81 punch items, each with its acceptance text), #308 (297 sweep rows), the fix audit's 165 findings with the streams' claimed answers, the register rows the round made

---

## Running Notes

### 1.1 The spec

- **#307** (`docs/audits/2026_09_25-milestone-rc-round-since-258/05-punch-list.md`, mirrored in the issue's 81 checkboxes): each item carries an acceptance line -- most name a harness case (`tools/last-good-scripts-test`), an ES unit case, a frame at 640x480, or a journal line. The acceptance text is the criterion the seats re-derive against; the ticks the issue carries (2026-09-28, by this session) are tracker state and not evidence here.
- **#308**: 297 rows in twelve packets by area; every row carries a verdict cell filled by the streams (fixed with a commit, withdrawn with a reason, a duplicate, moved to #307, or carried to #309). The rows are the second criterion set; the seats spot-check them against the diff as before, with the carried rows excluded.
- **The fix audit's findings** (`docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/02-forward-audit.md` § Findings index, 165 rows): each row's "what" is the seat's claim and its last column the stream's own outcome (fixed `<commit>` / withdrawn: reason / evidence added). For this audit the findings are the *spec of the follow-up work*: a seat is asked whether the stream's answer is sound, from the diff. The prior seats' per-item verdicts on the punch items (holds / in part / does not hold) are **sequestered** and not in the packets.
- **The register rows of the round** (33 dated 2026-09-28): D-QA-053, D-WORKFLOW-054..060, D-UI-110..115, D-RA-039..043, D-CLOUD-141..148, D-INFRA-012..014, D-NET-012/013 (open), D-QA-054, D-UI-111 (open). Where a stream's fix rests on a row (the plan file, the settings lock, the last-good records, the root-level exception, the rotation record's claim), the row is the design the seat judges against.
- Under-specified: the sweep rows' acceptance is implicit (the row's title); several punch items' acceptance names a device fact the VM cannot have (PL-018's pad, PL-032's panel); the follow-ups have no acceptance text of their own beyond the finding they answer.

### 1.2 The issues

| Issue | State | What it is |
| --- | --- | --- |
| #307 | closed by the maintainer 06:04 UTC; ticked by the session afterwards (79 ticked, 2 struck) | the punch list |
| #308 | closed completed by the session (every packet ticked) | the sweep |
| #309 | open, 14 checkboxes | the fix audit's six carried items and the eight sweep rows no stream answered (PL-006 pulled forward into this audit) |
| #310 | open | the launch/exit cycle's 10 MiB of address space a game, found by the VM proving PL-069 |
| #236 | open | the round; carries the results of the VM's read of `1b0d233657` |

A closed issue is not evidence of anything here (Evidence floor rule 1); #307's ticks are this session's own and are re-derived, not trusted.

### 1.3 Git history

- Distribution `417dcd8610..1b0d233657`: 309 commits, 264 files, +60754 / -4228. Six stream branches merged twice each (first delivery, then the follow-up), in the order F1, F2, C, D, B, A (01:11 to 05:58 UTC); B's follow-up rebased onto the rewritten history (the maintainer's `filter-branch` over `9b7bdf8da1..next` replaced the literal credential fixtures, 199 commits, trees identical). The integrator's own 46 first-parent commits: 41 under `docs/`, and five that touch the product or the harness -- `6f9d43a467` (rocknix's recipe: the updater copied only where a device ships one), `4e858bebe8`/`79bcaf55a6`/`1b0d233657` (the ES pin), `b31bf53771` (the harness's run-time fixtures), `9e104c65f3`/`04b5f66d92`/`380cbf7dc4` (the hooks), `78f147f762`/`1edb7f5d73` (vm-qa's launch, the rotation fixture, the claims), `59135a1dd7` (the lint). Their combined non-docs diff is 35 KB: packet **I**.
- Per stream, the whole-branch diff from the base (D-WORKFLOW-058): A 338 KB (13 files), B 242 KB (10), C 175 KB (8), D 234 KB (13), F1 182 KB (40, mostly deletions: the retired quirks), F2 150 KB (31). The merged harness `tools/last-good-scripts-test` is the sum of every block plus the integrator's fixture commit; each branch's diff carries its own block.
- EmulationStation `7eae8ed91..87b182fbe`: 113 commits, 119 files, +9383 / -894. One branch, two streams interleaved (E1 core, E2 application) plus the integrator's two why sentences. Split by path for the seats: **E-src** (es-core, es-app/src, the locale) and **E-tests** (es-app/tests, tests/, .githooks).
- Surprising: the harness grew from 384 to 844+ checks in one night (the streams' blocks); F1's diff is net -1400 lines (twenty GENERIC_X64 quirk scripts retired); the ES tests gained a `_WIN32` build and six new suites.

### 1.4 Documentation and constraints

Rules whose globs match the changed paths, read from `next`: `packaging-and-patches.md` (every recipe), `rclone-cloud-sync.md` (A, C and B's scripts), `generic-x64-vm-testing.md` (F1, vm-qa), `handheld-evidence.md` (the rocknix package), `change-log.md` (the change log carries the round's entry); the always-on set (`engineering-practices.md` -- § Guards must fail closed, § Verify the artifact, § A name is not a behaviour, § Nothing runs on a person's device; `upgrade-and-install.md` -- the Already-written answer on every fix, D-WORKFLOW-050; `es-player-text.md`, `es-native-ui.md`, `es-code-traps.md`, `es-ui-style-guide.md` for the ES streams; `least-surprise.md`, `player-language.md`, `time-to-play.md`). The blindspot register's 67 entries, with 66 (a verification pass keyed by finding number) and 67 (a credential fixture in history) added by this round. The project invariants: player progress above recency; no secrets in backups; the sync filter is an allowlist; every change lands on devices with state.

### 1.5 Prior-audit provenance map (no verdicts transcribed)

| Scope | Who audited | When | Depth | Trust signal |
| --- | --- | --- | --- | --- |
| The punch list's origin | two seats over ten buckets of the whole feature drop (`2026_09_25-milestone-rc-round-since-258`) | 09-27/28 | 409 findings, ~100 verified by the orchestrator | thorough; produced the 81 items and 297 rows this round worked |
| The streams' first deliveries | two seats per stream, packets by the streams' named files (`2026_09_28-milestone-audit-of-the-fixes-307`) | 09-28 04:25-04:47 | 165 findings; every Critical/High re-read by the orchestrator | thorough on what the packets held; **two packet gaps** (D's `cheevos_armsx2.sh`, F2's gstreamer/ryzenadj/dmidecode/zip hunks) reached no seat; branches had moved (D, E2, F1 follow-ups landed before the packets were read) |
| The follow-ups (~110 commits) | the orchestrator's read of each FAIL-then-PASS line and diff; no seat (D-WORKFLOW-059, now superseded) | 09-28 05:0x-06:04 | one reader | **thin -- the reason this audit runs**; the destructive-operation, credential and lifetime follow-ups (A's migration, B's backuptool, E2's capture gate and journey record) first |
| The integrator's own product and harness commits | none | -- | none | **uncovered until now** (packet I) |
| The VM | vm-qa runs 68 and 69, proof-298, the streams' named proofs (run 1 on `4234be0b6b`: 27 PASS, 2 FAIL; run 2 on `1b0d233657`: 32 PASS, 1 FAIL, 4 cannot run, 3 no script) | 09-28 | mechanical | strong where a proof exists; several passes on named stand-ins (kept as partial); no device fact |
| The second opinion on the fix audit | the GPT seat over the analysis documents | 09-28 06:19-06:33 | document-level | its conditions (revision-specific proofs, the lifetime bound, the accepted-risk ledger) met in the revised analysis |

Where extra adversarial effort goes in Phase 2: the follow-up commits of A (the migration's check and the pointer, `conf_valid`'s grammar, the filter file, the planless apply), B (the seven fail-closed guards, the credential scan, the mount-table revert, the last-good records), C (the attempt id and file lock, the config reader), D (the cursor, the ready rule, the listener check), E2 (the capture gate's refusal, the journey record, the rotation claim, the transfer page's stamps, the save-state deletion's lock), E1 (the cut live file, the reap guard, the picker's reload); the integrator's packet; the seams the fix audit named (D's files touched by F2, the shared harness, the ES join's return type).

Tier B: none in this repo; the walks' frame-diff (claims file) and the proof frames are the visual evidence, referenced in Phase 2.

### 1.6 Research Summary

- **What was planned:** the punch list's 81 items and the sweep's 297 rows, fixed by eight streams from written plans (D-WORKFLOW-054/055/056), then the fix audit's 165 findings answered (D-WORKFLOW-057), then the candidate cut (D-WORKFLOW-047).
- **What issues exist:** #307, #308 closed; #309 (14) and #310 open; #236 the round.
- **What code was changed:** the cloud scripts (A), backuptool and the rocknix scripts (B), the sign-in broker and cloud setup (C), the offline-achievements proxy and its ctl (D), EmulationStation core (E1) and application (E2), GENERIC_X64's quirks and the VM tool (F1), the packages and RetroArch's patches (F2), plus the harness, the hooks, vm-qa and two recipes (the integrator).
- **What constraints apply:** the rules and invariants in 1.4; every fix's Already-written answer; the outcome vocabulary for every word a player reads; the four tiers and two verbs.
- **Red flags for Phase 2:** (1) the follow-ups had one reader; (2) the packet gaps of the first audit; (3) the integrator's commits had none; (4) the harness's merged file was reconciled by hand twice (kept-both conflicts); (5) B's rebase onto rewritten history (the range is clean of credential shapes -- checked -- but the replayed commits' content is what the seat should read, not the report); (6) proofs on stand-ins; (7) the maintainer closed #307 and #308 before the VM's read, so tracker state ran ahead of evidence for an hour.
