# The cloud folder step on guest d (#363, D-CLOUD-170)

Run 100, `cb0b051b72`, guest d at 640x480, 2026-10-02 00:21-00:46 UTC. The script is `epic-proof-100.sh`, with the log at `proofs-307/logs/epic100.log`. All of the frames below come from that run.

| Frame | What it shows |
| --- | --- |
| `I-1-startup-card.png` | Boot, on a device still on `/ROCKNIX`: the startup sync's card first (SYNCING SAVES AT STARTUP, CHECKING THE CONNECTION...). |
| `I-2-step-scan.png` | Then the step's scan: CHECKING YOUR CLOUD, CLOUD FOLDER, ITEM 1 OF 1, with CANCEL. |
| `I-3-move-question.png` | Then the question: MOVE, KEEP USING /ROCKNIX, NOT NOW. |
| `I-4-asked-again-next-boot.png` | After NOT NOW, the next boot asks again. |
| `I-5-move-done.png` | MOVE at boot: MOVING YOUR CLOUD FOLDER, COMPLETED, 10 FILES MOVED, YOUR CLOUD FOLDER IS NOW /Rasteratops. |
| `I-6-next-boot-quiet.png` | The boot after the move: the carousel, no step. The journal reads `nothing to settle (--needs-step 1)`. |
| `J-offline.png` | Booted with the link cut on the monitor: FINISH CLOUD SETUP, with CONNECT TO WI-FI and NOT NOW. |
| `K-1` to `K-5` | A restore's marker and an earlier folder at the same boot. FINISH RESTORE PROCESS comes first. LATER brings no step. On the next boot, FINISH brings the step. |
| `L-1-move-question-after-step3.png` | The end of cloud setup, through the repair route: the step's question over the wizard's step 3. |
| `L-2-setup-complete.png` | After NOT NOW: CLOUD SETUP COMPLETE, listing the folders where NOT NOW left the device. |
| `E-run100-move-for-a-gamesfolder-the-backup-made.png` | The defect run 100 found (#364, D-CLOUD-172). On a stock `/GAMES` with nothing in the cloud, the startup sync's backup half made `/GAMES`, so the step asked MOVE instead of offering CREATE IT. Run 101 carries the fix. |

## Run 101 (`b2378d9c33`, D-CLOUD-172), 2026-10-02 01:35-02:01 UTC

The same proof as `epic-proof-101.sh`, with each case's remembered choices reset first. It ran 34 PASS and 0 FAIL; the log is `/workspace/tmp/rocknix-session/epic-proof-101.log`.

| Frame | What it shows |
| --- | --- |
| `E-run101-create-it-for-a-carried-games.png` | Case E fixed. On a stock `/GAMES` with nothing in the cloud, the boot's step offers CREATE IT, CHOOSE A FOLDER, and NOT NOW, and the startup sync made no `/GAMES` (the log's E lines). |
| `E-run101-skipped-card-over-the-step.png` | The same boot a moment earlier (`E-boot-0029.png`): the startup card's outcome, SKIPPED - YOUR CLOUD FOLDER ISN'T SET UP YET with SET IT UP: GAME SETTINGS > MANAGE CLOUD STORAGE, is still drawn over the top of the step's CHECKING YOUR CLOUD page. |
| `L-run101-setup-complete.png` | After NOT NOW on the end-of-setup question: CLOUD SETUP COMPLETE. |
| `L-run101-checking-your-cloud-at-end-of-setup.png` | The end of cloud setup, through the repair route: the step's scan page (CHECKING YOUR CLOUD, CLOUD FOLDER, ITEM 1 OF 1) at 01:58:56, between the wizard's step 3 and the move question (`L-setup-0200.png` of the half-second series). |
