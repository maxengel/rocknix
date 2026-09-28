# Forward Audit — the fixes for the #307 punch list and the #308 sweep, built as `4234be0b6b` (D-WORKFLOW-057)

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1 in the session; the seats: `anthropic/claude-fable-5.1` at xhigh and `openai/gpt-6-astra` at max, both through the council Facilitator on OpenRouter, D-WORKFLOW-049)
**Date:** 2026-09-28 (Phase 2 dispatched 04:25 UTC; the sixteen outputs in by 04:47 UTC)
**Subject:** the eight fix streams' diffs -- the distribution's `417dcd8610..` each stream's merge into `next` (rewritten as `6f9d43a467`'s history the same night, trees identical) and the EmulationStation fork's `7eae8ed91..` E1's and E2's branches -- judged against the punch list `docs/audits/2026_09_25-milestone-rc-round-since-258/05-punch-list.md`, the sweep rows on #308, and each stream's own plan (`seats/<X>.plan.md`)
**Spec:** the rule files embedded in each packet; the punch items' acceptance text; the register rows the streams cite (D-CLOUD-141..145, D-RA-039/040, D-UI-110..113, D-NET-012/013, D-QA-053)

---

## How this phase was run

One packet per stream (`seats/<X>.diff`, the plan, the report, the harness lines, the brief), the same packet to both seats, neither seeing the other. Each seat returned per-item verdicts (holds / holds in part / does not hold / cannot tell) for the stream's punch items and sweep rows, findings `G-<X>-NN` with severity, category, where, what, failure scenario and evidence, sweep spot-checks, and a coverage boundary. The two seats number independently, so a finding is `G-<X>-NN (seat)`; the lint keys on both (`tools/lint-audit-artifacts`, extended today).

Two things the packets could not carry, found on reading: the streams' later commits (the packets were cut at each stream's first delivery; D, E2 and F1 had follow-ups landed since) and hunks outside the stream's named files (D's `cheevos_armsx2.sh`, F2's gstreamer, ryzenadj, dmidecode and zip recipes). Findings that rest on those gaps are refuted below with the hunk on `next` named, not against the stream.

## Findings index (the seats' own severities; unverified until § Verification)

_(Regenerated from the sixteen outputs once the index is built; the interim draft is `/workspace/tmp/rocknix-session/fix-audit-findings-index.md`.)_

## Verification (Phase 4.5, running; a finding is written here the moment it is checked)

### G-E1-01 (claude, E1) -- the Wi-Fi join's result inverted
**Seat's claim:** E1's `GuiWifi` change treats `joinWifiNetwork`'s return as a bool where the function now returns the exit code, so a successful join reads as failure.
**Checked:** on the integrated ES tree (`test/qa-integration` at `42f9e8851`), `int ApiSystem::joinWifiNetwork` returns the script's exit code, 0 on `WifiText::parseJoin` success (E2's `c0def453a` made the return the code and its callers read it as one); the seat read E1's branch before E2's pass. Routed to E1 to confirm nothing else in its change assumes the old bool.
**Verdict:** **refuted on the integrated tree**; the Critical does not stand. Open only as E1's confirmation.

### G-D-01 (claude, D) -- the ARMSX2 rows have no hunk in the diff
**Seat's claim:** D's report ticks ARMSX2 items whose changes are not in the packet.
**Checked:** `cheevos_armsx2.sh` is not in D's named file list, so the packet builder left it out; `git log 417dcd8610..next -- projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh` holds D's rewrite (+51), read by the orchestrator: the proxy readiness gate and the failure path are as the report says.
**Verdict:** **refuted -- a packet gap, not a stream gap.** The orchestrator's read is the only review those hunks have had; recorded as a coverage boundary in `04-analysis.md`.

