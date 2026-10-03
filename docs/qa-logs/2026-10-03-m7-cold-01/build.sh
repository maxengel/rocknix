#!/bin/bash
# M7.P3 first cold engineering image. Invoke only after frozen inputs exist.
set -euo pipefail
TASK_BUILD_TREE=/workspace/repos/rocknix.worktrees/m7-generic-x64
TASK_SOURCE_CACHE=/workspace/cache/rocknix-sources
TASK_RUN_DIR=${1:?usage: build.sh RUN_DIR INPUTS_JSON}
TASK_INPUTS=${2:?usage: build.sh RUN_DIR INPUTS_JSON}
mkdir -p "$TASK_RUN_DIR"
TASK_RUN_DIR=$(realpath "$TASK_RUN_DIR")
TASK_INPUTS=$(realpath "$TASK_INPUTS")
[ "$(id -u)" != 0 ] || { echo 'Refusing root build'; exit 2; }
[ ! -e "$TASK_RUN_DIR/build.log" ] || { echo 'Refusing to overwrite an earlier build'; exit 2; }
cd "$TASK_BUILD_TREE"
[ "$(git branch --show-current)" = build/m7-generic-x64 ]
[ -z "$(git status --porcelain)" ] || { echo 'Build worktree must be clean'; exit 2; }
[ ! -e build.RASTERATOPS-GENERIC_X64.x86_64 ] || { echo 'Expected a new cold root'; exit 2; }
python3 - "$TASK_INPUTS" <<'PY'
import hashlib,json,pathlib,subprocess,sys
j=json.load(open(sys.argv[1]))
def git(*args): return subprocess.check_output(['git',*args],text=True).strip()
assert j['distribution_commit']==git('rev-parse','HEAD')
assert j['device']=='GENERIC_X64' and j['arch']=='x86_64'
assert j['build_root']=='build.RASTERATOPS-GENERIC_X64.x86_64'
assert j['global_jobs']==int(subprocess.check_output(['nproc'],text=True))
assert j['webkit_jobs']==4
assert j['container'] in pathlib.Path('Makefile').read_text().replace('$(DOCKER_IMAGE_DIGEST)',j['container'].split('@')[1])
for name,sha in j['source_files'].items():
 assert hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()==sha,name
assert j['emulationstation_commit'] in pathlib.Path('projects/ROCKNIX/packages/ui/emulationstation/package.mk').read_text()
assert j['splash_commit'] in pathlib.Path('projects/ROCKNIX/packages/tools/rocknix-splash/package.mk').read_text()
subprocess.run(['docker','image','inspect',j['container'],'--format','{{.Id}}'],check=True)
PY
# Validation precedes receipts; every failure after PID publication has a result.
finish() {
  local result=$?
  trap - EXIT
  if [ "$result" != 0 ]; then
    local failure_dir="$TASK_RUN_DIR/failure-logs"
    mkdir -p "$failure_dir"
    if [ -d build.RASTERATOPS-GENERIC_X64.x86_64/.threads/logs ]; then
      cp -a build.RASTERATOPS-GENERIC_X64.x86_64/.threads/logs "$failure_dir/threads"
    fi
  fi
  printf '%s\n' "$result" > "$TASK_RUN_DIR/build.rc"
  exit "$result"
}
trap finish EXIT
printf '%s\n' "$$" > "$TASK_RUN_DIR/build.pid"
if [ "$TASK_INPUTS" != "$TASK_RUN_DIR/inputs.json" ]; then
  cp "$TASK_INPUTS" "$TASK_RUN_DIR/inputs.json"
fi
date -u +%Y-%m-%dT%H:%M:%SZ > "$TASK_RUN_DIR/build.start"

DOCKER_EXTRA_OPTS="-v /workspace/repos/rocknix/.git:/workspace/repos/rocknix/.git -v $TASK_SOURCE_CACHE:$TASK_BUILD_TREE/sources" \
  make docker-GENERIC_X64 > "$TASK_RUN_DIR/build.log" 2>&1
