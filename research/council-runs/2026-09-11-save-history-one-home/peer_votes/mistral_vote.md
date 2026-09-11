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