### G-F2-01 (claude, F2) -- four sweep fixes with no hunk in the packet
**Seat's claim:** the gstreamer bad/base `die` on a missing library, the ryzenadj and dmidecode credits, and the zip removal are ticked without hunks.
**Checked:** the four hunks are on `next` (`4403918793`, `4f2b1c0cfa`, `bccbf54cd4`, `25c6e7bb26` per F2's follow-up; read by the orchestrator: each is the recipe change the row asked for).
**Verdict:** **refuted -- a packet gap**; the same coverage boundary as G-D-01.

### G-F1-08 (claude, F1) -- the loopback ssh command on a guest off QEMU's NAT
**Seat's claim:** `095-cloud-ssh` should drop the loopback command when the guest's address is not on 10.0.2.0/24.
**Checked:** F1's withdrawal: the quirk runs before the address exists, and the gate would rest on UTM's emulated mode handing out 10.0.2.x, which nobody here can check; the README note stands for a developers' tool (D-QA-053). The orchestrator agrees: a gate that breaks UTM's default on an unverified assumption costs more than the note.
**Verdict:** **withdrawn by the stream, accepted.**

### G-E2-O1 (orchestrator, E2) -- the rebuilt CLOUD hub loses the player's place after a folder change
**Found:** vm-qa run 68's walk `confirm-cloud-folder` against the d72084ccad baseline. ES `e98bfda4b` reopens the hub after CHANGE CLOUD FOLDER takes a folder so the row's line names the new one (#308 8-es claude F-ES-27); the reopened page opens on BACK UP TO THE CLOUD with CHANGE CLOUD FOLDER scrolled off the bottom, and the walk's next A press opened the back-up page where the baseline reopened the editor (frames 04 and 05).
**Verdict:** **Medium, open** -- a least-surprise defect (D-UI-042) introduced by a fix; routed to E2 (the reopened page puts its cursor on CHANGE CLOUD FOLDER).

### G-A-O1 (orchestrator, A) -- PL-020's catch-all check refuses a player's own `--filter-from`
**Found:** vm-qa run 68, `tools/cloud-round-trip` step "a user's own --filter-from is honoured and nothing is added over it": `RCLONEOPTS="--progress --filter-from /tmp/qa-own-rules.txt"` (the player's file, no `- /**`) made `cloud_backup --yes --saves-only` exit 1. `cloud_backup`'s `rules_whole` is applied to every `--filter-from` in the options, not only the managed `/storage/.config/cloud_sync-rules.txt`; the #71 contract says a player's own filter is theirs.
**Verdict:** **High, open** -- routed to A (the check on the managed file only; a case for a player-named file without the catch-all).

### G-A-O2 (orchestrator, A) -- `--match --apply` with no check before it answers SOMETHING CHANGED SINCE YOU CHECKED
**Found:** vm-qa run 68, `tools/cloud-round-trip` step "content transfers honour the system selection": `cloud_content_restore --match --apply` straight after `--set-systems` (no preview) exits 1 with `Nothing was removed: check what would change first, then try again.` and `>>> why SOMETHING CHANGED SINCE YOU CHECKED` (D-CLOUD-141, `aead63cee5`). Nothing changed; there was no plan. The why names a change that never happened.
**Verdict:** **Medium, open** -- routed to A: the contract (apply as the second half of a check) stated, the why for a missing plan naming the missing check, and the tool's step running the check first.

### G-H-01 (orchestrator, harness) -- vm-qa launched the scripts harness with SIGINT ignored
**Found:** vm-qa run 68, scripts FAIL (2) in 0 s: `last-good-scripts-test: SIGINT is ignored in this process (started as a shell background job?); the cancel checks cannot run`. The harness's refusal is right (streams A and D added cancel checks that send SIGINT); `run_suite` ran it as a plain child of a runner started with `setsid -f`, which ignores SIGINT.
**Verdict:** **fixed** -- `next 78f147f762`: the suite is exec'd through python3 with SIGINT reset to default; proven from a shell background job 04:47-04:51 UTC, 844 PASS.

### G-A-01, G-A-02, G-A-05, G-A-09 (gpt, A) -- the four Highs
**Seat's claims:** `rclone check`'s exit status ignored and "0 differences found" matched as a substring ("10 differences found" matches); `set_pointer`'s write unchecked before `relocate` deletes the source; `conf_valid`'s continuation branch `next`s past the shape checks; a root-level saves folder backed up with no `--backup-dir` and no record.
**Checked:** each read against the source on `next` by the orchestrator: the code is as the seat describes in all four (`cloud_migrate_layout`'s `relocate`/`resumable`, `set_pointer`; `cloud_backup`'s `conf_valid`; the saves-root branch). Routed to A to fix with a case first.
**Verdict:** **pending the stream's delivery**; the orchestrator's read says all four stand as High.

### G-B-01 .. G-B-07 (gpt, B) -- the seven guards-fail-closed Highs
**Seat's claims:** `archive_members` failing reads as nothing to protect; `tar -tzf`'s status dropped behind a count; the credential scan's find/grep failures indistinguishable from a clean scan; the backup-dir exclusion's awk and mv unchecked; `finish_restore` says reverted with files left; a failed move of an old ZIP leaves it cloud-eligible while the backup succeeds; `rocknix-evidence` lists files from an unfinished `find`.
**Checked:** read against `backuptool`, `chksysconfig` and `rocknix-evidence` on `next`: each is the shape `engineering-practices.md` § Guards must fail closed names, and none has the positive check the rule asks for. Routed to B.
**Verdict:** **pending the stream's delivery**; the orchestrator's read says all seven stand as High.

### G-B-01 (claude, B) -- the last-good record and `system.cfg.backup`
**Seat's claim:** the strip applied to `system.cfg` is not applied to the `.backup` copy the boot keeps, so a credential stripped from one survives in the other.
**Checked:** routed to B before the audit's outputs were read (the same finding from the orchestrator's read of the strip); B's follow-up 2 is in flight.
**Verdict:** **pending the stream's delivery**; stands as High on the orchestrator's read.

### G-B-05 (claude, B) -- the pid-reuse withdrawal argued the wrong boundary
**Seat's claim:** B withdrew a pid-reuse finding on the ground that the lock lives on tmpfs, which rules out a stale pid across boots but not a pid wrapping within one boot.
**Checked:** the seat is right about the boundary; whether a comm or start-time check is wanted, or a withdrawal that states the real bound (pid_max on this kernel against the boot's lifetime), is B's to answer with the number.
**Verdict:** **pending the stream's delivery.**
