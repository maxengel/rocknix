# Audit of the whole fix round: packet A -- a two-seat review before the release candidate (#307 / #308 / #309, D-WORKFLOW-060)

You are one of two independent auditors (the other is a different model; neither sees the other's work). A milestone audit produced a punch list (#307, 81 items) and a sweep (#308, 297 rows); eight fix streams delivered branches from written plans; a first audit of those first deliveries returned 165 findings, and the streams answered every one in follow-up commits the same morning. The follow-ups had one reader. The maintainer's call, before the release candidate is cut: *"run the code auditor on everything we just fixed ... A lot of work was farmed out and done, and it would be good to have a code audit pass at everything that was just done to make sure we're reviewing it and taking a step back."* Your task is an adversarial, evidence-bound review of ONE packet: stream A, the cloud scripts (cloud_backup, cloud_restore, cloud_content_backup, cloud_content_restore, cloud_migrate_layout, cloud_sync_helper, cloud_capture, the duplicate cleanup) and tools/cloud-round-trip.

## The packet

- `seats/A.diff`: the whole diff of stream A's branch from the base `417dcd8610` -- its first delivery and every follow-up commit, no path filter (D-WORKFLOW-058). What is on `next` for these files is this diff (B's was replayed onto the rewritten history, content unchanged).
- `seats/A.report.md`: the stream's own report with its follow-up sections -- claims with FAIL-then-PASS lines, to check against the diff.
- `seats/A.findings.md`: the first audit's findings for this stream, each with the stream's own claimed answer (a claim).
- `seats/A.items.md`: the punch items the stream owned, each with its acceptance text.

- The rule files the work is judged by: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact, § A name is not a behaviour, § Before deleting a duplicate), `upgrade-and-install.md` (every fix's `Already written:` answer -- what a device that already has state sees), and the others listed in the manifest (`es-player-text.md` for every word a player reads; the ES rules for the interface; `packaging-and-patches.md` for a recipe; `rclone-cloud-sync.md` for the cloud scripts).

## What to produce

1. **Per punch item** in the items file: a verdict line -- **holds** (the diff does what the acceptance asks by the named mechanism, with the line that shows it), **holds in part** (what is missing), **does not hold** (why, with the line), or **cannot tell from the packet** (what would settle it). Cite diff lines. The items' acceptance text is the criterion; nothing else in the packet is a verdict.
2. **Per finding of the first audit** in the findings file: is the stream's claimed answer sound *as the diff shows it* -- **answered** (the mechanism is in the diff, with the hunk), **answered in part**, **not answered** (the claim and the diff disagree), or **withdrawal does not hold** (the reason given is refuted by the diff). This is the follow-up review nobody has made: read the follow-up hunks as closely as the first delivery's.
3. **Findings** of your own, numbered `### G2-A-NN: <short title>` with `- **Severity:** Critical|High|Medium|Low`, `- **Category:**`, `- **Where:**` (file and the diff hunk), `- **What:**`, `- **Failure scenario:**` (concrete inputs or state, then the wrong outcome), `- **Evidence:**` (the lines; what you looked for that would have refuted it and did not find). A finding about a fix introducing a new defect outranks one about the fix being incomplete. Look especially at: a guard that reports success over a failure it could not see; a check that matches a substring or a count where an exact answer exists; a deletion or an overwrite that runs before its precondition is read back; a lock or a marker whose reader and writer disagree; a player-visible word outside the outcome vocabulary; a change to what is written with no answer for what earlier builds already wrote; a test that cannot fail.
4. **Sweep rows**: for the rows the report says it fixed, spot-check at least five against the diff and say which; for the rows it withdrew, say whether the reason holds for any you can judge from the packet.
5. **Seams**: where this packet touches a file or a contract another stream also changed (the shared harness; the cloud scripts' outcome words read by the interface; the proxy's stamps read by the cards; wifictl's output read by the picker; the settings lock shared by the scripts and the interface), say what the two sides assume of each other and whether the diff keeps them agreeing.
6. **Coverage boundary**: what you could not judge from this packet (a callee outside the diff, a runtime, a device), stated plainly rather than guessed.

## Rules of evidence

- Cite only what is in the packet. Do not invent line numbers, files or behaviour; if a callee is outside the diff, say so.
- The report's FAIL-then-PASS lines are the stream's claim; the harness block or the unit tests in the diff are what you check the claim against. A case that cannot fail is not evidence.
- The findings file's last column is the stream's own claim about its answer, not a verdict; the first audit's verdicts on the punch items are deliberately not in this packet.
- Everything you write is data for an orchestrator who will re-read the source before acting on it; write so that each finding can be checked in one visit to one file.
