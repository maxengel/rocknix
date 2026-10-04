# Futro: lowercase pixelelated for the next RC (#409)

## 1. What do we know and what are we assuming?

The owner chose lowercase pixelelated, changed the GitHub organization and
personal handle, kept Blitterbot, and confirmed no systems use /Rasteratops.
The required upgrade is ROCKNIX → pixelelated. The plan is
`docs/pixelelated/rename-plan.md`; this extends current M7.P3, not a new
milestone. No new icon/art direction or telemetry/update service is implied.

Substrate readback on 2026-10-04: `gh api repos/pixelelated/distribution`
returns `full_name=pixelelated/distribution`, default next; org GET lists
emulationstation and splash too. `gh api users/rasteratops` returns User
335803305, Blitterbot remains335883270. The separate maxengel account810989
still exists. `docker buildx imagetools inspect` resolves the new
`ghcr.io/pixelelated/build` address to the required
sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39.
Source GET/SSH reads work. Actual sibling pushes/archive downloads and
container use will be checked when performed; reads do not prove writes.
Build-versus-adopt: reuse existing migration and wordmark mechanisms.

## 2. What known unknowns need investigation?

Inspect every identity consumer, including exact-name branches in ES/proxy,
source archive hashes after org rename, theme wordmark and updater name
gate. The owner has settled the cloud default and predecessor questions;
these are no longer open. Site DNS/deployment is outside this source change.
The existing public-docs fork permission failure and live RA fixture remain
separate unresolved gates. No new image has been built under the new name.

## 3. What patterns from prior work apply that we haven't named?

The runs95–101 retro (2026-10-02) found that changed defaults leave stale QA
fixtures and an OS rename can hide settings archives. Its adjustments were
implemented and qualified on replacement02. Reuse those checks; do not
restart closed findings or transfer old image PASS claims to new bytes.
Keep the archive writer's ROCKNIX suffix and retained paths. Prior kickoff
`2026-10-02-rc-remediation.md` still governs unchanged release work.

## 4. What could we be missing?

A fresh agent might change only URLs, then ship an automatic update branch
because ES still compares OS_NAME against RASTERATOPS. A global replacement
might instead change old evidence or remove archive compatibility. A stale
fixture might make the default look green without exercising the new path.
Blindspots62 (already written),65 (substitute proof),71 (literal defaults)
and73 (watch actual activity) apply; existing guards cover these patterns.

Current source probe:
`rg -n 'getApplicationName\(\) == "RASTERATOPS"' /home/max/Development/emulationstation-next.worktrees/qa-integration/es-app/src/ApiSystem.cpp`
returned `452:    if (getApplicationName() == "RASTERATOPS")`.
The replacement mechanism still owes inert update queries, masked stats,
account discovery, matching boot/ES/theme art and stable stored interfaces.
A failed cutover would most likely be a missed sibling pin or a case mismatch.
The user's clarification removes a proposed RASTERATOPS predecessor gate;
retaining that invented gate would itself delay the actual requirement.

## 5. What adjustments or investigations must happen BEFORE execution?

Record D-WORKFLOW-144/D-CLOUD-174; put #409 first within M7.P3 in the live
milestone and umbrellas. Classify compatibility/history/owner/character
references rather than requiring zero old-name matches. Keep the existing
ROCKNIX adoption suffix. Preserve the qualified frozen build and create new
input provenance for changed product bytes. Test source checks, then the
actual new image; add rename scope to P4. No unresolved question blocks
source implementation, and no personal-cloud mutation is needed for it.
