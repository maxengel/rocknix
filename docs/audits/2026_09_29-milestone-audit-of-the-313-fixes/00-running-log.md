# Milestone Audit Running Log -- the audit of the fixes to #313's items (and #315), before the release candidate

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1 in the session; the seats: `anthropic/claude-fable-5.1` at xhigh and `openai/gpt-6-astra` at max through the council Facilitator on OpenRouter, D-WORKFLOW-049)
**Started:** 2026-09-29 00:17 UTC
**Scope:** the work done after the last two-seat read -- the fixes to the audit of the fix round's 34 items (#313, Phase 7) and #315's fix -- as the distribution `1b0d233657..02546235c1` on the upstream-bound paths (41 files, +2240/-577; the merges of streams A, B, C, C's follow-up, D, F2, the integrator's commits, step 0's upstream merge and the proxy bump) plus `320d2b2bea..286759eb6d` (#315, 4 files), and the EmulationStation fork `87b182fbe..c15c698367` (27 commits, 34 files, +2297/-252: E1, E2 and their follow-ups). Crosses the cloud-saves, offline-achievements and interface epics: milestone tier.
**Spec:** `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/05-punch-list.md` (the 34 items with their acceptance text and the Phase 7 outcomes the streams recorded), #313, #315.
**Why:** the maintainer, 2026-09-29: *"The idea was to have our local Fable instance running in this harness to record the work that we did in all of these fixes using our code auditor skill, so we're checking what was done."* The two earlier audits read the fix round's first deliveries and follow-ups (`417dcd8610..1b0d233657`); the fixes to their 34 items have been verified per item by the orchestrator, the harness and the proofs, and never read whole by the seats. This audit reads them whole, before the one build (D-WORKFLOW-063).

---

## Log Entries

### [Phase 0] 2026-09-29 00:17 -- folder, scope, packets cut

Skill copy checked against `next` (this checkout is the primary's `next`). Packets under `seats/`: `all-distribution.diff` (253 KB) and `all-es.diff` (156 KB), both under the seat cap, both 0 hits on the wordlist; `docs/audits/2026_09_29-issue-315-size-only-fix/seats/315-size-only.diff` (18 KB) already with both seats since 00:13 UTC as its own packet. Two packets, two seats each, plus the #315 pair: six seat outputs.

### [Phase 2] 00:40 -- six seat outputs landed

all-distribution: claude 9 findings (39.7 KB), gpt 9 (35.6 KB); all-es: claude 7 (30.0 KB), gpt 6 (27.7 KB); #315's packet at 00:27: claude 12, gpt 5. Every seat `outcome=success`, the served models the pinned ones.

### [Phase 2.5 / 4.5] 00:44-01:20 -- every finding re-read against the source; three Highs confirmed, one by execution

gpt G3-D-01 confirmed by running the seat's canary on the host (a sourced RANDOM= line ran a command); gpt G3-D-04 and G3-E-01 confirmed by reading. Verdicts and outcomes for all 31 in `02-forward-audit.md`: 17 taken, 9 accepted with the reason, 5 refuted with the artifact (the image's busybox prints the CRC column; F2-autoslot 9 PASS; the Osk is the user data; the French exists; no other reader of .added).

### [Phase 7] 01:01 -- the fixes in the tree; the interface fork's four commits pushed

Distribution: the grammar (three copies: shell-owned names, backslash-dollar-paren, a NUL byte), sort_settings gated, cloud_capture's batched rm, cloud_log_scrub's truncated tail, chksysconfig's was=no gate, cloud_migrate_layout on the shared reader, cloud_oauth's checked delete, raofflineproxy-ctl's ack by rename, cloud_setup's trailing slash, backuptool's CRC column, the hooks (guard-lib, commit-msg, pre-commit, pre-push) with hooks-test's five new cases (38 ok). EmulationStation `893a81403` (StringUtil), `03ebb50a1` (GuiMenu), `812bc2f75` (SystemConf, the es-conf-tests case seen to fail first), `db5fc6954` (the hooks, pre-push-test 22 ok); the pin moved to `db5fc6954f`. The harness runs whole with section S3F, then against `286759eb6d` for the section's positive.

### [Phase 7] 01:25 -- the seat's example literal redacted for the commit

claude's all-es output quoted the hooks' own run-time credential fixture as a literal in its G3-E-01 failure scenario; the pre-commit guard refused the commit (rightly: a fixture is built at run time, never written down). Replaced by `<a credential-shaped value>` in the seat's file; the finding is unchanged.
