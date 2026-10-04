# Cloud folders in pixelelated 0.0.1

A new setup uses `/pixelelated` on your cloud provider. `Saves` holds game
saves, save states, and screenshots; `Backups` holds settings backups;
`Content` holds ROMs, BIOS files, and other game content you choose to back up.

An upgrade from ROCKNIX preserves your configured folders. In **GAME SETTINGS
→ MANAGE CLOUD STORAGE**, the folder workflow can move the earlier `/GAMES`
or `/ROCKNIX` layout into `/pixelelated`. It copies and checks each tier
before removing the old copy, and an interrupted move can be retried. You
can keep your current folder. A custom content folder remains your choice.

Settings backups written by ROCKNIX remain readable. Backup filenames,
partition labels, the default hostname and stored settings keys retain
ROCKNIX identifiers for compatibility; the displayed project name is
pixelelated. Blitterbot remains the developer account, and Rasteratops is a
character rather than the distribution name.

This is prepared release documentation for #409. Publish it with the
qualified pixelelated candidate; an old Rasteratops engineering image is
not the renamed release.
