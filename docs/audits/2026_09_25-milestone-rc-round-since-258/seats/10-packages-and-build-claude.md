# Audit — bucket 10-packages-and-build (ROCKNIX fork e9ff9dbd11..314e339bad; ES fork bccd715707..7eae8ed913)

## Summary

The bucket adds a GENERIC_X64 (QEMU) device to the build, brings in the dependency chain for WebKit (ruby/unifdef host tools, brotli, woff2, openjpeg, libtasn1, glib-networking, gstreamer overrides, cairo 1.18.4, gnutls trust store), and ships a large body of device-side reliability work: persistent logging and pstore/ramoops on H700, a hang policy and hardware watchdog for all devices, a last-known-good `system.cfg` mechanism, credential redaction for logs, atomic setting writes with stale-lock recovery, and status-returning `factoryreset`/`run` scripts. The package recipes are mostly conventional and the shell work in `001-functions`, `chksysconfig` and `runemu.sh` is careful about the failure modes it names. Three things dominate. First, the distribution pins its interface to `maxengel/emulationstation-next` on a `test/qa-integration` branch by git clone with `PKG_SHA256` removed, and that branch carries `CLAUDE.md`, `.githooks/` and a compiled binary — an upstream blocker and a loss of source integrity in the build. Second, the thirteen QEMU quirk scripts (about 1,900 lines) write systemd units into read-only `/usr/lib`, produce unit files systemd cannot parse, and contradict each other and this same diff (a dbus↔hostnamed ordering cycle, hostnamed replaced by `/bin/true`, journald `MaxLevelStore=warning` discarding the `logger` lines every new script relies on, `RuntimeWatchdogSec=0` against the new `20-watchdog.conf`) — on the very VM the fork uses as its proof platform. Third, `hang-policy.conf` makes a 120-second D-state stall a panic-and-reboot on every device while only H700's kernel gained the detectors and the ramoops region to record it, and the 15-second hardware watchdog is argued against the Allwinner ceiling but not against suspend.

## Findings

### F-PB-01: Interface pinned to a personal repository and test branch by unverified git clone
- **Severity:** High
- **Category:** Upstream fit
- **Where:** `projects/ROCKNIX/packages/ui/emulationstation/package.mk:5-9` (hunk `@@ -2,15 +2,19 @@`), `projects/ROCKNIX/packages/ui/emulationstation/package.mk:17` (`GET_HANDLER_SUPPORT="git"`)
  `CLAUDE.md` (ES fork, new file), `.githooks/pre-push` (ES fork, new file), `build-tests/es-unit-tests` (ES fork, new binary, mode 100755)
- **What:** The distribution's ES package now clones `https://github.com/maxengel/emulationstation-next.git` on branch `test/qa-integration`, with `PKG_SHA256` deleted, so the image build has no integrity check on its interface source; the pinned branch carries agent context, git hooks, and a compiled test binary.
- **Failure scenario:** A ROCKNIX maintainer building `next` clones a contributor's personal repository; a force-push or a compromised account changes what `7eae8ed913` resolves to — no hash check catches it. A reviewer opening the pinned tree finds `CLAUDE.md` with `/workspace/repos/rocknix` and `~/Development/emulationstation-next.worktrees/qa-integration/.githooks`, and an unreviewable ELF under `build-tests/`.
- **Evidence:** `-PKG_SHA256="0915d23f…"` removed, `+PKG_GIT_CLONE_BRANCH="test/qa-integration"`, `+PKG_SITE="https://github.com/maxengel/emulationstation-next"`, `+PKG_URL="${PKG_SITE}.git"`. In the ES diff: `Binary files /dev/null and b/build-tests/es-unit-tests differ`; `CLAUDE.md` names personal absolute paths. The fork's own `.githooks/pre-push` refuses `pr/*` pushes that carry `CLAUDE.md`, `.githooks/`, `.claude/` — but the branch the image builds from is not a `pr/*` branch. I looked for a tarball URL or a sha256 elsewhere in the hunk and found none.
- **Fix:** Pin to a commit on `ROCKNIX/emulationstation-next` (tarball `PKG_URL` with `PKG_SHA256`), or at minimum to a fork branch that is built by content and carries only source; delete `build-tests/es-unit-tests` from history before submission.
- **Confidence:** high — the lines are unambiguous.

