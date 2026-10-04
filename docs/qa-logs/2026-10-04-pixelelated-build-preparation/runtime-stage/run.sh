#!/bin/bash
# Rehearse actual inherited archive recovery, timing and installed identity.
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-pixelelated
TASK_OWNER=/workspace/tmp/pixelelated-m7-runtime-01
TASK_BUNDLE=$(realpath "${1:?verified candidate bundle required}")
cd "$TASK_TREE"
export ES_SRC=/home/max/Development/emulationstation-next.worktrees/qa-integration
export VM_PAIR_DIR="$TASK_OWNER/pair"
export CLOUD_QA_STATE="$TASK_OWNER/cloud" CLOUD_QA_BACKEND=webdav
export CLOUD_QA_PORT=9040 CLOUD_QA_NAME=pixelelated-m7-runtime-01
export ROCKNIX_ARTIFACTS="$TASK_OWNER/artifacts"
test ! -e "$TASK_OWNER/qa.start"
test "$(cat /workspace/tmp/pixelelated-m7-qa-01/outer.rc)" = 0
test "$(cat /workspace/tmp/pixelelated-m7-guest-01/outer.rc)" = 0
sha256sum -c "$TASK_OWNER/harness.sha256"
python3 "$TASK_OWNER/verify-inputs.py" "$TASK_BUNDLE"
python3 - <<'CHECK'
from pathlib import Path
for path in Path('/proc').glob('[0-9]*/cmdline'):
    try:
        first = path.read_bytes().split(b'\0', 1)[0].decode()
    except (FileNotFoundError, ProcessLookupError):
        continue
    if Path(first).name.startswith('qemu-system-'):
        raise SystemExit('Other QEMU refuses isolated runtime QA: PID ' + path.parent.name)
CHECK
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
printf '%s\n' "$TASK_TREE/${RASTERATOPS_BUILD_RUN:?use tools/watch-build}" > "$TASK_OWNER/run.path"
date -u +%Y-%m-%dT%H:%M:%SZ > "$TASK_OWNER/qa.start"
TASK_PID=''
TASK_CLOUD_STARTED=0
cleanup() {
  result=$?
  trap - EXIT
  if [ -n "$TASK_PID" ]; then
    python3 "$TASK_OWNER/stop-guest.py" "$TASK_PID" "$TASK_OWNER/upgraded-overlay.qcow2" || result=1
  fi
  if [ "$TASK_CLOUD_STARTED" = 1 ]; then
    ./tools/cloud-test-backend down || result=1
  fi
  if [ -f "$TASK_OWNER/backing.sha256" ]; then
    sha256sum -c "$TASK_OWNER/backing.sha256" || result=1
  fi
  printf '%s\n' "$result" > "$TASK_OWNER/inner.rc"
  exit "$result"
}
trap cleanup EXIT
mkdir -p "$VM_PAIR_DIR" "$ROCKNIX_ARTIFACTS"
TASK_BACKING=/workspace/tmp/pixelelated-m7-qa-01/pair/vm-a.qcow2
sha256sum "$TASK_BACKING" > "$TASK_OWNER/backing.sha256"
cp /workspace/tmp/pixelelated-m7-qa-01/pair/qa-key "$VM_PAIR_DIR/qa-key"
cp /workspace/tmp/pixelelated-m7-qa-01/pair/qa-key.pub "$VM_PAIR_DIR/qa-key.pub"
qemu-img create -f qcow2 -F qcow2 -b "$TASK_BACKING" "$TASK_OWNER/upgraded-overlay.qcow2"
qemu-img info --backing-chain --output=json "$TASK_OWNER/upgraded-overlay.qcow2" > "$ROCKNIX_ARTIFACTS/disk-chain.json"
TASK_CLOUD_STARTED=1
./tools/cloud-test-backend up
./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize --res 640x480 --monitor /tmp/rocknix-qemu-monitor-d.sock --serial /tmp/rocknix-qemu-serial-d.sock --pidfile /tmp/rocknix-qemu-d.pid --vnc 12 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$TASK_OWNER/upgraded-overlay.qcow2"
TASK_PID=$(cat /tmp/rocknix-qemu-d.pid)
printf '%s\n' "$TASK_PID" > "$TASK_OWNER/guest.pid"
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock wait --up-to 300
TASK_PUBLIC=$(cat "$VM_PAIR_DIR/qa-key.pub")
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock sh "mkdir -p /storage/.ssh && chmod 700 /storage/.ssh && echo '$TASK_PUBLIC' >> /storage/.ssh/authorized_keys && chmod 600 /storage/.ssh/authorized_keys" >/dev/null
for TASK_I in {1..60}; do
  ssh -i "$VM_PAIR_DIR/qa-key" -p 10026 -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR root@127.0.0.1 true && break
  sleep 2
done
python3 "$TASK_OWNER/archive-proof.py" --key "$VM_PAIR_DIR/qa-key" --port 10026 --output "$ROCKNIX_ARTIFACTS/archive" --inherited
python3 "$TASK_OWNER/timing-proof.py" --key "$VM_PAIR_DIR/qa-key" --port 10026 --output "$ROCKNIX_ARTIFACTS/timing"
python3 "$TASK_OWNER/identity-proof.py" --key "$VM_PAIR_DIR/qa-key" --port 10026 --output "$ROCKNIX_ARTIFACTS/identity"
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
python3 "$TASK_OWNER/verify-inputs.py" "$TASK_BUNDLE"
echo 'PASS pixelelated actual inherited archive, isolated timing and identity'
