# proofs-307 run 3 on 8196071ff5 (guest d rebuilt from the image), 2026-09-28 19:39 UTC

| script | done line |
|---|---|
| A-pl001 | rc 3; 19:39:03 === done: 0 PASS, 1 FAIL |
| A-pl020 | rc 3; 19:39:03 === done: 0 PASS, 1 FAIL |
| B-holdback | rc 0; 19:39:05 === done: 6 PASS, 0 FAIL |
| B-kill18-reboot | rc 0;     cleanup: /storage/roms/backup: archive  /storage/roms/backup/archive: 19:39:56 === done: 7 PASS, 0 FAIL |
| B-maint-frames | rc 0; 19:42:45 === done: 1 PASS, 0 FAIL |
| B-pl003 | rc 0; 19:42:46 === done: 3 PASS, 0 FAIL |
| B-pl064 | rc 0; 19:43:02 === done: 5 PASS, 0 FAIL |
| B-ssid | rc 0; 19:43:03 === done: 5 PASS, 0 FAIL |
| C-signin | rc 0; 19:45:13 === done: 17 PASS, 0 FAIL |
| D-boot | rc 0; 19:46:24 === done: 5 PASS, 0 FAIL |
| D-fem07 | rc 0; 19:47:34 === done: 3 PASS, 0 FAIL |
| D-pl013 | rc 0; 19:50:19 === done: 2 PASS, 1 FAIL |
| D-pl059 | rc 0; 19:52:19 === done: 6 PASS, 0 FAIL |
| D-scan | rc 0; 19:52:49 === done: 3 PASS, 0 FAIL |
| E1-fcs14 | rc 0; 19:54:30 === done: 4 PASS, 0 FAIL |
| E1-pl024 | rc 0; 19:57:26 === done: 4 PASS, 0 FAIL |
| E1-pl069-control | rc 3; 19:57:26 === done: 0 PASS, 1 FAIL |
| E1-pl069 | rc 3; 19:57:26 === done: 0 PASS, 1 FAIL |
| E1-pl072 | rc 3; 19:57:27 === done: 0 PASS, 1 FAIL |
| E1-wifi | rc 0; 19:59:49 === done: 2 PASS, 0 FAIL |
| E2-frames | rc 0; 20:05:00 === done: 2 PASS, 0 FAIL |
| E2-pl014 | rc 0; 20:22:07 === done: 5 PASS, 0 FAIL |
| E2-pl029 | rc 3; 20:22:07 === done: 0 PASS, 1 FAIL |
| E2-pl061 | rc 0; 20:25:03 === done: 11 PASS, 0 FAIL |
| E2-pl062 | rc 3; 20:25:03 === done: 0 PASS, 1 FAIL |
| E2-pl068 | rc 0; 20:26:58 === done: 1 PASS, 0 FAIL |
| F1-res | rc 0; 20:30:35 === done: 12 PASS, 0 FAIL |
| F2-autoslot | rc 0; 20:32:48 === done: 9 PASS, 0 FAIL |
| F2-widgets | rc 0; 20:34:52 === done: 25 PASS, 0 FAIL |

## Run 3b (2026-09-28 20:37 UTC): the scripts run 3 failed on fixtures, re-run with guest d's own folder and the QA account back

| script | done line |
|---|---|
| A-pl001 | rc 0; 20:39:34 === done: 5 PASS, 0 FAIL |
| A-pl020 | rc 0; 20:39:39 === done: 10 PASS, 0 FAIL |
| E1-pl069-control | rc 0; 20:50:41 === done: 6 PASS, 1 FAIL |
| E1-pl069 | rc 0; 21:01:09 === done: 6 PASS, 1 FAIL |
| E1-pl072 | rc 0;     cleanup, the cloud folder: Ninoid.state.auto Ninoid.state.auto.png 21:02:25 === done: 5 PASS, 0 FAIL |
| E2-pl029 | rc 0; 21:05:30 === done: 3 PASS, 0 FAIL |
| E2-pl062 | rc 1; 21:06:59 === done: 1 PASS, 1 FAIL |
| X-bios-alone | rc 0; 21:09:52 === done: 1 PASS, 3 FAIL |
| X-cut-cfg | rc 0; 21:10:37 === done: 7 PASS, 0 FAIL |
| X-gaps-card | rc 1; 21:11:41 === done: 1 PASS, 1 FAIL |
| X-legacy-zip | rc 1; 21:11:41 === done: 0 PASS, 1 FAIL |
| X-migrate | rc 0; 21:11:43 === done: 2 PASS, 5 FAIL |
| X-socket | rc 0; 21:11:44 === done: 3 PASS, 2 FAIL |
run 3b done 21:11:44

