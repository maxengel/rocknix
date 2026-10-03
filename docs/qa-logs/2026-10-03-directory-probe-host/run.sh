#!/bin/bash
set -euo pipefail
cd /workspace/repos/rocknix.worktrees/conflict-resolution
sha256sum -c /workspace/tmp/rasteratops-m7-directory-host-01/inputs.sha256
export QA_SYSTEM_ROOT=/workspace/repos/rocknix.worktrees/m7-generic-x64/build.RASTERATOPS-GENERIC_X64.x86_64/image/system
export ES_SRC=/home/max/Development/emulationstation-next.worktrees/qa-integration
export RETROARCH_SRC=/workspace/repos/rocknix.worktrees/m7-generic-x64/build.RASTERATOPS-GENERIC_X64.x86_64
sha256sum "$QA_SYSTEM_ROOT/usr/bin/busybox" "$QA_SYSTEM_ROOT/usr/bin/rclone"
python3 - <<'SIG'
import os,signal
for s in (signal.SIGINT,signal.SIGPIPE):signal.signal(s,signal.SIG_DFL)
os.execv('tools/last-good-scripts-test',['tools/last-good-scripts-test'])
SIG
