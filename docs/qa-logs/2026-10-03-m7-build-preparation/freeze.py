#!/usr/bin/env python3
"""Record the clean M7 engineering inputs after ES delivery and pin integration."""
import datetime,hashlib,json,pathlib,re,subprocess,sys
root=pathlib.Path('/workspace/repos/rocknix.worktrees/m7-generic-x64')
output=pathlib.Path(sys.argv[1])
assert not output.exists(),'Refusing to overwrite frozen inputs'
def run(*args): return subprocess.check_output(args,cwd=root,text=True).strip()
assert not run('git','status','--porcelain'),'Build worktree is dirty'
assert run('git','branch','--show-current')=='build/m7-generic-x64'
assert not (root/'build.RASTERATOPS-GENERIC_X64.x86_64').exists(),'Expected cold root'
def pin(rel): return re.search(r'^PKG_VERSION="([^"]+)"', (root/rel).read_text(),re.M)[1]
es=pin('projects/ROCKNIX/packages/ui/emulationstation/package.mk')
assert es=='e6e1e4d0f91e177e182cc05b1cea74991e1cc45b','Qualified ES pin not integrated'
remote=run('git','ls-remote','https://github.com/rasteratops/emulationstation.git','refs/heads/test/qa-integration')
assert remote.split()[0]==es,'ES source not available from selected remote branch'
container='ghcr.io/rasteratops/build@sha256:'+re.search(r'DOCKER_IMAGE_DIGEST := sha256:([0-9a-f]+)',(root/'Makefile').read_text())[1]
container_info=json.loads(run('docker','image','inspect',container))[0]
assert container in container_info['RepoDigests']
files=run('git','ls-files','Makefile','config','distributions','projects','packages','scripts').splitlines()
source_files={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in files if (root/p).is_file()}
data={'schema':1,'purpose':'M7.P3 cold engineering image, not an RC','frozen_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'distribution_commit':run('git','rev-parse','HEAD'),'distribution_branch':run('git','branch','--show-current'),'upstream_base':'9fd38fa87094d4f0e956d03ac6c660fe4fd5e9d6','emulationstation_commit':es,'splash_commit':pin('projects/ROCKNIX/packages/tools/rocknix-splash/package.mk'),'container':container,'container_image_id':container_info['Id'],'device':'GENERIC_X64','arch':'x86_64','build_root':'build.RASTERATOPS-GENERIC_X64.x86_64','global_jobs':int(run('nproc')),'webkit_jobs':4,'source_cache':'/workspace/cache/rocknix-sources','source_files':source_files,'recipe_files':sum(p.endswith('/package.mk') for p in files)}
output.write_text(json.dumps(data,sort_keys=True,indent=2)+'\n')
print(json.dumps({k:v for k,v in data.items() if k not in ('source_files',)},indent=2))
print('inputs_sha256',hashlib.sha256(output.read_bytes()).hexdigest())
