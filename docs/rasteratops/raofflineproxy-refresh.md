# Current RAOfflineProxy integration for0.0.1

M7.P2, #361/#384, D-WORKFLOW-138. Selected main:
`ec60fdd0f6522790d9d1d4d20add397bbc4da945` (verified2026-10-04).
Archive SHA256: `393ffcec34b223fa4315622db7e68a8778a87e1dff2d3aaf289df857fcb7ff2f`.
The four commits after5866cd9 change only the packaged service version string
(alpha2); remaining changes are Android/docs/bundle versions. All15 current
fork patches still apply with zero fuzz;199 upstream and8 fork tests pass.
Evidence: `docs/qa-logs/2026-10-04-proxy-preflight/`. The detailed earlier
refresh history below retains its original source counts and scope.
This is source integration; candidate build and VM qualification remain required.

## Patch disposition

| Prior patch | Current disposition / behavior retained |
| --- | --- |
|001|Rebased: truthful dorequest client errors;401/403 retain auth handling.|
|002|Retained: strip the synthetic casual-only warning from achievement sets.|
|003|Rebased: atomic flush notification stamp; preserve upstream usage accounting.|
|004|Replaced: the old total-library cap is gone upstream. An explicit `budgeted=False` API lets the OS's deliberate scan finish a whole library, retaining queue locks, pacing, batch bounds and server pauses. Default upstream callers keep their100-game window.|
|005|Rebased: refresh thread survives exceptions; auth refusal and consecutive failures stop a pass, alongside upstream background429 handling.|
|007|Retained: use only the configured account's cached sign-in.|
|008|Rebased: automatic corruption-log upload requires JSON true; new usage consent remains independently enforced upstream.|
|009|Rebased: distinct process/thread temporary image paths and atomic publication.|
|010|Retained: store-only requests never attempt the network.|
|011|Rebased: headers identify offline/cache responses.|
|012|Rebased: an offline/store-only image miss returns immediately.|
|013|Rebased: Content-Length and PNG chunk/CRC/IDAT validation before publication, through upstream's current image fetchers and sharded paths.|
|014|Retired: upstream `_fetch_image`/`_thread_connection` already reuse a connection per thread/host, replace closed connections and follow redirects. Existing transport assertions move to that API.|
|015|Rebased: bounded DNS and reuse of the lookup answer, preserving upstream request accounting.|
|016|Rebased: downloaded/cached, absent404/410 and transient outcomes remain visible to the image helper.|
|017|Retired: upstream subset-aware `_iter_achievementsets_achievements`/`build_achievement_game_ids` and award-parity tests already preserve each set's game ID.|

Fourteen refresh patches apply without fuzz and reproduce the reviewed
integration tree. Parent gitlinks retain rcheevos1433173 and libchdr8e7b8bd;
full pins are retained in the evidence directory and existing coupled recipes.
The whole upstream download/queue model remains available. The deliberate OS
helper explicitly opts out of its game-count window and checks `queued`; a
queued game produces FAIL/pending behavior, never OK/offline-ready. Indexed
work uses background request throttling and persists server pauses so restart
cannot defeat them. Image lookup retains older unsharded paths.

## Evidence and remaining gates

`docs/qa-logs/2026-10-03-proxy-refresh/` records the initial125-game failure:
125 reported cached,100 actually cached. Five of eight strengthened integration
controls fail with the old helper; all eight pass with the integrating helper.
They cover indexed/unindexed125-game preparation, failure/retry, current queue
defaults, persisted pause,429 and reopen of an actual predecessor-written
SQLite store with login/cache/base/subset award rows and legacy image paths.
The reconstructed mapping remains base100/subset200 after two reopens.

180 upstream queue, award, consent, image, network and refresh tests pass on
current patched source. The first sandboxed attempt lacked socket/DNS access;
the host run passed. The broad fork harness now passes1,367 checks plus322 focused cloud cases
with0 FAIL/0 SKIP against this exact archive/series. Its initial four failures
were a stale schema annotation and old unsharded-path fixtures; after updating
the fixtures, timeout/503 retries and404/410 absence are exercised and pass.
Network/game boundaries in the whole-library tests are synthetic; no live
achievement account or personal cloud is used. Cold build, packaged service,
offline/online reconnect, image/UI/flush proof and upgrade remain P3.

The isolated concurrent-image-publication contribution under
`docs/upstream/raofflineproxy/image-publication/` remains prepared, not submitted.
General fixes remain owned by #168; upstream acceptance does not gate the
locally qualified candidate.


## Branded runtime discovery follow-up — #408

Replacement134e89 exposed upstream's exact OS_NAME=ROCKNIX detector missing
Rasteratops, so automatic account discovery could not find system.cfg. Patch018
adds the new complete identity while preserving the existing paths, configured
overrides and all queue behavior. Seven isolated controls,36 upstream platform/
config/auth tests and eight fork integration tests pass. The prepared upstream
patch includes focused tests. A rebuilt image must qualify this correction;
the original packaged failure remains in2026-10-03-proxy-identity.
