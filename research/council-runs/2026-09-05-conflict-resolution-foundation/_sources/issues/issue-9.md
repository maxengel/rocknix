author:	maxengel
association:	owner
edited:	false
status:	none
--
Scope guardrail: must stay within the cloud-sync allowlist (saves/savestates/screenshots + system-backup zip) and never risk non-synced local data (ROMs/BIOS/art). Preserve excludes in any sync/bisync direction; dir chooser stays within save dirs; keep system-backup partitioned from the saves flow.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
Progress-safety: bisync conflict handling must be non-destructive (keep both, no auto-delete of the loser) — never resolve purely by recency. See #11.
--
