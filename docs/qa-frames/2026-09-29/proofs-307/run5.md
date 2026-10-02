# proofs-307 run 5 on 8dd6765af0 (guest d rebuilt from the image), 2026-09-29 02:51 UTC

| script | done line |
|---|---|
| A-pl001 | rc 1; 02:53:16 === done: 1 PASS, 1 FAIL |
| A-pl020 | rc 0; 02:53:57 === done: 10 PASS, 0 FAIL |
| B-holdback | rc 0; 02:54:34 === done: 6 PASS, 0 FAIL |
| B-kill18-reboot | rc 0;     cleanup: /storage/roms/backup: archive  /storage/roms/backup/archive: 02:56:01 === done: 7 PASS, 0 FAIL |
| B-maint-frames | rc 0; 02:59:26 === done: 1 PASS, 0 FAIL |
| B-pl003 | rc 0; 03:00:03 === done: 3 PASS, 0 FAIL |
| B-pl064 | rc 0; 03:00:55 === done: 5 PASS, 0 FAIL |
| B-ssid | rc 0; 03:01:32 === done: 5 PASS, 0 FAIL |
| C-signin | rc 0; 03:04:19 === done: 17 PASS, 0 FAIL |
| D-boot | rc 0; 03:06:07 === done: 5 PASS, 0 FAIL |
| D-fem07 | rc 0; 03:07:53 === done: 3 PASS, 0 FAIL |
| D-pl013 | rc 0; 03:10:33 === done: 3 PASS, 0 FAIL |
| D-pl059 | rc 0; 03:13:09 === done: 6 PASS, 0 FAIL |
| D-scan | rc 0; 03:14:15 === done: 3 PASS, 0 FAIL |
| E1-fcs14 | rc 0; 03:16:32 === done: 4 PASS, 0 FAIL |
| E1-pl024 | rc 0; 03:20:04 === done: 4 PASS, 0 FAIL |
| E1-pl069-control | rc 0; 03:31:43 === done: 6 PASS, 1 FAIL |
| E1-pl069 | rc 0; 03:42:46 === done: 6 PASS, 1 FAIL |
| E1-pl072 | rc 0;     cleanup, the cloud folder: Ninoid.state.auto Ninoid.state.auto.png 03:44:38 === done: 5 PASS, 0 FAIL |
| E1-wifi | rc 0; 03:47:37 === done: 2 PASS, 0 FAIL |
| E2-frames | rc 0; 03:53:23 === done: 2 PASS, 0 FAIL |
| E2-pl014 | rc 0; 04:11:11 === done: 5 PASS, 0 FAIL |
| E2-pl029 | rc 0; 04:14:51 === done: 3 PASS, 0 FAIL |
| E2-pl061 | rc 1; 04:17:06 === done: 0 PASS, 1 FAIL |
| E2-pl062 | rc 1; 04:19:11 === done: 1 PASS, 1 FAIL |
| E2-pl068 | rc 1; 04:21:39 === done: 0 PASS, 1 FAIL |
| F1-res | rc 0; 04:26:01 === done: 12 PASS, 0 FAIL |
| F2-autoslot | rc 0; 04:30:26 === done: 6 PASS, 3 FAIL |
| F2-widgets | rc 0; 04:33:59 === done: 24 PASS, 1 FAIL |
| X-bios-alone | rc 0; 04:37:23 === done: 2 PASS, 2 FAIL |
| X-cut-cfg | rc 0; 04:39:01 === done: 7 PASS, 0 FAIL |
| X-gaps-card | rc 0; 04:41:34 === done: 6 PASS, 0 FAIL |
| X-legacy-zip | rc 0; 04:43:02 === done: 5 PASS, 0 FAIL |
| X-migrate | rc 0; 04:43:50 === done: 7 PASS, 0 FAIL |
| X-size-same | rc 1; no done line |
| X-socket | rc 0; 04:45:24 === done: 5 PASS, 0 FAIL |
| X-wifi-forget | rc 1; 04:47:20 === done: 0 PASS, 1 FAIL |

## Run 5b (2026-09-29 04:50 UTC): re-runs after the harness faults of run 5 were fixed (the QA account put back; the offline test waits for idle)

| script | done line |
|---|---|
| A-pl001 | rc 0; 04:54:05 === done: 5 PASS, 0 FAIL |
| E2-pl061 | rc 0; 04:58:20 === done: 11 PASS, 0 FAIL |
| E2-pl062 | rc 0; 05:01:30 === done: 2 PASS, 0 FAIL |
| E2-pl068 | rc 1; 05:04:24 === done: 0 PASS, 1 FAIL |
| F2-autoslot | rc 0; 05:08:49 === done: 6 PASS, 3 FAIL |
| X-bios-alone | rc 0; 05:12:13 === done: 2 PASS, 2 FAIL |
| X-size-same | rc 0; 05:13:03 === done: 5 PASS, 0 FAIL |
| X-wifi-forget | rc 0; 05:17:01 === done: 6 PASS, 0 FAIL |
run 5b done 05:17:01
run5b chain done 05:20:45 ra-offline rc 1

## Run 5c (2026-09-29 05:20 UTC): after the FINISH RESTORE SETUP marker a settings-restoring proof left was found and shed

| script | done line |
|---|---|
| E2-pl068 | rc 0; 05:23:47 === done: 1 PASS, 0 FAIL |
| F2-autoslot | rc 0; 05:27:02 === done: 9 PASS, 0 FAIL |
| X-bios-alone | rc 0; 05:30:14 === done: 4 PASS, 0 FAIL |
| X-wifi-forget | rc 0; 05:33:52 === done: 6 PASS, 0 FAIL |
run 5c done 05:33:52
