# M7.P2 proxy source qualification — #361, #384

Current upstream5866cd9ba784c13771a99c52dd6b6f2acc546842 replaces248ce5ac;
archive SHA2561bc5a88f379c958e958348efd1e5de3edeb8682fe42432b6415f4f29cabc218e.
The14 retained patches apply with fuzz0. Patch014's connection reuse and017's
subset mapping are supplied upstream and retired after behavioral checks.
`docs/rasteratops/raofflineproxy-refresh.md` gives the per-patch disposition.

- `fork-integration-before.log`: old helper fails5 of8 controls.
- `fork-integration-final.log`: all8 pass against a fresh patch reapplication.
  Actual old writer state is reopened twice by the new code: cache, offline
  sign-in, queued base/subset awards and unsharded image lookup survive.
  Indexed and unindexed125-game preparation, retries, queue budget and
  persisted429 backoff are checked without counting queued work as ready.
- `upstream-integration-host.log`:180 upstream award/queue/image/network/
  consent/refresh tests pass. The initial sandbox run could not bind/connect;
  its transcript is kept separately, not counted as a product failure.
- `broad-initial.log`:1363 PASS,4 FAIL,322 focused PASS. The failures named a
  stale schema comment and fixture assumptions about unsharded image paths.
  D19 now evicts the real sharded cache files, preserving its timeout/503,
  nonpublication and successful retry assertions.
- `broad-final.log`, `.rc`, `.status`:1,367 harness PASS,322 focused PASS,
  0 FAIL/0 SKIP, exit0. This is the final production recipe/helper input.
- `source-hashes.json` identifies all tested proxy inputs and the coupled
  rcheevos/libchdr recipes; `coupled-pins.tsv` retains upstream parent pins.

Commands: `tools/raofflineproxy-integration-test --source <fresh-patched-tree>
--predecessor-source <old248ce-plus-fork-patches>` and
`tools/last-good-scripts-test`. Temporary integration and predecessor trees
are recorded in the canonical checkpoint. The default upstream queue retains
its100-game budget; only the deliberate whole-library operation opts out.
Upstream pacing and shared pause state remain active in both paths.

These are host/source checks. Cold image packaging, the image's UI/daemon,
upgrade and reconnect proofs remain M7.P3; no candidate has been qualified.

After the broad PASS receipt, #368 added only argument dispatch to
`last-good-scripts-test`: help and invalid arguments stop before fixtures,
and focused layout arguments still reach their runner. The original hash
manifest is retained unchanged. Five dispatch controls pass in
`../2026-10-03-process/help-controls.log`; the tested proxy bytes are unchanged.
