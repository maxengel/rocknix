# Launch/exit memory diagnosis — M7.P2 #310

Can this be done on the VM? Yes. All guest work uses an owned, isolated run101
qcow2 overlay, canonical 640x480 software or virgl profiles, the same Ninoid
homebrew ROM, and no personal cloud. This is diagnostic evidence, not a
Rasteratops candidate. Per-run binary, Mesa, ROM and OS identities accompany
CSV and status receipts. Raw maps/smaps remain under
`/tmp/rasteratops-m7-memory/`; the decisive mapping traces are retained here.

## Cause and fix

Virgl controls remain flat. Software llvmpipe adds exactly 10240 KiB per game,
with 21 threads. `jit-trace.log` and matching Mesa BuildID symbols trace that
anonymous rwxp mapping to `rtasm_exec_malloc`; `unload-trace.log` shows SDL
unloading libgallium each game. Mesa's global executable arena was never
unmapped, and unloading lost its pointers. The packaged Mesa patch registers
arena/bookkeeping cleanup and unwinds failed initialization. Actual allocator
DSO tests retain 512000 KiB after 50 reloads before, zero after; concurrent
allocation and mmap/calloc/atexit failure controls pass. The diagnostic driver
build passes. Current upstream source/history are retained for comparison.

Ordinary freed heap was also retained by glibc. Mesa-only 10/50 runs failed;
`heap-trim.log` proves a bounded trim releases about 40 MiB already freed.
ES now has a proposed glibc-only trim after renderer teardown and after GUI
reactivation. Production source passes the real image compile command's
syntax check. The diagnostic binary additionally logs call timings; that
instrumentation is not in production source.

## Results, including failed attempts

| Run | Warmup / measured | VmSize growth KiB | RSS growth KiB | Result |
| --- | --- | --- | --- | --- |
| virgl control-10 | 0 / 10 | 0 | 672 | does not reproduce |
| Mesa-only patched-software-10 | 1 / 10 | 0 | 7060 | FAIL |
| Mesa-only patched-software-50-control | 0 / 50 | 14496 | 15780 | FAIL |
| one-trim trim-software-10-run2 | 1 / 10 | 3368 | 5700 | FAIL |
| two-trims-software-10 | 5 / 10 | 0 | 1916 | PASS original ten-cycle limits |
| two-trims-sync-50-run2 | 5 / 50 | 0 | 6808 | flat VmSize; FAIL added 2 MiB RSS endurance limit |

The original fifty-cycle issue criterion requires flat VmSize with exit sync
on. This diagnostic meets that criterion, with a distinct completed success
stamp on every cycle, but its stricter added RSS test fails and is retained
as such. A same-process continuation is investigating RSS convergence. No
issue is closed and no candidate acceptance is claimed. Five warmup cycles
match the original E1 proof; thresholds were not relaxed to obtain a pass.
The first sync setup attempt failed on a wrong settings pathname, before
config changes; the corrected setup uses the profile's actual J_CONF path.

Use `tools/es-launch-memory --help` for the retained runner. The ten-cycle
command uses `--warmup 5 --cycles 10 --max-vmsize-kib 1024 --max-rss-kib 2048`;
the sync run adds `--expect-exit-sync` and uses 50 measured cycles. Inputs and
owned guest paths are in the canonical checkpoint. The helper's return1 is
retained: it can kill RetroArch successfully then fail an unrelated killall
name; the runner asserts actual process exit and idle interface separately.

`trim-timing-summary.json` records both calls' measured VM cost. It does not
replace candidate time-to-play evidence. Final cold-image qualification and
long-run RSS disposition remain open before an RC call.


## Residual live heap traced and fixed

The continuation added4084KiB RSS across another50 cycles. malloc_info before
and after ten more shows about1.65MiB additional in-use heap, so trimming
alone was insufficient. LeakSanitizer via the loader's `--preload` option
(instrumenting ES only, not its emulator children) traced the dominant leak
to InputConfig::getDeviceParentSyspath. InputConfig::isWheel,
InputManager::getMice and GunManager's initial scan shared the missing
udev_enumerate_unref. ES now releases each enumeration on every exit; a
fallback string is copied before releasing its backing list. Null creation
is handled. Exact matched-source diagnostic build and current-source syntax
checks pass. Ten ordinary cycles after five warmups have VmSize0/RSS+948KiB.

The retained sanitizer comparison is quantitative, not a blanket clean claim:

| Same ten-launch diagnostic | Bytes reported | Allocations |
| --- | --- | --- |
| Before udev cleanup | 1153399 | 14360 |
| After udev cleanup | 15768 | 28 |
| Plus SDL/Mesa small cleanup | 808 | 6 |

No udev frames remain after its fix. The remaining repeated objects were
SDL's display-mode array (768 bytes per video cycle) and Mesa virgl's empty
screen table after a software-profile probe (592 bytes per cycle). Packaged
patches release modes when a display is removed and empty screen caches under
the existing mutex. Both build and fuzz0 exact-byte reapplication controls
pass. SDL2's official release list still names2.32.10 as latest; no SDL3 API
migration is introduced. The final six reported allocations occur once each
at shutdown, not once per game; retain that distinction rather than claiming
LeakSanitizer reports zero. Final normal10/50-cycle qualification is in progress.

Reproduce the allocator reload control with `run-rtasm-controls.py --help`.
It compiles the retained before/after translation unit against an existing
configured Mesa tree, runs50 reloads with four concurrent allocators, and
requires the original to fail and the fixed allocator to pass. Its driver was
rerun successfully after being retained. Injection failure receipts and their
actual C driver remain alongside it.


## Final diagnostic acceptance — all fixes

All use five warmup cycles, then the stated measured count; stable ES PID,
actual RetroArch launch/exit and unchanged limits (<1024KiB VmSize,
<2048KiB RSS). Both software and accelerated rendering remain available.

| Profile / measured cycles | VmSize growth KiB | RSS growth KiB | Verdict |
| --- | --- | --- | --- |
| software,10, sync off | 0 | 532 | PASS |
| software,50, exit sync on | 0 | 364 | PASS |
| virgl,10, sync off | 0 | 60 | PASS |

The50-cycle run has55 distinct successful stamps including warmup. Watcher
1871339 observed runner1865694 in the host namespace and retained final rc0.
No threshold was loosened; the formerly failed RSS endurance limit now passes.
ES source is committed locally as feature4f54ec035 / QA integratione6e1e4d0f;
source pin/push and the final cold Rasteratops artifact remain separate work.
The image's old ES base with the exact changed files and patched libraries is
a diagnostic vehicle. Its hashes do not stand in for the eventual image hash.

The initial virgl retry stopped before cycling because the new overlay lacked
the ROM. After supplying the same hashed homebrew fixture and restarting ES,
run2 is the actual accelerated control; no product failure is hidden.
