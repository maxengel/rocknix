# Futro: audited fixes and the combined 0.0.1 candidate (#383)

Written 2026-10-02 before execution. Owner authorization: “let's proceed with
all 4 in the order you've outlined”. Inputs: #344/#354/#365, findings
#376/#377/#379/#380/#381, the runs95–101 retro and the completed #375 audit.
The five product items were explicitly deferred to these owning issues by
#382; this phase implements them. The closed audit is not a closed release.

## 1. What do we know and what are we assuming?

The four steps are tests, fixes, combined branding/build/VM qualification,
then an independent review of the fixes. Bot identity and review routing
are complete. OS identity, executable table coverage and image acceptance
are not. The prior retro's scoped audit was subsumed by #375; both external
reads and primary follow-up probes now exist. No new initial audit is owed.

Fresh substrate checks: KVM exists; no distribution build or QA guest is
running; `/workspace` has 1.9TB free; run101's RECORD is 2438 bytes and the
session proof is 23167 bytes. The proof contains host-specific paths and
cases that depend on prior cases, so copying it unchanged is insufficient.
Production scripts, bubblewrap, rclone, the retained RC2/run101 images and
the synthetic cloud runner exist. Real writer/reader pairing is the first
regression transaction; guest pairing awaits the rebuilt image. This is a
bugfix and identity phase, with no build-versus-adopt decision.

After `git fetch origin next`, `git rev-list --left-right --count
next...origin/next` returned `3 0`. The working tree's product/tools/docs
contents equal `next` despite its older feature history. Rules also match.
`git log --oneline -1 next` returned `c5c866b60f audit: complete cross-lab
Rasteratops readiness review (#375, #382)`; working HEAD is the equivalent
`a3a2f395c4`. New commits will integrate by content-preserving cherry-pick,
without pushing the historical feature branch (#371). Frozen upstream
ancestry remains D-WORKFLOW-111. Other worktrees' held changes stay owned
by those worktrees.

## 2. What known unknowns need investigation?

- T08/T11/T12 whole-boot ordering, T23 interrupted content move, T25
  restricted bucket access and cancellation between pointer writes need
  executable cases. Source hypotheses are not declared failures.
- Card lifetime must be observed independently from worker lifetime.
- The 59ms legacy backup overhead must be remeasured in the guest after
  fixing policy; the existing 30ms criterion is not relaxed.
- Branded cold-build outputs and provider UI at 640x480 cannot be inferred
  from source. They are step3 evidence, so testing work can proceed now.
- Physical migration and publication require their later named actions;
  neither is assumed authorized by synthetic VM qualification.

## 3. What patterns from prior work apply that we haven't named?

Blindspots34/36/69/71/72 apply: host tooling differs from guest tooling;
backend semantics differ; permissive stubs hide actual refusals; copied
defaults drift; a subshell's failure does not necessarily stop its caller.
Runs95–101 also demonstrate that an isolated green rerun cannot validate
a stateful proof chain. Closed milestone issues freshly read: #370 fixed
rule counting, #375 completed review, #382 completed finding disposition.
None implements the five open product fixes. The current pair42/0 is useful
baseline evidence and must be rerun only after relevant source changes.

## 4. What could we be missing?

A fresh agent could “fix” scan by accepting every recursive archive, then
restore another device's settings. Preserve restore's current/legacy/healed
device selection and flat fallback, and assert the exact restored bytes.
Another could replace old OS suffixes globally and erase access to local
recovery snapshots: dual-name compatibility must reach all readers and
retention without deleting inherited archives.

Pre-mortem: a settings-only cloud becomes invisible after a successful save
pointer move; tests pass because they seed flat archives and omit old backup
tiers. Use real writer-shaped directories, independent tier states and
negative controls against the old production scripts. The retained audit
probe already demonstrates the scan mismatch. Fresh source query:
`rg -n 'SETTINGS_REMOTE|MINE=' projects/ROCKNIX/packages/network/rclone/sources/cloud_scan`
returned the root-only lookup at208 and MINE output at224.

Replaced mechanisms: archive selection retains device boundaries and error
reporting; folder classification retains unknown-vs-absent; any removed
per-sync probe retains refusal to recreate abandoned legacy roots; waiting
for card dismissal retains worker-lock serialization. Explicit empty content
root and custom/kept choices remain deliberate settings, never missing data.

## 5. What adjustments or investigations must happen BEFORE execution?

Pre-futro audit: all issue dependencies exist, the product content matches
the audited baseline, acceptance artifacts are available, and the existing
25-cell table includes the added findings. #365's older T01–T19 summary
must refer to T01–T25. No new scope is added.

Post-futro audit: use the ordered checklist below. Every unresolved runtime
question is a test task in #365 or qualification in #383; none blocks writing
the regression cases. Whole-boot behavior cannot be silently redesigned
around the historical lock race. Ready for implementation under the user's
existing authorization, including the commits needed to build it.

- [ ] Step1: real archive writer→scan→restore controls (#381/#376), all
  T-cells mapped, settlement/bucket/content/backups failures reproduced;
  promote the guest proof with reset and a constructed failing assertion.
- [ ] Step2: fix archive path/identity, bucket unknown, backup tier retention,
  explicit root, failed-settlement seeding, startup card ordering, timing
  and source-derived QA fixtures. Run relevant old/fixed controls.
- [ ] Step3: finish #337, package/check/integrate the frozen input set;
  cold branded build, clean/upgrade/full VM/pair/visual/timing qualification.
- [ ] Step4: code-auditor review of the fixes with the approved other-lab
  reviewer; resolve findings, rebuilding when product bytes change.
