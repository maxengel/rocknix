# QA frames, 2026-09-13 -- #93, #47, #82 and #27 on the VM

GENERIC_X64 `878ec8863b` (EmulationStation `bcc82f113`) on vm-pair's guest b
at 1280x800 and on a fourth guest, d, at 640x480 (`-device
virtio-gpu-pci,xres=640,yres=480`); `02f368914e` (ES `557a27d20`) on guest d
for the second #27 cut. Every frame is `tools/vm-visual-qa`'s screendump,
driven by step files kept in the session scratchpad.

| Frame | What it shows |
|---|---|
| `save-state-manager-four-tiles-1280x800.png` | The manager on `878ec8863b`: START NEW GAME, AUTO SAVE, SLOT 1, SLOT 2, every label whole, the sheet half the screen (#27's first cut, where it happened to work). |
| `save-state-manager-slot-focused-help-bar.png` | AUTO SAVE focused: BACK / DELETE / COPY TO FREE SLOT / LAUNCH. |
| `save-state-manager-after-last-delete-help-bar.png` | After the third delete: START NEW GAME focused, BACK / LAUNCH (#93). On the old build the bar kept the deleted slot's DELETE / COPY TO FREE SLOT. |
| `save-state-manager-four-tiles-640x480-878ec8863b-still-truncated.png` | The same page at 640x480 on the same build: START NEW G... / AUTO SAVE... / SLOT 1... -- #27's first cut failing. The label share fell to its floor because `Font::getHeight` is the tallest glyph rasterised so far. |
| `finish-restore-process-no-cloud-top.png` | FINISH RESTORE PROCESS at boot on a device with no cloud storage: check-circle icons, one line under each row, CHECK CONNECTION greyed under a neutral line (#47). |
| `finish-restore-process-no-cloud-bottom.png` | The same page scrolled: LATER KEEPS THIS LIST -- IT COMES BACK NEXT TIME YOU START UP, OR FIND IT IN NETWORK SETTINGS > FINISH RESTORE PROCESS. |
| `finish-restore-process-check-connection-pressed.png` | The greyed cloud row pressed: NO CLOUD STORAGE IS SET UP ON THIS DEVICE YET. SET IT UP NOW? -- an invitation, not a fault (#47's acceptance criterion). |
| `screenshots-list-after-game-exit.png` | SCREENSHOTS after a PNG was planted while ES ran and the NES probe was launched and ended: both files listed, no UPDATE GAMELISTS (#82). |
| `restore-from-the-cloud-page.png` | RESTORE FROM THE CLOUD with SAVES on, the page the restore below ran from. |
| `screenshots-list-after-cloud-restore.png` | SCREENSHOTS after that restore brought a third PNG down from the QA cloud and the completed page was closed: all three listed (#82). |