## Run 3c (2026-09-28 21:14 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| E2-pl062 | rc 1; 21:15:44 === done: 1 PASS, 1 FAIL |
| X-socket | rc 0; 21:15:49 === done: 5 PASS, 0 FAIL |
| X-legacy-zip | rc 0; 21:15:57 === done: 2 PASS, 3 FAIL |
| X-gaps-card | rc 3; 21:15:57 === done: 0 PASS, 1 FAIL |
| X-migrate | rc 1; 21:15:57 === done: 0 PASS, 1 FAIL |
run 3c done 21:15:57

## Run 3c (2026-09-28 21:17 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| E2-pl062 | rc 1; 21:19:21 === done: 1 PASS, 1 FAIL |
| X-gaps-card | rc 1; 21:21:06 === done: 1 PASS, 1 FAIL |
| X-migrate | rc 0; 21:21:09 === done: 7 PASS, 0 FAIL |
| X-bios-alone | rc 1; 21:22:33 === done: 1 PASS, 1 FAIL |
| X-legacy-zip | rc 0; 21:23:16 === done: 5 PASS, 0 FAIL |
run 3c done 21:23:16

## Run 3c (2026-09-28 21:25 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| E2-pl062 | rc 1; 21:29:05 === done: 1 PASS, 1 FAIL |
| X-gaps-card | rc 1; 21:30:49 === done: 1 PASS, 1 FAIL |
| X-bios-alone | rc 1; 21:34:06 === done: 1 PASS, 1 FAIL |
run 3c done 21:34:06

## Run 3c (2026-09-28 21:37 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| E2-pl062 | rc 0; 21:39:22 === done: 2 PASS, 0 FAIL |
| X-gaps-card | rc 0; 21:54:22 === done: 4 PASS, 1 FAIL |
| X-bios-alone | rc 1; 21:55:53 === done: 1 PASS, 1 FAIL |
run 3c done 21:55:53

## Run 3c (2026-09-28 21:57 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| X-bios-alone | rc 0; 22:00:05 === done: 1 PASS, 3 FAIL |
| X-gaps-card | rc 0; 22:03:30 === done: 4 PASS, 1 FAIL |
run 3c done 22:03:30

## Run 3c (2026-09-28 22:03 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| X-bios-alone | rc 0; 22:05:58 === done: 2 PASS, 2 FAIL |
run 3c done 22:05:58

## Run 3c (2026-09-28 22:08 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| X-bios-alone | rc 0; 22:10:59 === done: 2 PASS, 2 FAIL |
| X-gaps-card | rc 0; 22:12:14 === done: 6 PASS, 0 FAIL |
run 3c done 22:12:14

## Run 3c (2026-09-28 22:12 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| X-bios-alone | rc 0; 22:14:36 === done: 3 PASS, 1 FAIL |
| D-pl013 | rc 0; 22:16:40 === done: 3 PASS, 0 FAIL |
run 3c done 22:16:40

## Run 3c (2026-09-28 22:17 UTC): the proofs whose scripts were wrong, corrected and re-run

| script | done line |
|---|---|
| X-size-same | rc 0; 22:17:52 === done: 2 PASS, 1 FAIL |
| X-bios-alone | rc 0; 22:20:10 === done: 4 PASS, 0 FAIL |
run 3c done 22:20:10
