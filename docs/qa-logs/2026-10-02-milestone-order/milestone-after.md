# Snapshot: M7: Rasteratops 0.0.1

Historical adoption evidence for #388; the live GitHub milestone is authoritative.

# M7 — Rasteratops 0.0.1

**Current priority: M7.P1 — safe migration and recovery.** Next action: extend the production-script regressions with malformed/newer markers, failed marker publication and interrupted retry cases, then fix the demonstrated failures. No new branded candidate has been built; this is the implementation queue, not a claim that a build is running.

This body is the binding running order (D-WORKFLOW-139). Update current/next work, phase status and evidence here whenever they change; keep open issue titles aligned. Issue numbers below are links, not priority numbers. Delivery: #383. Release contract: #344. Cloud umbrella: #354. Completed readiness assessment: #385 and `docs/rasteratops/release-readiness.md`.

## Ordered critical path

| Phase | Priority / state | Exit gate |
| --- | --- | --- |
| **M7.P0 — Tracking conventions** | **COMPLETE** — tracking reconciliation #388; live readback verified. | This ordered body, open titles and canonical rules agree. No product readiness implied. |
| **M7.P1 — Safe migration and recovery** | **CURRENT**; failing controls and implementation next. | Supported marker versions, repeatable numbered transitions, interruption/marker-failure recovery and settings-lock safety have passing/failing controls; applicable actor/state coverage is explicit. |
| **M7.P2 — Qualified release inputs** | NEXT after P1 source gates. | Proxy functionality preserved, dependencies reconciled, remaining source/harness defects resolved, relevant host checks pass; exact inputs can be frozen. |
| **M7.P3 — Build and qualify the image** | WAITING on source readiness. | One cold branded artifact has recorded inputs/manifest/digests and passing clean-install, upgrade, provider, pair, achievements, UI, memory and timing evidence; software issues close from their own evidence. |
| **M7.P4 — Independent fixes audit** | WAITING on qualified artifact. | Approved primary + Fable 5.1/xhigh review through the verified Facilitator; findings resolved. Changed product bytes return to P3 for rebuild/requalification before the RC call. |
| **M7.P5 — Release staging and publication** | AFTER RC software qualification; separate action gates. | Source bundle, release/adoption/recovery/docs and manifest-bound assets ready; mandatory migration and per-device smoke evidence; publication only on its named authorization. |

### M7.P1 — Work in order

1. **Migration controls and shared state model** — #365 with #356: map applicable actors to T01–T25 assertions, preserve independent settings/content choices, and retain failing controls for the missed transitions.
2. **Versioned, repeatable migration** — #356: strict malformed/future-marker handling, numbered steps/journal, failure at tier or marker publication, safe retry and second-device follow. Name the actual older-build compatibility boundary; do not claim RC2 understands a future protocol.
3. **Settings recovery locking** — #320: deterministic concurrent-write and lock-busy controls, then fix stale recovery-record publication.

P1's source exit permits later candidate VM evidence to remain open. It does not close an issue from host tests alone.

### M7.P2 — Work in order

1. **Current proxy with no functionality loss** — #361 and #384: reconcile local patches with current upstream, prove >100-game preparation, never count queued work as ready offline, preserve cached sign-in/data and queued base/subset awards through upgrade/reconnect.
2. **Compatible current dependencies** — #362 and #386: libsoup/WebKit build inputs plus glslang, SPIR-V headers, cbindgen and unresolved tllist; verified sources, compatibility and package checks. Coupled dependencies retain evidenced parent pins. Distribution ancestry remains frozen by D-WORKFLOW-111.
3. **Remaining software and execution gates** — #310 launch-memory cause/fix, #332 LED script/reselection, #371 push-hook fix, #367 process guard/help, #368 remaining handoff armatures. Diagnostic VM builds are allowed when required to investigate these.

#327's implemented explanation-page change is now a P3 frame/docs verification item. Upstream contribution #168 can proceed with qualified local fixes; upstream acceptance does not hold the candidate.

### M7.P3 — Work in order

1. **Freeze, cold-build and retain the exact artifact** — #383/#344: distro/ES/splash commits, container digest actually consumed, source inventory, concurrency, cold RASTERATOPS root, logs, candidate manifest and digest verification before/after QA.
2. **Clean install and RC2 upgrade; actual cloud paths** — #354 and #349/#350/#351/#352/#353/#363/#364/#365/#366/#376/#377/#379/#380/#381. Run full VM QA plus required opt-ins, WebDAV/S3, independently reset promoted cases, pair migration, interrupted retries/future markers, writer-shaped archives, and injected failing controls.
3. **Preservation, performance and identity** — #361/#362/#384 runtime proofs; #310 memory/launch loops; #364 timing; #327 explanation frame/docs; #332 software fixture/UI evidence; #337 identity/manual update; #357 no upstream reporting; #359 licences. English/French at 640x480 and Nova1280x960, time-to-play and image brand/secret/localisation/source checks.

**Engineering-build gate is not the RC gate.** Image-only acceptance criteria must remain open until the image exists and supplies proof. They do not prohibit that engineering build. An RC claim requires the known software bugs resolved and P4 completed; no RC2 bug waiver carries automatically.

### M7.P4 — Work in order

The fixes review belongs to #383. #375/#382 are the completed initial review and dispositions; do not restart them. Use the approved cross-lab depth and verified receipts. Resolve findings, renew affected artifact evidence, then make the RC readiness call. The general automatic version/depth policy is later #378, not a missing authorization for this review.

### M7.P5 — Work in order

#265 and #344 own manifest-bound release selection/draft tooling, corresponding-source publication, adoption/recovery/release notes and public docs. Preserve the approved support matrix. RG35XX SP migration precedes remaining device attachments; each asset needs its own smoke evidence (D-WORKFLOW-100/120). Physical actions, personal-cloud writes and publication retain their named-action gates. Keep unqualified assets held.

## Placement and historical references

M7-wide umbrellas: #383 delivery, #344 release contract, #354 cloud scope. Their titles omit P because they span phases. Other open titles use their owning M7.P phase. An input issue assigned P2 can retain image-only acceptance for P3; title placement does not waive that criterion.

The older #344 headings remain **contract sections**, not this execution queue: contract P0 is historical investigation; contract P1 spans current P2/P3 custody; contract P2 maps to current P3; contract P2b/P3/P4 map to current P5; contract P5/P6 are later work. Cite `#344 contract P2` explicitly rather than renumbering that evidence.

## Explicitly outside this release

Infrastructure topology/off-host restore drill (#347/#348/#355), replacement runner and progressive inherited-code review planning (#336/#339/#346), own telemetry design (#387), full site beyond the approved placeholder, trademark registration and general automatic review-depth policy (#378). Existing decisions D-WORKFLOW-102/113 and the release contract remain binding.

