# vm-qa on 134e89c4fc

started 2026-10-03 21:03 UTC, guest a at :10022, cloud webdav (port 9010, hash=none modtime=no commit=partial bucket=no), image /workspace/artifacts/rasteratops-candidates/sha256/fc6b9774f79d5fcf6a4e077af1f321b7a125401b08671cad7f0a5c807dbd64d5/RASTERATOPS-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.img.gz, display: GL through virgl on /dev/dri/renderD128

| suite | result | time | log |
| --- | --- | --- | --- |
| scripts | PASS | 794s | `scripts.log` |
| lifetime | PASS | 1s | `lifetime.log` |
| wrapper | PASS | 0s | `wrapper.log` |
| vocabulary | PASS | 0s | `vocabulary.log` |
| french | PASS | 0s | `french.log` |
| quoting | PASS | 0s | `quoting.log` |
| menumap | PASS | 1s | `menumap.log` |
| register | PASS | 1s | `register.log` |
| pair-identity | PASS | 1s | `pair-identity.log` |
| fresh | PASS | 1s | `fresh.log` |
| round-trip | PASS | 83s | `round-trip.log` |
| exit | PASS | 28s | `exit.log` |
| time-to-play | PASS | 68s | `time-to-play.log` |
| walks | PASS | 995s | `walks.log` |
| frame-diff | SKIP | 0s | `frame-diff.log` |

**PASSED with 1 suite(s) SKIPPED** -- a skipped suite could not run (its log says why) and has not passed.

finished 2026-10-03 21:36 UTC

## time to play -- 134e89c4fc on webdav

2026-10-03 21:19 UTC, guest at :10022, cloud `webdav`, payload `full`, 1 repeat(s).

Host state: **vm-qa on serval, guest a**. SSH round trip 4 ms (the launch POST goes over it); one screendump 63 ms, which is the resolution of every frame-derived number below.

Seconds, as median / mean / max.

### UI to game, at rest

| from the press to | median / mean / max | n |
| --- | --- | --- |
| the screen leaving the carousel | 0.09 / 0.09 / 0.09 | 1 |
| the handover (a black screen) | 0.09 / 0.09 / 0.09 | 1 |
| RetroArch existing | 0.47 / 0.47 / 0.47 | 1 |
| **the game's first frame** | **0.61 / 0.61 / 0.61** | 1 |
| RetroArch drawing (200 CPU ticks, or 30 four seconds on) | 4.49 / 4.49 / 4.49 | 1 |

### The exit sync, on its own

| from execute_kill to | median / mean / max | n |
| --- | --- | --- |
| the emulator gone | 0.15 / 0.15 / 0.15 | 1 |
| **the last-sync-exit stamp** | **1.32 / 1.32 / 1.32** | 1 |
| the card gone from the screen | 3.51 / 3.51 / 3.51 | 1 |

Outcomes: completed x1. Payload seeded 616 KiB (RetroArch rewrites the auto-state on exit, so what moves is a little less; the log's rclone line has the bytes).

### Game to game, with the exit sync in flight

| from execute_kill to | median / mean / max | n |
| --- | --- | --- |
| the emulator gone | 0.15 / 0.15 / 0.15 | 1 |
| the relaunch sent | 0.16 / 0.16 / 0.16 | 1 |
| the question answered (STOP IT AND PLAY, D-CLOUD-130) | 1.35 / 1.35 / 1.35 | 1 |
| **the next game's first frame** | **1.01 / 1.01 / 1.01** | 1 |
| the exit sync's stamp | - | 1 |

What the launch did to the sync, from the stamp's token: `?` x1.


renderer: virgl (Mesa Intel(R) Graphics (ARL)). -- the guest's Mesa, from the launch log; display: GL through virgl on /dev/dri/renderD128
