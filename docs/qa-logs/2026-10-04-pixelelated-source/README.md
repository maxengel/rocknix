# pixelelated source qualification (#409)

This is source/host evidence, not a built image or an RC verdict. The source
pins, font source and immutable container identity are in `inputs.json`.

- Identity guard: 0 failures; verifies lowercase OS identity, retained RC2
  filename/storage contracts, inert updater/statistics paths, exact ES pin
  and matching ES/theme artwork.
- Focused cloud/archive matrix: **316 PASS, 0 FAIL**. The deliberately false
  assertion returns1 (`cloud-layout-negative.log`), as required.
- Proxy: exact upstream archive SHA verified; all patches apply with zero
  fuzz;16 platform/account/update tests pass, including lowercase identity.
- ES: all three changed C++ units pass syntax checks using the image build's
  compiler; the final screenshot-row edit preserves lowercase and RTL.
- Splash: native build passes; actual renderer writes only in-memory preview
  buffers at640x480, all four rotations, and1280x960. No host framebuffer or
  handheld is touched. The two PNGs are renderer previews, not guest frames.
  Existing unchecked-read/write compiler warnings in fbsplash are unchanged.
- Vocabulary, package lint and accountable council pins pass. The council
  model roster/efforts/verification contract were not changed.

## Scope correction and first-run failures

The first focused run returned317PASS/5FAIL after the default changed.
Its failures all exercised the unshipped run101 → /Rasteratops predecessor.
The owner explicitly confirmed that no systems use that folder and that the
required upgrade is ROCKNIX → pixelelated (D-WORKFLOW-144). Removed six
run101 cases and changed its seventh, re-interruption, to the real RC2
predecessor. All new-layout tier/marker/shelf interruption cases, boundary
cases and RC2 adoption cases remain. The resulting316 cases are not a claim
of compatibility with run101's unshipped /Rasteratops layout. Earlier
successful run101 proofs remain with their original tools and artifacts.

The first broad shell-harness run exposed additional hardcoded /Rasteratops
fixture paths. Its exact owned process group was stopped before editing the
shell harness. The retained initial log and cancellation record distinguish
that obsolete-fixture run from the corrected final run. The final run passed **1,373 broad +316 focused checks,0FAIL**, rc0;
the shared watcher recorded terminal success at02:17:32UTC. active-session reporting
provides delivery here. No disconnected notification destination is configured.

## Remaining release work

Freeze/build new lowercase pixelelated inputs, perform clean install and
actual ROCKNIX upgrade with installed-byte and visual evidence, complete
remaining P3 checks and P4 fixes review, then separately gated P5 staging.
Historical replacement02 stays frozen and must not be relabelled.
