# Final P2 fresh resume proof — #368

Read-only agent `m7_p2_final_resume` began with only the repository and the
instruction to resume from its canonical entrypoints. It recovered the exact
route: P2 integration/normal push, pending ES approval, qualified ES pin,
isolated cold build with frozen inputs and actual watcher, then P3/P4.

Independent artifact reads verified feature33faa33c27, next939e73a1d4,
buildc3f0c75661, clean ES4f54ec035/e6e1e4d0f and splash530b334, production
pin39f8883545, absent branded root, memory0/532,0/364,0/60, final watcher rc0
and all nine LED assertions. Parent verified host process shutdown and
preflight; the fresh agent did not have host process namespace access.

## Findings and retest

1. Required readiness document retained active P1 claims. Corrected current
   execution summary and marked the older review tables explicitly historical.
2. Prepared scripts were0644 without explicit invocation; same-path manifest
   copy preceded the EXIT trap. README now gives python3/bash commands;
   launcher supports same-path input and installs trap before receipt writes.
   Two isolated controls confirm same-path success and copy-failure result
   capture, without Docker or an actual build.

Both findings were recorded on #368 before repair. Agent re-read the changed
files and control receipts and returned **PASS for both, no remaining gap**.
This proof does not grant pending ES/splash publication approval or qualify
an unbuilt image. Ordinary final commit/hash updates follow this snapshot.