### F-PB-02: QEMU quirk scripts write to read-only paths and produce systemd units that cannot load — dead code that errors on every VM boot
- **Severity:** High
- **Category:** Correctness / Test gap
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/096-plymouth-communication-fixes` (heredoc `>/usr/lib/systemd/system-generators/plymouth-x64-generator`, `chmod +x` after it)
  `.../097-systemd-security-overrides` (heredoc `>/usr/lib/systemd/system/x64-security-cleanup.service`, `ln -sf` into `sysinit.target.wants`)
  `.../098-dbus-fd-improvements` (heredocs `>/usr/lib/systemd/system/x64-dbus-connection-monitor.service`, `x64-connection-monitor.service`)
  `.../100-service-lifecycle-coordination` (heredocs `>/usr/lib/systemd/system/x64-service-coordinator.service`, `x64-dbus-ownership-monitor.service`, `x64-target-coordinator.service`; three `ln -sf` into `multi-user.target.wants`)
  `.../101-virtualization-fixes:9-11` (`/etc/udev/rules.d/90-x64-virtual-devices.conf`), and its four `>/usr/lib/systemd/system/x64-*.service` heredocs
  `.../095-kernel-early-boot-fixes:10-12` (`mkdir -p /etc/kernel` then `>/etc/kernel/cmdline.d/10-generic-x64.conf`)
  `.../091-systemd-fixes`, `.../092-vm-service-fixes` (drop-ins under `/storage/.config/systemd/system/`)
- **What:** ROCKNIX is an immutable image; `/usr/lib` is squashfs. Seven unit files and a generator are written there at every boot and fail with a read-only error, and the `ln -sf` lines then create dangling symlinks into `*.target.wants`. Where the writes would succeed, the units cannot parse: every `x64-*.service` `ExecStart=/bin/sh -c '` spans many lines with no `\` continuation, which systemd's line-oriented parser reads as an unterminated quote followed by dozens of non-assignment lines. Separately: udev only reads `*.rules`, not `*.conf`; `/etc/kernel/cmdline.d/` is never created before it is written into; `/storage/.config/systemd/system/` is not on systemd's unit search path; `echo deadline > /sys/block/*/queue/scheduler` is an ambiguous redirect and `deadline` is not a scheduler on kernel 7.x.
- **Failure scenario:** Every boot of the QA VM runs these scripts (matched by DMI product name) and emits "Read-only file system" and "No such file or directory" errors, then systemd logs "Unit x64-service-coordinator.service not found" for each dangling `.wants` link. The boot log the fork audits for noise on this platform is filled by the fork's own scripts, and none of the intended behaviour exists.
- **Evidence:** `+mkdir -p /usr/lib/systemd/system` and `+cat <<EOF >/usr/lib/systemd/system/x64-service-coordinator.service` with `+ExecStart=/bin/sh -c '` on one line and `+    while true; do` on the next; `+ln -sf /usr/lib/systemd/system/x64-service-coordinator.service /etc/systemd/system/multi-user.target.wants/…`; `+cat <<EOF >/etc/udev/rules.d/90-x64-virtual-devices.conf`; `+mkdir -p /etc/kernel` immediately followed by a write into `/etc/kernel/cmdline.d/`. I looked for any `mount -o remount,rw`, overlay setup, or `daemon-reload` in the thirteen files and found none. The one piece of internal evidence that bears on effectiveness: `network-base.service`'s new comment records hostnamed re-applying a cached name on the GENERIC_X64 guest (2026-09-13), which cannot happen while `094`'s `/bin/true` unit is in force — so either these writes are dead, or that diagnosis was made on a first-boot VM where they had not yet applied.
- **Fix:** Delete the thirteen scripts. Anything genuinely needed for the VM (a `Virtual` connector, a hardware-cursor flag — both already handled in `111-sway-init`) belongs in the image as a shipped unit or config, not as boot-time writes into immutable paths.
- **Confidence:** high on the read-only and parser mechanics; medium on which `/etc/*` paths are writable on ROCKNIX (outside the packet — see F-PB-03 for the consequence either way).

### F-PB-03: QEMU quirk scripts contradict each other and this diff; where they take effect they misconfigure the VM
- **Severity:** High
- **Category:** Correctness
- **Where:** `.../093-rocknix-service-fixes:52` (`After=systemd-journald.service systemd-hostnamed.service` on dbus.service) and `:68-69` (`After=… dbus.service`, `Requisite=dbus.service` on systemd-hostnamed.service)
  `.../094-core-systemd-fixes:13-25` (systemd-hostnamed.service replaced by a `Type=oneshot` `/bin/true` unit; comment "systemd was built without D-Bus")
  `.../098-dbus-fd-improvements:30,38` (`MaxLevelStore=warning`, `ForwardToConsole=yes`), and `SyncIntervalSec=10min` in the same heredoc
  `.../095-kernel-early-boot-fixes:70` (`RuntimeWatchdogSec=0`)
  `.../100-service-lifecycle-coordination` (rocknix-automount drop-in: `Type=simple`, `RemainAfterExit=no`, `ExecStartPre=/bin/sh -c 'sleep 5'`, `ExecStartPre=… || sleep 10`; logind drop-in `:17,20-22,41` — `PartOf=graphical-session.target`, `Conflicts=` `Before=` `BindsTo=` resets, `ExecStopPre=`)
  `.../091-systemd-fixes`, `.../092-vm-service-fixes`, `.../093`, `.../098` — four `dbus.service.d` fragments
- **What:** The set orders dbus after hostnamed and hostnamed after dbus in the same script (a cycle systemd breaks by deleting a job); replaces hostnamed with `/bin/true` while `network-base.service` in this diff is ordered `Before=systemd-hostnamed.service` on the premise that hostnamed runs; sets journald `MaxLevelStore=warning`, which discards every `logger -t chksysconfig|network-base-setup|wait_lock|factoryreset|rocknix-corekeep` line this diff adds (all at notice/info) and defeats `rocknix-evidence collect`; sets `RuntimeWatchdogSec=0` against `20-watchdog.conf`'s `15s`; and changes `rocknix-automount.service` to `Type=simple` with 5–15 s of sleeps, so units ordered after it no longer wait for `/storage/roms` to be bound — `chksysconfig`'s `finish_restore` comment relies on "about 2.5 s". Four `dbus.service.d` fragments disagree on `MemoryMax` (48M/32M), `RestartSec` (1/2/2s/3s) and `Type`. `ExecStopPre=` is not a systemd directive. Monitors (if they ever loaded) call `systemctl restart dbus.service` on a 30–60 s poll, which drops every bus client.
- **Failure scenario:** On the QA VM, if `/etc/systemd/system` is the persistent unit directory (as in LibreELEC-derived images), then from the second boot onward: hostnamed is `/bin/true` and any `hostname1` bus call blocks 25 s; the game list can render before `/storage/roms` is mounted; the journal keeps only warnings, so the evidence archive has no `chksysconfig` history and `rocknix-evidence`'s "what chksysconfig said" section is empty. If those paths are not writable, all of this is dead and F-PB-02 stands alone. Either way the VM diverges from the image real devices run, and the fork's VM proofs describe a different system.
- **Evidence:** Quoted lines above. I attempted to refute the cycle by checking whether either unit is conditionally skipped — `093` writes both fragments unconditionally. I attempted to refute the `MaxLevelStore` effect by looking for a later-sorting journald fragment restoring `debug`/`info`: `092-journald-config`'s `10-generic-x64.conf` and `093`'s `10-generic-x64-early.conf` sort before `20-x64-fd-improvements.conf` and do not set `MaxLevelStore`.
- **Fix:** Same as F-PB-02 — delete the set. If any single tuning is wanted for the VM, express it once, in the image, and re-derive the `network-base.service`/`chksysconfig` timing claims against a VM without it.
- **Confidence:** medium — the contradictions are certain from the text; which fragments are effective depends on `/etc` wiring outside the packet.

