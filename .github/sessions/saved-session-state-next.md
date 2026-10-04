# Saved Session State

> Saved 2026-10-04T00:04:18.615993+00:00. Previous checkpoint: `.github/sessions/archived/saved-session-state-next-20261004T000418Z.md`.

## Start here

Rasteratops is an immutable handheld Linux distribution and build system
forked from ROCKNIX, not an app. Current work is M7.P3 qualification for0.0.1.
Read AGENTS.md and every-session rules from next, compare your worktree rules,
then this file, the live M7 milestone/#383, `docs/rasteratops/release-readiness.md`
and today's work log. The archive above links the detailed earlier history;
archived running states are historical, not current instructions.

Latest owner asks us to proceed with tests and proactively monitor failures,
stalls and completion. Ordinary fixes/tests/VMs, exact single-commit integration
onto next and normal distribution fork pushes are authorized. No handheld
actions, personal-cloud writes or release publication. Blitterbot migration
and earlier named ES/splash pushes are complete; no repeated permission needed.
Never expose credentials. No goal tool was created.

## Current result and next work

**No build or test is running.** Replacement02 build and all tests launched in
this batch completed; owned QEMU guests and cloud endpoints stopped. No
watcher is armed for a future job and no disconnected alert is configured.
The build is an engineering candidate, NOT an RC; P4 remains owed.

Completed on frozen61b: all15 defaults/0FAIL/0SKIP;16 UI walks/78 walk frames
plus16 time-to-play frames; baseline comparison; actual RC2 upgrade; exact
clean/upgraded script/policy readbacks; packaged proxy20; S3 failure10;
root transitions/sentence22; archive writer/journal8; final actual-upgraded
archive14, isolated timing4 and identity11 assertions. Final installed timing
264ms legacy/241ms current =23ms, PASS unchanged30ms limit, every transfer
hash verified and no migration journal activity. No source override.

Next, in milestone order:
1. Finish remaining P3 identity/manual-update/brand/secret/localisation and
   source/licence/readiness mapping. Existing targeted source/image checks are
   not a universal secret or network sweep. #337/#359 and release contract#344
   retain their unverified criteria; public-site delivery has the403 below.
2. Live ordinary-mode RA award/reconnect proof still needs the earlier
   QA-account fixture answer. Continue independent work without resetting an
   account or claiming a live award from synthetic queue preservation.
3. Approved P4 primary plus Fable5.1/xhigh fixes audit through the verified
   Facilitator; #375/#382 are completed initial review, do not restart them.
   Resolve findings; changed product bytes require affected rebuild/requalification.
4. P5 source/docs/adoption/recovery/publication and per-device work stay
   separately gated. First handheld is RG35XX SP/H700 DDR4; GENERIC_X64 is
   not its image. No RC call or handheld staging yet.

The milestone body is the ordered current priority list (D-WORKFLOW-139).
M7.Pn identifies phases; issue numbers are references. Update/read back live
bodies when work changes. Known software bugs close only from their evidence.

## Trees and immutable candidate

- Feature `/workspace/repos/rocknix.worktrees/conflict-resolution`, branch
  feature/conflict-resolution; previous published evidence07e39237d42e5e180c096963d517457bbc1a1bc2.
- Primary `/workspace/repos/rocknix`, next; previous published evidence
  e2267b475cbe1372cd8a1ac33da9bc7caa5ad231 (exact cherry-pick).
  This checkpoint/final evidence batch advances docs only; inspect git/remote
  HEAD for its final hashes. Integrate exact commits, never merge unrelated work.
- Build `/workspace/repos/rocknix.worktrees/m7-generic-x64`, build/m7-generic-x64,
  **frozen61b64817bf8ab48237e51abb395484e36cbf924b**. DO NOT advance for docs.
  Preserve generated tracked `documentation/PER_DEVICE_DOCUMENTATION/GENERIC_X64/SUPPORTED_EMULATORS_AND_CORES.md`.
