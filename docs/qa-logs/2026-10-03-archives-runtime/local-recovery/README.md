# Installed local recovery — #376

23 assertions pass on the actual RC2-upgraded replacement image, terminal
rc0 at22:35:54UTC. Both ROCKNIX- and RASTERATOPS-suffixed production archives
are read. A subprocess-scoped exported tar function delegates real extraction,
records the changed sentinel, then returns failure once for the selected
archive. The unchanged installed backuptool automatically extracts its real
pre-restore snapshot and restores the previous sentinel byte-for-byte. The
fault does not change any installed file. A plain retry restores the target.

Four future-dated mixed-name histories model a clock behind existing backups.
Retention keeps the newest three histories plus the active recovery snapshot;
the snapshot remains readable and holds the original sentinel. A subsequent
ordinary backup returns history to three and creates a compatible ROCKNIX
archive whose sentinel lists back correctly. Fixture names/hashes are retained.
All previous overlay archives were moved to a preserved subfolder. The actual
RC2-upgraded backing disk is unchanged; guest and endpoint stopped.

Two launcher preflight errors (runner path and absent activity directory) are
retained. Neither launched a VM. The successful run uses the original script.
