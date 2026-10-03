# Archive selection and setup — #376/#379/#381

56 assertions passed on the actual RC2-upgraded replacement image134e89,
using production writer bytes. Current, legacy, genuinely healed previous-ID,
flat-root and foreign-only directories independently reset and restore the
selected sentinel with exact archive bytes. The current directory wins over
legacy/previous/flat alternatives; same-model archives win over a newer foreign
one. In a foreign-only directory the console restore deliberately falls back
to NEWEST (D-CLOUD-067); the transfer-page settings row requires MINE
(D-CLOUD-156). This proof does not claim foreign-only archives enable that row.

Settings-only /ROCKNIX/Backups and /GAMES/backup survive actual setup, then
scan and restore. The final production writer archive appears in the actual
640x480 restore page with GENERIC X64 and its date. Restoring that selection
recovers the unique ui-writer sentinel. The stronger selected-toggle frame is
in ../root-transitions, visually reviewed at native size.

Coverage correction: this run's explicit-content-root follow and settle
fixtures leave the saves pointer unchanged; they are no-op controls, not proof
of a transition. Join/apply do transition. The strict independently reset run
in ../root-transitions requires all four saves pointers to actually change.
The missing CONTENT_REMOTE key receives /Rasteratops/Content here.
