# Analysis — the fixes for #307/#308, audited (D-WORKFLOW-057)

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1; the seats through the council Facilitator, D-WORKFLOW-049)
**Date:** 2026-09-28 (opened 05:40 UTC; the executive summary and the scorecard are written when the streams' follow-ups are in)
**Subject:** the eight fix streams' work against the punch list (#307, 81 items) and the sweep (#308, 297 rows), built as `4234be0b6b`
**Spec:** `docs/audits/2026_09_25-milestone-rc-round-since-258/05-punch-list.md`; the streams' briefs and reports; the register rows they cite

---

## Executive summary

**The fixes hold, and the audit of them found what a second reading finds: guards that still failed open, checks that matched a substring, a fix that cost the player their place.** Two seats read eight packets and returned 165 findings (Critical 1, High 15, Medium 70, Low 79). Every one was answered by its stream the same morning -- 124 fixed and 9 fixed in part, each with a harness or unit case seen to fail first; 28 withdrawn with the line that refutes them (six with a guard committed anyway); 4 answered with evidence added -- and the follow-ups (about 110 commits across the eight branches) are merged into `next` (`688b9944aa`) and the EmulationStation branch (`87b182fbe`), the whole scripts harness passing after each merge, and built as `1b0d233657`.

The one Critical (G-E1-01, the Wi-Fi join's result inverted) was already fixed by another stream before the packet was read; it does not stand. Of the fifteen Highs, thirteen stood and are fixed (the four in the cloud migration and the root-level backup, the seven fail-open guards in `backuptool` and its neighbours, the last-good records, the tier collision), and two were packet gaps -- hunks outside the streams' named files that reached no seat and were read by the orchestrator alone (D-WORKFLOW-058). The build's own QA found three more the seats could not: a harness launched with SIGINT ignored (the runner's, fixed), a player's own filter file refused and a planless apply blamed on a change that never happened (stream A's contract, fixed), and the reopened CLOUD hub losing the player's place after a folder change (E2, fixed). Of the 81 punch items, 79 are fixed, one is partial on a font decision the maintainer holds (PL-032, D-UI-111), and one belongs to the PR-prep pass (PL-081); the seats' per-item verdicts hold or hold in part on all of them, none contested.

What the round leaves: six items carried to the next one on #309, none blocking (a card's lifetime, a migration's resume, the picker's SSID column, a null count's word, three sign-in notes, and a seat pass over the follow-ups themselves, D-WORKFLOW-059); four sets of proposed player words for the maintainer (D-UI-112, D-UI-115, B's list, C's page note); and the VM proofs the streams named, running on guest d against the first cut (`proofs-307.md`, one FAIL so far, which is the one-card revert B had already found and fixed in its follow-up) and re-run on `1b0d233657` before the Phase 7 ticks land on #307 and #308. The candidate is cut from `1b0d233657` only after that run.

## Acceptance-criteria scorecard

