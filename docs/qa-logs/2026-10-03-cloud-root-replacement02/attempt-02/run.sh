#!/bin/bash
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-generic-x64
TASK_OWNER=/workspace/tmp/rasteratops-m7-root-runtime-02
cd "$TASK_TREE"
export CLOUD_QA_STATE="$TASK_OWNER/cloud" CLOUD_QA_BACKEND=webdav CLOUD_QA_PORT=9040 CLOUD_QA_NAME=rasteratops-m7-root-runtime-02
TASK_QEMU_PID=''; TASK_CLOUD_STARTED=0
cleanup() {
 if [ -n "$TASK_QEMU_PID" ] && [ -r "/proc/$TASK_QEMU_PID/cmdline" ] && tr '\0' '\n' < "/proc/$TASK_QEMU_PID/cmdline" | grep -Fq "$TASK_OWNER/root-overlay.qcow2"; then
  kill "$TASK_QEMU_PID"
  for TASK_I in {1..60}; do
   [ -r "/proc/$TASK_QEMU_PID/stat" ] || break
   [ "$(awk '{print $3}' "/proc/$TASK_QEMU_PID/stat")" = Z ] && break
   sleep 0.25
  done
 fi
 [ "$TASK_CLOUD_STARTED" = 0 ] || ./tools/cloud-test-backend down
}
trap cleanup EXIT
./tools/cloud-test-backend up
TASK_CLOUD_STARTED=1
./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize --res 640x480 --monitor /tmp/rocknix-qemu-monitor-d.sock --serial /tmp/rocknix-qemu-serial-d.sock --pidfile /tmp/rocknix-qemu-d.pid --vnc 12 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$TASK_OWNER/root-overlay.qcow2"
TASK_QEMU_PID=$(cat /tmp/rocknix-qemu-d.pid)
printf '%s\n' "$TASK_QEMU_PID" > "$TASK_OWNER/guest.pid"
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock wait --up-to 300
TASK_PUBLIC=$(cat "$TASK_OWNER/pair/qa-key.pub")
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock sh "mkdir -p /storage/.ssh && chmod 700 /storage/.ssh && echo '$TASK_PUBLIC' >> /storage/.ssh/authorized_keys && chmod 600 /storage/.ssh/authorized_keys" >/dev/null
python3 "$TASK_OWNER/root-proof.py" --key /workspace/tmp/rasteratops-m7-root-runtime-02/pair/qa-key --port 10026 --output "$TASK_OWNER/artifacts"
echo 'PASS installed cloud-root transitions and sentence'
