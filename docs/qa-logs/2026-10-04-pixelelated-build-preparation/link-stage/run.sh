#!/bin/bash
# Prepared link-loss qualification, only after the new candidate's first QA passes.
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-pixelelated
TASK_OWNER=/workspace/tmp/pixelelated-m7-link-01
TASK_BUNDLE=$(realpath "${1:?verified pixelelated candidate bundle required}")
cd "$TASK_TREE"
export ES_SRC=/home/max/Development/emulationstation-next.worktrees/qa-integration
export ROCKNIX_ARTIFACTS="$TASK_OWNER/artifacts"
export CLOUD_QA_BWLIMIT=200k
export CLOUD_QA_BACKEND=webdav
export VM_PAIR_DIR="$TASK_OWNER/webdav/pair"
export CLOUD_QA_STATE="$TASK_OWNER/webdav/cloud"
test ! -e "$TASK_OWNER/qa.start"
test "$(cat /workspace/tmp/pixelelated-m7-qa-01/outer.rc)" = 0
sha256sum -c "$TASK_OWNER/harness.sha256"
python3 "$TASK_OWNER/verify-inputs.py" "$TASK_BUNDLE"
python3 - <<'CHECK'
from pathlib import Path
for path in Path('/proc').glob('[0-9]*/cmdline'):
    try:
        first = path.read_bytes().split(b'\0', 1)[0].decode()
    except FileNotFoundError:
        continue
    if Path(first).name.startswith('qemu-system-'):
        raise SystemExit('Existing QEMU refuses link QA: PID ' + path.parent.name)
CHECK
printf '%s\n' "$TASK_TREE/${RASTERATOPS_BUILD_RUN:?use tools/watch-build}" > "$TASK_OWNER/run.path"
date -u +%Y-%m-%dT%H:%M:%SZ > "$TASK_OWNER/qa.start"
cleanup() {
  result=$?
  trap - EXIT
  ./tools/vm-pair down || result=1
  ./tools/cloud-test-backend down || result=1
  printf '%s\n' "$result" > "$TASK_OWNER/inner.rc"
  exit "$result"
}
trap cleanup EXIT
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
for TASK_PROVIDER in webdav s3; do
  export CLOUD_QA_BACKEND="$TASK_PROVIDER"
  export VM_PAIR_DIR="$TASK_OWNER/$TASK_PROVIDER/pair"
  export CLOUD_QA_STATE="$TASK_OWNER/$TASK_PROVIDER/cloud"
  mkdir -p "$TASK_OWNER/$TASK_PROVIDER"
  echo "START pixelelated $TASK_PROVIDER link-loss matrix"
  ./tools/vm-qa "$TASK_BUNDLE/pixelelated-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.img.gz" --only link --backend "$TASK_PROVIDER"
  ./tools/vm-pair down
  ./tools/cloud-test-backend down
  echo "PASS pixelelated $TASK_PROVIDER link-loss matrix"
done
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
python3 "$TASK_OWNER/verify-inputs.py" "$TASK_BUNDLE"
echo 'PASS pixelelated WebDAV/S3 link-loss matrices'
