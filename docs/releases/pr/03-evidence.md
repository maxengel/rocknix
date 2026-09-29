Title: rocknix: handhelds keep their logs, a watchdog and a crash store

A handheld that misbehaved used to lose the evidence at the reboot that followed: `/var/log` was tmpfs and the journal went with it. Logs now persist under `/storage`, a hardware watchdog restarts a hung device and records that it did, kernel panics land in pstore, and a bounded ring of core dumps is kept so the next crash can be read. `rocknix-evidence` collects it all into one archive on a timer, and `rocknix-corekeep` arms the core store when asked.

**What it carries.** The two scripts and their units, busybox's sysctl and mount units (`storage-log`, `var-log.mount`, the hang policy, the coredump pattern), systemd's watchdog and pstore configuration and tmpfiles, powerstate's start order and its no-battery case, and `rocknix/package.mk`, which installs these scripts (and, shared with the settings PR, chksysconfig's unit and the bootloader updater gate).

**How it was tested.** On an RG35XX SP across a power cycle: the journal of the previous boot readable after it, an EmulationStation crash's backtrace in the journal, and a core kept under `/storage/.cache/log/cores` and read on the host. On the x86_64 VM: the same units, and the harness that runs every shell script under the image's own busybox.

**What it does not touch.** What is logged; only where it lives and how long.

**Kernel, bootloader or device tree.** Yes, on H700: `linux.aarch64.conf` gains pstore and the ramoops driver, and `0950-arm64-dts-allwinner-h616-ramoops-reserved-memory.patch` reserves the memory ramoops writes to. Other devices are unchanged and get pstore only where their kernel already offers it.

**Depends on.** PR 1.
