#!/bin/bash
# Run-owned M7.P3 cold build; invoke through the frozen tree's watch-build.
set -euo pipefail
TASK_TREE=/workspace/repos/rocknix.worktrees/m7-pixelelated
TASK_OWNER=/workspace/tmp/pixelelated-m7-cold-01
TASK_CACHE=/workspace/cache/rocknix-sources
cd "$TASK_TREE"
[ "$(id -u)" != 0 ]
[ "$(git branch --show-current)" = build/m7-pixelelated ]
[ -z "$(git status --porcelain)" ]
[ ! -e build.pixelelated-GENERIC_X64.x86_64 ]
[ ! -e "$TASK_OWNER/run.path" ]
python3 - "$TASK_OWNER/inputs.json" <<'PY'
import hashlib,json,pathlib,subprocess,sys,os
j=json.load(open(sys.argv[1]))
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==j['distribution_commit']
assert int(subprocess.check_output(['nproc'],text=True))==j['global_jobs']
assert '-j4' in pathlib.Path('packages/web/webkitgtk/package.mk').read_text()
assert j['container_image_id']==subprocess.check_output(['docker','image','inspect',j['container'],'--format','{{.Id}}'],text=True).strip()
assert hashlib.sha256(pathlib.Path(j['host_options_path']).read_bytes()).hexdigest()==j['host_options_sha256']
for name,want in j['source_files'].items():
 assert hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()==want,name
for name,want in j['source_symlinks'].items():
 assert pathlib.Path(name).is_symlink() and os.readlink(name)==want,name
print('PASS frozen inputs, host options, container and24/4 concurrency',flush=True)
PY
# Full swap is a failed preflight, not an exception for this cold C++ build.
tools/build-preflight > "$TASK_OWNER/host-preflight.txt"
cat "$TASK_OWNER/host-preflight.txt"
printf '%s\n' "$TASK_TREE/${RASTERATOPS_BUILD_RUN:?run through tools/watch-build}" > "$TASK_OWNER/run.path"
date -u +%Y-%m-%dT%H:%M:%SZ > "$TASK_OWNER/build.start"
failure_logs() {
  result=$?
  trap - EXIT
  if [ "$result" != 0 ] && [ -d build.pixelelated-GENERIC_X64.x86_64/.threads/logs ]; then
    cp -a build.pixelelated-GENERIC_X64.x86_64/.threads/logs "$TASK_OWNER/failure-threads"
  fi
  printf '%s\n' "$result" > "$TASK_OWNER/inner.rc"
  exit "$result"
}
trap failure_logs EXIT
export DOCKER_EXTRA_OPTS="-v /workspace/repos/rocknix/.git:/workspace/repos/rocknix/.git -v $TASK_CACHE:$TASK_TREE/sources"
make docker-GENERIC_X64
python3 - "$TASK_OWNER/inputs.json" <<'PY'
import hashlib,json,pathlib,sys,os
j=json.load(open(sys.argv[1]))
for name,want in j['source_files'].items():
 assert hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()==want,name
for name,want in j['source_symlinks'].items():
 assert pathlib.Path(name).is_symlink() and os.readlink(name)==want,name
assert hashlib.sha256(pathlib.Path(j['host_options_path']).read_bytes()).hexdigest()==j['host_options_sha256']
root=pathlib.Path(j['build_root'])/'image/system'
assert 'OS_NAME="pixelelated"' in (root/'etc/os-release').read_text()
assert j['distribution_commit'] in (root/'etc/os-release').read_text()
for name in ('LICENSE.md','TRADEMARK.md'):
 assert (root/'usr/share/licenses/pixelelated'/name).read_bytes()==pathlib.Path(name).read_bytes()
print('PASS unchanged frozen inputs and assembled identity/licence payload',flush=True)
PY
