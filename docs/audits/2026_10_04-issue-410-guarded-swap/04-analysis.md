# Analysis — guarded host swap helper

## Executive summary

Independent Issue-level review completed: Codex/OpenAI primary plus Anthropic
Fable5.1/xhigh through the verified Facilitator. Seven external leads were
checked against actual source/host observations. Five improvements are fixed;
the proposed High host-priority blocker is refuted by actual priority -1, and
the timeout-duration concern remains unproven. No escalation path was found.
Code is committed as `8c448fcb35`; final35 tests pass and the same-suite
memory-guard mutation fails exactly2 tests. Installation is ready to prepare,
but actual administrator bootstrap, permission readback and kernel recycle
remain open under #410. This audit does not qualify the running M7 image or P4.

## Acceptance-criteria scorecard

| Criterion | Verdict | Evidence / remaining work |
| --- | --- | --- |
| Guard and recovery behavior | PASS, isolated software scope | final-tests.log:35 tests/rc0; final-negative-memory-guard.log:35 tests/2 expected failures; process/Python probes. No actual kernel transition claim. |
| Default read-only / explicit preflight | PASS, isolated software scope | Preflight tests cover fixed argv, missing/denied helper, stale/malformed counters and inactive swap. |
| Exact root installation and effective grant | PARTIAL | Real parser validates exact policy; source checks direct include and trusted paths; staged installation/live permissions still pending. |
| Instructions and preserved build inputs | PARTIAL, rollout | README/canonical rule updated; frozenb137 and launcher hashes unchanged; future host rollout still pending. |

2 PASS,2 PARTIAL (50% completely proved within the stated acceptance scope).
No installation criterion is ticked from a fixture.

## Code-quality assessment

Fixed path/argv, isolated system Python and absolute child commands keep the
root boundary small. Ownership/type/link checks, exclusive lock, repeat RAM/
job checks and verified reactivation are explicit. Installer rollback now
attempts each file independently and reports incomplete recovery. Remaining
complexity is privileged installation and process/kernel failure handling;
fixtures cannot fully model those environments.

## Instruction conformance and spec fidelity

D-INFRA-015/#410 define explicit pre-build maintenance of existing /swap.img.
Default preflight stays read-only; no timer, broad grant, root-container
workaround, unrelated job stop or frozen-input edit. VM-first justification
is in410; isolated fixtures precede host bootstrap. Tool inventories/rules,
register/work-log checks and normal hook tests pass. Known operational scope
is serval/max1000, default fstab and observed priority -1 (other negative
priorities deliberately refuse). No fleet-wide portability claim.

## Missing artifacts

Installed root-owned bytes/effective sudo grant and actual safe-idle kernel
recycle are pending, pre-existing410 scope. Source/fixture evidence is retained
separately. Physical-device and cloud behavior are outside this host audit.

## Risk assessment

The grant can trigger a bounded swap-in only when guards pass. RAM/process
observations are snapshots, not reservations; another allocator can start
later. SIGKILL/power loss cannot run cleanup. Timeout120s may refuse on slower
storage; no observed duration establishes a defect on serval. Never weaken
busy/low-RAM guards to obtain a test. Actual installation failures report
administrator recovery; interrupted installation must be reverified.

## Finding Verification

| Lead (Anthropic) | Final disposition and direct evidence |
| --- | --- |
| F1 High: default negative priority blocks serval | Withdrawn for this host: escalated actual /proc/swaps read shows -1, not the proposed -2. host-configuration.txt; code permits -1. README now makes the deliberate host boundary explicit. It is not universal kernel-default documentation. |
| F2 Medium:29-test negative receipt vs30-test suite | Confirmed/resolved: original receipt predates one case. Retain it as historical; final source hashes bind35-test PASS and35-test negative receipt (two exact headroom failures). |
| F3 Low: any user can pre-create sticky-directory lock | Confirmed/resolved: old /run/lock root1777; guard regression reaches unsafe open. Both participants now lock directly under root0755 /run and reject writable parents. |
| F4 Low: subsequent preflight reports READY with inactive swap | Confirmed/resolved: old default and explicit invocations return0 in fixture. Both now return1 with NO ACTIVE SWAP and no attempted activation. |
| F5 Low:120s timeout is likely too short | Unconfirmed, not a defect claim: no serval timing measurement in packet. Keep bounded failure/recovery behavior and measure actual idle operation under pre-existing410 rollout. No timeout increase based on speculation. |
| F6 Info:ESRCH after process open causes spurious refusal | Confirmed/Low/resolved: reproduced ProcessLookupError; now tolerate vanished processes while PermissionError still refuses. |
| F7 Low: one failed rollback skips the second file/final validation and leaks temp | Confirmed/resolved: injected policy restore failure reproduces; now helper restoration and final validation still execute, rollback temp is removed, error names incomplete rollback. |