### F-PB-04: `hang-policy.conf` turns a slow-card writeback stall into a reboot on every device, with the trace kept only on H700
- **Severity:** Medium
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/sysutils/busybox/sysctl.d/hang-policy.conf:15-17`
  `projects/ROCKNIX/devices/H700/linux/linux.aarch64.conf` (hunks `@@ -7287,9 +7287,9 @@`, `@@ -7972,10 +7972,11 @@`)
  `projects/ROCKNIX/devices/H700/patches/linux/0950-arm64-dts-allwinner-h616-ramoops-reserved-memory.patch`
- **What:** `kernel.hung_task_panic = 1` with `CONFIG_DEFAULT_HUNG_TASK_TIMEOUT=120` panics on the first task in `TASK_UNINTERRUPTIBLE` for 120 s, and `kernel.panic = 10` reboots. A `sync`, `jbd2` or writeback task blocked that long on a slow SD card under sustained writes is the ordinary "task blocked for more than 120 seconds" warning on cheap media; it is now a reboot in the middle of the write. The sysctl ships to every device in `/usr/lib/sysctl.d`, but only H700's kernel config gains `SOFTLOCKUP_DETECTOR`, `DETECT_HUNG_TASK`, `PSTORE_RAM` and the ramoops region in this diff.
- **Failure scenario:** A player copies a large ROM set over Samba to an RK3326 handheld's SD card; `vm.dirty_writeback_centisecs=1500` (rocknix.conf, unchanged) lets dirty pages accumulate; `sync`/`kworker` blocks >120 s; the device panics and reboots mid-write, leaving the ext4 journal to replay and the transfer half-done — with no ramoops on that SoC, nothing records why. On a device whose kernel lacks `CONFIG_DETECT_HUNG_TASK`, `systemd-sysctl` instead logs "Couldn't write '1' to 'kernel/hung_task_panic'" every boot — the class of noise `post-update` removes `vm.laptop_mode` to avoid.
- **Evidence:** `+kernel.softlockup_panic = 1`, `+kernel.hung_task_panic = 1`, `+kernel.panic = 10` under `busybox/sysctl.d/` (project-wide); the only kernel config in the diff that enables the detectors is H700's (`+CONFIG_DETECT_HUNG_TASK=y`, `+CONFIG_DEFAULT_HUNG_TASK_TIMEOUT=120`). I looked for a device gate on the sysctl file or a `panic_on_io_error`-style exclusion and found none; the file's comment addresses `panic_on_oops` but not writeback stalls.
- **Fix:** Ship the file per device alongside the kernel config and ramoops/efi-pstore that makes the panic readable; leave `hung_task_panic` off, or raise `hung_task_timeout_secs` well above what a slow card can produce, and keep `softlockup_panic` only where the trace is kept.
- **Confidence:** medium — other devices' kernel configs are outside the packet; the sysctl's project-wide path and H700-only enablement are in it.

### F-PB-05: QEMU quirk scripts strip service sandboxing, open D-Bus ownership to `*`, and set `mitigations=off`
- **Severity:** Medium
- **Category:** Security
- **Where:** `.../097-systemd-security-overrides` (heredocs for `systemd-udevd.service.d`, `systemd-hostnamed.service.d`, `systemd-logind.service.d`, `systemd-ask-password-*.service.d`)
  `.../096-plymouth-communication-fixes` (heredoc `>/etc/dbus-1/system.d/plymouth-x64-fixes.conf`, second `<policy user="root">` block)
  `.../095-kernel-early-boot-fixes:18` (`mitigations=off`)
- **What:** Every hardening directive on udevd/logind/hostnamed/ask-password is emptied (`SystemCallFilter=`, `MemoryDenyWriteExecute=`, `RestrictAddressFamilies=`, `LockPersonality=`) and then explicitly reversed (`NoNewPrivileges=no`, `ProtectSystem=no`, `ProtectHome=no`, `PrivateDevices=no`), justified as removing "warnings". The D-Bus policy grants `<allow own="*"/>` `<allow send_destination="*"/>` to root and lets any user talk to `org.freedesktop.Plymouth` (Plymouth does not use D-Bus). A kernel cmdline fragment disables CPU mitigations.
- **Failure scenario:** none demonstrated as exploited; scope is the QEMU DMI match. But a QA platform running with `NoNewPrivileges=no` and no syscall filters on logind/udevd is not a proxy for the device, and a maintainer diffing the two configurations would reject this on sight.
- **Evidence:** `+NoNewPrivileges=no`, `+ProtectSystem=no`, `+SystemCallFilter=` across four heredocs; `+    <allow own="*"/>`; `+mitigations=off`. The stated reason ("unsupported compile-time security options that cause warnings") is a build-configuration matter for the systemd recipe, not a runtime override.
- **Fix:** Delete; if systemd on x86_64 lacks seccomp support, fix `projects/ROCKNIX/packages/sysutils/systemd/package.mk`'s meson options instead.
- **Confidence:** high on content; effect is confined to the VM by the quirk directory name.

### F-PB-06: `wait_lock` spins at 100% CPU when the lock cannot be created for any reason other than "it exists"
- **Severity:** Medium
- **Category:** Resource
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` hunk `@@ -89,25 +167,124 @@`, the line `[ -e "${J_CONF_LOCK}" ] || continue   # released since the create failed: try again at once`
- **What:** The old loop slept one second between attempts. The new loop, when `(set -o noclobber; echo "$$" > "${J_CONF_LOCK}")` fails and the file does not exist — EROFS after an ext4 error remount, ENOSPC, ENOENT on a missing parent — takes `continue` with no sleep and retries forever at full speed.
- **Failure scenario:** A card on its way out remounts `/storage` read-only (the very scenario `sort_settings`' new guard names). EmulationStation calls `set_setting` → `wait_lock` → create fails, `-e` is false → hot loop; the caller never returns and a core is pegged until reboot. Under the old code this was an idle 1 s poll.
- **Evidence:** `+    [ -e "${J_CONF_LOCK}" ] || continue` immediately after the failed create, with `sleep 1` reached only in the `kill -0` live-holder branch. I looked for a `sleep` or attempt counter on the ENOENT path and found none.
- **Fix:** On a failed create with no file present, `sleep` (or check `-w "$(dirname "${J_CONF_LOCK}")"` and fail closed); consider `flock`, which the image already uses (`rocknix-evidence`: `flock -n /var/run/cloud_sync.lock true`).
- **Confidence:** high on the loop; medium on how commonly the create fails for a non-EEXIST reason (lock path outside the packet).

### F-PB-07: `write_setting_line` replaces `system.cfg` with awk's output without the emptiness/hostname guard `sort_settings` now insists on
- **Severity:** Medium
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` hunk `@@ -89,25 +167,124 @@`, function `write_setting_line` (awk … `> "${J_CONF}.tmp" 2>/dev/null` then `mv -f "${J_CONF}.tmp" "${J_CONF}"`); compare `sort_settings` in the same hunk (`if [ -s "${J_CONF}.tmp" ] && grep -q '^system\.hostname=' …`)
- **What:** The rename is gated only on awk's exit status. Busybox awk warns and continues on an input it cannot open or that returns EIO mid-read, then runs `END { print k "=" v }` and exits 0 — so a one-line or truncated temporary is renamed over the live file. `sort_settings` was given exactly this guard in the same change ("An unreadable source (EIO, a card on its way out) gives grep nothing, and the mv below then installed an empty system.cfg"); the new writer was not.
- **Failure scenario:** `system.cfg` returns EIO after the 40th line; `set_setting global.ratio core` → awk prints 40 lines and the key → `mv` → the remaining settings are gone; the next boot's `valid()` passes (hostname line survived) so the last-good copy is never consulted.
- **Evidence:** `+  if K="${1}" V="${2}" awk '…' "${J_CONF}" > "${J_CONF}.tmp" 2>/dev/null` / `+    mv -f "${J_CONF}.tmp" "${J_CONF}"`. No size or hostname check between them. I looked for `set -o pipefail`-style protection or a line-count comparison and found none.
- **Fix:** Apply the same acceptance test as `sort_settings` (`-s` and `^system\.hostname=` — or, more directly, that the temporary has at least as many lines as the source minus one) before the `mv`; otherwise remove the temporary and log.
- **Confidence:** medium — busybox awk's status on an unreadable input is outside the packet; the missing guard is not.

### F-PB-08: Stale-lock detection can steal a live lock in the create window, and pid reuse defeats `kill -0`
- **Severity:** Medium
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` hunk `@@ -89,25 +167,124 @@`, `case "${holder}" in ''|*[!0-9]*)` branch and the `rm -f "${J_CONF_LOCK}"` after the second read
- **What:** A holder's create is `open(O_EXCL)` then `write`; a contender reading between them sees an empty file, classifies it "nobody can be holding it", re-reads (still empty), and removes it — the code's own comment says the re-read "does not close" the window. Two writers then run `write_setting_line` concurrently and the second `mv` discards the first's key. Separately, `kill -0 "${holder}"` cannot tell a pre-reboot pid from a live unrelated process if the lock file persists across boots.
- **Failure scenario:** `network-base-setup` (`set_setting system.hostname`) and `001-setup`/ES both write at ~2 s of a first boot; the empty-file window is hit; one write is lost silently.
- **Evidence:** `+        # few microseconds; the re-read below is what stands between that and a theft.` and `+    # Re-reading just before the rm shrinks that window to a few instructions; it does not close it.` — the author states the race. I looked for `mkdir`-based or `flock`-based locking and found the pid-file scheme retained.
- **Fix:** Use `flock` on the config directory (present on the image), or `mkdir` as the atomic primitive with the pid inside; if the pid-file scheme stays, write the pid with a temp file + `ln` so the file is never observed empty.
- **Confidence:** medium — the window is real; its hit rate on a handheld is unquantified.

### F-PB-09: `gst-plugins-bad` override parses another recipe's source text with `sed` to build its option string
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/multimedia/gstreamer/gst-plugins-bad/package.mk:14-19`
- **What:** `PKG_MESON_OPTS_TARGET` is reconstructed by `sed -n '/PKG_MESON_OPTS_TARGET="/,/"$/p'` over `packages/multimedia/gstreamer/gst-plugins-bad/package.mk`. The range ends at the first line ending in `"`. The sibling `gstreamer` override in this diff shows the upstream idiom `-Dpackage-name="gstreamer"` — a line ending in `"` inside the option block. If the generic gst-plugins-bad recipe has the same idiom, every option after it is silently dropped and meson configures with auto-detected defaults; the build succeeds with a different plugin set than intended.
- **Failure scenario:** Upstream reformats or adds a quoted option line → the option list truncates → plugins the image never wanted are built and thrown away, or `-Dmpegtsmux=enabled` is never reached and the substitution is a no-op — with no error.
- **Evidence:** `+  PKG_MESON_OPTS_TARGET="$(sed -n '/PKG_MESON_OPTS_TARGET="/,/"$/p' ${ROOT}/packages/multimedia/gstreamer/gst-plugins-bad/package.mk \`. The generic recipe is outside the packet, so I could not check whether the range terminates early today; the override's comment concedes it exists because "there is no hook to chain onto".
- **Fix:** Restate the option string in full, as the `gst-plugins-base` and `gstreamer` overrides in this same diff do, with the same "keep in step when rebasing" note.
- **Confidence:** medium.

### F-PB-10: `factoryreset`'s player-facing last line carries ANSI escape sequences
- **Severity:** Medium
- **Category:** Player text
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/factoryreset:38` (`echo -e "\e[31m${1}\e[0m"` in `fail()`)
- **What:** The header comment says "EmulationStation runs these behind a spinner and puts the last line on the outcome dialog." That last line is emitted wrapped in `ESC[31m … ESC[0m`; unless the interface strips them (nothing in this bucket's three ES files does), the dialog shows `[31mTHE DEFAULT SETTINGS COULDN'T BE PUT BACK.[0m` with an unrenderable ESC glyph.
- **Failure scenario:** Player chooses a reset on a build that lacks `/usr/config/PortMaster/release/PortMaster.zip` → dialog text is polluted with control codes.
- **Evidence:** `+    echo -e "\e[31m${1}\e[0m"` and, twenty lines above, `+# EmulationStation runs these behind a spinner and puts the last line on the outcome dialog.` I looked for a `[ -t 1 ]` test or a plain-text branch and found none.
- **Fix:** Colour only when stdout is a terminal (`[ -t 1 ] && printf '\e[31m%s\e[0m\n' … || printf '%s\n' …`).
- **Confidence:** medium — the ES consumer is outside the packet.

### F-PB-11: `finish_restore` can declare the safety copy missing at 1.7 s and drop the marker while the copy sits on a card not yet mounted
- **Severity:** Medium
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/chksysconfig` hunk `@@ -1,34 +1,186 @@`, function `finish_restore` (`if [ -n "${snap}" ] && [ ! -d "$(dirname "${snap}")" ]; then … return 0; fi` followed by the `tar -tzf`/`else … echo failed … rm -f "${mark}"` branch); `projects/ROCKNIX/packages/rocknix/system.d/rocknix-sysconfig.service:14-15` (`Before=network-base.service`, at sysinit)
- **What:** "Not mounted yet" is inferred from the *parent directory* of the snapshot not existing. On a device that previously merged the internal card and later switched to an external one, the underlying `/storage/roms/<backups dir>` exists on the internal card before `rocknix-automount` binds the external card, so the directory test passes, the file test fails, the marker is removed and `.restore-reverted` is written as `failed` — the interrupted restore is never reverted although the copy exists.
- **Failure scenario:** External-merge device; restore cut by a power cut; next boot at sysinit: parent dir present on internal card, copy absent → `failed`, marker gone → the half-restored tree stands.
- **Evidence:** `+  if [ -n "${snap}" ] && [ ! -d "$(dirname "${snap}")" ]; then` is the only mount test; no `mountpoint -q /storage/roms` or `system.merged.device` check. The service runs before automount by design (`DefaultDependencies=no`, `Before=network-base.service`). Backuptool's snapshot location is outside the packet, so this depends on the copy living under `/storage/roms` as the comment states.
- **Fix:** Defer the marker decision when `/storage/roms` is not yet a mountpoint (`busybox mountpoint -q`) or when `system.merged.device=external`, and let the `001-setup` verify finish it; never remove the marker on the sysinit pass.
- **Confidence:** medium-low — the snapshot path is asserted by comment, not shown.

### F-PB-12: `.env` keeps a world-readable mode from before the change on the first run, while the comment claims owner-only
- **Severity:** Medium
- **Category:** Security
- **Where:** `Makefile:159-162` (hunk `@@ -153,7 +157,9 @@`), `Makefile:179` (hunk `@@ -170,4 +176,4 @@`)
- **What:** `umask 077` affects only file creation; `>` on an existing `.env` truncates and keeps its mode. The previous Makefile left `.env` behind (0644 under a 022 umask) after every build. The first `make docker-*` after this change writes the forwarded environment — including the four kept credentials — into that 0644 file; only the new `rm -f .env` at the end makes later runs owner-only.
- **Failure scenario:** Shared build host; developer updates the tree and runs `make docker-RK3588`; `SCREENSCRAPER_DEV_LOGIN=…` is readable by every local user for the duration of the build.
- **Evidence:** `+docker-%: $(shell umask 077; ./scripts/get_env > .env)`; comment two lines above: "owner-only, and gone again once the container has exited." No `rm -f .env` or `chmod 600` precedes the write.
- **Fix:** `$(shell rm -f .env; umask 077; ./scripts/get_env > .env)` or `install -m 600 /dev/null .env` before writing.
- **Confidence:** high on the mechanism; exposure is one run per upgrading developer.

### F-PB-13: `external_node_present` mis-derives the internal disk for `sdXN`-rooted devices, so an absent external card costs a 10 s boot wait
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/automount:191` (`internal=$(grep " /storage " /proc/mounts | awk '{print $1}' | sed -e 's#.*/##' -e 's#p[0-9]*$##')`), and the wait condition in hunk `@@ -213,9 +248,28 @@`
- **What:** The partition suffix is stripped only when it is `pN`. `/dev/sda2` → `sda2`, which never equals `sda`, so the root disk itself is counted as an external candidate whenever it is >8 GB. The grace-vs-wait logic then waits the full `FIND_MAX=10` seconds for a card that is not present.
- **Failure scenario:** GENERIC_X64/AMD64 with an AHCI root (`sda`), `system.merged.device=external`, external card removed → boot pauses 10 s instead of ~2 s, on every boot until the setting is changed.
- **Evidence:** the `sed -e 's#p[0-9]*$##'` line; the candidate glob `sd[a-z]` includes the root disk; the comment says "The internal card is the disk backing /storage and is never a candidate," which the code does not deliver for `sd*`. `nvme0n1p2` and `mmcblk0p2` are handled correctly.
- **Fix:** Derive the parent via `/sys/class/block/<part>/..` (`readlink -f /sys/class/block/sda2/.. | xargs basename`) or `lsblk -no pkname`.
- **Confidence:** medium — the pre-existing `find_games` loop has the same suffix assumption, so `sd*` roots may already be handled elsewhere in lines outside the hunk.

### F-PB-14: `RuntimeWatchdogSec=15s` is argued against the Allwinner timeout ceiling, not against suspend
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/sysutils/systemd/config/system.conf.d/20-watchdog.conf:8,13`
- **What:** PID 1 arms `/dev/watchdog` at 15 s and pings every 7.5 s. During suspend PID 1 does not run. If the SoC's watchdog keeps counting in the sleep state (the kernel watchdog core only pings once and cancels its worker on suspend; it stops the hardware only where the driver does), a handheld asleep for more than 15 s resets and comes up cold — the session lost, which is the outcome the file exists to prevent. Nothing in the packet addresses this case for `sunxi_wdt` (H700), `dw_wdt` (Rockchip), or the Qualcomm targets.
- **Failure scenario:** RG SP put to sleep for a minute → reboot on wake (if the hardware keeps counting).
- **Evidence:** the file's reasoning is entirely about "the Allwinner watchdog counts to 16 at most" and shutdown; no `SuspendWatchdog`-style handling, no per-device gate, no note of a suspend test. What would refute it: a driver suspend hook stopping the timer, firmware (crust/SCP) handling it, or a recorded VM/device test of `systemctl suspend` >15 s — none in the packet.
- **Fix:** Record the suspend test per SoC in the file (or the decision register entry it cites), and gate the drop-in to devices where it passed.
- **Confidence:** low — hardware behaviour is outside the packet; the gap in reasoning is in it.

### F-PB-15: Generic `installer` package keys a dependency on a device name
- **Severity:** Low
- **Category:** Convention
- **Where:** `packages/tools/installer/package.mk:14-18`
- **What:** `if [ "${DEVICE}" != "GENERIC_X64" ]; then PKG_DEPENDS_TARGET+=" grub"; fi` in a `packages/` recipe. The stated rule ("grub is only needed for aarch64-EFI devices; … syslinux ships bootx64.efi") is a property of `${BOOTLOADER}`/`${TARGET_ARCH}`, not of one device; the next x86_64 device re-adds the special case or gets grub it does not use.
- **Failure scenario:** none demonstrated.
- **Evidence:** the quoted block; `projects/ROCKNIX/bootloader/install` already dispatches on `${BOOTLOADER}` and would be the consistent key.
- **Fix:** `case ${BOOTLOADER} in syslinux) ;; *) PKG_DEPENDS_TARGET+=" grub" ;; esac`.
- **Confidence:** high.

### F-PB-16: `rocknix-corekeep` streams the whole core through the pipe when disarmed, and the cut/whole probe is unreliable under busybox `head`
- **Severity:** Low
- **Category:** Resource / Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep` (the `if [ ! -f "${CORE_MARKER}" ]; then cat > /dev/null 2>&1; exit 0; fi` block; the `MORE=$(head -c 1 2>/dev/null | wc -c)` line)
  `projects/ROCKNIX/packages/sysutils/busybox/sysctl.d/99-coredump.conf:4`
- **What:** With the marker absent (the shipped state), the handler reads the entire core to `/dev/null` before exiting. The kernel aborts a pipe dump on the first `EPIPE`, so exiting without reading (what `|/bin/false` did) costs nothing; reading an 800 MB EmulationStation core costs seconds of memory bandwidth on a 1 GB handheld before the crashed process can respawn. Separately, busybox `head -c` is `getc`-buffered and reads ahead past the cap; a dump that exceeds the cap by less than the stdio buffer reads `MORE=0` and is labelled "whole".
- **Failure scenario:** ES segfaults on a handheld with the default (disarmed) config → several seconds of CPU/IO spent discarding a dump → ES restart delayed. A dump of cap+2 KiB is recorded as whole.
- **Evidence:** `+    cat > /dev/null 2>&1` with comment "the kernel needs the pipe consumed" (it does not); `+    MORE=$(head -c 1 2>/dev/null | wc -c)` immediately after `head -c "${CORE_MAX_BYTES}" | gzip -1`. The chksysconfig comment establishes `head` on the device is busybox.
- **Fix:** `exit 0` without reading when disarmed; decide cut/whole from `RAW -ge CAP` alone, or read the probe byte with `dd bs=1 count=1`.
- **Confidence:** medium — busybox head's buffering is outside the packet; the kernel's EPIPE behaviour is standard.

### F-PB-17: Evidence snapshot runs `top`, `journalctl`, `df` and writes to the card every five minutes during play
- **Severity:** Low
- **Category:** Resource
- **Where:** `projects/ROCKNIX/packages/rocknix/system.d/rocknix-evidence.timer:5-7`, `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-evidence` (`write_snapshot`)
  `projects/ROCKNIX/packages/rocknix/package.mk` (`enable_service rocknix-evidence.timer`)
- **What:** `OnUnitActiveSec=5min` on every device, unconditionally, invoking `journalctl -k -n 40` over a 64 M on-card journal, `top -b -n 1`, a dozen `cat`s, then a `redact_credentials` sed pass and a write to `/storage`. `Nice=15`/`IOSchedulingClass=idle` soften it but do not remove the periodic wake, the journal read, or the card write.
- **Failure scenario:** A frame hitch every five minutes in a timing-sensitive core on a low-end handheld; measurable card wear over months. None demonstrated in the packet.
- **Evidence:** the timer lines and `write_snapshot`'s command list; no `ConditionACPower`, no "only while no emulator runs" gate, no opt-out other than `volatile-log`.
- **Fix:** Pause while `/tmp/.process-kill-data` (an emulator is running) exists, or lengthen the interval; document the opt-out.
- **Confidence:** medium.

### F-PB-18: `redact_credentials` misses `Pass`/`login` spellings and forks on every "disk-" line
- **Severity:** Low
- **Category:** Security / Test gap
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` hunk `@@ -25,6 +25,72 @@` (`local words='passw|token|api_?key|secret|psk|wifi\.key|retroachievements\.key'`, `local marks='…|sk-|…'`)
- **What:** The key list requires `passw`; a key spelled `…Pass` (the batocera-ES `ScreenScraperPass` style) or `…Login` is not covered by the key/value rules. The `sk-` mark is unanchored, so `disk-full`, `task-manager` force the sed fork the one-line fast path is meant to avoid.
- **Failure scenario:** A log line `ScreenScraperPass=hunter2` passes through unredacted into an evidence archive.
- **Evidence:** the two variable definitions; `[[ "${line}" =~ (${words}|${marks}) ]]`. I checked the URL rule (`://user:pass@`) and the flag rule — neither covers a bare `Pass=`.
- **Fix:** Add `pass(word|wd)?` and `login` to `words`; anchor `sk-` as `(^|[^A-Za-z0-9])sk-`.
- **Confidence:** medium — which producers emit such keys is outside the packet.

### F-PB-19: New x86 packages without a consumer in the diff; quoting and header inconsistencies
- **Severity:** Low
- **Category:** Build/packaging / Convention
- **Where:** `packages/sysutils/ryzenadj/package.mk:2,17-19`, `packages/sysutils/dmidecode/package.mk:2`
- **What:** Nothing in the diff depends on `ryzenadj` or `dmidecode`; unless a device options file outside the packet names them, they are dead recipes. `ryzenadj`'s `PKG_CMAKE_OPTS_TARGET` has no line continuations and embeds `'-ludev'` in single quotes inside a double-quoted string, so cmake receives the quote characters literally (it works only because ninja's shell strips them at link time). Copyright lines read `2025 ROCKNIX` here and `2024 ROCKNIX` in the quirks, against `2026-present` everywhere else in the diff.
- **Failure scenario:** none demonstrated.
- **Evidence:** `+PKG_CMAKE_OPTS_TARGET="-DCMAKE_BUILD_TYPE=Release` / `+                       -DBUILD_SHARED_LIBS=OFF` / `+                       -DCMAKE_EXE_LINKER_FLAGS='-ludev'"`; grep of the diff for `ryzenadj`/`dmidecode` finds only the recipes.
- **Fix:** Wire them into the GENERIC_X64/AMD64 options in the same change (or drop them); write `-DCMAKE_EXE_LINKER_FLAGS=-ludev \`; normalise headers.
- **Confidence:** medium — a consumer may exist outside the packet.

### F-PB-20: `get_env` drops every `GITHUB_*`/`GH_*` variable from the container environment
- **Severity:** Low
- **Category:** Build/packaging
- **Where:** `scripts/get_env:14-15`
- **What:** `DROP='…|^(AWS|GH|GITHUB|NPM|OPENAI|ANTHROPIC)_'` removes `GITHUB_ACTIONS`, `GITHUB_SHA`, `GITHUB_REF` and the like, not only tokens. If any build script inside the container branches on them (release naming, CI detection), `make docker-*` under GitHub Actions now behaves like a local build.
- **Failure scenario:** none demonstrated; consumers are outside the packet.
- **Evidence:** the `DROP` regex; the comment says "Names, not values, are matched" and accepts over-dropping.
- **Fix:** Drop by suffix (`TOKEN|KEY|SECRET|PASSWORD`) within those prefixes rather than the whole prefix, or `KEEP` the non-secret CI variables.
- **Confidence:** low.

### F-PB-21: Documentation defects — duplicated sentences, a stale backend claim, an empty quirk file
- **Severity:** Low
- **Category:** Documentation
- **Where:** `packages/graphics/woff2/package.mk:14-20` ("upstream has not tagged a release since 2020" appears twice)
  `projects/ROCKNIX/packages/multimedia/gstreamer/gst-plugins-base/package.mk` (the appsink paragraph appears in the header comment and again inside `post_makeinstall_target`)
  `projects/ROCKNIX/packages/graphics/cairo/package.mk:7-15` (comment says the override exists for "the GL/GLES backends the devices' OPENGL/OPENGLES options name"; cairo 1.18 has no GL backends, and the visible options block sets none)
  `projects/ROCKNIX/packages/hardware/quirks/devices/innotek GmbH VirtualBox/091-vbox-graphics` (new empty file, mode 100644 among 100755 siblings)
- **What:** Comments that repeat themselves or describe options the recipe does not pass; an empty, non-executable quirk that either does nothing or fails "Permission denied" depending on how the quirk runner invokes it.
- **Failure scenario:** none demonstrated.
- **Evidence:** as cited; the cairo options block's GL lines (if any) are outside the hunk, so the stale-claim part is low confidence.
- **Fix:** Deduplicate; state what the override actually changes (xcb/xlib-xcb surfaces and the version); delete the empty file.
- **Confidence:** high for the duplications and the empty file; low for the cairo claim.

## Upstream fit

A ROCKNIX maintainer reading this as a PR would push back on, in roughly this order:

1. **The interface pin** (F-PB-01): personal repository, `test/` branch, git clone, no sha256, `CLAUDE.md`/`.githooks`/a binary in the pinned tree. This alone stops the PR.
2. **The QEMU quirk set** (F-PB-02/03/05): thirteen scripts, ~1,900 lines, headed "Phase 1…6", copyrighted 2024, writing systemd units at boot into an immutable filesystem. Fork-only, must not ship; the fork's own VM results should be re-established without them.
3. **Fleet-wide policy changes hidden in a "packages and build" change**: persistent logging on by default (`var-log.mount` condition inverted), `hang-policy.conf`, `20-watchdog.conf`, the avahi responder enabled for every device, the `<FAMILY>-<hex>` hostname scheme, `SystemMaxUse=64M`/`SyncIntervalSec=1min` journald. Each is a maintainer decision with a device-wear or player-visible consequence; each wants its own PR with the D-SYS/D-NET reasoning in the commit message, not in a comment.
4. **Fork-internal references in code comments**: `fork #104`, `D-CLOUD-078`, `audit #258 PL-001`, `the seat's G-03`, `guest d, 2026-09-10`, `issue #16` (`emulators/package.mk`), `fork #291` (`config/graphic`). Upstream cannot resolve any of these; the prose (often longer than the code — `network-base-setup`, `rocknix-corekeep`, `gst-plugins-base`) should collapse to what a reader of the tree needs, with history in commit messages.
5. **Packaging layout**: a project override (`harfbuzz-icu`) that sources a `chrome-depends` addon recipe; a `libyaml` under `rsyslog-depends` as the host dependency of the toolchain's ruby; `gst-plugins-bad` scraping another recipe with `sed` (F-PB-09); a device name in a generic `packages/tools/installer` recipe (F-PB-15). `packages/README.md` and `packaging-and-patches.md` both expect `pre_*/post_*` hooks and copying from the template, not text-mining.
6. **GENERIC_X64 in `world:`**: adds a VM target to the default build set; upstream will ask whether it belongs there or behind its own target only.
7. **Version bumps in project overrides** (`cairo` 1.18.4 in `projects/ROCKNIX/…`) — acknowledged in the comment as redundant once upstream PR 3359 lands; should be rebased out rather than submitted.
8. **Patches**: `woff2-0001-include-cstdint.patch` has no description header; it is a legitimate carry (upstream dormant). The H700 ramoops DTS patch is device-scoped and well argued.
9. **Copyright hygiene**: `2024 ROCKNIX`, `2025 ROCKNIX`, `2026-present ROCKNIX` across new files; `factoryreset` and `cairo` correctly add a ROCKNIX line while keeping predecessors.
10. **Behavioural default flips in shipped configs**: `system.cfg` drops `cloud.backup` and renames three RetroAchievements keys — mitigated by `add_setting_either`, correctly, but the shipped-default `progress_tracker=1` only reaches fresh installs (per `upgrade-and-install.md`'s "config option" row; it depends on `add_setting`'s empty-value behaviour, outside the packet).

Things a maintainer would welcome as-is: `--wrap-mode=nodownload` in `scripts/build`; `libyaml`'s `ccache:host`; `libsamplerate --with-pic`; the `installer`/`syslinux` ldlinux.c32 fix (modulo the device gate); `gnutls`'s trust store; `get_env`'s secret filtering (with F-PB-20's refinement); `rocknix-update`'s `.part` download; `setrootpass` refusing empty; `run` returning status.

