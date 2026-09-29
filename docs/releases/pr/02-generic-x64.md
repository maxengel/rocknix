Title: GENERIC_X64: a virtual machine build target, for QA on a desktop

ROCKNIX builds a QEMU or VirtualBox guest as a device: the same busybox, scripts, EmulationStation binary and 640x480 panel as a handheld, with software GL, a serial root shell on a virtual machine only, and per-device emulator configurations that name no handheld's hardware. It is what every change in this series was proven on before a handheld saw it.

**What it carries.** `projects/ROCKNIX/devices/GENERIC_X64` (options, the kernel config, the VM launcher and its profile), the GENERIC_X64 quirks and the QEMU device quirk, the x86_64 initramfs, syslinux and installer changes, the x86_64 fixes in gcc, libplacebo, mupen64plus and gliden64, the per-device configurations under `config/GENERIC_X64` for the standalone emulators and RetroArch, `scripts/image`, `scripts/extract` and `scripts/build_distro` (the release directory pruned whole), `config/graphic` (a device's LLVM choice survives the driver reset), and the emulator list for the device in `virtual/emulators/package.mk` (which also carries the core-pins map the saves PR reads; it is one file).

**How it was tested.** The image boots headless under QEMU and runs the fork's whole QA: fourteen suites on every candidate (the cloud round trip against WebDAV, S3, SFTP, SMB and FTP backends, the script harness, the screens' walks at 640x480, the upgrade rehearsal from the previous image). Those tools stay in the fork; upstream gets the device.

**What it does not touch.** No handheld device's options or kernel; no shared package's behaviour on aarch64 beyond the x86_64 branches named above.

**Kernel, bootloader or device tree.** A kernel config for x86_64 (`linux.x86_64.conf`), the x86_64 initramfs, and syslinux for BIOS boot; no handheld's.

**Depends on.** PR 1 (the build guard, so the new device builds with no download).