`evidence/review-regressions-before.log`:33 tests,3 failures/2 errors before
fix. `review-regressions-after.log`:33 pass. Added direct-include and real
unowned-include parser checks bring final suite to35. Real parser rejects
unowned include directories, so that fixture does not pretend to validate a
root-owned installed include. Original unsupported digest policy failure is
retained; sudo-rs needs exact-command root-file protection instead.

Additional reviewer coverage questions: actual /usr/local and sbin are
root0755 (host receipt), sudo accepts -n -- but needs authentication, installer
now requires direct include, and real executable -I rejects hostile Python
startup paths with an effective negative control. Real root include/grant,
sudo signal relay and actual swap duration remain host observations.

## Coverage boundary

Five named source files were frozen for the external call, hashes retained in
source-hashes.json. The packet carries their numbered bytes but omitted the
hash JSON itself; final-source-hashes.json independently binds the corrected
files. Tests replace privileged operations; no installed root helper, policy
change, real swapoff/swapon or kernel/sudo signal experiment has occurred.
No runtime build input changed. Source fixture proof is not release evidence.

## Second opinion

Independent depth:2 model perspectives,1 external reviewer,1 refutation call.
Primary exact model suffix unknown; session identifies Codex/OpenAI. Reviewer
observed `anthropic/claude-fable-5.1`, provider Anthropic, effort xhigh, outcome
success, identity source provider_response, verified Facilitator1.14.0.
Command: `tools/council/run invoke --member claude --provider openrouter
--prompt-file .../second-opinions/claude-brief.md --output
.../second-opinions/claude-fable-5.1-review.md`.
Receipt: `second-opinions/claude-fable-5.1-review.md.provenance.json`.
Output SHA2562c812c7b61242a1dd06554d3e45dbbd5955e444f879ba8672f717cd1e9b3feee.
Verified pinned substrate before call; verified success/model/effort/output
hash after. Research-specific lints are absent in this export; the explicit
checks and audit artifact linter enforce this independent call contract.
No council vote or milestone-audit completion is claimed. All external leads
are graded above; response and original packet remain unchanged.

## Quality self-check

| Required element | Recorded |
| --- | --- |
| Scope/spec/criteria |410, research, forward audit,4 criteria above |
| Code quality/conformance/spec fidelity | Present |
| Missing artifacts/risk | Present, rollout distinguished |
| Findings/refutation |7 external leads,5 confirmed/fixed |
| Independent review/provenance |1 verified cross-lab call |
| Evidence/reproduction | Before/after regressions and negative controls |
| Coverage boundary | Source/fixture vs host explicit |
| Instruction recommendations | Not applicable to single Issue scope |
| Punch list/resolution |05, five resolved items with trace |
| User-facing audit tracker | Linked after creation; parent410 stays open |

Audit tracker: [#411](https://github.com/pixelelated/distribution/issues/411).
Parent [#410](https://github.com/pixelelated/distribution/issues/410) retains host rollout.

## Post-audit host installation — policy ordering correction

The owner installed the reviewed bundle; exact helper bytes/root modes and
installer policy checksum passed. The promised live permission check then
failed: a later matching rule from zz-fleet-hardening required authentication.
Sudo-rs's [version0.2.13 manual](https://raw.githubusercontent.com/trifectatechfoundation/sudo-rs/v0.2.13/docs/man/sudoers.5.md)
states that the last matching rule wins, including a broader one. Actual
sudo listing and failed command are retained in first-install-policy-order.txt.
This is the pending installation criterion in410, not a sixth finding
attributed to the completed external review. The original response is intact.

Corrected installer uses zz-pixelelated-reclaim-swap, validates that the
directory include is the final directive and no later active file can
override it, and retires only an unchanged original helper policy. Failed
installation restores all three owned files where possible. It never edits
fleet policy or adds another allowed command. Helper bytes remain identical.
37 tests PASS,37-test negative control fails2; new manifest policy-order-source-
hashes.json binds this source revision. Original35-test receipts remain the
reviewed pre-install version, not final corrected-installer proof. Another
owner-authenticated installation and live grant check are pending.
