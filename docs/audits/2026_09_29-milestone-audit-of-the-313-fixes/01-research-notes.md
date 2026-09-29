# Research Notes -- the audit of the fixes to #313's items (and #315)

**Auditor:** Code Auditor skill
**Date:** 2026-09-29
**Subject:** the Phase 7 fixes of `docs/audits/2026_09_28-milestone-audit-of-the-fix-round` (#313, 34 items) and #315
**Spec:** the punch list's items and their recorded outcomes; #313's checkboxes; #315's acceptance criteria

---

## Running Notes

### Scope, measured

- Distribution, upstream-bound paths (`packages/ projects/ config/ scripts/ distributions/`), `1b0d233657..02546235c1`: 41 files, +2240/-577. By directory: the rclone sources (10 files), `rocknix/sources/scripts` (3), GENERIC_X64 (2), libretro (2), the image, linux, RK3566, RK3326 recipes (upstream's own commits in the merge `4c291eec63`, out of the fork's scope but in the diff), the proxy package and its ctl (`1b309ea8d3`).
- #315: `320d2b2bea..286759eb6d`, the two cloud scripts, the harness section, the round-trip step (its own packet, dispatched 00:13 UTC).
- EmulationStation `87b182fbe..c15c698367`: 27 commits, 34 files, +2297/-252 -- es-app/src (10), es-app/tests/unit (7), es-core (5), the ES fork's `.githooks` (5, fork-only, never upstream), tests (3).
- Since `02546235c1`, on the upstream-bound paths, nothing but #315 (`git diff --stat 02546235c1..286759eb6d -- packages projects`: the two scripts).

### Provenance map (what was verified before, and how)

- Each of the 34 items has a recorded outcome in `05-punch-list.md` § Phase 7 and a ticked checkbox on #313 naming its commit and its fail-before line; the harness gated every merge (`PASSED`, 1215 at the last merge, 1232 now); the streams' named proofs ran on `8196071ff5` (`docs/qa-frames/2026-09-28/proofs-307/run3.md`). These are the streams' and the orchestrator's claims and checks, sequestered here: the seats read the diff against the items' acceptance text, not against the outcomes.
- Not verified by anyone but the orchestrator: whether a fix's mechanism is the one the item asked for, across items; the seams between streams' fixes on shared files (`001-functions`, `backuptool`, the rclone scripts, `ProxyCards`, `SystemConf`).

### The commits (for the seats' packets)

Distribution: see `git log --format='%h %s' 1b0d233657..02546235c1 -- packages projects` (61 commits, the streams' merges and the integrator's). EmulationStation: 27 commits from `7d999fd15` (the guard library) to `bf5d70834` (the 69-gaps card).
