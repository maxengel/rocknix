#!/bin/bash
set -euo pipefail
TASK_ROOT=/workspace/repos/rocknix.worktrees/conflict-resolution
TASK_OWNER=/workspace/tmp/rasteratops-m7-guest-d-01
export VM_PAIR_DIR=$TASK_OWNER/pair
export QA_KEY=$VM_PAIR_DIR/qa-key
export CLOUD_QA_STATE=$TASK_OWNER/cloud CLOUD_QA_BACKEND=webdav
export ROCKNIX_ARTIFACTS=$TASK_OWNER/artifacts
TASK_PID=''; TASK_CLOUD_STARTED=0
cleanup() {
  if [ "$TASK_CLOUD_STARTED" = 1 ]; then "$TASK_ROOT/tools/cloud-test-backend" down; fi
  if [ -n "$TASK_PID" ] && [ -r "/proc/$TASK_PID/cmdline" ] && tr '\0' '\n' < "/proc/$TASK_PID/cmdline" | grep -Fq "$TASK_OWNER/guest-d.qcow2"; then
    kill "$TASK_PID"
    printf 'Stopped owned guest d pid %s\n' "$TASK_PID"
  fi
}
trap cleanup EXIT
cd "$TASK_ROOT"
sha256sum -c "$TASK_OWNER/harness.sha256"
if [ -s /tmp/rocknix-qemu-d.pid ] && kill -0 "$(cat /tmp/rocknix-qemu-d.pid)" 2>/dev/null; then
  printf 'Refusing to replace an active guest d\n' >&2; exit 2
fi
./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize --gl auto --res 640x480 --monitor /tmp/rocknix-qemu-monitor-d.sock --serial /tmp/rocknix-qemu-serial-d.sock --pidfile /tmp/rocknix-qemu-d.pid --vnc 12 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$TASK_OWNER/guest-d.qcow2"
TASK_PID=$(cat /tmp/rocknix-qemu-d.pid)
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock wait --up-to 300
TASK_PUBLIC=$(cat "$VM_PAIR_DIR/qa-key.pub")
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock sh "mkdir -p /storage/.ssh && chmod 700 /storage/.ssh && echo '$TASK_PUBLIC' >> /storage/.ssh/authorized_keys && chmod 600 /storage/.ssh/authorized_keys" >/dev/null
python3 "$TASK_OWNER/seed.py"
./tools/cloud-test-backend up
TASK_CLOUD_STARTED=1
./tools/rasteratops-vm-cloud-epic --output "$TASK_OWNER/artifacts/cloud-epic"
