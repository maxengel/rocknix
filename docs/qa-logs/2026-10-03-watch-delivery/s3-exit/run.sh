#!/bin/bash
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/conflict-resolution
TASK_OWNER=/workspace/tmp/rasteratops-m7-watch-s3-exit-01
cd "$TASK_TREE"
export CLOUD_QA_STATE="$TASK_OWNER/cloud" CLOUD_QA_BACKEND=s3 CLOUD_QA_PORT=9032
export CLOUD_QA_NAME=rasteratops-m7-watch-s3-exit-01 CLOUD_QA_BWLIMIT=200k
cleanup() { ./tools/cloud-test-backend down; }
trap cleanup EXIT
./tools/cloud-test-backend up
./tools/cloud-test-backend status
cleanup
echo 'PASS S3 watched endpoint lifecycle'
