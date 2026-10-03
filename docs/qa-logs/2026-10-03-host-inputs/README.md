# M7.P3 host suite candidate inputs — #403

The original discovery searched only build.ROCKNIX-* and consumed the old
warm x64 BusyBox215ea665…a95e812. QA_SYSTEM_ROOT now explicitly selects both
executables under the candidate image/system, and refuses absent or unusable
named inputs. Automatic discovery also recognizes build.RASTERATOPS-*.
Actual old/new selection blocks: original0PASS/8FAIL; corrected8PASS/0FAIL,
covering conflicting roots, spaces, missing/unusable inputs and branded-only
discovery. Candidate BusyBox5e8a9142…dee2f and rclone361c27d9…924c are printed
and hashed at the full run's launch. The full suite remains in progress;
its exact source scope and final result are still owed.

Full exact-input rerun finished20:47:25UTC, rc0:1373 broad+322 layout,
0FAIL/0SKIP. Receipt: ../2026-10-03-content-network/host-after/. The source
scope includes the prepared #401 fix; no replacement image is implied.
