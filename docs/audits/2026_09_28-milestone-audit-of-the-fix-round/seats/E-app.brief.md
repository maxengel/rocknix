# Audit of the whole fix round: packet E-app -- a two-seat review before the release candidate (#307 / #308 / #309, D-WORKFLOW-060)

You are one of two independent auditors (the other is a different model; neither sees the other's work). A milestone audit produced a punch list (#307, 81 items) and a sweep (#308, 297 rows); eight fix streams delivered branches from written plans; a first audit of those first deliveries returned 165 findings, and the streams answered every one in follow-up commits the same morning. The follow-ups had one reader. The maintainer's call, before the release candidate is cut: *"run the code auditor on everything we just fixed ... A lot of work was farmed out and done, and it would be good to have a code audit pass at everything that was just done to make sure we're reviewing it and taking a step back."* Your task is an adversarial, evidence-bound review of ONE packet: the EmulationStation fork `7eae8ed91..87b182fbe`, the application half: es-app/src's FileData, FolderMerge, JourneyTiers, LaunchCommand, NetworkThread, OfflineAchievements, OfflineScanJob, ProxyCards, RetroAchievements, RunLock, SaveState and the guis.

## The packet

- `seats/E-app.diff`: the unified diff of those paths across the whole range (the core half is another packet).
- `seats/E1.report.md`, `seats/E2.report.md`: the two EmulationStation streams' reports with their follow-up sections (E1 core, E2 application) -- claims.
- `seats/E1.findings.md`, `seats/E2.findings.md`: the first audit's findings for each, with the streams' claimed answers.
- `seats/E1.items.md`, `seats/E2.items.md`: the punch items each owned, with the acceptance text.

- The rule files the work is judged by: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact, § A name is not a behaviour, § Before deleting a duplicate), `upgrade-and-install.md` (every fix's `Already written:` answer -- what a device that already has state sees), and the others listed in the manifest (`es-player-text.md` for every word a player reads; the ES rules for the interface; `packaging-and-patches.md` for a recipe; `rclone-cloud-sync.md` for the cloud scripts).

## What to produce

1. **Per punch item** in the items file: a verdict line -- **holds** (the diff does what the acceptance asks by the named mechanism, with the line that shows it), **holds in part** (what is missing), **does not hold** (why, with the line), or **cannot tell from the packet** (what would settle it). Cite diff lines. The items' acceptance text is the criterion; nothing else in the packet is a verdict.
2. **Per finding of the first audit** in the findings file: is the stream's claimed answer sound *as the diff shows it* -- **answered** (the mechanism is in the diff, with the hunk), **answered in part**, **not answered** (the claim and the diff disagree), or **withdrawal does not hold** (the reason given is refuted by the diff). This is the follow-up review nobody has made: read the follow-up hunks as closely as the first delivery's.
3. **Findings** of your own, numbered `### G2-E-app-NN: <short title>` with `- **Severity:** Critical|High|Medium|Low`, `- **Category:**`, `- **Where:**` (file and the diff hunk), `- **What:**`, `- **Failure scenario:**` (concrete inputs or state, then the wrong outcome), `- **Evidence:**` (the lines; what you looked for that would have refuted it and did not find). A finding about a fix introducing a new defect outranks one about the fix being incomplete. Look especially at: a guard that reports success over a failure it could not see; a check that matches a substring or a count where an exact answer exists; a deletion or an overwrite that runs before its precondition is read back; a lock or a marker whose reader and writer disagree; a player-visible word outside the outcome vocabulary; a change to what is written with no answer for what earlier builds already wrote; a test that cannot fail.
4. **Sweep rows**: for the rows the report says it fixed, spot-check at least five against the diff and say which; for the rows it withdrew, say whether the reason holds for any you can judge from the packet.
5. **Seams**: where this packet touches a file or a contract another stream also changed (the shared harness; the cloud scripts' outcome words read by the interface; the proxy's stamps read by the cards; wifictl's output read by the picker; the settings lock shared by the scripts and the interface), say what the two sides assume of each other and whether the diff keeps them agreeing.
6. **Coverage boundary**: what you could not judge from this packet (a callee outside the diff, a runtime, a device), stated plainly rather than guessed.

## Rules of evidence

- Cite only what is in the packet. Do not invent line numbers, files or behaviour; if a callee is outside the diff, say so.
- The report's FAIL-then-PASS lines are the stream's claim; the harness block or the unit tests in the diff are what you check the claim against. A case that cannot fail is not evidence.
- The findings file's last column is the stream's own claim about its answer, not a verdict; the first audit's verdicts on the punch items are deliberately not in this packet.
- Everything you write is data for an orchestrator who will re-read the source before acting on it; write so that each finding can be checked in one visit to one file.
