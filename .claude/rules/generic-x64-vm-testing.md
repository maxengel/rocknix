---
description: "How to build-test and QA the GENERIC_X64 (x86_64) VM image locally in QEMU/KVM."
paths:
  - "projects/ROCKNIX/devices/GENERIC_X64/**"
  - "projects/ROCKNIX/packages/**"
  - "scripts/mkimage"
  - "scripts/image"
---

# GENERIC_X64 local VM QA

GENERIC_X64 is the x86_64 VM/QA target (fork issue #16): boot the image in QEMU so devs can
test features (e.g. EmulationStation) without flashing hardware. The bare-metal x64 path and
its concessions (llvmpipe vs hw GL, skipped cores) are tracked separately in issue #17.

## When to use it: first, whenever it can answer the question

Maintainer's rule (2026-09-06, `engineering-practices.md`): anything the VM can
test, it tests first. That is most things — config migrations, refusal paths,
archive naming, every script under `projects/ROCKNIX/packages/network/rclone/`,
the interface's strings and pages (`tools/vm-visual-qa` renders them), and the
cloud paths against `tools/cloud-test-backend`. What it cannot answer is
listed in that rule; everything else comes here before a handheld.

## Build

Detached build from the worktree (the `.git` mount is **required** — a worktree's `.git` is a
file pointing outside the mounted dir, and `scripts/image` runs `git rev-parse`):

```bash
make docker-GENERIC_X64 \
  DOCKER_EXTRA_OPTS='-v /workspace/repos/rocknix/.git:/workspace/repos/rocknix/.git'
```

Image lands at `target/ROCKNIX-GENERIC_X64.x86_64-<date>.img.gz`. To re-image after a
scripts/only change (e.g. `mkimage`), remove `build.*/.stamps/image/build_target` first —
scripts aren't in a package deephash so the image won't rebuild otherwise.

**The image step writes into the tree.** It regenerates
`documentation/PER_DEVICE_DOCUMENTATION/GENERIC_X64/SUPPORTED_EMULATORS_AND_CORES.md`,
a tracked file, so every build leaves the worktree dirty and
`tools/fork-worktree sync` refuses it afterwards (it names the file). Discard
it before syncing — `git -C <worktree> checkout -- documentation/` — it is
build output, not a change to keep. A build started from an unsynced
worktree builds the old pin and says nothing; check `git log -1` in the
build worktree against `next` before `make`.

## Boot in QEMU

**Environment parity is the acceptance criterion.** A qcow2 only carries disk bytes; it does
not carry CPU, RAM, firmware, disk bus/sector geometry, GPU, network, audio, input, or serial
configuration. Never treat a bootable qcow2 alone as the finished developer artifact.

The versioned source of truth is
`projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json`. The adjacent `generic-x64-vm` tool
generates both:

```bash
VM_TOOL=projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm
$VM_TOOL run target/ROCKNIX-GENERIC_X64.x86_64-<date>.qcow2
$VM_TOOL utm target/ROCKNIX-GENERIC_X64.x86_64-<date>.qcow2 \
  --output target/ROCKNIX-GENERIC_X64.x86_64-<date>.utm.zip
```

The baseline is Q35 + UEFI, **Haswell-v4** (the oldest fixed QEMU model satisfying this
image's `x86-64-v3` build requirement), 4 vCPUs, 8 GiB RAM, 16 GiB VirtIO disk with explicit
512-byte sectors, `virtio-gpu-gl-pci`, VirtIO network, Intel HDA, USB 3, and a serial console.
Linux uses KVM when available; UTM necessarily uses QEMU TCG to emulate x86_64 on Apple
silicon. Acceleration differs, but the guest-visible CPU model and devices come from the same
profile. VirtualBox is not the common layer because its Apple-silicon build only runs Arm
guests; it cannot run this x86_64 image.

First boot resizes storage and reboots; the second boot is the real one. Release artifacts:
`.utm.zip` for macOS/UTM and `.qcow2` + the generated launcher for Linux/QEMU.

## Headless, on a build host with no desktop

`virtio-gpu-gl-pci` refuses `-display none`, a bare `-display none` captures
black, and SSH is off on a fresh image — three separate discoveries that are
now one flag:

```bash
VM_TOOL=projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm
$VM_TOOL run --headless --daemonize target/ROCKNIX-GENERIC_X64.x86_64-<date>.qcow2
#   virtio-gpu-pci, -display none, -vnc 127.0.0.1:9 (a committed scanout for
#   screendump), the serial console on /tmp/rocknix-qemu-serial.sock, a
#   pidfile at /tmp/rocknix-qemu.pid, and QEMU returns once the VM is up
tools/vm-serial wait                          # until EmulationStation is running
tools/vm-serial sh 'df -h /storage'           # a root shell line, its output back
tools/vm-serial script setup.sh               # a whole file, uploaded and run
kill "$(cat /tmp/rocknix-qemu.pid)"           # stop it -- by PID, never by pattern
```

The qcow2 comes from the raw image the same way every time: `gunzip -c
<img.gz> > vm.img && qemu-img convert -f raw -O qcow2 vm.img vm.qcow2 &&
qemu-img resize vm.qcow2 16G` (the 16 GiB is not optional; see below). First
boot resizes storage and reboots itself; `vm-serial wait` returns on the
second boot, twenty to thirty seconds in.

**Tools that speak SSH** (`tools/cloud-round-trip`): `sshd` on the image is
disabled but running, root login permitted, and there is no `/root` — the
home is `/storage`. One serial command provisions a key and the profile's
forward does the rest:

```bash
tools/vm-serial sh "mkdir -p /storage/.ssh && chmod 700 /storage/.ssh && echo '$(cat key.pub)' >> /storage/.ssh/authorized_keys && chmod 600 /storage/.ssh/authorized_keys"
ssh -i key -p 10022 -o StrictHostKeyChecking=no root@127.0.0.1 'echo ok'
```

**Two guests, one cloud (D-QA-009).** A conflict is a change on both sides
since they last agreed, and one guest cannot make one; a handheld must
never be asked to. `tools/vm-pair up <img.gz>` builds two disks from the
image, boots both headless — guest `a` on the defaults above, guest `b`
with a `-b` suffix on its sockets, SSH 10023, VNC :10 and its own MAC — and
provisions the QA key in each over serial; `vm-pair ssh a '…'`, `vm-pair serial b
'…'`, `vm-pair info`, `vm-pair down`. Both reach the host's backend at
`10.0.2.2`, so the pair against `cloud-test-backend` is the venue for every
fixture that manufactures a conflict or interrupts a transfer, run once on
WebDAV and once on MinIO.

**The pair through the harness.** `tools/cloud-round-trip --host
root@127.0.0.1 --port 10022 --second-port 10023 --identity
/tmp/rocknix-vm-pair/qa-key` runs the single-device suite on `a`, then the
two-device fixtures of #35 (`--only A1,A9` for a subset; `--only CONTRACT
--transport bisync` for #9's items, `--bisync-flags` for Gate 11's variants);
both guests are put back on every exit. Scripts fixed on the host ride in
`/tmp/qa-bin` on both guests through `--path-prefix`; the pair's `up` does
not put them there.

**Two guests must be two devices (#91).** `cloud_device_id` hashes the
permanent MAC, and `generic-x64-vm` gives every guest the profile's fixed
one, so two guests from one image printed one id between them
(`GENERICX64-15ca35b6b4` on both, 2026-09-08) — one settings folder, one
manifest, and pair fixtures agreeing with themselves. `vm-pair up` now
starts `b` with `--mac 52:54:00:52:4E:59` (the profile's plus one; `a`
keeps `…:58`, so its id does not move), and the harness reads both ids
before it prepares either guest and refuses the two-device fixtures when
they match or either is blank — nothing is written, so nothing needs
putting back. The rewrite it used to do (`<id>-second` on `b` for the run)
is gone: it ran every pair fixture on an identity the harness had invented.
A pair started before this keeps its shared id until `vm-pair up` rebuilds
the disks — the id is derived from the address on first boot and then
stored, so clearing `b`'s stored id while the MACs match re-derives the
same one. A11 alone clones `a`'s id onto `b`, on purpose, and puts it back;
a run interrupted inside A11 leaves that clone behind, and the refusal's
message tells the two cases apart by the MACs. The harness's stdout is block-buffered
when redirected, so a run in the background shows nothing until it ends —
wait for the `PASSED` / `N CHECK(S) FAILED` line rather than reading the
file early.

**Busybox `pgrep -x` compares the whole argv, not the comm.** On the guest
`pgrep -x retroarch` returns 1 while `/usr/bin/retroarch` runs (its argv[0]
is the full path); `pgrep -x emulationstation` happens to work because ES is
started by its bare name. Match a process by a bracketed fragment of its
path — `pgrep -f '/usr/bin/retroarc[h]'` — and kill by name with `killall`,
which is what `input_sense` does. The bracket protects only the pattern's
own literal: a `pkill -f 'f1-liv[e].sh'` still killed the shell running it
because the same command line carried `rm -f /tmp/qa-bin/f1-live.sh`. When
a command both matches and names the thing, put it in a script file and
run the file (2026-09-08, twice in one hour; the reviewer hit it the same
day with `pkill -f 'sleep 30'`).

**Stop it by PID.** `pkill -f 'vm76[.]qcow2'` killed the shell that ran it,
because the same command text held the literal in an `rm` three lines down,
and `bash -c` carries the whole script in its argv. The pidfile exists so
that this never has to be a pattern.

**Socket paths under 107 bytes.** A session scratch directory is longer than
that, and a longer path fails to bind with an error that names nothing. The
tool refuses one.

**A handheld's panel size is a flag.** `run --headless --res 640x480 …`
appends `xres=640,yres=480` to the virtio-gpu device (desktop and headless
alike), the guest's DRM takes it as the preferred mode, and EmulationStation
renders at it; without the flag the guest is QEMU's 1280×800 as before (#97).
So the 640×480 look of the picker rows and the transfer page (#85, #95, #94)
is a VM check first and a handheld confirmation second (D-QA-007): walk it at
1280×800, then again with `--res 640x480`; `tools/vm-visual-qa` and the
walks need no change, a `screendump` simply comes back at the guest's size.

## Driving EmulationStation from the monitor

The keys the image maps (`/storage/.config/emulationstation/es_input.cfg`,
read it on the guest rather than trusting this): **START = `ret`, A = `x`,
B = `z`, X = `s`, Y = `a`, SELECT = `shift_r`**, arrows for direction. The
things that cost a cycle each before they were written down:

- **A page opens on its first row, and `up` from there lands on its BACK
  button** — the wrap runs rows → buttons → rows. So the bottom of GAME
  SETTINGS is three `up`s from the top (BACK, the last row, the one above),
  not one. The button bar is a focus stop on every page.
- **START on MAIN MENU closes it.** START opens the menu from a system or
  game view; on the menu it is CLOSE. Sending it twice returns to where you
  were, and the next `x` launches whatever is under the cursor.
- **After five idle minutes the first key only wakes the screensaver.** Send
  `shift` first — a key the interface ignores — or the walk starts one key
  late and every later press lands one screen off.
- **`x` on a switch row toggles it; B closes the page and runs its save
  function.** So "flip a switch and see the effect" is `x`, `z`, then reopen.
- **A transfer page ends on PRESS ANY BUTTON TO CLOSE and returns to the hub**
  with focus where it was, not to the transfer page.
- **Wait 2 s after a page opens, 7 s after one that scans the cloud**, then
  `shot`. A frame taken early is the previous screen, and it reads as "the
  key did nothing".
- **A restarted EmulationStation comes back on the last game list, not the
  carousel.** `systemctl restart emustation` (and ES's own restarts) restore
  the list that was open -- TOOLS, MUSIC PLAYER, whatever the previous walk
  left -- so a walk that assumes the carousel starts one screen deep, and its
  `x` presses launch things: on 2026-09-09 one such run started the File
  Manager (`foot` + `commander.sh`) and every later key went to it. Only a
  full reboot lands on the carousel. After a restart, send one `z` (B) and
  read a frame before driving anything; when a frame shows a game list, that
  one B is the whole fix. A launched tool is killed by pid over SSH
  (`pgrep -a foot`), never by pattern, and ES then shows `UKNOWN ERROR : 230`
  (upstream's spelling) that one `x` dismisses.
- **After an ES restart, `screendump` can serve the previous ES's last frame
  for half a minute or more.** Frames captured 7-34 s after a restart still
  showed the old hub page with its old clock, while the new ES was already
  running and its startup sync had come and gone. The surface caught up once
  keys were sent. A full `reboot` does not have the problem: capture
  continuously from about 15 s after issuing it and the boot-time card is in
  the frames (`SYNCING SAVES AT STARTUP` at t+25 s, `COMPLETED SUCCESSFULLY`
  at t+27 s on 2026-09-09). Note that on a fresh boot the guest clock reads
  from the RTC until NTP corrects it, so log timestamps from the first minute
  lag real time by up to a minute (blindspot 32); order by uptime, not by
  the clock.
- **A serial or SSH command that hangs on `set_setting` is waiting on
  `/tmp/.system.cfg.lock`.** `wait_lock` spins with no timeout and never
  checks whether the holder is alive (#98); one `set_setting cloudsaves.startup 1`
  took 4 min 43 s on 2026-09-09 after a tool had been killed from outside.
  Read the pid in the file and `kill -0` it before waiting on it again.
- **`vm-serial wait` returns at once if an ES is still up.** Right after
  `reboot` the old EmulationStation is still running for several seconds, so
  "ready after ~0s" means nothing; check that `uptime` has reset first.
- **A screen that looks like the previous one is not proof the key was
  ignored.** Check `pgrep emulationstation` before re-driving input — an
  abort()ed ES restarts to the carousel, which looks the same.

`tools/vm-visual-qa` writes PNG with the stdlib, so the frames are readable by
anyone without Pillow. Read them; a walk whose frames nobody read has tested
nothing. Reusable walks live in `tools/vm-walks/` — compose them with `cat`.

## What the guest's busybox lacks

The scripts run on the image, not on the host, and the host's coreutils hide
that. Present: `mapfile` (bash), `stat -c`, `find -path`, `mktemp -d`,
`sort -u`, `flock`, `base64 -d`. Absent: **`comm`**, **`pgrep -c`**,
`find -printf`, `ls --time-style`, `realpath`. `comm ... | wc -l` reading 0
on the image shipped once (2026-09-06, a difference count that said
"identical"); `pgrep -c` prints usage and exits 1, which a `$(...)` reads as
an empty string. When a script reaches for a coreutils name, run it on the VM
before believing the host.

## Fixtures for the cloud tier

`tools/cloud-test-backend` serves a directory over WebDAV that the guest
reaches at `10.0.2.2:9010`; `seed-content` puts the content-tier fixture at
the endpoint and `seed-device` prints the guest half — the remote, the conf,
and device ROMs that pair with the fixture so every verdict a systems page
can give has a system that produces it:

```bash
tools/cloud-test-backend up && tools/cloud-test-backend reset
tools/cloud-test-backend seed-content
tools/cloud-test-backend seed-device > /tmp/seed.sh && tools/vm-serial script /tmp/seed.sh
tools/vm-serial sh '/usr/bin/cloud_content_restore --scan'
```

Then read the endpoint after a transfer (`cloud-test-backend ls`), never the
page's COMPLETED SUCCESSFULLY — that is the check that found `MEDIA_EXCLUDES`
being passed to nothing (blindspot 30).

## After every VM cycle

A cycle that taught something and left it in the work log has taught the
next cycle nothing. Before closing the cycle, sort what it found into:

1. **A tool or a flag** — anything that was a procedure (a boot recipe, a
   fixture, a wait loop) becomes code here or in `tools/`, so it cannot be
   skipped by not reading it.
2. **A walk** — any screen reached by hand becomes a `tools/vm-walks/*.steps`
   file, so the next cycle replays it.
3. **A line in this file** — a gotcha, a key, a missing applet.
4. **A row in `docs/vm-qa-log.md`** — the cycle itself: what the VM found,
   what it could not prove, and which of 1–3 it left behind. The next cycle
   starts by reading the last row.

The work log keeps the narrative; it is not where the next cycle will look.

## UTM virtio-gpu cursor sprite

UTM's virtio-gpu hardware cursor plane can display the **cursor graphic** upside down while
movement and the primary display remain correctly oriented. Do not add a coordinate
calibration or rotate the output—that would break correct pointer movement and UI orientation.
For virtual DRM connectors (`Virtual-*`), `111-sway-init` writes
`WLR_NO_HARDWARE_CURSORS=1` to Sway's environment, forcing wlroots to composite the cursor in
the correctly oriented primary plane. Confirm in `/var/log/sway.log`:
`Loading WLR_NO_HARDWARE_CURSORS option: 1`.

## Give the VM enough disk, or the UI silently breaks (16GB+)

The raw `.img` ships a tiny (~33MB) `STORAGE` partition that **resizes to fill its disk on
first boot** — but a bare `.img` is only ~4GB (`SYSTEM_SIZE=4096` + a small storage tail), so
on a ~4GB disk storage stays ~33MB and hits **100% full**. The first-boot
`rsync /usr/config → /storage/.config` then fails with **ENOSPC** and copies **0** of ES's 144
resource files, so ES can't resolve its `:/` resources (blur shader, `ubuntu_condensed.ttf`,
help icons). The result is a *rendering* ES with a **broken main menu** — no dimmed/blurred
background, wrong fonts, missing help-button glyphs — which looks like a graphics/compositor
bug but is **purely out-of-space**. Real hardware never hits this (storage resizes to fill the
whole SD card *before* the rsync).

Confirm from the serial shell: `df -h /storage` shows `100%`, and
`journalctl | grep -i "no space"` shows `rsync: ... No space left on device`.

- **Fix:** run on a **16GB+ disk**. `tools/fork-publish-release` converts the raw image into
  the sparse disk size defined by the canonical VM profile and packages that same qcow2 into
  `.utm.zip`; first-boot resize then gives ~12GB `STORAGE` and every resource populates. For
  a bare `.img`, grow the disk (`qemu-img resize <disk> 16G`, or a ≥16GB target) **before**
  first boot.
- **Don't** chase weston / Mesa / `glBlitFramebuffer` for a missing menu dim — that is a red
  herring downstream of the missing `:/shaders/blur.glsl`. The compositor never changes ES's
  own Mesa GL context, so weston vs sway is irrelevant here.

## KVM access (important gotcha)

`setfacl -m u:max:rw /dev/kvm` grants access but **logind resets it** on session changes, so it
breaks between boots. The durable fix is group membership + `sg`:

```bash
sudo usermod -aG kvm <user>     # once (persistent)
sg kvm -c '<qemu command>'      # picks up the group with no re-login
```

## Inspect a headless VM

- **Screenshot** (verify the UI without a display): QEMU monitor `screendump`
  `printf 'screendump /tmp/es.ppm\n' | socat - UNIX-CONNECT:/tmp/qmon.sock` (or a tiny
  Python `AF_UNIX` client). Convert PPM→PNG with stdlib `zlib`/`struct` if no image tools.
  Needs a display backend that commits the scanout — use `-vnc :N` (a bare `-display none`
  captures all-black). Drive input with the monitor: `sendkey ret` opens the ES main menu.
- **Reliable in-guest shell over serial** (prefer this — SSH can reset mid-handshake with
  `kex_exchange_identification: Connection reset`): GENERIC_X64 ships
  `serial-debug-shell.service` (autologin root `/bin/sh` on `ttyS0`). `run --headless`
  puts it on a unix socket and `tools/vm-serial` is the client (echo off, unique
  `BEG`/`END` markers around every command because the boot console shares `ttyS0`).
  This is the channel that found the disk-size bug.
- **Live logs over SSH**: default login is `root` / `rocknix`; `PermitRootLogin yes`. No
  `sshpass` on the host — use `SSH_ASKPASS=<script-echoing-pw> SSH_ASKPASS_REQUIRE=force
  setsid -w ssh -p 10022 root@127.0.0.1 …`. ES logs to tmpfs `/var/log/es_log.txt`,
  sway to `/var/log/sway.log`.
- **Offline logs** (VM off): `dd if=IMG of=/tmp/p2.ext4 bs=512 skip=<part2 start sector>`
  then `debugfs -R "cat /.config/emulationstation/es_settings.cfg" /tmp/p2.ext4` (toolchain
  `debugfs`/`mtools` are under `build.*/toolchain/bin`). Handy because `/var/log` is lost on
  shutdown; `/storage` (partition 2, ext4, label `STORAGE`) persists.

## Debug order

When ES fails, check the layer below before blaming the app: read `sway.log` first — an ES
"wayland not available"/renderer abort is usually sway having failed to find a GPU
(`/dev/dri/cardN`), not an ES bug. See `engineering-practices.md`.

## Won't boot in UTM / a VM → check the disk logical sector size (4K vs 512)

The image's GPT + ESP FAT are laid out for **512-byte** sectors. OVMF/UTM firmware **cannot
UEFI-boot a disk exposed with 4096-byte logical sectors** — it misreads the 512b GPT (sees
only the protective MBR), finds no ESP, and drops to the UEFI interactive shell. Symptom in
the shell: `map` shows only `BLK0`/`BLK1`, **no `FS0:`**; firmware prints
`BdsDxe: failed to load ... Not Found` → PXE.

- The image is **not** at fault — it boots in every 512b firmware/bus (Ubuntu OVMF, upstream
  EDK2, qemu's own `edk2-x86_64-code.fd`; virtio and SATA). Don't "fix" the image.
- **Fix is VM-side:** present the boot disk as **512-byte sectors** (UTM: use a VirtIO/SATA
  drive, not a 4K disk). A shipped VM artifact (`.utm`/OVA) must bake in a 512b disk config.
- **Reproduce locally** with UTM's exact firmware:
  `curl -L .../pc-bios/edk2-x86_64-code.fd.bz2` (+ `edk2-i386-vars.fd.bz2`) from the qemu repo,
  then `-device virtio-blk-pci,drive=d0,logical_block_size=4096,physical_block_size=4096` →
  reproduces the shell drop; drop the two block-size args (→ 512b) → boots.
- **Container format is irrelevant** to this: raw/qcow2/vdi/vmdk all decode to identical disk
  bytes; only the *sector size the VM presents* and the machine config matter. "Shareable dev
  image" = an appliance that carries machine config (`.utm` bundle for UTM, OVA for
  VirtualBox/VMware), not a bare disk — a bare disk still needs correct UEFI + 512b setup.

## Automated visual QA (`tools/vm-visual-qa`)

UI work can be reviewed without flashing a device or photographing a handheld.
QEMU's human monitor exposes two primitives that both work under `-display none`,
which is what makes this usable on a headless build host:

- `sendkey <key>` — the guest sees real key events
- `screendump <file>` — writes the current framebuffer as a PPM

`tools/vm-visual-qa` wraps them: it runs a step file (`key` / `wait` / `shot`),
converts frames to PNG (stdlib; no Pillow needed), and optionally assembles an
animated GIF (that part does need Pillow). `tools/vm-walks/` holds the step
files worth keeping.

```bash
# boot headless with a monitor socket, then:
tools/vm-visual-qa --monitor /tmp/mon.sock run steps.txt --outdir shots/ --gif walk.gif
```

**Input mapping is the trap.** ES's *compiled* keyboard defaults (F1 = start) are
not what ships: `/storage/.config/emulationstation/es_input.cfg` on the image maps
**start = Enter, A/OK = `x`, B/back = `z`**, arrows for direction. Read that file
on the guest rather than assuming — a wrong mapping looks exactly like "input is
broken".

Other sharp edges: menu lists **wrap**, so `up` from the top is the short path to
entries near the bottom; give ES a second or two to settle before `shot`, and wait
for the PPM's size to stop changing or you capture a torn frame.

The frames are meant to be *read* — by a person or an image model — which catches
what code review cannot. Its first run found a shipped defect: Cloud Tools actions
rendered without their scope descriptions whenever no remote was configured.
