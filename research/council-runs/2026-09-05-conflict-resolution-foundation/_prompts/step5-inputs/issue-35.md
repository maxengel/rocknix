# #35 [OPEN] qa: fresh-handheld round-trip on two VMs
labels: cloud-saves  milestone: Cloud Saves: Fresh Handheld Journey

Child of epic #26 — the milestone's exit test, run for real.

## Procedure
Two fresh GENERIC_X64 VM disks (`generic-x64-vm`): complete the journey on VM1 (link remote → restore/populate → play → back up), then on a fresh VM2: link remote → RESTORE EVERYTHING (+ content) → re-link wizard → play VM1's save.

## Acceptance criteria
- [ ] Documented step-by-step procedure (work log + this issue) reproducible by someone else.
- [ ] VM2 ends with: settings applied after reboot, saves/savestates/screenshots present, ROMs/BIOS restored, and the re-link wizard having walked WiFi/password/ScreenScraper/RA/cloud steps.
- [ ] A game save created on VM1 loads and plays on VM2.
- [ ] Every defect found is filed as its own issue and linked here before this closes.


## Added by the futro of 2026-09-05 (epic #11)

- [ ] **Two-device both-sides-changed step**: the same save modified on two "devices" (two local roots against one remote) since their last agreement; run the boot pair (`cloud_restore --method=copy --update && cloud_backup --method=copy --update`) and the game-exit `cloud_backup --recent` from each. Pass condition: **neither copy is overwritten** and the pair is reported for the wizard. As shipped today this step fails (blindspot 28) — it must be seen to fail before #22 makes it pass.


- [ ] **Manifest step** (added by the alignment review, 2026-09-05; written before #21 lands so it fails first): plant a savestate and a `.srm`, run the exit path, and assert `savestates/.rocknix/manifest-<device-id>.json` reaches the remote with entries whose `sha256` equal the planted bytes; `remote_hash` is `null` on the WebDAV backend (no hashes) and non-null on S3 (`CLOUD_QA_BACKEND=s3`, MinIO offers md5) — both backends, because the null path is the fallback the schema relies on. Then run `cloud_content_backup` and assert the manifest is **absent** from the content tier.