- ES pinned/published e6e1e4d0f91e177e182cc05b1cea74991e1cc45b at
  `/home/max/Development/emulationstation-next.worktrees/qa-integration`.
  Splash7450aa8180ae66684814dd460f31eb502b2abf61 unchanged.

Bundle:
`/workspace/artifacts/rasteratops-candidates/sha256/87b8c01d65dc22b4f29049bd0d69307a59c14c16f5223534e95058b2234ca5cd/`

- Image `RASTERATOPS-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.img.gz`,2073132412bytes,
  SHA f1af353331dfb1da9911b34db6b19d124feed28f59c669f3c046704acde93f47.
- Tar2073989120bytes,
  SHA cda2524063cd75b3445cfccf7e9fe6b923ae7e9a952e8855f9271a1d2c84f30b.
- Input manifest `/workspace/tmp/rasteratops-m7-replacement-02/inputs.json`,
  SHA5344827ad829dfeb126055bea2fb9ea2f719044c06829f180bf047356cbed2d2;
  6612files/180raw symlinks/1608recipes. Build642tasks finished23:16:46UTC rc0.
- Container ghcr.io/rasteratops/build@sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39;
  global24/WebKit4; upstream frozen9fd38fa87094d4f0e956d03ac6c660fe4fd5e9d6.
  Original cold root cached, rclone+proxy cleaned and image stamp invalidated;
  no diagnostic root copied. All inputs and assembled scripts verified.

## Latest completed runs and receipts

All paths under `docs/qa-logs/` below; no tool session remains to await.

| Run | Owner / watcher | Outcome / retained evidence |
| --- | --- | --- |
| Main replacement02 | `/workspace/tmp/rasteratops-m7-replacement-qa-02/`; frozen `.build-runs/20261003T231900Z-6a9ba405/` | defaults15PASS, RC2 upgrade, clean/upgraded eight-file readback, custody; runner3637372/watcher3637373 and waiter14426 done0 at23:54:39. `2026-10-03-m7-replacement02-qualification/` |
| Final runtime | `/workspace/tmp/rasteratops-m7-final-runtime-02/`; feature `.build-runs/20261003T235511Z-4eb57f50/` | archive14/timing4/identity11 PASS; waiter65240 and runner4136059/watcher4136060 done0 at23:56:11. `2026-10-03-m7-final-runtime/` |
| Proxy | `/workspace/tmp/rasteratops-m7-proxy-runtime-04/`; feature run20261003T233311Z-c453f106 |20PASS; waiter75788 done0; `2026-10-03-proxy-runtime/` |
| S3 query | `/workspace/tmp/rasteratops-m7-s3-listing-03/`; feature run20261003T233621Z-c14ecea5 |10PASS; waiter53337 done0; `2026-10-03-s3-parent-listing-replacement02/` |
| Root transition | `/workspace/tmp/rasteratops-m7-root-runtime-02/`; feature run20261003T233734Z-91d13a6e |22PASS; waiter76209 done0; `2026-10-03-cloud-root-replacement02/` |
| Selected archive journal | `/workspace/tmp/rasteratops-m7-archive-journal-02/`; feature run20261003T233908Z-950ce566 |8PASS; waiter21508 done0; `2026-10-03-archive-journal-replacement02/` |

Retained actual RC2-upgraded disk:
`/workspace/tmp/rasteratops-m7-replacement-qa-02/pair/vm-a.qcow2`.
Never reset it. Final runtime `final-overlay.qcow2` is a stopped COW of it,
with its own key under final-runtime-02/pair/qa-key. Other stopped guest-d
COW chains and old original bundles remain intact. Create a new owner/overlay
for more tests, install the owned public key through serial on every boot.
Do not execute the old immutable launchers blindly: they own reset/fixtures.

`build.status` is watcher text; `build.rc` is terminal result; owner/outer.rc
records shell outcome. Terminal status heartbeat deliberately stops. Inspect
with `cat <run>/build.status`, `tail -n40 <run>/build.log`, and `cat <run>/build.rc`.
For host PIDs use escalated read access; stop by validated owned PID only.

