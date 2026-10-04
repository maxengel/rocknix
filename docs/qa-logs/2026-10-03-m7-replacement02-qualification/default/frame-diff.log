# frame-diff

baseline `/workspace/artifacts/rocknix-images/walk-baseline` (build d72084ccad) against `/workspace/tmp/rasteratops-m7-replacement-qa-02/artifacts/rocknix-images/qa-61b64817bf-webdav-a-20261003-2319/walks`: 78 screens in 1 s.
masks: /workspace/repos/rocknix.worktrees/m7-generic-x64/tools/vm-walks/masks.txt (7); claims: /workspace/repos/rocknix.worktrees/m7-generic-x64/tools/vm-walks/claims.txt (17 live, 0 stale against another baseline).

| screen | box | pixels | verdict |
| --- | --- | --- | --- |
| `confirm-cloud-folder/02-hub-change-folder-row.png` | x 250..1028, y 552..569 | 7379 px | claimed by 308 # CHANGE CLOUD FOLDER's line is YOUR SAVES ARE IN: <folder> -- one line under the row (ES 39d5a9d6d, 8-es claude F-ES-14, D-UI-023) |
| `confirm-cloud-folder/03-folder-editor.png` | x 201..415, y 226..267 | 4056 px | claimed by 353 # the CLOUD FOLDER editor holds /Rasteratops/Saves, the fork's default (D-CLOUD-156); the caret after it is masked |
| `confirm-cloud-folder/04-folder-result.png` | x 250..1028, y 552..569 | 7379 px | claimed by 308 # the same row's line on the hub reopened after the folder change (ES 39d5a9d6d); the reopened hub sits on CHANGE CLOUD FOLDER again (ES 4313a8f53, G-E2-O1) so nothing else on the frame differs |
| `confirm-cloud-folder/05-after-dismiss.png` | x 201..415, y 232..266 | 4006 px | claimed by 353 # the same editor, reopened after the dismiss |
| `continue-to-systems/05-systems-page.png` | x 250..540, y 475..521 | 3693 px | claimed by 308 # PICO-8 listed, 1 FILE NOT YET IN YOUR CLOUD: a system whose only file is empty (the 0-byte Splore.png) was read as nothing to move and left out (ES 52ba93160, 8a gpt); the rows below it shift down |
| `continue-to-systems/05-systems-page.png` | x 236..1043, y 545..676 | 69385 px | claimed by 308 # PICO-8 listed, 1 FILE NOT YET IN YOUR CLOUD: a system whose only file is empty (the 0-byte Splore.png) was read as nothing to move and left out (ES 52ba93160, 8a gpt); the rows below it shift down |
| `restore-page/02-restore-page.png` | x 250..680, y 464..515 | 6251 px | claimed by 349 # SETTINGS dimmed, its line NO SETTINGS BACKUP FROM THIS DEVICE YET and no switch: the QA cloud holds no settings backup from this device's label, so the scan offers none (D-CLOUD-162, D-CLOUD-164 string 3); since ES 551c5a762 the row keeps the rows' inset, where 1acdaf2cce..d9493fe339 drew it flush with the panel's edge |
| `restore-page/02-restore-page.png` | x 971..1029, y 474..503 | 779 px | claimed by 349 # SETTINGS dimmed, its line NO SETTINGS BACKUP FROM THIS DEVICE YET and no switch: the QA cloud holds no settings backup from this device's label, so the scan offers none (D-CLOUD-162, D-CLOUD-164 string 3); since ES 551c5a762 the row keeps the rows' inset, where 1acdaf2cce..d9493fe339 drew it flush with the panel's edge |
| `run-transfer-frames/05-systems-page.png` | x 250..540, y 475..521 | 3693 px | claimed by 308 # the same page on the frames walk |
| `run-transfer-frames/05-systems-page.png` | x 236..1043, y 545..676 | 69385 px | claimed by 308 # the same page on the frames walk |
| `run-transfer-frames/06-selected-all.png` | x 250..540, y 475..521 | 3693 px | claimed by 308 # the same page, all selected |
| `run-transfer-frames/06-selected-all.png` | x 236..1043, y 545..676 | 74761 px | claimed by 308 # the same page, all selected |
| `run-transfer-frames/07-t02.png` | x 684..694, y 325..338 | 116 px | claimed by 308 # ITEM 1 OF 5: the PICO-8 unit counted (same change) |
| `run-transfer-frames/07-t02.png` | x 424..854, y 560..573 | 3893 px | claimed by 308 # the same footer, the frames walk |
| `run-transfer-frames/08-t05.png` | x 565..714, y 288..338 | 2663 px | claimed by 308 # the run carries PICO-8's files too (26 files, 1.1 MB against 23, 640 KB) and still ends at ELAPSED 0:03 (t08: COMPLETED); the t05 sample can catch ITEM 5 OF 5 a moment before the end |
| `run-transfer-frames/08-t05.png` | x 499..782, y 560..573 | 2864 px | claimed by 308 # the same sample: the footer still THIS CAN TAKE A WHILE. |
| `run-transfer-frames/08-t05.png` | x 588..691, y 743..765 | 1210 px | claimed by 308 # the same sample: the help bar still CANCEL |
| `run-transfer/07-transfer-running.png` | x 424..854, y 560..573 | 3893 px | claimed by 308 # the transfer page's footer no longer names a console letter: THIS CAN TAKE A WHILE. (ES 5a7afc4ca, F-RA-14/F-CS-07; es-ui-style-guide Interaction rules) |
| `to-change-cloud-folder/02-hub-change-folder-row.png` | x 250..1028, y 552..569 | 7379 px | claimed by 308 # the same row on the other walk |
| `to-change-cloud-folder/03-folder-editor.png` | x 201..415, y 226..267 | 4056 px | claimed by 353 # the same editor on the other walk |

**PASS** -- 20 box(es) claimed, 0 unclaimed, 0 screen(s) missing.