Built from the streams' reports, the seats' item verdicts and the proofs checklist (an agent's extraction, five rows re-read against the reports by the orchestrator: PL-001, PL-020, PL-045, PL-061, PL-076 -- all as the reports say). **79 of 81 fixed by their streams, PL-032 partial (the code and the patch stack fixed; the frame half waits on D-UI-111, the M+ 1p face), PL-081 in no report (the PR-prep pass, #256).** The seats: claude 66 holds / 12 holds in part / 3 no verdict (per item); gpt 41 holds / 38 holds in part / 1 other / 1 no verdict; no punch item drew "does not hold" or "cannot tell" from either seat. "fu" in the commits column is a follow-up commit tied to the item by the report's own text or by a seat's finding against it. The last column names the VM proof the checklist carries; a proof's PASS lands as the Phase 7 tick on #307, not here. The VM half: `proofs-307.md` and vm-qa run 69 on `1b0d233657`.

| item | severity | stream | outcome | commits | claude seat | gpt seat | proof named (VM) |
|---|---|---|---|---|---|---|---|
| PL-001 | Critical | A | fixed | aead63cee5 | holds | holds | A integrator [ ] (MATCH walk, preview -> YES) |
| PL-002 | High | F2 | fixed | 8e874f87c5, 65bd183950 | holds | holds in part | - |
| PL-003 | High | B | fixed | fb45fc4289 | holds | holds | B guest [ ] |
| PL-004 | High | B | fixed | b3fa5a156c | holds | holds | - |
| PL-005 | High | B | fixed | 1506c976b3; fu a7163034df (gpt G-B-03) | holds | holds in part | chain (cloud-round-trip) |
| PL-006 | High | B | fixed | f3b280ac5b; fu 97db4608d4 (claude G-B-01) | holds in part | holds | B fu2 [ ] (97db4608d4) |
| PL-007 | High | B | fixed | 17c994e644; fu 34c7eac1ef (gpt G-B-01/02), 59f0fbf0bc (gpt G-B-05/08) | holds | holds in part | B guest [ ] (KILL18 + reboot) |
| PL-008 | High | B | fixed | baed981ad4; fu 316bb02e5d (gpt G-B-04) | holds | holds in part | - |
| PL-009 | High | B | fixed | 9c0e7c0ab1; fu 34c7eac1ef (gpt G-B-01/02) | holds | holds in part | - |
| PL-010 | High | B | fixed | d57cdc65df | holds | holds | - |
| PL-011 | High | B | fixed | 174f6126f9 | holds | holds | - |
| PL-012 | High | A | fixed | 7a8b6cdcd9, 9f564e1733 (the sibling row: BIOS alone under `--selected`); fu 1fa2a26a16 (gpt G-A-07 = claude G-A-03) | holds | holds in part | A integrator [ ] (round-trip `--all`/BIOS step) |
| PL-013 | High | D | fixed | 146d7f01ed, 511aab7aa6 (bounds); fu c723147a01 (claude G-D-03) | holds in part | holds in part | D guest [ ] (CANCEL frames) |
| PL-014 | High | E2 | fixed | 9b7b1d3a2 | holds in part | holds in part | E2 guest [ ] (rescan soak) |
| PL-015 | High | C + A (script half, the coordinator's row) | fixed (both halves) | C: a96cd98f8d, 384d1a14e9; fu 8b5655a4dc (gpt G-C-01). A: 0a1472852a | A: holds; C: holds | A: holds; C: holds in part | A integrator [ ] (`CONTENT_REMOTE=""` for `/GAMES`) |
| PL-016 | High | C | fixed | 077920c4d7 | holds | holds in part | C guest [ ] |
| PL-017 | High | C | fixed | c087fe179e | holds | holds | C guest [ ] |
| PL-018 | High | C | fixed in code ("resolved in code. The acceptance's device fact is open.") | 2c3fe042e8 | holds | holds in part | C/PL-018 [ ] |
| PL-019 | High | F1 | fixed | 24ceb9e15a; fu 16ae2219ca (gpt G-F1-09) | holds in part | holds in part | F1 reads [x]; chain (retired quirk files, F1's seeds) |
| PL-020 | High | A | fixed | 0451642fc6; fu 72ea073ca8 (vm-qa run 68: the catch-all test applied to the managed rules file only) | holds | holds | A fu2 [ ] (the player's own `--filter-from` step) |
| PL-021 | High | A | fixed | 734665a9e0 | holds | holds | - |
| PL-022 | High | F1 | fixed | b19fb29733 | holds | holds in part | - |
| PL-023 | High | F1 | fixed | 08fdaffe55 | holds | holds in part | F1 reads [x] (ConditionResult=yes) |
| PL-024 | High | E1 | fixed | 944193685; fu 800c818d3 (gpt G-E1-03) | holds | holds in part | E1 guest [ ]; E1 fu [ ] (G-E1-03) |
| PL-025 | High | A | fixed | c77a26d57f | holds | holds | - |
| PL-026 | High | A | fixed | f9e801ac74; fu 79c2f15725 (gpt G-A-02) | holds | holds in part | A fu2 [ ] (a pointer that did not land stops it) |
| PL-027 | High | A | fixed | 7d684b868b | holds | holds | - |
| PL-028 | High | A | fixed | 8053ee7334 | holds | holds | A integrator [ ] (settings-outcome assertion) |
| PL-029 | High | E2 | fixed | 8fb12b185; fu 71a67ed1b (gpt G-E2-01/02) | holds | holds in part | E2 guest [ ] (journal) |
| PL-030 | High | A (script half) + E2 (C++ half) | fixed (both halves) | A: 5a5e47c78e. E2: 1209ac249 | A: holds; E2: holds | A: holds; E2: holds in part | - |
| PL-031 | Medium | B | fixed | 9b9bb8cde8 | holds | holds | B guest [ ] (needs a second adapter) |
| PL-032 | Medium | F2 | **partial** ("resolved in the code and the patch stack. The frame half of the acceptance is open.") | 150a4e1402 | holds in part | holds in part | F2 widgets [ ] |
| PL-033 | Medium | F1 | fixed | d3912bdcb9 | holds | holds | - |
| PL-034 | Medium | F1 | fixed ("Implemented differently from the item's text": a record beside the cfg, not a launcher overlay) | a5a03bd9fa; fu afe32f0afd (gpt G-F1-02/04, claude G-F1-03) | holds in part | holds in part | F1 guest [ ] |
| PL-035 | Medium | B | fixed | 221804941d | holds | holds | - |
| PL-036 | Medium | B | fixed | 02d1b16aa4; fu 34c7eac1ef (gpt G-B-01) | holds | holds in part | - |
| PL-037 | Medium | B | fixed | 01522088cc | holds | holds | - |
| PL-038 | Medium | B | fixed | 63269d17ab | holds | holds | - |
| PL-039 | Medium | B | fixed | 6517eb4c9d; fu 6aab6d611b (claude G-B-08, a test only) | holds | holds | - |
| PL-040 | Medium | B | fixed | c864fcb7cd | holds | holds | - |
| PL-041 | Medium | B (shell half) + E1 (PidLock half) | fixed (both halves) | B: 073a3fdaff; fu f3622d3a2d (claude G-B-13; G-B-05 withdrawn, comment corrected). E1: 409f44917; fu 5e390e128 (gpt G-E1-01/02) | B: holds in part; E1: holds | B: holds in part; E1: holds in part | - |
| PL-042 | Medium | F1 | fixed | 24ceb9e15a (with PL-019) | holds | holds | - |
| PL-043 | Medium | F2 | fixed | a79b7f82a5; fu 67cd0e6493 (gpt G-F2-01) | holds | holds in part | - |
| PL-044 | Medium | B | fixed | 14bc17919c | holds | holds | - |
| PL-045 | Medium | B | fixed | 45f390e898; fu 59f0fbf0bc (claude G-B-04, "a regression in my own PL-045"; gpt G-B-08) | holds | holds in part | B guest [ ]; B fu2 [ ] (one-card revert) |
| PL-046 | Medium | B | fixed | a1a65e0e50; fu dcfab80817 (gpt G-B-07) | holds | holds in part | - |
| PL-047 | Medium | C | fixed | 12fee6bbda | holds | holds | - |
| PL-048 | Medium | C | fixed | 754801892f | holds | holds | - |
| PL-049 | Medium | C | fixed | 967b66bc68 | holds | holds in part | C guest [ ] |
| PL-050 | Medium | C | fixed | b05a1e3485; fu db843bf27d (gpt G-C-02 = claude G-C-02) | holds | holds in part | - |
| PL-051 | Medium | C + A (script half, the coordinator's row) | fixed (both halves) | C: b5e2beeed1, 384d1a14e9; fu dde630672b (gpt G-C-03), 9434dbd4e1 (gpt G-C-04). A: 688a0f9261; fu d5f24b05aa (gpt G-A-05), 7f3a3eaaca + 32aa3a0c65 (gpt G-A-06), 2447ff320f (claude G-A-14) | A: holds; C: holds | A: holds in part; C: holds in part | A integrator [ ] (`conf_valid` on real confs) |
| PL-052 | Medium | A | fixed | c42dfb0c40 | holds | holds | - |
| PL-053 | Medium | A | fixed | fcc16f7ae7 (gpt G-A-03, the seat's reason, was withdrawn as a residual under D-CLOUD-102; no commit) | holds | holds in part | A integrator [ ] (migration on WebDAV/S3, `--files-from-raw`) |
| PL-054 | Medium | E2 | fixed | 1cf15dead | holds | holds | - |
| PL-055 | Medium | D | fixed | d9bd0c8b32; fu d803743338 (claude G-D-10, gpt G-D-03) | holds | holds | - |
| PL-056 | Medium | E2 | fixed | 8b6d47d46 | holds | holds | - |
| PL-057 | Medium | D | fixed | 883d92415c | holds | holds | - |
| PL-058 | Medium | D | fixed | 9167f22270 | holds | holds | - |
| PL-059 | Medium | D | fixed | 5bb4e84714; fu ebcbf19817 (G-D-06, both seats) | holds in part | holds in part | D guest [ ] (TRUNCATED frame) |
| PL-060 | Medium | D | fixed | a3d6781a09, e997a4213c; fu fa9af93285 ("PL-060 regression"), 81ec471c24 (claude G-D-02 = gpt G-D-01), 815f8184d5 (claude G-D-04, a test only) | holds in part | holds in part | D timing [ ] (a nothing-new scan timed) |
| PL-061 | Medium | E2 | fixed | 0adda3f78; fu f4c9549ba (gpt G-E2-03, claude G-E2-06) | holds in part | holds in part | E2 guest [ ]; E2 fu4 [ ] (refused at the 10 s bound) |
| PL-062 | Medium | E2 | fixed | d75fb3866 | holds | holds | E2 guest [ ] (walk) |
| PL-063 | Medium | E1 | fixed | 7949a2529 | holds | holds | - |
| PL-064 | Medium | E1 + B (upgrade half, E1's ask) | fixed (E1: "resolved in ES; the upgrade case also needs stream B"; B's half delivered) | E1: b8c225da1; fu 44705df2d (claude G-E1-02, gpt G-E1-04/05). B: 9764cf01b2; fu 59f0fbf0bc (gpt G-B-10) | B: -; E1: holds in part | B: other (no verdict word); E1: holds in part | B guest [ ] (rehearsal: a cut `system.cfg` and a whole `.tmp`) |
| PL-065 | Medium | E1 | fixed | 587440205; fu 44d174436 (the fixture gpt's "holds in part" asked for) | holds | holds in part | - |
| PL-066 | Medium | A | fixed | 62b5431c54 | holds | holds | - |
| PL-067 | Medium | A | fixed | 3fee07b875; fu b251bf6021 (gpt G-A-04) | holds | holds in part | A integrator [ ] (the capture's lock on busybox `flock`) |
| PL-068 | Medium | E1 (gate) + E2 (bookkeeper half, the coordinator's) | fixed (E1: "resolved in code; the walk is the integrator's") | E1: 6e58988f8. E2: fa57923af; fu 5b6d2e638 (claude G-E1-09), 9b89369dc (gpt's PL-068 coverage note) | E1: holds in part; E2: holds | E1: holds in part; E2: holds in part | E2 guest [ ] (DELETE with the lock held) |
| PL-069 | Medium | E1 | fixed | f67be8b9c; fu 162d2fedb (claude G-E1-05 = gpt G-E1-07) | holds | holds in part | E1 guest [ ] (VmSize over 50 syncs) |
| PL-070 | Medium | A | fixed | 774c2e48bf | holds | holds | - |
| PL-071 | Medium | A | fixed | 42948809d1 | holds | holds | - |
| PL-072 | Medium | E1 | fixed | 8fb11f498 | holds | holds in part | E1 guest [ ] (frame) |
| PL-073 | Low | F1 | fixed | ce355c2a73 | holds | holds | F1 reads [x] (no `update.sh`) |
| PL-074 | Low | C | fixed | e2d45ec7ec; fu 4b1dbb116c (claude G-C-09) | holds | holds | - |
| PL-075 | Low | E1 | fixed ("a documentation change") | dac8aba9d; fu b9b2e3ca1 (claude G-E1-06) | holds | holds | E1 fu [ ] (G-E1-06; a unit suite, not a guest run) |
| PL-076 | Low | F1 (reassigned: F2's report recorded it "open" because the file is F1's) | fixed | F1: 9fd73da845 (F2's follow-up: "should now read resolved by F1") | F1: -; F2: holds ("holds in the diff, credited elsewhere") | F1: other (no verdict word); F2: holds | - |
| PL-077 | Low | B | fixed | dbb9e6bdd5 (backuptool), 5ec237f820 (evidence) | holds | holds | - |
| PL-078 | Low | E1 | fixed | f412119ad | holds | holds | - |
| PL-079 | High | A (beyond its brief) | fixed (the report names it by its finding, gpt F-CS-02, not by PL number) | ff2bdc65a6 | - | holds ("present"; a paragraph, not an index row) | - |
| PL-080 | Medium | A (beyond its brief) | fixed (the report names it by its finding, claude F-CS-13, not by PL number) | fd6878278a | - | holds ("present"; "A30 is a constructed progress-stream test, not a measurement") | - |
| PL-081 | High | - | not in the report | - | - | - | - |
|---|---|---|---|---|---|---|
|---|---|---|---|---|

## Risk assessment

Ranked by what it would cost a player if it shipped as the fix build stands (`4234be0b6b`), before the follow-ups:

1. **The guards that still fail open in `backuptool` and its neighbours** (gpt G-B-01..07): a backup that reports success over a traversal that did not finish, a credential scan that cannot complete and lets the publish through, a boot rollback that says reverted with files left. Each is the shape this project's worst shipped defects had (blindspots 13, 33). Stream B's follow-up 2 is in flight; nothing ships before it lands.
2. **`cloud_migrate_layout`'s verification** (gpt G-A-01/02): a migration that deletes its source on a substring match of rclone's summary, and after a pointer write nobody checked. The migration is the one operation in the cloud scripts that removes a player's files from their cloud on purpose; its check must be exact. With stream A.
3. **A player's own filter refused** (G-A-O1): a `RCLONEOPTS` the player wrote stops their saves backup with a reason about a file they did not write. The #71 contract says the file is theirs. With stream A.
4. **The ES log of this build can carry an unmasked password** (E1's own finding, coverage item 6, fixed `b036967fc`): `sh -c 'tool --password "front back"'` reached the log unmasked between E1's `dcf7fa8c7` and the fix. The build is not staged and will not be; a device that had run it would hold the line until its next boot.
5. **The hub loses the player's place after a folder change** (G-E2-O1): no data moves, but the confirmation the fix exists to show is off the screen, and the next press does something else. With stream E2.
6. **`--match --apply` with no plan names a change that never happened** (G-A-O2): the refusal is the safe branch; the why is wrong. With stream A.

Not a risk to a player, and worth naming: the harness's launch (G-H-01, fixed) and the packet gaps (G-D-01, G-F2-01), which are process defects of this audit, not of the build.

## Coverage boundary

- **The packets were the streams' named files at first delivery, not their branches.** D's `cheevos_armsx2.sh` rewrite and F2's gstreamer, ryzenadj, dmidecode and zip hunks reached no seat; the orchestrator read them and found them as the reports said. That is one reviewer, not two, on those hunks. The next audit's packets are `git diff base..head`, whole.
- **Follow-ups outran the packets.** D (two follow-ups), E2 (three), F1 (one) had commits landed after their packets were cut; the seats audited a moved branch, and one Critical (G-E1-01) was already fixed by a commit the seat could not see. The follow-ups made in answer to this audit (F1, F2, E1 so far; A, B, C, D, E2 in flight) have had no seat: the orchestrator reads each FAIL-then-PASS line and the diff, which is the depth this round affords. A second seat pass over the follow-ups is the next audit's first work if the maintainer wants one.
- **The interface was reviewed as diffs and as frames.** Both seats read the ES diffs; the only interface defect found (G-E2-O1) came from the build's walk frames, not from either seat. Frames cover the walked screens only (`tools/vm-walks/suite.txt`); pages no walk visits -- the RetroAchievements pages, the Wi-Fi picker, the sign-in window -- were reviewed as code alone until the proof runner's frames land (`proofs-307.md`).
- **The scripts were proved on the VM's busybox by the harness (844 checks) and by vm-qa's suites, not on a handheld.** No device fact is claimed here; the H700 twin is built and unstaged.
- **The sweep rows (#308) were spot-checked by the seats, not re-verified one by one.** Each seat took a sample per packet; the streams' own outcome per row is the record.

## Quality self-check

- Every verdict in `02-forward-audit.md` § Verification names the artifact it rests on (a commit, a line, a frame, a suite line) or says "pending the stream's delivery" -- none rests on a report's sentence alone. The two refutations by packet gap say that the orchestrator's read is the only review.
- Subagent (stream) reports were used as leads: each fixed finding is checked by its FAIL-then-PASS lines in the harness and by reading the commit; each withdrawal by the refuting line. Where the orchestrator has not yet done that, the entry says pending.
- The findings index is regenerated from the sixteen outputs (the agent's draft is a lead; the index in `02-forward-audit.md` is checked against the files before it is trusted).
- Timestamps are from the clock at the moment of writing; the log's entries were written as the steps happened (`00-running-log.md`).
- What this audit did not do: no second seat over the follow-ups; no device; no re-verification of every sweep row.

## Second opinion

_(the GPT seat's reading of this analysis, Phase 4.6, after the scorecard is written)_
