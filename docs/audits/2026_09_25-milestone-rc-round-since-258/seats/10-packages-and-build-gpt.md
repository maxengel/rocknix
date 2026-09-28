Two potential release blockers are supported by the embedded code: stale-lock recovery can admit concurrent settings writers, and the credential filter leaves some valid unquoted passwords unchanged in support bundles. The QEMU quirks also generate invalid systemd units and contradictory service ordering. These are static findings; I have not run commands, accessed the filesystem, or independently re-hashed the sources.

# Summary

This bucket combines package and cross-compilation changes with substantial changes to settings recovery, diagnostics, boot ordering, and VM services. I would not approve it as presented. The most serious findings are support archives that can contain unredacted credentials, settings-lock recovery that can admit concurrent writers, and QEMU configuration that generates invalid or contradictory systemd units. Several error paths also discard failures and report success, undermining the recovery and packaging guarantees described in the comments.

All code references below identify hunks within embedded source **S1**, not files independently read from a checkout. The declared source paths and Facilitator-verified hashes are recorded in `corpus.provenance.json` under **Coverage boundary**.

# Findings

### F-PB-01: Valid unquoted passwords can pass through the support-bundle filter unchanged
- **Severity:** Critical
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`: hunk `@@ -25,6 +25,72 @@`, `redact_credentials`
  
  `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-evidence`: new-file hunk, `take`, `filter_tree`, and `collect`
- **What:** The unquoted-value expression cannot match a credential whose first character is `&` or `;`. Such a value can remain completely intact in an archive described to the player as credential-filtered.
- **Failure scenario:** A collected log contains `root.password=&example-value`. The quoted-value expressions do not apply, and the unquoted expression rejects the leading `&`; collection therefore archives the complete value, which the player can then send as instructed.
- **Evidence:** The unquoted matcher requires `[^[:space:]\"'&;]+`. Collection copies logs, invokes this filter, and then reports, “Every file in it has been through the credential filter.” Refutation attempted: the flag, Fetch-line, token-format, and URL expressions do not cover this ordinary unquoted assignment.
- **Fix:** Parse the supported log formats and redact the complete value, or conservatively redact the remainder of an ambiguous credential field. Add fixtures covering leading delimiters, embedded spaces, and escaped quotes, and check the resulting archive—not just individual helper outputs.
- **Confidence:** high — the unmatched input and subsequent archive path follow directly from the supplied code.

### F-PB-02: Stale-lock recovery can delete a live writer’s lock
- **Severity:** Critical
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`: hunks beginning at new lines 143 and 167, `wait_lock` and `write_setting_line`
- **What:** Reading the lock twice does not make its removal conditional on its continued ownership. Two processes can consequently enter the settings critical section and write the same `system.cfg.tmp`.
- **Failure scenario:** Two waiters observe the same stale PID. One removes the stale lock and acquires a new lock; the other removes that new lock after its earlier comparison, then acquires its own. Their writes can overwrite or truncate one another’s temporary file, losing settings or corrupting the live configuration.
- **Evidence:** The sequence is separate `read`, `kill -0`, second `read`, comparison, and `rm -f` operations. The code itself acknowledges that rereading “does not close” the window. There is also an open-before-write interval in which a live creator’s lock is empty. Refutation attempted: the ownership check in the exit trap does not protect this acquisition-time deletion.
- **Fix:** Use a kernel-managed lock held throughout the critical section, and make every settings writer use it. Do not reclaim ownership by checking a pathname and subsequently unlinking it. Add deterministic concurrent-writer and killed-holder tests.
- **Confidence:** high — both acquisition races and the shared temporary filename are visible.

### F-PB-03: Concurrent evidence collections can put raw logs back after redaction
- **Severity:** Critical
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-evidence`: new-file hunk, `collect`
- **What:** Collections started in the same second on the same device share both their staging directory and archive filename. One collector can overwrite already-filtered files with raw copies while another is preparing its archive.
- **Failure scenario:** Start two collections in the same second. Pause the first after `filter_tree`, let the second copy an unfiltered `exec.log` into their shared `logs/` directory, then let the first run `tar`; its successful archive contains the raw credential-bearing log.
- **Evidence:** `stamp=$(date '+%Y_%m_%d-%H%M%S')` and the device label entirely determine `dir` and `out`; `mkdir -p` accepts the shared directory. Refutation attempted: there is no collection lock, unique staging allocation, or exclusion of writes after filtering.
- **Fix:** Allocate a private, unique staging directory per collection and use a collision-safe final archive name. Publish only that invocation’s completed, filtered tree. Test concurrent collection with credential fixtures.
- **Confidence:** high — the collision and overwrite interleaving require no behavior outside the supplied script.

### F-PB-04: Generated VM units contain invalid multiline ExecStart assignments
- **Severity:** High
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/100-service-lifecycle-coordination`: new-file hunk, generated coordinator and ownership-monitor units
  
  `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/101-virtualization-fixes`: new-file hunk, generated virtualization, NBD, hardware-detection, and readiness units
- **What:** These templates place a multiline shell program inside single quotes without systemd line continuations. Shell quoting does not make physical newlines into a valid multiline unit assignment.
- **Failure scenario:** The scripts generate and enable the units, but systemd reads an unterminated `ExecStart=/bin/sh -c '` assignment rather than the intended program. The coordination and detection services cannot run as written.
- **Evidence:** Multiple units begin `ExecStart=/bin/sh -c '` and continue on subsequent physical lines without trailing backslashes. Refutation attempted: the surrounding shell heredoc preserves those newlines; it does not convert them into systemd continuation syntax.
- **Fix:** Install executable helper scripts and use ordinary one-line `ExecStart` entries, or generate correctly continued assignments. Validate every rendered unit with the target systemd tooling.
- **Confidence:** high — this is a unit-file syntax defect.

### F-PB-05: The VM service configuration introduces boot-ordering cycles
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/093-rocknix-service-fixes`: new-file hunk, D-Bus and hostnamed drop-ins
  
  `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/101-virtualization-fixes`: new-file hunk, `x64-device-readiness.service` and sysinit enablement
- **What:** D-Bus is ordered after hostnamed, while hostnamed is ordered after D-Bus. Separately, ordinary services with default service dependencies are enabled in the early sysinit transaction and ordered before `local-fs.target`.
- **Failure scenario:** Queuing D-Bus and hostnamed together creates an explicit cycle. Once their syntax is repaired, the early readiness services also conflict with their default ordering after sysinit/basic; systemd must reject or break the requested ordering.
- **Evidence:** The opposing declarations are `After=... systemd-hostnamed.service` and `After=... dbus.service`. The readiness unit has `Before=local-fs.target`, is linked into `sysinit.target.wants`, and lacks `DefaultDependencies=no`. Refutation attempted: replacing hostnamed with the later no-op unit does not remove its drop-in ordering.
- **Fix:** Remove the reverse D-Bus dependency and establish a minimal, acyclic boot graph. Give genuinely early services explicit appropriate dependencies. Verify the effective graph, including every generated drop-in.
- **Confidence:** high — the opposing edges are explicit.

### F-PB-06: VM configuration creates ordinary files and directories at socket paths
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/098-dbus-fd-improvements`: new-file hunk, D-Bus drop-in and tmpfiles block
  
  `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/099-mount-configuration-fixes`: new-file hunk, socket mount units and tmpfiles block
- **What:** The generated tmpfiles rules treat D-Bus and journald socket endpoints as ordinary files or directories. The D-Bus service additionally unlinks its socket pathname before starting.
- **Failure scenario:** Processing these rules before socket activation creates a regular `/run/dbus/system_bus_socket` or directories at journald’s socket endpoints, preventing the expected socket bind. With socket-activated D-Bus, unlinking an already-bound endpoint makes that endpoint unreachable by pathname.
- **Evidence:** The rules include `f /run/dbus/system_bus_socket`, `d /run/systemd/journal/socket`, and `d /run/systemd/journal/stdout`; the service runs `rm -f /run/dbus/system_bus_socket`. Refutation attempted: conditional mount declarations do not neutralize the unconditional tmpfiles entries.
- **Fix:** Create only parent directories and leave socket creation to the owning socket units or daemons. Remove the unlink operation and safely clean up already-created wrong-type objects.
- **Confidence:** high — the filesystem object types conflict with the endpoints’ roles.

### F-PB-07: The build environment file is neither invocation-scoped nor reliably private
- **Severity:** High
- **Category:** Security
- **Where:** `Makefile`: hunks beginning at new lines 157 and 176
  
  `scripts/get_env`: hunk `@@ -1,5 +1,22 @@`
- **What:** The `$(shell ...)` prerequisite expansion still creates `.env` while make reads the Makefile, not only when a container recipe runs. Applying `umask 077` also does not tighten permissions on an existing `.env`.
- **Failure scenario:** A checkout retains a mode-0644 `.env` created by the previous implementation. Running an ordinary non-Docker make target with an allowed developer credential exported rewrites that readable file, and the Docker-only cleanup never executes.
- **Evidence:** Generation remains `docker-%: $(shell umask 077; ./scripts/get_env > .env)`, while removal exists only in the container recipe. `get_env` explicitly forwards four credential variables. Refutation attempted: there is no `chmod`, exclusive creation, or recipe-local generation.
- **Fix:** Generate a unique owner-only temporary file inside the actual container recipe, check generation success, and install cleanup traps. Do not use a shared parse-time `.env`; account for the old file left by previous builds.
- **Confidence:** high — make expansion timing and existing-file permission behavior establish the failure.

### F-PB-08: Failed settings writes are returned as success
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`: `write_setting_line` in the hunk beginning at new line 167; `set_setting` in the hunk beginning at new line 327
- **What:** The failure branch of `write_setting_line` returns the successful cleanup status, and `set_setting` subsequently returns the lock-removal status. Callers cannot reliably distinguish a saved preference from a failed write.
- **Failure scenario:** An out-of-space or input-read error makes `awk` fail. The temporary file and lock are successfully removed, so the operation returns zero even though the requested setting was not saved.
- **Evidence:** The failure branch ends with `rm -f "${J_CONF}.tmp"`; the caller executes `write_setting_line ...` followed by `rm -f "${J_CONF_LOCK}"`. Refutation attempted: neither layer captures and returns the writer’s status.
- **Fix:** Return failure explicitly from the writer, preserve its status across lock release, and propagate that status to callers. Test write, rename, and read failures.
- **Confidence:** high — failure is explicitly converted into successful cleanup.

### F-PB-09: A directory reset can report success without replacing the old configuration
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/factoryreset`: hunk beginning at new line 3, `restore_default`
- **What:** `restore_default` ignores failure of `rm -rf` and then copies a source directory onto a potentially still-existing destination directory. That copy can succeed by nesting the defaults inside the old directory instead of replacing it.
- **Failure scenario:** An immutable descendant prevents removal of `/storage/.config/dolphin-emu`. The subsequent directory copy creates a nested `dolphin-emu` directory, leaves the active old configuration in place, and returns success.
- **Evidence:** The sequence is unchecked `rm -rf "${dst}"`, checked `cp -rf "${src}" "${dst}"`, then `return 0`. Refutation attempted: `remove_checked` exists in this same script but is not used here.
- **Fix:** Stage and verify the replacement before destructive work, check removal/replacement explicitly, and prevent directory nesting. Fault-test partially unremovable destinations and insufficient space.
- **Confidence:** high — the directory-copy semantics and ignored removal failure are sufficient.

### F-PB-10: Recovery requests are consumed without a successful rollback
- **Severity:** High
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/chksysconfig`: hunk `@@ -1,34 +1,186 @@`, `finish_restore`
- **What:** `finish_restore` deletes the recovery marker after missing-snapshot and extraction failures. Its parent-directory existence test does not establish that the volume containing the snapshot has actually been mounted.
- **Failure scenario:** An interrupted restore’s snapshot belongs on an external games volume, but the underlying internal path already contains its parent directory. The early check treats the not-yet-visible snapshot as missing and deletes the marker; mounting the correct volume later cannot trigger the intended retry. A failed partial rollback extraction also loses its retry marker.
- **Evidence:** Deferral tests only `! -d "$(dirname "${snap}")"`. Both success and failure then reach unconditional `rm -f "${mark}"`. Refutation attempted: there is no volume-identity check or success-only marker removal.
- **Fix:** Retain the request until rollback succeeds, distinguish unavailable storage from a verified missing snapshot, and retry after the required mount is ready. Make interrupted rollback resumable, following S3’s migration requirements.
- **Confidence:** high — both marker-consuming failure paths are explicit.

### F-PB-11: The secret guard fails open on incomplete or invalid history ranges
- **Severity:** High
- **Category:** Security
- **Where:** `.githooks/pre-push`: EmulationStation new-file hunk, range construction and `hits` pipeline
- **What:** First-push range construction can omit history or generate an invalid range, and a failed `git log` is treated as an empty, successful scan. Excluding commits reachable from any remote also does not establish what the destination remote will receive.
- **Failure scenario:** A repository’s first commit contains a matching credential. With no parent, the hook constructs `${local_sha}^..${local_sha}`; `git log` fails, its error is discarded, and a non-`pr/*` push is allowed. A first push to a different remote can likewise skip credential-bearing history already reachable from another remote.
- **Evidence:** The fallback range requires `local_sha^`; discovery uses `--not --remotes`; scanning redirects Git errors away and ends in `|| true`. Refutation attempted: no separate successful-history-enumeration check exists.
- **Fix:** Derive the scanned commit set from the destination’s known reachability, handle root commits, and refuse on enumeration or diff failure. Test root, first-push-to-another-remote, and unavailable-remote-tip cases.
- **Confidence:** high — the root-commit case directly reaches the fail-open path.

### F-PB-12: Renaming a file bypasses credential scanning
- **Severity:** High
- **Category:** Security
- **Where:** `.githooks/pre-push`: EmulationStation new-file hunk, `git log` invocation
- **What:** The secret scan excludes rename and type-change diffs, despite claiming to inspect every added line in every pushed commit.
- **Failure scenario:** With rename detection enabled, rename a sufficiently similar existing text file and add a credential-shaped line. Git classifies it as `R`, so the hook does not inspect the new line and permits the push.
- **Evidence:** The invocation uses `--diff-filter=AM`. Refutation attempted: there is no second scan for renamed/type-changed files and no `--no-renames` override.
- **Fix:** Inspect added lines without excluding these change classes. Add a renamed-file credential fixture to the hook tests.
- **Confidence:** high — the selected diff classes exclude this input.

### F-PB-13: Failed redaction replacement can still produce an archive labelled safe
- **Severity:** High
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-evidence`: new-file hunk, `filter_tree` and final archive creation
- **What:** Successful filtering is counted even when replacing the raw file fails. The failure branch also does not verify that an unfiltered file was actually removed.
- **Failure scenario:** The filter succeeds, but `mv` returns nonzero while the original staged log remains readable. The function increments `FILTERED`, returns zero, and collection can archive the original plaintext log alongside its claimed redaction count.
- **Evidence:** `mv -f "${f}.redacting" "${f}"; FILTERED=$((FILTERED + 1))` is unchecked, and `filter_tree` unconditionally returns zero. Refutation attempted: there is no final postcondition or abort before `tar`.
- **Fix:** Treat replacement and removal failures as collection failures. Publish no archive unless every staged file is known to be the successfully filtered version or has been successfully excluded.
- **Confidence:** high — the missing status checks and unconditional archive continuation are explicit.

### F-PB-14: The virtual-device udev rules are written with an ignored extension
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/101-virtualization-fixes`: new-file hunk, first heredoc
- **What:** The script writes udev rules into a `.conf` file rather than a `.rules` file.
- **Failure scenario:** The quirk reports successful application, but udev does not load the NBD and virtual-device readiness rules.
- **Evidence:** The destination is `/etc/udev/rules.d/90-x64-virtual-devices.conf`. Refutation attempted: the script neither renames it nor writes a corresponding `.rules` file.
- **Fix:** Install it with the correct extension, remove the obsolete generated file, and test the effective rules with target udev tooling.
- **Confidence:** high — the filename controls rule discovery.

### F-PB-15: Core retention is neither newest-first nor fully bounded
- **Severity:** Medium
- **Category:** Resource
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep`: new-file hunk, low-space return and final pruning pipeline
- **What:** Sorting filenames orders by executable before timestamp, so pruning can discard the newest crash. Note-only failures are never included in the ring and can accumulate without bound.
- **Failure scenario:** Three old `core.retroarch.*.gz` files exist; a newer `core.emulationstatio.*.gz` sorts before them and is deleted. Repeated low-space crashes create unlimited `.txt` notes because that branch exits before pruning and the pruning glob only selects `.gz`.
- **Evidence:** Names are `core.${SAFE}.${WHEN}.${PID}`; pruning uses plain `sort`; the low-space branch exits immediately. Refutation attempted: no independent timestamp sort or note-only cleanup exists.
- **Fix:** Maintain one retention inventory for every attempt, sort by the actual crash timestamp, and prune on all completion paths. Read existing filenames when introducing the corrected policy.
- **Confidence:** high — both counterexamples follow from the filename and control flow.

### F-PB-16: Deleting a setting still interprets its key as a regular expression
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`: hunk beginning at new line 167, `del_setting`
- **What:** Writes now match keys literally, but deletions retain regex matching and can remove unrelated keys.
- **Failure scenario:** A configuration contains `foo.bar=1` and `foo_bar=2`. Deleting `foo.bar`, including through `set_setting foo.bar default`, removes both.
- **Evidence:** Deletion uses `sed -i "/^${1}=/d"`, whereas the new writer uses literal `index($0, k "=")`. Refutation attempted: only `system.hostname` gets the special literal-writing path.
- **Fix:** Use literal key comparison for deletion as well, under the corrected lock, and test keys containing regex metacharacters.
- **Confidence:** high — this retained behavior has a direct counterexample.

### F-PB-17: Save-state arguments can be taken from the ROM filename
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/runemu.sh`: hunk beginning at new line 175, `parse_savestate_arguments`
  
  `projects/ROCKNIX/packages/rocknix/sources/scripts/setsettings.sh`: hunk beginning at new line 906, numbered entry-slot emission
- **What:** Slot and autosave values are still extracted from the flattened argument string rather than argument boundaries. A ROM filename containing the same flag text can override the actual launch option.
- **Failure scenario:** Launch `Demo -state_slot 2 - Part.sfc` with an actual `-state_slot 7` option. The first textual match yields slot `2`, which can be passed onward as the numbered entry slot.
- **Evidence:** `SNAPSHOT="${ARGUMENTS#* -state_slot *}"` takes the first occurrence, and `${SNAPSHOT%% -*}` truncates at the following filename fragment. Refutation attempted: the argument-by-argument parser protects only `-state_file`.
- **Fix:** Parse all save-state flags from `"$@"`, consuming their following arguments and validating their values. Test filenames containing flag-like text.
- **Confidence:** high — the parser deterministically selects the wrong occurrence.

### F-PB-18: The personal-path guard can compare against the fork instead of upstream
- **Severity:** Medium
- **Category:** Upstream fit
- **Where:** `.githooks/pre-push`: EmulationStation new-file hunk, `base_ref` selection and personal-path comparison
- **What:** When upstream references are unavailable, the hook accepts `origin/master` as its baseline. In this fork, that need not represent ROCKNIX’s upstream tree.
- **Failure scenario:** `origin/master` already contains `CLAUDE.md`, and a `pr/*` branch inherits it unchanged. With no upstream reference available, the comparison omits the inherited personal file and allows the push.
- **Evidence:** Candidate selection includes `upstream/master upstream/HEAD origin/master`; refusal occurs only when all are missing. Refutation attempted: no check establishes that the fallback is an upstream commit.
- **Fix:** Require an explicitly verified upstream baseline and refuse when it is unavailable. Test a contaminated fork baseline.
- **Confidence:** high — the fallback and comparison permit the stated repository state.

### F-PB-19: The upstream packet includes explicitly fork-only scaffolding and a generated binary
- **Severity:** Medium
- **Category:** Upstream fit
- **Where:** `CLAUDE.md`: EmulationStation new-file hunk
  
  `.githooks/pre-push`: EmulationStation new-file hunk
  
  `build-tests/es-unit-tests`: EmulationStation binary-addition hunk
- **What:** The proposed change set includes personal workflow files that its own instructions prohibit from travelling upstream, plus an opaque generated test executable.
- **Failure scenario:** none demonstrated; this is a PR-content and reviewability finding.
- **Evidence:** `CLAUDE.md` says “this file, `.githooks/` and `.claude/` never travel.” The diff nevertheless adds the first two and reports the executable only as a binary difference. Refutation attempted: no source-reviewable representation of that executable is available in this packet.
- **Fix:** Exclude the fork-only files and generated executable from the upstream branch. Submit any generally useful hook separately without personal repository assumptions; build test executables from source.
- **Confidence:** high — the inclusion and the stated exclusion policy are both present.

### F-PB-20: The interface core-dump cap depends on an unreliable task-name spelling
- **Severity:** Medium
- **Category:** Resource
- **Where:** `projects/ROCKNIX/packages/sysutils/busybox/sysctl.d/99-coredump.conf`: changed `core_pattern`
  
  `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep`: new-file hunk, per-executable cap selection
- **What:** The 1 GiB cap is selected only for the literal `emulationstation`, while the first argument comes from `%e`, the task comm name. The normal 15-character spelling `emulationstatio` takes the 256 MiB fallback.
- **Failure scenario:** An interface crash delivered with that truncated comm name produces a capped 256 MiB dump instead of the larger dump the change was intended to preserve.
- **Evidence:** The pattern passes `%e` first and `%E` fifth; the cap switch matches only `emulationstation)`. Refutation attempted: the available executable path is not used to select the cap.
- **Fix:** Select the cap using the executable path already supplied, rather than an exact task-name spelling. Test with the actual target kernel’s argument expansion.
- **Confidence:** medium — the handler behavior is certain; the pinned kernel implementation and actual interface comm value are outside the packet.

### F-PB-21: Concurrent core handlers can defeat the free-space floor
- **Severity:** Medium
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep`: new-file hunk, free-space admission and compression
- **What:** The space check admits each dump independently without reserving capacity or serializing writers. It cannot enforce the stated headroom guarantee under concurrent crashes.
- **Failure scenario:** With roughly 800 MiB free, four handlers each observe enough space for the 512 MiB floor plus a 256 MiB cap. Near-incompressible output can collectively fill the card, despite every handler passing its individual check.
- **Evidence:** `df`, the `NEED_KB` comparison, and `gzip` execute without a shared lock or reservation. Refutation attempted: this handler contains no serialization; a global kernel concurrency restriction is not established by the supplied sysctl change.
- **Fix:** Serialize admission, writing, and pruning, or implement actual reservations and bounded concurrent output. Verify any kernel-side limit relied upon.
- **Confidence:** medium — the race exists in the handler; effective global core-handler limits are outside the packet.

### F-PB-22: The VM “security cleanup” disables unrelated service protections
- **Severity:** Medium
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/097-systemd-security-overrides`: new-file hunk
- **What:** The overrides do more than remove unsupported syscall-filter options: they unconditionally disable filesystem isolation and privilege restrictions. On a build supporting those controls, this expands the authority of affected services.
- **Failure scenario:** An effective `ProtectSystem`, `ProtectHome`, or `NoNewPrivileges` restriction is replaced with `no` on the QEMU guest, removing protection from a compromised service or helper.
- **Evidence:** The templates explicitly set `ProtectHome=no`, `ProtectSystem=no`, and, for affected services, `NoNewPrivileges=no`. Refutation attempted: comments about unsupported options provide no feature check or evidence justifying these independent removals.
- **Fix:** Remove the blanket overrides. Correct the underlying build incompatibility or narrowly gate a demonstrated unsupported option while retaining independent protections.
- **Confidence:** medium — the policy removal is explicit; baseline effective units and compiled feature support are not embedded.

### F-PB-23: Re-extraction now silently merges with an old source tree
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `scripts/extract`: hunk `@@ -78,7 +78,7 @@`
- **What:** Changing `mkdir` to `mkdir -p` accepts an already-populated destination, after which tar overlays the incoming tree without removing obsolete destination files.
- **Failure scenario:** The destination contains `obsolete.c`, which is absent from the pinned source being extracted. The command succeeds while leaving that file behind, so the extracted tree differs between a clean and reused destination.
- **Evidence:** `mkdir -p "${FULL_DEST_PATH}"` is followed by a tar-to-tar copy. Refutation attempted: no destination cleanup or content verification appears in this branch; caller cleanup guarantees are outside the packet.
- **Fix:** Extract into a clean staging directory and publish it, or refuse an existing destination unless its contents are deliberately validated. Test removal of a file between extractions.
- **Confidence:** medium — the merge behavior is certain, but normal caller reachability requires the complete extraction flow.

### F-PB-24: Required GStreamer payload copies are treated as optional
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/multimedia/gstreamer/gst-plugins-bad/package.mk`: new-file hunk, `post_makeinstall_target`
  
  `projects/ROCKNIX/packages/multimedia/gstreamer/gst-plugins-base/package.mk`: hunk beginning at new line 1, `post_makeinstall_target`
- **What:** Copies of the libraries and plugins described as necessary for WebKit are silenced with `|| true`. The hooks do not establish that their required runtime payload survived.
- **Failure scenario:** A required shared library or plugin is absent, installed at an unexpected location, or fails to copy. These preservation operations do not fail the package, allowing a missing runtime dependency to escape this stage.
- **Evidence:** Both preservation and restoration copies use `2>/dev/null || true`, including `libgstmpegts-1.0.so*` and the base plugin collection. Refutation attempted: no required-file assertion is present in either hook.
- **Fix:** Make required payload copies mandatory, assert the expected libraries and appsink-providing plugin, and test the final image’s runtime dependency closure.
- **Confidence:** medium — error suppression is explicit; inherited recipes, `safe_remove`, and the final installation flow are outside the packet.

### F-PB-25: Core-pin generation does not establish that listed cores were installed
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/virtual/emulators/package.mk`: GENERIC_X64 exclusion hunk and hunk `@@ -1726,4 +1736,30 @@`
- **What:** The pin table unconditionally queries the six IDTECH child packages, even when `idtech-lr` is excluded. A nonempty version answer is recorded without checking whether that core belongs to the resolved installed package set.
- **Failure scenario:** On a target that omits idtech and does not select its children independently, version lookups for available child recipes can still create rows presented as pins for cores built into the image.
- **Evidence:** `IDTECH_CORES` is appended unconditionally to the loop; the emission condition is only `[ -n "${_core_ver}" ]`. Refutation attempted: there is no selected-parent or installed-artifact check in the hunk. The lookup helper and complete dependency graph could affect the result and are outside the packet.
- **Fix:** Generate the table from the resolved installed core set, then attach each verified build version. Test excluded-core targets and avoid assigning authoritative metadata to absent or unverified artifacts, consistent with S3.
- **Confidence:** medium — the enumeration gap is visible; the current image’s exact false-positive rows cannot be established from this packet.

# Upstream fit

- **Split the change set by responsibility.** Package dependency fixes, H700 panic/watchdog policy, persistent diagnostics, settings recovery, networking, and QEMU service rewrites are materially different changes. Boot and security policy should not arrive as incidental package-bump changes.
- **Do not submit the fork’s integration plumbing as upstream product code.** The EmulationStation recipe now names `maxengel/emulationstation-next` and `test/qa-integration`. Upstream integration needs an intentional source/pin transition after the corresponding interface changes land. F-PB-19 identifies additional files to exclude.
- **Replace the QEMU workaround stack with a minimal configuration.** The successive scripts overwrite or accumulate settings for the same services, replace hostnamed with a no-op, remove protections, and introduce their own monitors and boot dependencies. Repairing individual syntax errors is not sufficient justification for retaining that architecture.
- **Account for files already written to devices.** In particular, overrides under `/storage/.config/systemd/system` survive image replacement. Removing their generator from the source tree does not remove the generated state. Cleanup must identify managed files, preserve owner changes, and work both on an upgraded guest and a fresh one. This is required by S3, not something a release note can substitute for.
- **Keep package changes auditable against their inherited recipes.** The GStreamer overrides replace configuration hooks, and one parses another recipe’s source text to reconstruct its options. A maintainer needs the actual inherited options, dependency graph, and cold-build results before accepting these changes.
- **Separate package-local fixes from upstream-library fixes.** The WOFF2 header changes should have an upstream submission or tracking reference. H700 reserved-memory and watchdog behavior require device-specific evidence; comments describing memory placement are not that evidence.
- **Use the authoritative packaging contract.** S4 defers to S5. The missing Git-fetch implementation prevents resolving whether removal of `PKG_SHA256` is a supported handler exception; I am not declaring the full commit pin unpinned or the build broken on that basis.

# Coverage boundary

This was a static review of the five embedded sources. I did not access a filesystem, execute commands, inspect downloaded archives, render units, run `tools/pkgcheck`, boot a VM, or recompute any hash. Comments describing earlier tests, incident fixes, or closed issues were treated as context, not as verification.

The orchestrator needs to obtain or route the following missing evidence:

1. **Build-system and inherited-recipe context:** complete sourced GStreamer, GnuTLS, and HarfBuzz recipes; Git fetching and extraction behavior; `get_pkg_version`, `safe_remove`, package installation, and dependency-resolution implementations. These are necessary to resolve the bounded packaging risks above.
2. **Effective VM configuration:** quirk dispatch, writable/overlaid filesystem layout, final rendered units, socket units, tmpfiles rules, and the complete boot graph. These determine the full operational impact of the directly visible configuration defects.
3. **Clean and upgrade proofs:** fresh-image and previous-image upgrade runs, including persisted quirk overrides, restore markers, source-tree reuse, and the device’s actual BusyBox tools. S3 explicitly requires both paths.
4. **Fault and concurrency proofs:** simultaneous settings writers, simultaneous evidence collections, failed redaction replacement, failed configuration writes, interrupted rollback, and concurrent core collection.
5. **Hardware and final-image evidence:** H700 bootloader memory use and ramoops survival, watchdog behavior across affected devices, x86 bootloader/initramfs execution, software rendering, runtime CLI availability, TLS trust/module loading, and GStreamer/WebKit dependency closure.
6. **Additional governing material:** the referenced blindspot register, full decision register, relevant issue acceptance criteria, and other applicable instruction files were not embedded. Conformance conclusions are limited to S2–S5; no complete acceptance-criteria PASS is claimed.
7. **The test executable:** `build-tests/es-unit-tests` is represented only by a binary-difference notice. Its contents and provenance cannot be reviewed here.

The diff is measured from the stated upstream merge bases, not from audit #258. It therefore does not establish which findings were introduced specifically after that audit.

## `corpus.provenance.json`

The following is inline artifact content for the orchestrator to materialize. The arrays align by index with `source_ids`. Each hash is the supplied **sha256 verified by the Facilitator at embed time**, not a hash computed by this reviewer.

```json
{
  "bucket": "10-packages-and-build",
  "review_mode": "static review of facilitator-embedded source contents",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5"
  ],
  "source_descriptions": [
    "Fork-only distribution and EmulationStation diff",
    "Audit anti-patterns and quality standards",
    "Upgrade and clean-install rules",
    "Packaging and patch rules",
    "Authoritative package.mk reference"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/10-packages-and-build.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/packaging-and-patches.md",
    "/workspace/repos/rocknix/packages/README.md"
  ],
  "source_file_hashes": [
    "2dc307089ee80e9f00bc07756b2cdbef9330ebbf493a7e5b41d8db0ededc9e21",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "db3a14de71c3ec3f52db77ac2f7a6f6b75d58f007c977de19fe116ae93b81742"
  ],
  "hash_algorithm": "sha256",
  "hash_verification": "Verified by the Council Facilitator at embed time; not independently recomputed by this reviewer",
  "facilitator_manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "reviewer_filesystem_access": false,
  "reviewer_re_read_files": false,
  "reviewer_rehashed_files": false,
  "commands_executed": [],
  "missing_source_gaps": [
    "Complete inherited package recipes and referenced build helper implementations",
    "Quirk dispatch, effective target units, filesystem overlays, and complete boot graph",
    "Clean-install, upgrade, fault-injection, concurrency, and target-tool test artifacts",
    "Final image contents and H700/x86 runtime evidence",
    "Referenced blindspot register, full decision register, acceptance criteria, and other applicable instruction files",
    "Reviewable contents and build provenance of the added test executable"
  ],
  "gap_disposition": "Surfaced to the orchestrator in the Coverage boundary; no contents or hashes fabricated for missing sources"
}
```