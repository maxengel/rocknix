author:	maxengel
association:	owner
edited:	false
status:	none
--
From the manifest alignment review (2026-09-05): the origin badge this issue's comment anticipates ("tiles already render `emulator: core` per slot") should read `device.label`, `core` and `core_build` from the save manifests (`docs/save-manifest-schema.md` §6) rather than re-derive them. The SYNC tile's pull is a transfer and goes through `take_cloud_lock` and, once #22 lands, the agreement record.
--
