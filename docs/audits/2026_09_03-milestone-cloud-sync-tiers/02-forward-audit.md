# Forward Audit — Cloud-Sync Tier Restructure

**Auditor:** Code Auditor skill · **Date:** 2026-09-03

Verdicts re-derived from code and from commands run on a live H700. Where the only
evidence would be my own recollection of writing the code, the verdict is UNTESTABLE.

## Issue #56 — seed the folder structure

| # | Criterion | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Wizard against an **empty** remote leaves the folders | **UNTESTABLE ?** | The ES wizard path has never executed. `--seed-folders` was run only against a remote that already had the structure. |
| 2 | Each holds a plain-text note | **PASS ✓** | `rclone lsf -R dropbox:/ROCKNIX/Content` → `README.txt`, `ROMs/README.txt`, `BIOS/README.txt` |
| 3 | `Content/bios` exists; per-system folders described not created | **SKIP ○ (superseded)** | Design became `ROMs/` + `BIOS/` (D-CLOUD-018). **The AC was never edited** → F-06 |
| 4 | Seeded paths byte-identical to transfer paths | **PASS ✓** | Both build `${REMOTE}${CONTENTPATH}/…`; the `--selected` upload landed in the seeded `Content/ROMs/gba` |
| 5 | Works on a bucket remote (S3/B2) | **UNTESTABLE ?** | No bucket remote available. The README-as-materialiser mechanism is reasoned, not demonstrated. |
| 6 | Re-running changes nothing, never overwrites a README | **PASS ✓** | Second run printed 4×`OK`; `rclone cat` showed the README unchanged |
| 7 | Nothing deleted, nothing outside configured paths touched | **PASS ✓** | Script contains no delete verb; paths derive from config |
| 8 | Wizard says what it **will** create, and what exists after | **PARTIAL ⚠** | Only the "after" half shipped → F-07 |
| 9 | Saves sync / content restore do not pull the READMEs down | **PARTIAL ⚠** | Saves allowlist ends `- /**`; content restore copies `ROMs/<system>` not `ROMs/`. Reasoned, not executed. |
| 10 | `BACKUPMETHOD=sync` leaves READMEs in place | **UNTESTABLE ?** | Not run. Reasoned from excluded-files-are-outside-sync's-consideration. |

## Issue #58 — tar container

| # | Criterion | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | A symlinked path restores with the symlink intact | **UNTESTABLE ? (unsatisfiable as written)** | Archives are built from `find -type f`, so **no symlink member can exist**. Separately, tar fails on a *directory* member landing on a live symlink (exit 1, proven). → F-08 |
| 2 | An existing `.zip` still restores | **UNTESTABLE ?** | Never executed; a real restore reboots the device |
| 3 | Retention / sorting / newest-selection treat both formats | **PARTIAL ⚠** | `newest_backup()` verified picking the `.tar.gz`; rotation glob and cloud retention extended but never exercised |
| 4 | Verified on a device, not the host | **PASS ✓** | All tar probes ran on the H700 |

## Issue #59 — per-device system selection

| # | Criterion | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Picker lists cloud systems with sizes | **PARTIAL ⚠** | `--scan` → `gba\|172032\|1`, `psx\|524288\|1` on device. ES page never rendered. |
| 2 | Unsupported systems visibly marked, from `es_systems.cfg` | **PARTIAL ⚠** | Only the `\|1` branch has ever produced output; the `\|0` branch is unexercised → F-09 |
| 3 | Toggling persists; reopening shows it | **PARTIAL ⚠** | `--set-systems` / `--systems` round-tripped on device; ES persistence never run |
| 4 | Download transfers only selected | **UNTESTABLE ?** | Never run |
| 5 | Upload transfers only selected | **PASS ✓** | selection {snes,psx,gba} ∩ local {fbneo,gba,nes,pico-8,psx} → transferred exactly gba, psx |
| 6 | Survives reboot; NOT carried by a system backup | **PASS ✓** | `grep -c storage/.cache backuptool` = 0; `/storage` is persistent |
| 7 | `EVERYTHING` still works | **PARTIAL ⚠** | Code path untouched; not re-run after the change |
| 8 | Empty library and unsupported-system scans are readable | **PARTIAL ⚠** | Empty-library GuiMsgBox exists in code, never rendered |

## Scorecard

| Verdict | Count |
| --- | --- |
| PASS ✓ | 7 |
| PARTIAL ⚠ | 9 |
| UNTESTABLE ? | 5 |
| SKIP ○ | 1 |
| FAIL ✗ | 0 |

**22 criteria, 7 passing.** No outright failures, but two thirds are unverified because
the image has not been flashed. That is the expected shape for pre-flash work — the
error would be reading it as "nearly done".
