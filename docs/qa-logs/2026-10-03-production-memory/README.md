# Production memory and sign-in load — M7.P3

Actual unchanged candidate503e24e10dde6a59aa6c631f789b88b89f8e92e1,
ESe6e1e4d0f91e177e182cc05b1cea74991e1cc45b, fresh16GiB guest d,
640x480 canonical profile. No injected product binary. Each phase uses five
warmups, a stable ES PID, actual emulator exit and unchanged strict limits
VmSize<1024KiB, RSS<2048KiB. Owned WebDAV supplies software50 exit sync.

| Phase | VmSize growth KiB | RSS growth KiB | Result |
| --- | ---: | ---: | --- |
| virgl10 | 0 | 620 | PASS |
| software10 | 0 | 52 | PASS |
| software50 with exit sync | 0 | 1228 | PASS |

All55 software50 exit-sync records, including warmups, are distinct and
successful. Sign-in loaded example.org over HTTPS for30s: peak total RSS
292788KiB, pass=true. This proves page loading and measured memory, not
provider authentication or redirect coverage.

The final shared watcher recorded rc0 at20:56:03UTC and owned processes
exited. Earlier immutable launchers stopped after successful phases because
of host setup errors: unsupported --gl software (use none), then absent
fresh rclone config directory. Original logs remain in the run owner; no
memory failure or threshold relaxation is hidden by the continuation.
The exit helper's incidental return1 is recorded; actual emulator exit and
idle state are independently required on every cycle.

Raw status/maps/smaps and all logs remain in
/workspace/tmp/rasteratops-m7-production-memory-01/. artifact-hashes.json
identifies every retained artifact. Private SSH/config files are excluded.
The run-owned scripts identify inputs and cleanup. A fresh read-only agent
verified all55 success stamps, terminal result, source/candidate identities,
and absence of owned processes. Off-session alert delivery remains #395.
