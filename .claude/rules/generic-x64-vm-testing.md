---
description: "How to build-test and QA the GENERIC_X64 (x86_64) VM image locally in QEMU/KVM."
paths:
  - "projects/ROCKNIX/devices/GENERIC_X64/**"
  - "projects/ROCKNIX/packages/**"
  - "scripts/mkimage"
  - "scripts/image"
  # The harness is most of this file and none of it lived under the globs
  # above, so a session editing the runner, a walk or the QA endpoint had the
  # rule out of context (#147, 2026-09-12).
  - "tools/vm-qa"
  - "tools/vm-serial"
  - "tools/vm-pair"
  - "tools/vm-visual-qa"
  - "tools/vm-walks/**"
  - "tools/cloud-test-backend"
  - "tools/emulator-exit-test"
  - "tools/time-to-play"
  - "docs/vm-qa-log.md"
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
  DOCKER_EXTRA_OPTS='-v /workspace/repos/rocknix/.git:/workspace/repos/rocknix/.git -v /workspace/cache/rocknix-sources:/workspace/repos/rocknix.worktrees/generic-x64/sources'
```

**Both mounts, every time.** The worktree's `sources/` is not a directory of
ours: it is the root-owned mount point Docker left behind, so a build
without the second mount dies in its first minute with `mkdir: cannot create
directory '.../sources/kernel-firmware': Permission denied` under a headline
naming whichever package came first (`install kernel-firmware:target has
failed`, 2026-09-12). The shared cache is `SOURCES_DIR` for every build root
(`device-builds.md`).

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

**Cutting the guest's link (fault injection, #103).** `tools/vm-serial sh 'ip
link set eth0 down'` cuts it; `... up` restores it. Serial is the only channel
that survives the cut: the host's forwarded SSH arrives from `10.0.2.2` like
everything else, so it goes with the link -- and it does not *die*, it
**stalls**, because an admin-down does not reset an established TCP
connection, so a command over a `ControlMaster` blocks for the whole outage.
Close the master before the cut (`ssh -O exit`) and go back over SSH only once
serial confirms the network. Inside the guest the routes vanish at once (a
fresh connection fails in 20 ms, `network is unreachable`; rclone does not
retry it), the IPv4 address lingers until NetworkManager notices ~8 s later
and flushes it (`nmcli dev` -> `unavailable`), and in-flight transfers sit in
`ESTABLISHED`. After `up` the address, default route and a ping to `10.0.2.2`
are back in ~0.3 s -- a handheld's Wi-Fi takes seconds to reassociate, so
*test for the return* (`ip -4 addr show eth0 | grep inet && ip -4 route show
default | grep . && ping -c1 -W1 10.0.2.2`) rather than assume it. Read the
interface off `ip -4 route show default` (`eth0` here, `wlan0` on a handheld).
Two things this guest cannot stage: a *silent* black hole (no iptables/nft/tc
on the image), and `ip route del default` does **not** cut the QA endpoint --
`10.0.2.2` sits on the guest's own /24. Established TCP rides a short outage
out and resumes on its retransmit schedule, so an *unbounded* rclone
**completes** after a brief outage rather than hanging; the hang needs an
outage longer than its timeout budget, and the load-bearing signal on a short
one is the exit code and stamp. One backend sharp edge: `rclone serve webdav`
fed a fully-buffered aborted PUT through slirp holds the destination name's
lock and returns `423 Locked` to a re-PUT of the same name for minutes -- a
VM-only artifact (a real provider resets the aborted PUT), so assert
re-upload idempotency for a same-name upload on MinIO/S3 or a device. The
same buffer has a second face since the deliberate run's stall ceiling
(#153): a healthy 12 MiB re-run is taken by slirp at once and drained by
the throttled server for ~40 s, during which rclone's counter reads 100%
and moves nothing, so the ceiling ends an upload that is completing and
the archive is whole afterwards (LINK5 on WebDAV, 4d7eb1f303, 2026-09-13).
The cell SKIPs that signature on WebDAV only (D-CLOUD-128); KILL5's 6 MiB
archive drains inside the ceiling, and on S3 the same re-run has passed.
`tools/cloud-round-trip --only LINK1,...,LINK7 --serial-socket <sock>` does
all of this against the throttled endpoint and refuses unless the console it
holds is the device on `--host` (a nonce written over SSH, read over serial).
The cells are off by default in the suite and skipped with a line when no
serial socket is given, which is every handheld.

**Lagging the guest's resolver (fault injection, #175).** A hotspot whose DNS
answers seconds after its address is the case the network-up token retry
exists for, and it is reproduced through the image's own override, not by
editing what looks like the file. `/etc/resolv.conf` -> `/run/rocknix/resolv.conf`
-> `/run/systemd/resolve/stub-resolv.conf`: two symlinks, and resolved
regenerates the stub at every link change, so a `nameserver` written through
them is gone the moment the link comes up (which is exactly when the test
needed it). `network-base-setup` copies **`/storage/.config/resolv.conf`**,
when present, into `/run/rocknix/resolv.conf` as a regular file at boot and
nothing touches it afterwards. So: write `nameserver 127.0.0.1` there before
the boot -- nothing listens, `getent`/curl fail in a millisecond with `Could
not resolve host` -- and to end the lag remove the override and put the
symlink back (`rm -f /storage/.config/resolv.conf /run/rocknix/resolv.conf;
ln -sf /run/systemd/resolve/stub-resolv.conf /run/rocknix/resolv.conf`). The
override is a supported user setting, so leave the guest without it. ES logs
to `/var/log/es_log.txt` (a `/storage/.cache/log/` copy beside it); there is
no `es_log.txt` under `/storage/.config/emulationstation/`, and a `grep -c`
on that path over serial returns an error line whose digits are none, which
`tr -dc '0-9'` turns into an empty count -- a FAIL that names the harness.

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
  This holds when you "know" the state: a walk composed without `wake.steps`
  because the previous walk had ended on the carousel five minutes earlier
  lost its first key to the screensaver, entered a game list on the second,
  and launched a game twice (2026-09-10). Wake first, every time, and begin
  from a frame, not from memory.
- **`x` on a switch row toggles it; B closes the page and runs its save
  function.** So "flip a switch and see the effect" is `x`, `z`, then reopen.
- **A transfer page ends on PRESS ANY BUTTON TO CLOSE and returns to the hub**
  with focus where it was, not to the transfer page.
- **Do not time a page; watch it.** A frame taken early is the previous
  screen, and it reads as "the key did nothing". `settle` before every
  `shot` and `wait-for-change` after every press replace the old advice
  (2 s after a page opens, 7 s after one that scans the cloud), which was
  right on an idle host and wrong on a building one.
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
  `/tmp/.system.cfg.lock`, and since #98 that means a live holder.** Until
  2026-09-09 `wait_lock` spun with no timeout and never checked whether the
  pid in the file was alive; one `set_setting cloudsaves.startup 1` took
  4 min 43 s after a tool had been killed from outside. It now removes a lock
  whose pid is dead (or whose file is empty or not a pid) and retries at
  once, and after 30 s of one live holder logs its pid once. So on a build
  that carries it, `journalctl -t wait_lock` names the holder to look at;
  on an older build, read the pid in the file and `kill -0` it yourself.
  `tools/wait-lock-test` proves both behaviours against any copy of
  `001-functions`.
- **`vm-serial wait` returns at once if an ES is still up.** Right after
  `reboot` the old EmulationStation is still running for several seconds, so
  "ready after ~0s" means nothing; check that `uptime` has reset first.
- **A screen that looks like the previous one is not proof the key was
  ignored.** Check `pgrep emulationstation` before re-driving input — an
  abort()ed ES restarts to the carousel, which looks the same.

- **Wait for the frame, not for the clock.** Since #125 the walk steps are
  `settle` (until the screen holds still) and `wait-for-change` (until the
  last key has visibly landed), and every file in `tools/vm-walks/` is
  written on them. A fixed `wait N` between presses is a guess about a host
  that is also building: a press a second after a screen change is
  regularly eaten, and the rest of the walk then runs one screen out of
  phase. `wait-for-change` re-sends the eaten press once and then fails the
  walk naming the key and the line, so the wrong-screen frames are never
  produced at all.

`tools/vm-visual-qa` writes PNG with the stdlib, so the frames are readable by
anyone without Pillow. Read them; a walk whose frames nobody read has tested
nothing. Reusable walks live in `tools/vm-walks/` — compose them with `cat`,
or name the composition in `tools/vm-walks/suite.txt`, which is what
`tools/vm-qa --only walks` replays (`--guest b` to drive vm-pair's second
guest).

## Frame at the handheld's size, not only the pair's

vm-pair's guests run at 1280x800. The maintainer's handhelds are 640x480,
and two things differ under 720 px that 1280x800 never exercises:
`Font::get` scales every requested size by 1.31 (1.5 under 320), and
full-screen menus are on, so the window draws no help bar under a second
page. #27's first cut was right at 1280x800 and truncated every label at
640x480; four cuts were each caught by a 640x480 frame and none would have
been caught at the pair's size (blindspot 41).

So a UI change is framed at 640x480 before it is called done. A small guest
beside the pair is one QEMU command: the pair's arguments with `-device
virtio-gpu-pci,xres=640,yres=480`, its own disk from the same image, its own
ports and sockets (`-d` suffix, SSH 10026, MAC `52:54:00:52:4E:5B`, VNC :12),
the QA key written over serial with `tools/vm-serial`. **Its disk lives in
its own directory on the disk-backed workspace** (`/workspace/tmp/rocknix-vm-d`),
never in vm-pair's and not on `/tmp`. `/tmp` is a 31 GB tmpfs: a raw image is
4.3 GB, each guest disk 2 GB, and a disk deleted under a running guest still
counts until that guest exits. Two conversions at once ran it out of space
and truncated both new disks silently -- 0.9 GB and 1.8 GB where 2.2 GB was
right -- so the guests booted to the firmware's boot menu (2026-09-13, twice
before the cause was found). Check `df /tmp` before a second conversion, and
never in vm-pair's directory: `vm-pair up`
begins with `rm -f "$DIR"/vm-*.qcow2`, so a third guest kept there loses its
disk under it the moment the runner starts and boots into the firmware's
"select boot device" menu, while its own conversion disturbs the pair's
(2026-09-13, both at once). The session scratchpad's `rebuild-d.sh` does the
rest and reboots the guest seeded with a NES ROM and three save states;
making it a `vm-pair` guest is open. Read the small frame first: at that
size a label that fits is the finding, and a bar that is missing is one too.

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

`tools/cloud-test-backend` serves a directory to the guest in **five
protocols**, each on its own port so more than one can be up at a time
(#133). The guest reaches every one of them at `10.0.2.2`.
`seed-content` puts the content-tier fixture at the endpoint and
`seed-device` prints the guest half — the remote, the conf, and device ROMs
that pair with the fixture so every verdict a systems page can give has a
system that produces it:

```bash
tools/cloud-test-backend up && tools/cloud-test-backend reset      # WebDAV, the default
tools/cloud-test-backend --backend sftp up                         # or any of the five
tools/cloud-test-backend seed-content
tools/cloud-test-backend seed-device > /tmp/seed.sh && tools/vm-serial script /tmp/seed.sh
tools/vm-serial sh '/usr/bin/cloud_content_restore --scan'
```

Then read the endpoint after a transfer (`cloud-test-backend ls`), never the
page's COMPLETED SUCCESSFULLY — that is the check that found `MEDIA_EXCLUDES`
being passed to nothing (blindspot 30).

### The five backends

| `--backend` | Port | How it runs | Data under `~/.cache/rocknix-cloud-qa/` | Hashes | Modtimes | A PUT cut in flight |
| --- | --- | --- | --- | --- | --- | --- |
| `webdav` (default) | 9010 | `rclone serve webdav`, a host process | `data/` | no | **no** | leaves a short file |
| `s3` | 9012 | MinIO in a container (`rocknix-cloud-qa`) | inside the container | MD5 | yes | **commits or nothing** |
| `sftp` | 9013 | an unprivileged `sshd`, key auth only | `sftp/data/` | no | yes | leaves a short file |
| `smb` | 9014 | Samba in a container (`rocknix-cloud-qa-smb`) | `smb/data/` | no | yes | leaves a short file |
| `ftp` | 9015 | `pyftpdlib` in a venv, PASV 9060-9069 | `ftp/data/` | no | yes | leaves a short file |

`caps` prints the last three columns for the selected backend; nothing binds
**9011**, which is the dead port every failure fixture aims at
(`dead-conf` writes the refusing stanza, in whichever field that backend
carries its address).

**The three shapes a remote path can have**, which is why no caller should
hard-code one: on WebDAV and FTP the folder *is* the path (`/GAMES`); on S3
the first component is the bucket and on SMB the share (`/rocknix-qa/GAMES`,
`/qashare/GAMES`); on SFTP every path is absolute, because an sshd running as
an ordinary user cannot chroot. `endpoint-prefix` states what to strip,
`saves-remote` / `settings-remote` / `content-remote` state what to
configure. A hard-coded `/QA-Custom` is a legal folder on Dropbox and an
illegal *bucket name* on S3.

**WebDAV is the harshest and stays the default.** With `vendor=other` it
carries neither hashes nor modtimes, so rclone compares by size alone —
which is the shape of #53. The other four all carry modtimes, so a bug only
WebDAV can catch is one WebDAV must keep catching.

### What the matrix cannot do here

- **No hosted provider.** Google Drive, Box, pCloud and Mega need accounts
  somebody has to create; that half of #133 is the maintainer's to start.
  Everything else — the S3 form, a hash-less remote, the WINDOWS SHARE tier,
  FTP — runs on this host with no account at all, so "we need a real
  provider" is not an answer to *can this be done on the VM?*
- **WebDAV and S3 can be throttled; the other three cannot.** For WebDAV
  `CLOUD_QA_BWLIMIT` is an `rclone serve` flag. For S3 (#151 PL-13,
  `96284d5544`) the same variable moves MinIO to loopback 9022 and fronts
  9012 with an inline token-bucket proxy shaped like rclone's (4 MiB burst,
  one bucket per direction), so the LINK constants calibrated on WebDAV
  hold; the host's own rclone bypasses it. `backend_throttled()` reads
  `<state>/<backend>.pid` for both. SFTP, FTP and the SMB tier have no
  throttle, so the LINK cells still cannot run against them. On S3 the LINK
  cells see rclone's S3 backend re-dial through the AWS SDK's backoff for
  `--low-level-retries 10` after a cut, which no `--timeout` covers -- the
  deliberate `--system-only` run completed 88.8 s after a 40 s cut and
  reported success (its own issue).
- **Only S3 can prove an atomic PUT.** Four of the five write into the final
  name, so a file cut mid-body reads as truncated; KILL1's torn-file
  assertion is asserted on `--backend s3` and skipped, with the reason, on
  the rest.
- **The host's rclone is not the guest's** (1.60 here, 1.75 on the image).
  Test rclone *behaviour* by running rclone on the guest against the
  endpoint, never on the host.

## Fixtures for the launch path

`tools/emulator-exit-test --port <ssh> --identity <key> --vm` (fork-only;
`--vm` swaps RetroArch to the gl driver for the run because the guest has no
Vulkan, never pass it for a handheld). It builds a battery-backed Game Boy
cartridge that writes a known byte, launches it through `runemu.sh` as
`es_systems.cfg` does, and drives the shipped `execute_kill` from the
installed `input_sense`: one press, a held combo, the debounce window on a
target of its own, and the marker's lifetime. Against an `input_sense` with
the debounce stripped it fails in two places (no `.srm`; the repeat went
through), which is what makes it a gate (#117, #120). The exit code is not
the signal -- since #92 a forced quit reads as clean -- the save on disk is.

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
  **A reboot over it is a plain `reboot`** with a short END timeout
  (`tools/vm-serial --timeout 8 sh 'sync; reboot'`): the client waits for an
  END marker the guest never sends because it is going down, and returns when
  the timeout does. The backgrounded form, `(sleep 1; reboot) >/dev/null 2>&1 &`,
  returns cleanly and reboots nothing -- the first #175 proof run on RC-4
  (2026-09-14) read a 357 s uptime after its "offline boot", and every check
  after that was of the wrong boot. After `vm-serial wait`, read
  `/proc/uptime` and refuse the boot if it is not small.
- **Live logs over SSH**: default login is `root` / `rocknix`; `PermitRootLogin yes`. No
  `sshpass` on the host — use `SSH_ASKPASS=<script-echoing-pw> SSH_ASKPASS_REQUIRE=force
  setsid -w ssh -p 10022 root@127.0.0.1 …`. ES logs to tmpfs `/var/log/es_log.txt`,
  sway to `/var/log/sway.log`.
  **The ES log file is late, and its tail can be lost.** `AsyncLogger`
  (`es-core/src/Log.cpp`) queues lines to a worker and flushes the stream
  every 8 batches, so a line can sit unflushed for minutes on an idle
  carousel -- on 2026-09-14 the token check's lines reached the file 100 s
  after they were logged, and a live `grep -c` said 0 for a line that was
  there. So a live check never gates on the file: read the count again
  later, or take the line from a channel that is not buffered. **ERROR
  lines also go to stderr, which is the journal** (`journalctl -b -u
  emustation`, the unit's `start_es.sh[pid]` lines, immediate); WARNING and
  INFO lines reach only the file, which is complete in `es_log.N.txt` after
  the next boot (the SIGTERM handler flushes, with a 10 ms wait for the
  worker that fork #178 asks about). And **the credential filter drops
  prose**: RetroAchievements' refusal reads `Invalid user/password
  combination`, so a `grep -v passw` read of the log or the journal says
  the line is not there when it is (the same run, twice). For a read whose
  answer may be that sentence, mask values rather than drop lines --
  `sed -E 's/((passw[a-z]*|token|key)[=:][ ]*)[^ ",]+/\1<masked>/gI'` --
  and keep the dropping filter for config files, where a value is the
  whole line.
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

## One command for every check

`./tools/vm-qa <ROCKNIX-GENERIC_X64...img.gz>` brings the pair up from the
image and runs the scripts test, the round-trip suite, the emulator-exit cell
and every walk, leaving `report.md` and the logs and frames under
`/workspace/artifacts/rocknix-images/qa-<build>-<backend>-<guest>-<date>/`;
it exits non-zero if any suite failed. `--skip-up` for a pair already on the
image, `--only` for a subset, `--link` for the seven link-loss cells (minutes
each, never while an image builds on this host -- they are timing-bound).
`--backend <name>` picks which of the five QA clouds every suite talks to
(default `webdav`); the report header names the cloud, its port and its
caps. Run it on every image before anything is staged (#120).
`--ra-offline` (or `--only ra-offline`) adds the offline-achievements
scenario, `tools/ra-offline-test` (#166): opt-in like `link` because it
needs the serial console, the QA RetroAchievements account file, and spends
one of that account's cheap achievements per PASS -- see § Games with
RetroAchievements sets below. `--guest d` drives the 640x480 guest beside
the pair (`--skip-up` with it: `up` is written around the pair only).

Two runs fit on one host at once — `--guest a` against one backend and
`--guest b` against another, which is how the matrix is walked:

```bash
./tools/vm-qa --skip-up --only round-trip --backend webdav --guest a &
./tools/vm-qa --skip-up --only round-trip --backend sftp   --guest b &
```

The round trip takes about 130-160 s per backend on this host — except S3,
which takes ~578 s, nearly all of it in one step against a refused endpoint
(#143).

## Crash and hang recipes

The profile carries QEMU's `i6300esb` watchdog with `-action watchdog=reset`,
and the GENERIC_X64 kernel has pstore over UEFI variables (the guest boots
OVMF, so a panic's kernel log lands in the variable store and comes back as
`/sys/fs/pstore/dmesg-efi-*` on the next boot). That makes the whole of
`handheld-evidence.md` provable here except H700 DRAM retention.

- **A hard power cut**: `system_reset` on the monitor socket. No shutdown
  runs, so anything not yet synced is lost -- which is the point. The
  journal syncs every minute; write a marker with `logger`, wait past the
  interval, cut, and look for it in `journalctl -b -1`.
- **A kernel panic**: `echo c > /proc/sysrq-trigger` (sysrq is on). The guest
  reboots itself after `kernel.panic` seconds; `systemd-pstore` then copies
  the dump into `/storage/.cache/log/pstore/`.
- **A PID 1 that stops pinging**, which is what a hung kernel looks like to
  the watchdog: freeze it. The guest runs hybrid cgroups with a v1 freezer,
  so `mkdir /sys/fs/cgroup/freezer/wd; echo 1 > .../wd/tasks; echo FROZEN >
  .../wd/freezer.state` stops systemd cold, and the i6300esb resets the guest
  within `RuntimeWatchdogSec` (17 s observed against 15 s). The previous
  boot's journal then ends without a shutdown line, which is what a real
  hang looks like afterwards. **Do not try to starve PID 1 with RT busy
  loops**: since 6.12 the scheduler's fair deadline server
  (`/sys/kernel/debug/sched/fair_server/cpuN/runtime`, 50 ms/s) guarantees
  SCHED_OTHER tasks CPU regardless of `sched_rt_runtime_us`, and four
  `chrt -f 99` loops on four vCPUs left systemd pinging happily (2026-09-10).

`journalctl --list-boots` is the quickest check that the journal is
persistent at all: a volatile one lists exactly one boot, always.

## Automated visual QA (`tools/vm-visual-qa`)

UI work can be reviewed without flashing a device or photographing a handheld.
QEMU's human monitor exposes two primitives that both work under `-display none`,
which is what makes this usable on a headless build host:

- `sendkey <key>` — the guest sees real key events
- `screendump <file>` — writes the current framebuffer as a PPM

`tools/vm-visual-qa` wraps them: it runs a step file, converts frames to PNG
(stdlib; no Pillow needed), and optionally assembles an animated GIF (that
part does need Pillow). `tools/vm-walks/` holds the step files worth keeping.

```bash
# boot headless with a monitor socket, then:
tools/vm-visual-qa --monitor /tmp/mon.sock run steps.txt --outdir shots/ --gif walk.gif
```

The step verbs are `key` / `wait` / `shot` and, since #125, `settle`,
`wait-for-change`, `wake` and `dismiss-dialogs`. The last four compare
framebuffers rather than counting seconds: `settle` waits until the screen
holds still, `wait-for-change` until the last press has visibly landed (and
fails the walk when it has not), `wake` spends the screensaver's free press
on a key the interface ignores, and `dismiss-dialogs` presses B until the
screen repeats itself, which is the carousel toggling GO TO — so it ends
there whatever was open, where a fixed count of B presses ends on a dialog
from an odd depth. `--help` carries the thresholds, how they were measured
on a 640x480 guest, and the interface facts a walk would otherwise have to
rediscover.

**Neither a walk's result nor its timing is a fixed delay any more, and that
is the point.** The frame steps are what make a walk survive a host that is
also building — which is the normal state of this machine.

**Cutting the guest's power (KILL12/13, #105).** `system_reset` over the
monitor (`printf 'system_reset\n' | socat - UNIX-CONNECT:/tmp/rocknix-qemu-monitor.sock`)
drops every dirty page in the guest and keeps QEMU up; the disk holds exactly
what the guest issued. Close the SSH master first (`ssh -O exit`) -- a command
over it stalls across the reset as across a link cut. Prove the reset landed
before trusting `vm-serial wait`: read `/proc/sys/kernel/random/boot_id` and
`/proc/uptime` over serial before, and require a new boot_id and an uptime
below what it would have read without a reset -- `uptime < u0` alone fails
when the previous boot was seconds ago. Then `pgrep emulationstation | wc -l`
= 1, the network test, and `flock -n /var/run/cloud_sync.lock true` (the
startup sync). `/var/log` does not survive, so anything to be read from
`es_log.txt` is read in the boot after the cut, and `Could not parse Settings
file` never lands there at all (Settings load before the log opens). A boot on
a reseeded `system.cfg` can come up with sshd off: `sshd.service` needs
`/storage/.cache/services/sshd.conf`, written from `ssh.enabled` at boot, so
recover over serial with `touch` of that marker then `systemctl start sshd`.
Once, a reset boot came up with a garbage command line and sat in the
initramfs shell on the VGA console (ESP intact); a second reset booted
normally, so give a silent boot 150 s and reset once more before calling it
dead. The virtio disk is not an SD card: the reset models a battery dying,
not a card's write cache or FTL, and on this disk a page close followed by a
cut within 200 ms already tears `system.cfg` written in place.
`tools/cloud-round-trip --only KILL12,KILL13 --serial-socket ... --monitor-socket ...`
does all of this.

**Input mapping is the trap.** ES's *compiled* keyboard defaults (F1 = start) are
not what ships: `/storage/.config/emulationstation/es_input.cfg` on the image maps
**start = Enter, A/OK = `x`, B/back = `z`**, arrows for direction. Read that file
on the guest rather than assuming — a wrong mapping looks exactly like "input is
broken".

Other sharp edges: menu lists **wrap**, so `up` from the top is the short path to
entries near the bottom -- through the BACK button, which is a focus stop on every
page. Put a `settle` step before every `shot` rather than a delay; the tool waits
for the PPM's size to stop changing itself, so a torn frame is no longer yours to
worry about.

The frames are meant to be *read* — by a person or an image model — which catches
what code review cannot. Its first run found a shipped defect: Cloud Tools actions
rendered without their scope descriptions whenever no remote was configured.

## The credential filter is for a guest's files, not for a harness's verdicts

Guest and device reads go through `grep -v -i -E 'key|pass|token|user|psk'` so a
value never lands in a transcript. Applied to a harness log it deletes every
`PASS` line -- a proofs run on 2026-09-13 lost its own verdicts that way. For
host-side harness output (`tools/vm-qa`, `tools/cloud-round-trip`,
`tools/last-good-scripts-test`) filter on the shapes a value would take,
`grep -v -i -E 'passw|pass=|pass:|token=|key='`, and keep the verdicts; the
strict filter stays for anything read from `/storage`.

## Games with RetroAchievements sets for the guests

Three free homebrew titles with RetroAchievements sets live outside the repo at
`/workspace/artifacts/rocknix-qa-roms/` (README there: sources, sha256s, systems):
Tobu Tobu Girl Deluxe (GBC), Niñoid (GB), Böbl (NES). They are what an achievement
proof on a guest uses -- the fixture ROMs have no sets, so before 2026-09-13 an unlock
could only be shown on a handheld. Copy them under `/storage/roms/<system>/`, put the
QA account on with `tools/qa-accounts <port> ra`, and read RetroArch's log for the
unlock; with the offline proxy on, the proxy's `service.log` shows the queued award and
its flush. Do not commit them; the directory is the fixture home.

`tools/ra-offline-test` drives the whole scenario (the `ra-offline` suite of
`tools/vm-qa`): account on, toggle on, the game launched online through the
interface's own launch path (`POST /launch` on the guest's loopback, as
`tools/time-to-play` does), the link cut on the monitor, the game driven over
`sendkey` until RetroArch logs `Awarding achievement`, the exit with the link
down, `pending`, the link back, `Flush complete ... flushed=1`, the stamp, and
RetroAchievements' own API saying the award landed. `--control` runs it with
the toggle off and asserts #162's loss instead.

Three things about it that are not obvious from the outside:

- **An achievement is spent by a PASS.** RetroAchievements records an unlock
  once per account (softcore; hardcore is a second life, but the proxy is
  casual-only), so the fixture first asks RA's API which of its routed
  achievements the QA account has NOT earned, and FAILs naming the spent one
  with its date when none is left -- never passes over nothing. The
  maintainer resets the account's progress on the game at retroachievements.org
  between runs (2026-09-14), or a second QA account is used. A nightly that
  includes this suite needs one of those every run.
- **A route is a key cadence someone has driven to the award.** Tobu's hidden
  song: two STARTs to the MAIN MENU, then left/right through the carousel with
  4.5 s on each entry -- the award at about the 18th press, 90 s in. Böbl's
  Dive Ball and Niñoid's double jump have no route: Böbl's bubble must be
  sprung over a pillar from a full dive on a timing no blind sequence hit, and
  Niñoid's tutorial kid did not jump on A, B or Up (2026-09-14, on a pair guest
  with the link cut so nothing was spent -- hardcore mode is how a spent
  softcore achievement is re-driven for a route check: it fires again, and is
  lost on purpose by killing RetroArch before the link returns).
- **The only channel with the link down is the serial console**, and its
  lines end in CRLF. `tools/vm-serial` strips the outermost; a second line
  keeps its `\r`, so `"0"` reads as `"0<CR>"` in a `[ = ]`. Pipe serial
  output through `tr -d '\r'` before comparing it. Busybox `pgrep -x
  retroarch` matches nothing (the process is `/usr/bin/retroarch`); use
  `pgrep -f ^/usr/bin/retroarch`. And `exec.log` carries
  `cheevos_password = "..."` from `setsettings.sh` -- every excerpt goes
  through the credential filter with the account name masked.

## The interface runs under `essway.service`, and its PATH comes from `/etc/profile`

On the VM image (and the handhelds' too) EmulationStation is not `emustation.service`'s
process: that unit is inactive, and `essway.service` runs `/usr/bin/start_es.sh`, which
sources `es_settings` -> `/etc/profile` -> `/etc/profile.d/*` (where `098-busybox` sets
`PATH="/usr/bin:/usr/sbin"`) -> `/storage/.config/profile.d/*`, then execs
`emulationstation`. So on 2026-09-14 a drop-in on `emustation.service` was loaded and
changed nothing, and `Environment=PATH=...` on `essway.service` reached `start_es.sh` and
was reset before the interface ran. A shim that must be first on the interface's PATH (a
`systemctl` that sleeps on stop, to watch a page stay alive during a ctl call) goes in as
a file under `/storage/.config/profile.d/` with `export PATH=/storage/.qa-shim:$PATH`, and
applies at the next boot -- to every shell that sources the profile, your own included.
Read the answer from `/proc/<pid>/environ` of the running interface, not from
`systemctl show`.

Three more harness traps from the same day. Busybox `pgrep` has no `-c`; a poller that
runs `pgrep -c` prints a usage message every second and reads as "0" downstream -- use
`pgrep -f 'patter[n]' | wc -l`. `settle` compares frames with a dead band, so a row whose
counter moves by a digit or two (`SCANNING... - GAME 24 OF 57`) reads as still: the end
of a run is a fixed `wait` sized to the run, then a settle. And a press sent while the
interface thread is blocked (the Tailscale switch's `tailscale up --timeout=7s`) is
queued and lands when the block ends, racing whatever opens then -- the #174 walk's
second press landed on the switch instead of the popup and turned it off again, a
"regression" the journal (`tailscaled` started at 34.7 s, stopped at 42.5 s) refuted.
Never send a second press into a known block; wait it out.

## A game in the foreground swallows a whole proof run, and every check still "reads"

2026-09-15, the RC-10 run: the walk's first START did not open the main menu (frame
`01-main-menu.png` showed the carousel), so the presses meant for GAME SETTINGS walked the
carousel, opened a game's save state manager and pressed LAUNCH. For the next hour every
"captured" frame was the game, two timers measured the game's animation and reported
176 s and 2.6 s, and greps of the interface's log returned zeros -- all of it graded as
if it were the interface. Nothing in the run noticed.

So, in every proof script:

- **Before any walk, `pgrep -f '^/usr/bin/retroarch'` on the guest must be 0.** A hit is a
  FAIL of the phase, not a thing to work around: kill it, say so, and let the phase fail.
- **A press that must change the screen is proven to have changed it.** Opening the main
  menu is a frame before START and a frame after, compared; three tries, then stop the
  walk. `wait-for-change` alone is not that proof -- a carousel that moved is also a change.
- **After the walk, `pgrep` again.** A game that appeared during the walk means the walk
  went somewhere else; the frames after that point say nothing about the interface.
- **A named frame proves nothing about its contents.** Open one before grading a phase.

The session scripts carry these as `no_game` and `menu_open` (`rc6/guards.sh`).
