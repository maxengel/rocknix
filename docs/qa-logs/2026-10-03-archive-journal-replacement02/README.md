# Installed archive writer and selected restore journal

Can this be done on the VM? Yes: owned guest-d with replacement02 image61b64817bf,
synthetic single-file settings archive, WebDAV9040. Eight assertions PASS,
runner/watcher/outer0; guest/backend stopped. No source overrides.

Production backuptool writes the compatible ROCKNIX-suffixed archive; actual
cloud_backup writes it under the device folder. cloud_scan identifies the same
archive, cloud_restore fetches its exact hash and backuptool restores the
original sentinel. transfer-journal.txt names the copied archive, and the real
backuptool journal names that same file at CHECKING/RESTORING plus the protected
PRE_RESTORE snapshot. provenance.json records exact archive/sentinel hashes.

This completes selected-file journal evidence alongside the prior current,
legacy, healed previous, foreign-only and flat-root selection matrix and
640x480 SETTINGS-enabled frames. Refs #381, #376, #383.
