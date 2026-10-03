#!/bin/bash
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-generic-x64
TASK_OWNER=/workspace/tmp/rasteratops-m7-replacement-link-01
TASK_BUNDLE=/workspace/artifacts/rasteratops-candidates/sha256/fc6b9774f79d5fcf6a4e077af1f321b7a125401b08671cad7f0a5c807dbd64d5
cd "$TASK_TREE"
export ROCKNIX_ARTIFACTS="$TASK_OWNER/artifacts"
export CLOUD_QA_BWLIMIT=200k
export CLOUD_QA_BACKEND=webdav
export VM_PAIR_DIR="$TASK_OWNER/webdav/pair"
export CLOUD_QA_STATE="$TASK_OWNER/webdav/cloud"
cleanup() { ./tools/vm-pair down; ./tools/cloud-test-backend down; }
trap cleanup EXIT
sha256sum -c "$TASK_OWNER/harness.sha256"
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
for TASK_PROVIDER in webdav s3; do
 export CLOUD_QA_BACKEND="$TASK_PROVIDER"
 export VM_PAIR_DIR="$TASK_OWNER/$TASK_PROVIDER/pair"
 export CLOUD_QA_STATE="$TASK_OWNER/$TASK_PROVIDER/cloud"
 mkdir -p "$TASK_OWNER/$TASK_PROVIDER"
 echo "START replacement $TASK_PROVIDER full link-loss matrix"
 ./tools/vm-qa "$TASK_BUNDLE/RASTERATOPS-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.img.gz" --only link --backend "$TASK_PROVIDER"
 cleanup
 echo "PASS replacement $TASK_PROVIDER full link-loss matrix"
done
./tools/rasteratops-candidate-store verify "$TASK_BUNDLE"
echo 'PASS replacement WebDAV/S3 link-loss matrices'
