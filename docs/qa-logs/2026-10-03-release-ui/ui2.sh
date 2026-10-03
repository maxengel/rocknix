#!/bin/bash
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/conflict-resolution
TASK_OWNER=/workspace/tmp/rasteratops-m7-release-ui-01
cd "$TASK_TREE"
export CLOUD_QA_STATE="$TASK_OWNER/cloud" CLOUD_QA_PORT=9030 CLOUD_QA_BACKEND=webdav
TASK_QEMU_PID=''; TASK_CLOUD_STARTED=0
stop_guest() {
 if [ -n "$TASK_QEMU_PID" ] && [ -r "/proc/$TASK_QEMU_PID/cmdline" ] && tr '\0' '\n' < "/proc/$TASK_QEMU_PID/cmdline" | grep -Fq "$TASK_OWNER/guest-d.qcow2"; then
  kill "$TASK_QEMU_PID"
  for TASK_I in {1..60}; do
   [ -r "/proc/$TASK_QEMU_PID/stat" ] || break
   [ "$(awk '{print $3}' "/proc/$TASK_QEMU_PID/stat")" = Z ] && break
   sleep 0.25
  done
 fi
 TASK_QEMU_PID=''
}
cleanup() { stop_guest; [ "$TASK_CLOUD_STARTED" = 0 ] || ./tools/cloud-test-backend down; }
trap cleanup EXIT
./tools/cloud-test-backend up
TASK_CLOUD_STARTED=1
mkdir -p "$CLOUD_QA_STATE/data/Rasteratops/Saves" "$CLOUD_QA_STATE/data/Rasteratops/Backups"
for TASK_RES in 640x480 1280x960; do
 ./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize --res "$TASK_RES" --monitor /tmp/rocknix-qemu-monitor-d.sock --serial /tmp/rocknix-qemu-serial-d.sock --pidfile /tmp/rocknix-qemu-d.pid --vnc 12 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$TASK_OWNER/guest-d.qcow2"
 TASK_QEMU_PID=$(cat /tmp/rocknix-qemu-d.pid)
 printf '%s\n' "$TASK_QEMU_PID" > "$TASK_OWNER/guest.pid"
 ./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock wait --up-to 300
 TASK_PUBLIC=$(cat "$TASK_OWNER/pair/qa-key.pub")
 ./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock sh "mkdir -p /storage/.ssh && chmod 700 /storage/.ssh && echo '$TASK_PUBLIC' >> /storage/.ssh/authorized_keys && chmod 600 /storage/.ssh/authorized_keys" > /dev/null
 python3 "$TASK_OWNER/seed.py"
 TASK_LANGS="en_US fr_FR"
 [ "$TASK_RES" != 640x480 ] || TASK_LANGS="fr_FR"
 for TASK_LANG in $TASK_LANGS; do
  python3 "$TASK_OWNER/ui2.py" "$TASK_LANG" "$TASK_RES"
 done
 stop_guest
done
echo 'PASS all four language/panel captures; visual review required'