## Scope, closures and preserved failures

#380/#407/#408 were closed from preceding published e2267b475c evidence.
This final batch's issue-evidence.md maps completed #364/#376/#377/#379/#381/
#357 criteria to exact receipts; reconcile live issue state against that file.
#376 wording now preserves D-CLOUD-067 console NEWEST fallback and separately
D-CLOUD-156/162 UI MINE eligibility. It does not invent a foreign-archive ban.
Old negative controls: `2026-10-02-cloud-remediation/baseline.log` and
apply-other-old.log; latest full1373+322 host controls all pass under
`2026-10-03-directory-probe-host/`. Main default scripts795s pass on61b.

Synthetic predecessor SQLite SHA a796c1e6ce6373a6620dfa983e16de3012b6d8feb83f9a2c178f437d8c0adca5
was written with old proxy Storage code. Current packaged modules twice reopen
all cache/sign-in/queue rows; actual service exposes base/subset queued awards
and old badge bytes while offline. This is not a live award/reconnect proof.
Proxy pin stays5866cd9ba784c13771a99c52dd6b6f2acc546842; upstream patch018 is
prepared under docs/upstream/raofflineproxy/rasteratops-identity, not submitted.

Preserved fixture failures: proxy02 wrong legacy-image directory; proxy03
cache_images=False with an incompatible image expectation; S3 attempt02
missing serial key installation. Corrected runs change no product bytes.
Original134e timing46ms and stricter39ms FAIL remain; source-bound20ms PASS
was diagnostic, now installed23ms PASS. No GOMAXPROCS/cache shortcut adopted.
Directory slash retains presence/absence/error checks. Original provider outer
waiter46328 reported143 despite child/watcher0; isolated lifecycle retry0,
cause remains unproved. New successful launches retain explicit outer.rc.

Previous bundles: original503e83751e812351c72fc80a6a3cf418929769158684345cf6dd5f9e0fbcd9877d21;
replacement134e fc6b9774f79d5fcf6a4e077af1f321b7a125401b08671cad7f0a5c807dbd64d5.
Their tests keep their scope: original all15 defaults across corrected runs,
S3 full roundtrip, pair42/42, guest matrix19cases249PASS, memory virgl10/
software10/software50 (VmSize0; RSS620/52/1228KiB),55unique exit-sync stamps.
Replacement134e all7WebDAV+7S3 link cases477/463s, actual upgraded archives24+
selection/setup56+strictroot22+recovery23. All24 EN/FR640/1280 release frames
visually reviewed; source ES unchanged. Their receipts/history are archived.

## Remaining inputs and watcher contract

- Dedicated RA QA account already earned ordinary Tobu100359. Earlier question
  pending: owner resets that test achievement or privately configures another
  QA account. Do not reset or substitute hardcore unearned state; never print
  account secrets. Sign-in-page memory proof is not provider authentication.
- Public-site screenshot commit4f6df54 in `/home/max/Development/rocknix.org`,
  branch docs/cloud-saves-native-wizard, is local only. GitHub403 refuses
  Blitterbot push to maxengel/rocknix.org. No alternate credentials/remote.
  #327 and related site criteria stay open; this was not auto-review rejection.
- #395 disconnected destination remains unanswered. Death/monitor-loss/short
  stall controls and active-session notices pass; no external notification
  is armed. Each future long job needs immutable runner/watch-build, existing
  activity-dir, recursive detail logs,5s checks/5min suspected inactivity,
  explicit outer.rc and active-session checks<=60s. Report terminal outcomes
  before unrelated work. Never edit executing scripts, reset another run's
  backend, or end with a detached watcher while promising future delivery.

Fresh-context read-only resume proof at23:47 verified actual processes,
counts and frozen trees. Its current-tracker lag/status-command/path wording
findings were corrected; final state is now complete/stopped, not those
historical running PIDs. Audit cadence remains due and unwaived. Consumed
source inventory568roots is provenance, not P5 corresponding-source publication.
