# P0: the updater note (#344 §2.2, 2026-09-30)

**Branch B: manual adoption.** The fielded RC2 client cannot be made to discover a fork release by a minimal re-point, because the discovery is not in the client.

## Mechanism, read from `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-update` (205 lines) and `busybox/scripts/init`

| Question | Answer | `path:line` |
| --- | --- | --- |
| Mechanism | A `POST` to a **fixed endpoint**, `ENDPOINT_URL="https://update.rocknix.org"`, with form fields `OS=${OS_NAME}`, `ARCH=${HW_ARCH}`, `SOC=${HW_DEVICE}`, `VERSION=${OS_VERSION}`, `UID=<last 12 hex of the machine id>`, `BUILD=${OS_BUILD}`, `DEV=${QUIRK_DEVICE}`, `FORCE`, `BRANCH=${updates.branch}`; the server answers with a URL or with anything else. Not the GitHub Releases API, not a manifest file. | `rocknix-update:10,16-32` |
| Asset match pattern | **None on the client.** The URL's basename becomes the file name in `/storage/.update/`; the `check` mode prints `${filename##*-}` without `.tar` as the version. The server holds whatever pattern exists. | `rocknix-update:94-98,173-177` |
| Redirect handling | `curl --progress-bar -S -L` follows redirects for the file and for `<url>.sha256`. | `rocknix-update:63,112,122` |
| Distro-name check | Client: none (`OS_NAME` is only sent). **Device init**: the update file's **name** must contain the running image's `@DISTRONAME@`, or the init prints "Unsupported operating system update. Please only use @DISTRONAME@ update packages with this distribution." and reboots; then `HW_DEVICE` in the update's `os-release` must equal the running one (`is_compatible`, or the update's `canupdate.sh` says yes). The arch check reads `OS_ARCH`, which `scripts/image` never writes, so it is skipped as "very old build, trust it". | `init:871,882-889,295-372`; `scripts/image:153-165` |
| Draft and pre-release handling | Not applicable: fielded clients never see a GitHub release; they see the server's answer. A draft or pre-release on the fork's GitHub cannot reach an RC2 device. | `rocknix-update:19-29` |
| Version comparison | **None on the client or the device.** The forced mode accepts only an 8-digit date (`^[0-9]\{8\}$`); `display_versions` reads `VERSION` from `os-release`, which is not written, so it prints nothing; the init applies any compatible tar it finds first (`ls *.tar | head -n 1`). | `rocknix-update:160`; `init:311-316,377-391,871` |
| Manual route | Confirmed: a tar in `/storage/.update/` (`UPDATE_ROOT`, `init:34`) is found at the next boot (`check_update`, `init:869-960`), mounted through AVFS or extracted, checked as above, then `KERNEL` and `SYSTEM` are written to `/flash` with `dd conv=fsync` (`update_file`, `init:393-412`) and the bootloader's `update.sh` runs (`init:426-434`). `rocknix-update` itself downloads under a `.part` name and renames only after the sha256 matches (`:100-147`, fork #105). | as cited |
| Integrity | Automatic path: `sha256` of the download against `<url>.sha256`. Manual path: the person verifies the checksum before staging (the runbook does). No signature anywhere. | `rocknix-update:129-147` |
| The EmulationStation side | `ApiSystem::canUpdate` runs `rocknix-update check` and treats exit 0 (or `updates.force`) as "can update"; `updateSystem` runs `rocknix-update` and logs to `system-upgrade.log`; the UPDATES & DOWNLOADS page's CHECK FOR UPDATES switch writes `updates.enabled`, and BRANCH writes `updates.branch`. | `es-app/src/ApiSystem.cpp:212,447-470`; `GuiMenu.cpp:1505-1520` |

RC2's shipped copy (unsquashed from `h700-all-20260929-69e6039f8f`) carries the same `ENDPOINT_URL` at its line 10, and its `os-release` reads `OS_NAME="ROCKNIX"`, `OS_VERSION="20260929"`, `HW_DEVICE="H700"`.

## Why not Branch A

Branch A needs the RC2 device, unaided, to be offered `0.0.1`. The device asks `update.rocknix.org` with `OS=ROCKNIX`; that server is ROCKNIX's and answers with ROCKNIX's releases. A one-line re-point of `ENDPOINT_URL` ships only in the *new* image and changes nothing on a fielded device, and there is no fork service to point it at (base plan §2.2: no manifest service in 0.0.1). The bound the plan set (one read, one minimal correction attempt) is met by the read alone: the correction has nowhere to land. **Consequence to carry into P4:** an RC2 device whose CHECK FOR UPDATES is on will keep being offered ROCKNIX's next monthly release, and would apply it over the fork (the only device-side gate is `HW_DEVICE`), so the fork-aware updater in 0.0.1 must both stop the query and say "manual update required".

## Comparison of `0.0.1` against RC2's `20260929`

