#!/bin/bash
# Fresh guest-d cloud qualification of the exact cold candidate; Refs #383, #409.
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-pixelelated
TASK_OWNER=/workspace/tmp/pixelelated-m7-guest-01
TASK_BUNDLE=$(realpath "${1:?verified candidate bundle required}")
cd "$TASK_TREE"
export ES_SRC=/home/max/Development/emulationstation-next.worktrees/qa-integration
export VM_PAIR_DIR="$TASK_OWNER/pair"
export CLOUD_QA_STATE="$TASK_OWNER/cloud" CLOUD_QA_BACKEND=webdav
export CLOUD_QA_PORT=9040 CLOUD_QA_NAME=pixelelated-m7-guest-01
export ROCKNIX_ARTIFACTS="$TASK_OWNER/artifacts"
test ! -e "$TASK_OWNER/qa.start"
test "$(cat /workspace/tmp/pixelelated-m7-qa-01/outer.rc)" = 0
test "$(cat /workspace/tmp/pixelelated-m7-link-01/outer.rc)" = 0
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
        raise SystemExit('Existing QEMU refuses guest QA: PID ' + path.parent.name)
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
    python3 "$TASK_OWNER/stop-guest.py" "$TASK_PID" "$TASK_OWNER/guest-d.qcow2" || result=1
  fi
  if [ "$TASK_CLOUD_STARTED" = 1 ]; then
    ./tools/cloud-test-backend down || result=1
  fi
  printf '%s\n' "$result" > "$TASK_OWNER/inner.rc"
  exit "$result"
}
trap cleanup EXIT
mkdir -p "$VM_PAIR_DIR" "$ROCKNIX_ARTIFACTS"
echo 'Preparing independent 16GiB guest d from the verified pixelelated image'
gunzip -c "$TASK_BUNDLE/pixelelated-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.img.gz" > "$TASK_OWNER/image.img"
qemu-img convert -f raw -O qcow2 "$TASK_OWNER/image.img" "$TASK_OWNER/guest-d.qcow2"
qemu-img resize "$TASK_OWNER/guest-d.qcow2" 16G
qemu-img check "$TASK_OWNER/guest-d.qcow2"
qemu-img info --output=json "$TASK_OWNER/guest-d.qcow2" > "$ROCKNIX_ARTIFACTS/disk-initial.json"
rm "$TASK_OWNER/image.img"
ssh-keygen -q -t ed25519 -N '' -f "$VM_PAIR_DIR/qa-key" -C pixelelated-guest-qa
./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize --gl auto --res 640x480 --monitor /tmp/rocknix-qemu-monitor-d.sock --serial /tmp/rocknix-qemu-serial-d.sock --pidfile /tmp/rocknix-qemu-d.pid --vnc 12 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$TASK_OWNER/guest-d.qcow2"
TASK_PID=$(cat /tmp/rocknix-qemu-d.pid)
printf '%s\n' "$TASK_PID" > "$TASK_OWNER/guest.pid"
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock wait --up-to 300
TASK_PUBLIC=$(cat "$VM_PAIR_DIR/qa-key.pub")
./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock sh "mkdir -p /storage/.ssh && chmod 700 /storage/.ssh && echo '$TASK_PUBLIC' >> /storage/.ssh/authorized_keys && chmod 600 /storage/.ssh/authorized_keys" >/dev/null
python3 "$TASK_OWNER/seed.py"
TASK_CLOUD_STARTED=1
./tools/cloud-test-backend up
./tools/rasteratops-vm-cloud-epic --output "$ROCKNIX_ARTIFACTS/cloud-epic"
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
python3 "$TASK_OWNER/verify-inputs.py" "$TASK_BUNDLE"
echo 'PASS all 19 independently reset pixelelated cloud-epic guest cases'
