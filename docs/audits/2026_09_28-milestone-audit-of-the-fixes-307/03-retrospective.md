# Retrospective — the fix round for #307/#308, and the audit of it

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1)
**Date:** 2026-09-28 (opened 05:25 UTC, extended as the streams deliver)
**Subject:** how eight delegated streams (Opus 5.5, D-WORKFLOW-055/056) worked 81 punch items and 297 sweep rows in one night, and what the audit of their work could and could not see
**Spec:** `docs/audits/2026_09_25-milestone-rc-round-since-258/05-punch-list.md`; the streams' briefs (`docs/audits/2026_09_25-milestone-rc-round-since-258/streams/briefs/`) and reports (`streams/reports/`)

---

## Running Notes

### What the round did (the shape)

Eight worktrees from one base (`417dcd8610`; the ES streams from `7eae8ed91`), one brief each with the items' acceptance text and the rules embedded, a block of harness cases each stream owns (`# ---- audit #307, stream X ----` in `tools/last-good-scripts-test`, 844 checks after the merges), reports in one shape (punch items, sweep rows, decisions made, what could not be done, player words proposed). The integrator merged by content in a fixed order (F1, F2, C, D, B, A; E1 then E2 on the ES branch), ran pkgcheck and the syntax check on what each merge touched, and the whole harness after each; the merge conflicts were the appended harness blocks and the French catalogue, both kept-both-sides. One build, one QA run, one proof, one audit of the diffs by two seats.

### What worked

- **A block per stream in one harness file.** Every stream wrote its cases first and saw them fail; the integrator's only test of a merge was that the whole file still passed. 844 checks, and the conflicts were mechanical.
- **The report shape.** "What I could not do" and "Player words proposed" sections gave the integrator the proofs to run and the words to put to the maintainer without reading the diffs for them. The proofs list (`proofs-307.md`) was assembled from those sections alone.
- **Follow-ups by message.** A stream kept its context; a finding routed back to it landed in minutes with a case, where a fresh agent would have re-read the subsystem. F1 and F2 answered 37 findings between them inside an hour of the seat outputs landing.
- **The harness refused its own bad launch.** Stream D's cancel checks made the harness refuse to run with SIGINT ignored, and vm-qa's launch gave it exactly that; the suite failed in 0 s with a sentence that named the cause. A guard that fails closed on its own precondition is the cheapest kind of finding.

### What was harder than expected

- **A packet cut by named files is not the stream's diff.** The seat packets were built from each stream's listed files; D's `cheevos_armsx2.sh` and F2's gstreamer, ryzenadj, dmidecode and zip hunks were outside their lists and reached no seat -- the Claude seat flagged the rows as unhunked (G-D-01, G-F2-01), and the only review those hunks have had is the orchestrator's. A packet is `git diff base..head` of the branch, whole, and the seat is told the size; the file list is for reading order, never for scope.
- **A packet cut at first delivery audits a branch that has moved.** D, E2 and F1 had follow-ups landed before their packets were read; G-E1-01 (Critical) was refuted by a commit E2 had already made. Either the packet is cut at the stream's last commit and the seats wait, or each follow-up is audited as its own small packet. Waiting is cheaper than an argument about a finding that is already fixed.
- **A finding's prose can carry a credential shape.** B-claude's finding about the sign-in scanner's `sk-` pattern used a literal example, and the pre-commit guard refused the seat output. Right on both sides: the artifact is committed with the example replaced by a placeholder and a note at its head. The rule for fixtures (`engineering-practices.md` § A fixture for a secret scanner is built at run time) extends to the prose that describes them.
- **A fix can cost the player their place.** The one interface defect the build's walk found was made by a fix (the hub reopened so a row's line reads the new folder, and reopened at its top). The frame-diff found it because the walk's next press landed on a different page; a reviewer reading the diff, and both seats, missed it. Walks catch what diffs do not, and the claims file is where an intended change is separated from the rest.
- **Fixture leakage looked like a regression for an hour.** A PICO-8 row appeared on the content page where the baseline had none. It was the 0-byte `Splore.png` the pico-8 package touches at every boot, hidden by the old page and listed by the fixed one (F-ES-10); tracing it meant reading the guest, the seed scripts, the package's autostart and the page's code. A walk baseline's note should list the fixture's systems, so a new row is checked against the list before the code.

### Cross-stream seams the audit is placed to see

- **Two streams, one file.** F2 found two defects in D's scripts (gpt G-F2-02, G-F2-07) while reading its own; E2's `joinWifiNetwork` return change reached E1's caller. The merge order was chosen for conflicts, not for who reads whose interface; a seam like that wants the later stream told what the earlier one changed in shared files, which the integrator did by message after the fact.
- **The harness's own launch.** The cancel checks are the first cases in this harness that depend on how it is started; nothing in `tools/vm-qa` said how it starts suites. Now the launcher says it, in a comment beside the wrapper.
- **The round-trip's contract with the scripts.** Two of A's fixes (PL-020's catch-all check, D-CLOUD-141's plan) changed what the scripts accept, and `tools/cloud-round-trip` encoded the old contract in two steps. The tool is the contract's second copy; a stream that changes what a script refuses owns the tool's step too (A's brief did not say so; the next brief does).

_(extended as the remaining streams deliver: A, B, C, D, E1, E2)_
