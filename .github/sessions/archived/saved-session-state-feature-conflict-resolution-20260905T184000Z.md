# Saved Session State

> **Saved**: 2026-09-05T18:40:00Z
> **Branch**: `feature/conflict-resolution` @ `484337be87`
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)
> **Worktree**: `/workspace/repos/rocknix.worktrees/conflict-resolution`

## Current Focus

**A five-model council deliberation on the foundation for cloud-save conflict
resolution is mid-flight, in recursion round 2.** Round 1 finished all four
steps; the vote was a genuine 2-2-1 tie, so the run recurses automatically per
`tie-breaking-recursion.md` rather than pausing. Round 2's peer reviews were
launched at 18:35 UTC and are **running in the background right now** (5
`council-invoke` processes). This is the highest-value thing in flight; do not
start anything that competes for the machine until it lands.

## In Progress — the council run (READ THIS FIRST)

**Run directory:** `research/council-runs/2026-09-05-conflict-resolution-foundation/`
Genesis anchored on `verification-anchors/2026-09-05-conflict-resolution-foundation` (pushed).

**Round 1: complete, all gates PASS, all four steps committed and sealed.**

| Voter | Voted for |
| --- | --- |
| claude | `gpt-revised_plan.md` |
| gemini | `gpt-revised_plan.md` |
| gpt | `claude-revised_plan.md` |
| kimi | `claude-revised_plan.md` |
| mistral | `kimi-revised_plan.md` |

`gpt` 2 · `claude` 2 · `kimi` 1 → **2-2-1 = genuine tie → recurse.**

**Round 2 state:**

- **r2 Step 2 (peer reviews): LAUNCHED at 18:35 UTC, in flight.** Outputs land
  at `peer_reviews/{member}_peer_review-r2.md`; each seat's stderr goes to
  `_prompts/step2-r2-<member>.log` (a zero-byte one means that seat is still
  running). The launcher writes `R2STEP2-DONE` to
  `/workspace/artifacts/council-r2step2.log` only when all five have exited.
  A `Monitor` task (`bm87e825v`) was armed — **a monitor does not survive a
  context compaction**, so after resuming, check by hand:
  `pgrep -fc council-invoke` (0 = finished) and `ls peer_reviews/*-r2.md`.
  As of 18:41 UTC gemini and mistral had landed; claude, gpt and kimi were
  still running, which matches round 1 (the three reasoning seats take
  ~15 min, the other two ~6).
- **r2 Step 3 and Step 4: not started.**

**To continue the run after r2 Step 2 lands** (from the worktree root):

```bash
R=research/council-runs/2026-09-05-conflict-resolution-foundation
# 1. gate: every seat's provenance must show identity=PASS before advancing
for m in claude gemini gpt kimi mistral; do
  python3 -c "import json;d=json.load(open('$R/peer_reviews/${m}_peer_review-r2.md.provenance.json'));print('$m',d['final']['outcome'],d['final']['verification']['result'],d['final']['verification']['observed'])"
done
# 2. r2 Step 3 — revisions. Template pattern: copy _prompts/step3-template.md,
#    retitle for round 2, build with --step 3 (injects the r2 peer reviews):
for m in claude gemini gpt kimi mistral; do
  tools/council/run prompt --step 3 --member $m --run-dir $R \
    --template $R/_prompts/step3-r2-template.md --out $R/_prompts/step3-r2-$m.md
done
# then invoke each (mistral needs --max-tokens 32768; others use seat defaults):
tools/council/run invoke --member <m> --provider openrouter \
  --prompt-file $R/_prompts/step3-r2-<m>.md \
  --source-manifest $R/_prompts/step3-source-manifest.json \
  --output $R/revised_approaches/<m>-revised_plan-r2.md
# 3. r2 Step 4 — votes, same shape with --step 4 and step4-r2-template.md,
#    output peer_votes/{m}_vote-r2.md. Then tally.
```

**Critical process rules that are easy to get wrong:**

- **Every member call goes through `tools/council/run invoke`.** Never curl, never
  a subagent. (`.claude/rules/council-substrate-integrity.md`.)