## Coverage boundary

Not judgeable from this packet; each would change a confidence above:

- How quirk scripts are executed and which of `/etc/systemd/system`, `/etc/systemd/journald.conf.d`, `/etc/tmpfiles.d`, `/etc/udev/rules.d`, `/etc/dbus-1/system.d`, `/etc/kernel`, `/etc/systemd/system.conf.d` are writable or symlinked into `/storage` on ROCKNIX (F-PB-02/03).
- `add_setting`'s behaviour with an empty value; `get_setting`; the location of `J_CONF_LOCK` (tmpfs or `/storage`) (F-PB-06/07/08).
- Busybox versions on each device: `head -n -N`, `head -c` buffering, `sed s///I`, awk's exit status on an unreadable input (F-PB-07/16; the `tr` octal ranges in `valid()` I traced through busybox's `expand()` and believe correct).
- `backuptool`'s `.restore-in-progress` format and snapshot path; `save-sysconfig.service` (F-PB-11).
- `storage-log.service`'s `[Unit]` head (its `DefaultDependencies`), to rule out an ordering cycle now that `systemd-pstore.service` (stock `Before=sysinit.target`) is `After=storage-log.service`.
- Whether any unit sets `LimitCORE=`; with systemd's default soft limit of 0, `rocknix-corekeep` never receives a dump.
- `sunxi_wdt`/`dw_wdt`/Qualcomm watchdog behaviour across suspend, or a recorded suspend test (F-PB-14).
- Other devices' kernel configs for `DETECT_HUNG_TASK`/`SOFTLOCKUP_DETECTOR`/pstore (F-PB-04).
- `config/functions`' meson cross file: the cairo override deletes its `ipc_rmid_deferred_release` sed on the claim the cross file sets it.
- The generic `gst-plugins-bad` recipe text (F-PB-09), and its `pre_configure_target`, which the override replaces wholesale.
- `scripts/image`'s `${INSTALL}` at the point `bootloader/install` is sourced, and `bootloader/release`'s reading of `usr/share/bootloader/` — whether the new install step feeds anything or merely prints.
- The `initramfs` package's consumption of `config/initramfs.x86_64.conf`; GENERIC_X64's device options (`LLVM_SUPPORT`, `GRAPHIC_DRIVERS`, consumers of `dmidecode`/`ryzenadj`); the `raofflineproxy` package; `cloud_device_id --if-present`.
- ES's handling of ANSI sequences in `executeScriptLegacy` output (F-PB-10) and the `flock` side effect in `write_snapshot` (creating `/var/run/cloud_sync.lock` if cloud scripts test its existence).
- Tarball SHA256s and the existence of the exact versions pinned (brotli 1.2.0, glib-networking 2.90.0, libtasn1 4.21.0, openjpeg 2.5.4, ruby 3.3.12, unifdef 2.12, dmidecode 3.7, ryzenadj 0.19.0, cairo 1.18.4, Linux 7.1.2); nothing in the packet lets me verify a hash.
- The `111-sway-init` env file: whether `${env_file}` is truncated before the new `>>` append (lines above the hunk).