#!/bin/bash
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-generic-x64
TASK_OWNER=/workspace/tmp/rasteratops-m7-proxy-runtime-03
TASK_BUNDLE=/workspace/artifacts/rasteratops-candidates/sha256/87b8c01d65dc22b4f29049bd0d69307a59c14c16f5223534e95058b2234ca5cd
cd "$TASK_TREE"
TASK_QEMU_PID=''
cleanup() {
 if [ -n "$TASK_QEMU_PID" ] && [ -r "/proc/$TASK_QEMU_PID/cmdline" ] && tr '\0' '\n' < "/proc/$TASK_QEMU_PID/cmdline" | grep -Fq "$TASK_OWNER/guest-d.qcow2"; then
  kill "$TASK_QEMU_PID"
  for TASK_I in {1..60}; do
   [ -r "/proc/$TASK_QEMU_PID/stat" ] || break
   [ "$(awk '{print $3}' "/proc/$TASK_QEMU_PID/stat")" = Z ] && break
   sleep 0.25
  done
 fi
}
trap cleanup EXIT
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
if [ ! -f "$TASK_OWNER/guest-d.qcow2" ]; then
 gunzip -c "$TASK_BUNDLE/RASTERATOPS-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.img.gz" > "$TASK_OWNER/image.img"
 qemu-img convert -f raw -O qcow2 "$TASK_OWNER/image.img" "$TASK_OWNER/guest-d.qcow2"
 qemu-img resize "$TASK_OWNER/guest-d.qcow2" 16G
 qemu-img check "$TASK_OWNER/guest-d.qcow2"
 rm "$TASK_OWNER/image.img"
 ssh-keygen -q -t ed25519 -N '' -f "$TASK_OWNER/pair/qa-key" -C m7-proxy-qa
fi
./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize --res 640x480 --monitor /tmp/rocknix-qemu-monitor-d.sock --serial /tmp/rocknix-qemu-serial-d.sock --pidfile /tmp/rocknix-qemu-d.pid --vnc 12 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$TASK_OWNER/guest-d.qcow2"
TASK_QEMU_PID=$(cat /tmp/rocknix-qemu-d.pid)
printf '%s\n' "$TASK_QEMU_PID" > "$TASK_OWNER/guest.pid"
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock wait --up-to 300
TASK_PUBLIC=$(cat "$TASK_OWNER/pair/qa-key.pub")
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock sh "mkdir -p /storage/.ssh && chmod 700 /storage/.ssh && echo '$TASK_PUBLIC' >> /storage/.ssh/authorized_keys && chmod 600 /storage/.ssh/authorized_keys" >/dev/null
python3 "$TASK_OWNER/host-proof.py"
echo 'PASS replacement02 packaged proxy runtime proof'