| Where a comparison could happen | What happens with `0.0.1` | Ordering |
| --- | --- | --- |
| `rocknix-update <version>` (forced) | `0.0.1` fails `^[0-9]{8}$`, falls to the usage text, exits 1 | not comparable |
| `rocknix-update check` on a fork tar `rasteratops-H700.aarch64-0.0.1.tar` | prints `0.0.1` (the text after the last `-`); a suffix such as `-ROCKNIX` would print `ROCKNIX` instead, so the suffix goes **before** the version or the `check` output is wrong | string, no order |
| `/etc/os-release` `OS_VERSION` | `0.0.1` beside RC2's `20260929`; nothing on the device orders them | none |
| The device init | applies the first compatible `*.tar` in the queue whatever its version | none |
| A person, under Branch B | reads the notes: `0.0.1` is **newer than every date-versioned ROCKNIX build**, by declaration | by declaration |

Version-ordering table for the notes and for the 0.0.2 updater:

| Case | RC2 `20260929` vs `0.0.1` | `0.0.1` vs `0.0.2` | `0.0.1` vs ROCKNIX `20261001` |
| --- | --- | --- | --- |
| equal | same string only | same string only | never |
| older | `0.0.1` is declared newer than any date | `0.0.1` is older | ROCKNIX's dates are outside the fork's order; never offered |
| skip-ahead | `20260929` → `0.0.3` is allowed by the manual route | the fork-aware updater may require sequential 0.0.x, its own decision | not applicable |
| downgrade | `0.0.1` → `20260929` is a manual re-install of a ROCKNIX tar, refused by nothing on the device | `0.0.2` → `0.0.1` the same | not applicable |

## Acceptance table (base plan §2.2), as Branch B reads it

| Case | Required behaviour | Under Branch B |
| --- | --- | --- |
| RC2 → `0.0.1` | offered and applied under the adoption model | the tar staged by the documented procedure applies at the next boot; PASS line: "RC2 device, given the 0.0.1 tar in its update queue, applies it and boots with saves and cloud root intact" |
| Asset-name match | recorded, not assumed | the RC2 init requires `ROCKNIX` in the file name (`init:882`); the migration tar is named to pass it (an `IMAGE_SUFFIX` such as `rasteratops-H700.aarch64-ROCKNIX-0.0.1.tar`, suffix before the version so `check` still prints the version; `scripts/image:110-111`), or the procedure renames the file it stages |
| Redirect following | followed, or Branch B | not exercised: a person downloads from the release page |
| Distro-name check | passes, or Branch B | the name check above; the `HW_DEVICE` check passes unchanged; from 0.0.1 the init's own check names the new `DISTRONAME` |
| Same version | no repeated loop | no automatic check exists to loop |
| Older release | no unintended downgrade | nothing on the device refuses one; the notes say so and the fork-aware updater in 0.0.2 gains the order |
| Later point release / skip-ahead | ordering explicit | the ordering table above; `0.0.1 → 0.0.2` over-the-air is proven before `0.0.2` is published |
| Wrong board / architecture | rejected | `HW_DEVICE` mismatch is rejected (`init:359-372`); the arch check is dead (`OS_ARCH` unwritten), so a wrong-arch tar for the same `HW_DEVICE` name would not be caught -- no such pair exists in the matrix |
| Draft, pre-release, CI candidate | not offered on the stable channel | nothing is offered to a fielded device by GitHub at all; the release discipline (drafts, the candidate store) protects the person who downloads |
| Truncated download / bad checksum | not activated | the procedure verifies the sha256 before staging; a truncated tar fails AVFS and extraction and the init reboots without writing `/flash` (`init:915-943`) |
| Interruption mid-install | recovers, data intact | `/flash` is written file by file with `dd conv=fsync`; an interruption during `SYSTEM` leaves a partial `/flash/SYSTEM` and a bootable `/storage`; recovery is the runbook's card reflash, saves untouched (`init:393-412`) |
| Failed first boot | data-preserving recovery exercised | the supplied stock card, kept as recovery media (`docs/device-flashing-runbook.md:33`), or a reflash of the fork image; `/storage` is never rewritten by an update |
| Unavailable channel | clear failure; no silent fallback to the upstream project | **the current script is the silent fallback**: it asks ROCKNIX's server; the fork-aware updater replaces it |

## Branch B procedure skeleton, with what the read confirms

1. Identify the board and the running build: `/etc/os-release` (`HW_DEVICE`, `BUILD_ID`, `OS_VERSION`) -- reads, no yes needed.
2. Back up saves and configuration (`backuptool`, the cloud), keep the stock card.
3. Download the board's tar from the fork release; verify `sha256`.
4. Stage it: `scp` into `/storage/.update/` under a name containing `ROCKNIX` (the yes for the copy, D-QA-011), then `sync`.
5. Reboot (its own yes); the init applies it and reboots again.
6. Verify: `/etc/os-release` reads the new `OS_NAME` and `OS_VERSION`; saves, `system.cfg` and the configured cloud root unchanged; UPDATES & DOWNLOADS reads "manual update required" and makes no request to `update.rocknix.org` (a `tcpdump` or the journal on the device, or the VM's network capture first).
7. If adoption fails: the stock card, then the fork image flashed fresh and the backup restored.