- **Never put run observations in a member prompt** — no vote tallies, no timings,
  no "two plans led". The r2 prompts deliberately omit the tally. Tally lives in
  `model-verification-log.md`.
- **The prompt builder has no round support.** r2 prompts are built by passing a
  round-specific `--template` and `--out`; `--step 3` injects peer reviews and
  `--step 4` injects revised plans, whatever the round.
- Run `tools/council/run seal --run-dir $R --step N` then `lint --at-step N`,
  `verify-chain`, `verify-seals` after each step. All must be OK before advancing.
- Recursion cap is `r5`. If still tied at r5, the user decides directly.
- Step 5 (issue draft) and Step 6 (handoff) have not been reached.

## Completed This Session

**Council infrastructure (fork issue #70, D-WORKFLOW-003):**

- Imported the `council` skill, five member agents, the Facilitator and the whole
  verification toolchain from `pfi/pfi-collaboration` (council `d51c09c`,
  facilitator `8a4ef90`) via marvin. Lives in `.claude/skills/council/`,
  `.claude/agents/`, `.claude/rules/council-*.md`, `tools/council/`.
  Provenance and the three re-pathing patches: `.claude/skills/council/IMPORTED-FROM.md`.
- `tools/council/run <invoke|lint|start|prompt|seal|summary|verify-pins|verify-chain|verify-seals|efforts|drift>`
  loads `~/.config/council/env` (0600, holds only `OPENROUTER_API_KEY`) and execs
  the scripts. Verifier pins regenerated accountably; `verify-pins` passes.
- **GPT seat moved GPT-5.6 Sol → GPT-6 Astra** (`openai/gpt-6-astra`, listed
  2026-09-04). Roster: Fable 5.1 (xhigh), Gemini 3.1 Pro Preview (high),
  GPT-6 Astra (max), Kimi K3 (max), Mistral Large 3. All five identity-verified;
  probes in `research/seat-probes/2026-09-05-{serval-import,astra}/`.
- **serval → marvin SSH key** installed through the Ansible hub;
  `~/.ssh/marvin_ed25519`, host key was already pinned and byte-matched.

**Shipped to the device today (seventh H700 image, `BUILD_ID 394a3d536a`):**

- #65 tab strip is a focus stop (left/right cycles rows again), #67 scraper
  SCRAPE-tab filters remembered, #68 RetroAchievements web API key entered on
  the device, #69 tools icons show in every GAME ARTWORK mode.
- Issues filed today: #65, #66, #67, #68, #69, #70.
- Register rows added: D-UI-021, D-QA-006, D-CLOUD-029 (decided: no `--update`
  stopgap), D-CLOUD-030 (identity = content hash), D-CLOUD-031 (manifest shape),
  D-WORKFLOW-003 (council runs on serval).
- `docs/save-manifest-schema.md` rev 1 (#20 closed) and
  `docs/save-manifest-alignment-review.md`.

## Next Steps

1. **Wait for r2 Step 2, then drive r2 Steps 3 and 4** per the commands above.
   Report the cross-review themes to the user between steps.
2. **Tally r2.** Majority (3+) → Step 5. Plurality (2, no peer) → pause and ask.
   Still 2-2-1 → r3.
3. **Step 5** drafts the issue body; **Step 6** hands off. Nothing reaches the
   tracker before Step 5, and the user sees the winner first.
4. **Then the milestone work resumes** at whatever the council settles. The
   pre-council task list had #24 identity (done, D-CLOUD-030), #20 schema (done),
   then #19 bench, #35 round-trip, #22, #23. **The council will reorder this** —
   see the findings below.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `research/council-runs/2026-09-05-conflict-resolution-foundation/` | Created | The whole run: 42-source `_sources/`, prompts, 5 analyses, 5 reviews, 5 revised plans, 5 votes, verification |
| `.claude/skills/council/**`, `.claude/agents/council-member-*` | Created | Imported skill + seats |
| `tools/council/**` | Created | Facilitator, lint, anchoring, seals, verifiers, `run` wrapper, pins |
| `.claude/rules/council-substrate-integrity.md`, `adversarial-council.md` | Created | Imported rules |
| `.githooks/pre-push`, `.claude/rules/fork-workflow.md` | Modified | `tools/council/` and `research/` added to personal paths |
| `docs/save-manifest-schema.md` | Created | Rev 1, the #20 deliverable |
| `docs/save-manifest-alignment-review.md` | Created | One-model review the council supersedes |
| `docs/decision-register.md` | Modified | D-CLOUD-029/030/031, D-UI-021, D-QA-006, D-WORKFLOW-003 |
| `docs/council-limits.md` | Created | Imported limits audit |

## Related Context

- **Tracker:** milestone *Cloud Saves: Visual Conflict Resolution*, epic #11,
  children #19–#25 + #10; #9 (bisync) is implicated by the council's findings.
- **Design:** `docs/conflict-wizard-ia.md` rev 4, `docs/save-manifest-schema.md`,
  `plans/conflict-resolution/vita-style-conflict-resolution.md` (holds the futro).
- **Device:** RG35XX SP is `ssh rg35xxsp` (192.168.1.81), DDR4, on the seventh
  image. It powers off between sessions; "no route to host" means off.
- **Flashing:** worktree `/workspace/repos/rocknix.worktrees/device-flashing`
  (`build/device-flashing`) was seeded for the RG-SP flash in a separate session.

## Notes for Next Session

- **`next` is 4 commits behind this branch** (`b4d0fc4da6` vs `484337be87`); the
  council commits live only here. Merge to `next` and push when the run finishes,
  or sooner if durability matters. Nothing else is unpushed.
- **The council's substantive findings so far** — these are the payload, and they
  already change the plan of record:
  - **All five members demote `rclone bisync` from detector to a spike that must
    pass a written contract.** Detection becomes an application-owned three-way
    compare of local hash, cloud hash and last-agreed hash. This reverses #22/#9
    as written.
  - **Verified live bugs in shipped code:** `getNextFreeSlot()` returns `-99` for
    a game holding only an auto state (KEEP BOTH's commonest case);
    `copyToSlot()` returns true without checking its copies; script exit codes 3
    and 4 collide with rclone's own, so a real failure is displayed as a friendly
    skip and stamped as success; both scripts exit with the saves-phase status
    only, masking a failed system-backup phase.
  - **`tools/cloud-round-trip` overwrites `rclone.conf` before it checks which
    remote is first, and never restores it.** Fix it before pointing it at
    anything that matters. This changes #35's order.
  - **The boot sync races a running emulator** (`102-cloud-saves` downloads while
    RetroArch flushes SRAM every 10 s) — a live data-loss path today.
  - **Deletion has no semantics anywhere**; needs tombstones written at the
    moment of deletion, since absence can mean an unmounted card.
  - **Multi-file and shared saves** (PPSSPP dirs, Dreamcast VMU, PSX memcards)
    must resolve as one unit or a card ends up half from each device.
  - **The one-way stopgap:** turning off the startup sync leaves only the exit
    upload, overwrites nothing, and needs no code change or reopened decision.
    Both members who wanted a `--update` stopgap withdrew it after seeing that
    the boot restore undoes the stranding.
- **Orchestrator verified one disputed claim itself** (the `-99` question) against
  the ES source rather than by majority; recorded in `model-verification-log.md`.
- Seat costs: a full five-seat step is ~15–20 min wall clock and the corpus is
  ~134k tokens per seat per step. Mistral's context is the binding constraint
  (262k) and it is capped at `--max-tokens 32768`.
- `/workspace/artifacts/council-*.log` hold each step's launcher output.

## Open Questions

- **Nothing is blocking the council run.** The user's standing asks are: report
  themes between steps, and pause when a majority winner emerges.
- **After the council:** whether to accept its reordering of the milestone work
  (harness fix and the cheap physics experiments before #21/#22 code).
- **#70's last criterion** is "one real run" — this run closes it when it reaches
  Step 6.
- Marvin still holds a copy of the OpenRouter key at `~/.config/council/env`;
  the user was given `shred -u` for it and has not confirmed removal.
