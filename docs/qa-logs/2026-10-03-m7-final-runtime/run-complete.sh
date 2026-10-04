#!/bin/bash
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-generic-x64
TASK_OWNER=/workspace/tmp/rasteratops-m7-final-runtime-02
cd "$TASK_TREE"
export CLOUD_QA_STATE="$TASK_OWNER/cloud" CLOUD_QA_BACKEND=webdav CLOUD_QA_PORT=9040 CLOUD_QA_NAME=rasteratops-m7-final-runtime-02
TASK_QEMU_PID=''; TASK_CLOUD_STARTED=0
cleanup() {
 if [ -n "$TASK_QEMU_PID" ] && [ -r "/proc/$TASK_QEMU_PID/cmdline" ] && tr '\0' '\n' < "/proc/$TASK_QEMU_PID/cmdline" | grep -Fq "$TASK_OWNER/final-overlay.qcow2"; then
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
test -f /workspace/tmp/rasteratops-m7-replacement-qa-02/outer.rc
test "$(cat /workspace/tmp/rasteratops-m7-replacement-qa-02/outer.rc)" = 0
python3 - <<'CHECK'
from pathlib import Path
bad=[]
for p in Path('/proc').glob('[0-9]*/comm'):
 try:
  if p.read_text().strip().startswith('qemu-system'):bad.append(p.parent.name)
 except (OSError,ProcessLookupError):pass
assert not bad, 'timing needs all other QEMU guests stopped: '+str(bad)
CHECK
cp /workspace/tmp/rasteratops-m7-replacement-qa-02/pair/qa-key "$TASK_OWNER/pair/qa-key"
cp /workspace/tmp/rasteratops-m7-replacement-qa-02/pair/qa-key.pub "$TASK_OWNER/pair/qa-key.pub"
qemu-img create -f qcow2 -F qcow2 -b /workspace/tmp/rasteratops-m7-replacement-qa-02/pair/vm-a.qcow2 "$TASK_OWNER/final-overlay.qcow2"
./tools/cloud-test-backend up
TASK_CLOUD_STARTED=1
./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize --res 640x480 --monitor /tmp/rocknix-qemu-monitor-d.sock --serial /tmp/rocknix-qemu-serial-d.sock --pidfile /tmp/rocknix-qemu-d.pid --vnc 12 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$TASK_OWNER/final-overlay.qcow2"
TASK_QEMU_PID=$(cat /tmp/rocknix-qemu-d.pid)
printf '%s\n' "$TASK_QEMU_PID" > "$TASK_OWNER/guest.pid"
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock wait --up-to 300
TASK_PUBLIC=$(cat "$TASK_OWNER/pair/qa-key.pub")
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock sh "mkdir -p /storage/.ssh && chmod 700 /storage/.ssh && echo '$TASK_PUBLIC' >> /storage/.ssh/authorized_keys && chmod 600 /storage/.ssh/authorized_keys" >/dev/null
python3 "$TASK_OWNER/archive-proof.py" --key "$TASK_OWNER/pair/qa-key" --port 10026 --output "$TASK_OWNER/artifacts/archive" --inherited
python3 "$TASK_OWNER/timing-proof.py" --key "$TASK_OWNER/pair/qa-key" --port 10026 --output "$TASK_OWNER/artifacts/timing"
python3 "$TASK_OWNER/identity-proof.py" --key "$TASK_OWNER/pair/qa-key" --port 10026 --output "$TASK_OWNER/artifacts/identity"
echo 'PASS final installed inherited archive, isolated timing and identity'

