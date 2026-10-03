#!/bin/bash
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-generic-x64
TASK_OWNER=/workspace/tmp/rasteratops-m7-replacement-qa-01
TASK_BUNDLE=/workspace/artifacts/rasteratops-candidates/sha256/fc6b9774f79d5fcf6a4e077af1f321b7a125401b08671cad7f0a5c807dbd64d5
cd "$TASK_TREE"
export VM_PAIR_DIR="$TASK_OWNER/pair"
export CLOUD_QA_STATE="$TASK_OWNER/cloud"
export ROCKNIX_ARTIFACTS="$TASK_OWNER/artifacts"
export CLOUD_QA_BACKEND=webdav
export ES_SRC=/home/max/Development/emulationstation-next.worktrees/qa-integration
export RETROARCH_SRC="$TASK_TREE/build.RASTERATOPS-GENERIC_X64.x86_64"
export QA_SYSTEM_ROOT="$RETROARCH_SRC/image/system"
cleanup() { ./tools/vm-pair down; ./tools/cloud-test-backend down; }
trap cleanup EXIT
sha256sum -c "$TASK_OWNER/harness.sha256"
[ "$(git rev-parse HEAD)" = 134e89c4fcb08581f1c831229167364828a37e27 ]
[ "$(git -C "$ES_SRC" rev-parse HEAD)" = e6e1e4d0f91e177e182cc05b1cea74991e1cc45b ]
[ -z "$(git -C "$ES_SRC" status --porcelain)" ]
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
./tools/vm-qa "$TASK_BUNDLE/RASTERATOPS-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.img.gz"
python3 "$TASK_OWNER/check-payload.py" clean
./tools/vm-upgrade-rehearsal \
 /workspace/artifacts/rocknix-images/x64-all-20260929-69e6039f8f/ROCKNIX-GENERIC_X64.x86_64-20260929.img.gz \
 "$TASK_BUNDLE/RASTERATOPS-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.tar" \
 134e89c4fc
python3 "$TASK_OWNER/check-payload.py" upgrade
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
echo 'PASS replacement defaults, RC2 upgrade and payload/policy readback'
