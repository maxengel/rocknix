#!/bin/bash
# Run-owned M7.P3 replacement, using the original cold root's unchanged cache.
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-generic-x64
TASK_OWNER=/workspace/tmp/rasteratops-m7-replacement-01
TASK_CACHE=/workspace/cache/rocknix-sources
cd "$TASK_TREE"
[ "$(id -u)" != 0 ]
python3 - "$TASK_OWNER/inputs.json" <<'PY'
import hashlib,json,pathlib,subprocess,sys,os
j=json.load(open(sys.argv[1]))
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
assert git('rev-parse','HEAD')==j['distribution_commit']
assert git('branch','--show-current')==j['distribution_branch']
p='documentation/PER_DEVICE_DOCUMENTATION/GENERIC_X64/SUPPORTED_EMULATORS_AND_CORES.md'
assert git('status','--porcelain').strip()=='M '+p
assert hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()==j['preserved_generated_document_sha256']
for p,h in j['source_files'].items():assert hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()==h,p
for p,target in j['source_symlinks'].items():assert pathlib.Path(p).is_symlink() and os.readlink(p)==target,p
assert int(subprocess.check_output(['nproc'],text=True))==j['global_jobs']
assert subprocess.check_output(['docker','image','inspect',j['container'],'--format','{{.Id}}'],text=True).strip()==j['container_image_id']
print('PASS replacement input and container identity preflight',flush=True)
PY
printf '%s\n' "$TASK_TREE/$RASTERATOPS_BUILD_RUN" > "$TASK_OWNER/run.path"
date -u +%Y-%m-%dT%H:%M:%SZ > "$TASK_OWNER/build.start"
tools/build-preflight > "$TASK_OWNER/host-preflight.txt" || true
# Historical swap is full; this cached package/image replacement has 48GiB
# available RAM, no QA guests, no pin/config changes or cold C++ build planned.
awk '/MemAvailable:/ {exit ($2 < 32000000)}' /proc/meminfo
export DOCKER_EXTRA_OPTS="-v /workspace/repos/rocknix/.git:/workspace/repos/rocknix/.git -v $TASK_CACHE:$TASK_TREE/sources"
PROJECT=ROCKNIX DEVICE=GENERIC_X64 ARCH=x86_64 PACKAGE=rclone make docker-package-clean
# scripts/image is not a recipe input. Its policy installation must execute.
rm -f build.RASTERATOPS-GENERIC_X64.x86_64/.stamps/image/build_target
make docker-GENERIC_X64
python3 - "$TASK_OWNER/inputs.json" <<'PY'
import hashlib,json,pathlib,sys,os
j=json.load(open(sys.argv[1]))
for p,h in j['source_files'].items():assert hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()==h,p
for p,target in j['source_symlinks'].items():assert pathlib.Path(p).is_symlink() and os.readlink(p)==target,p
root=pathlib.Path(j['build_root'])/'image/system'
for p in ['LICENSE.md','TRADEMARK.md']:
 assert (root/'usr/share/licenses/rasteratops'/p).read_bytes()==pathlib.Path(p).read_bytes(),p
for name in ['cloud_content_transfer','cloud_content_backup','cloud_content_restore']:
 assert (root/'usr/bin'/name).read_bytes()==pathlib.Path('projects/ROCKNIX/packages/network/rclone/sources',name).read_bytes(),name
assert j['distribution_commit'] in (root/'etc/os-release').read_text()
print('PASS unchanged frozen inputs and assembled replacement payload bytes')
PY
