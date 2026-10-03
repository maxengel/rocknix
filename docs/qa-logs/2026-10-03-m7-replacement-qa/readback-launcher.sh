#!/bin/bash
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-generic-x64
TASK_OWNER=/workspace/tmp/rasteratops-m7-upgrade-readback-01
TASK_QA=/workspace/tmp/rasteratops-m7-replacement-qa-01
cd "$TASK_TREE"
export VM_PAIR_DIR="$TASK_QA/pair"
cleanup() {
 if [ -n "${TASK_QEMU_PID:-}" ] && [ -r "/proc/$TASK_QEMU_PID/cmdline" ]; then
  if tr '\0' '\n' < "/proc/$TASK_QEMU_PID/cmdline" | grep -Fq "$TASK_QA/pair/vm-a.qcow2"; then
   kill "$TASK_QEMU_PID"
   for TASK_I in {1..30}; do
    [ -r "/proc/$TASK_QEMU_PID/stat" ] || break
    [ "$(awk '{print $3}' "/proc/$TASK_QEMU_PID/stat")" = Z ] && break
    sleep 1
   done
  fi
 fi
}
trap cleanup EXIT
projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize "$TASK_QA/pair/vm-a.qcow2"
TASK_QEMU_PID=$(cat /tmp/rocknix-qemu.pid)
printf '%s\n' "$TASK_QEMU_PID" > "$TASK_OWNER/guest.pid"
tools/vm-serial wait
python3 "$TASK_QA/check-payload.py" upgrade
cp "$TASK_QA/artifacts/payload-upgrade.json" "$TASK_OWNER/artifacts/"
tools/rasteratops-candidate-store verify /workspace/artifacts/rasteratops-candidates/sha256/fc6b9774f79d5fcf6a4e077af1f321b7a125401b08671cad7f0a5c807dbd64d5
echo 'PASS retained RC2-upgraded guest exact payload and candidate custody'
