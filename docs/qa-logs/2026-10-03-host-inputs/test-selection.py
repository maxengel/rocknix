#!/usr/bin/env python3
"""Exercise actual old/new selection code with conflicting and missing roots."""
from pathlib import Path
import os,re,subprocess,tempfile,json
repo=Path(__file__).resolve().parents[3]
old=subprocess.check_output(['git','-C',str(repo),'show','1fde95670d:tools/last-good-scripts-test'],text=True)
new=(repo/'tools/last-good-scripts-test').read_text()
fn=re.search(r'^image_tool_source\(\) \{.*?^}',new,re.M|re.S).group()
results=[]
with tempfile.TemporaryDirectory(prefix='m7 candidate inputs ') as tmp:
 d=Path(tmp); root=d/'worktree';root.mkdir()
 legacy=d/'legacy/build.ROCKNIX-OLD/image/system'; branded=d/'branded/build.RASTERATOPS-NEW/image/system'; explicit=d/'named candidate system'
 for loc in (legacy,branded,explicit):
  (loc/'usr/bin').mkdir(parents=True)
  for name in ('busybox','rclone'):
   p=loc/'usr/bin'/name;p.write_text('#!/bin/sh\nexit 0\n');p.chmod(0o700)
 for version in ('before','after'):
  for name,var,args in [('busybox','BB_SRC','sed --help'),('rclone','SA_RCLONE_SRC','version')]:
   block=(re.search(r'^'+var+r'=""\n.*?^\[ -n "\$\{'+var+r'\}" \].*?$',old,re.M|re.S).group()+'\nprintf "%s\\n" "${'+var+'}"') if version=='before' else fn+f'\nimage_tool_source {name} {args}'
   for mode in ('explicit','missing','unusable','branded'):
    env=dict(os.environ,ROOT=str(root),QA_SYSTEM_ROOT=str(explicit))
    expected=explicit/'usr/bin'/name
    if mode=='missing':env['QA_SYSTEM_ROOT']=str(d/'absent')
    if mode=='unusable': expected.write_text('#!/bin/sh\nexit 9\n')
    if mode=='branded':
     env.pop('QA_SYSTEM_ROOT');expected=branded/'usr/bin'/name
     (legacy/'usr/bin'/name).chmod(0o600)
    p=subprocess.run(['bash','-c',block],env=env,capture_output=True,text=True)
    ok=(p.returncode==2 and not p.stdout.strip()) if mode in ('missing','unusable') else p.returncode==0 and Path(p.stdout.strip()).resolve()==expected
    results.append(dict(version=version,tool=name,mode=mode,passed=ok,rc=p.returncode))
    (explicit/'usr/bin'/name).write_text('#!/bin/sh\nexit 0\n')
    (legacy/'usr/bin'/name).chmod(0o700)
print(json.dumps(results,indent=2))
summary={v:{'pass':sum(r['passed'] for r in results if r['version']==v),'fail':sum(not r['passed'] for r in results if r['version']==v)} for v in ('before','after')}
print(json.dumps(summary))
assert summary['before']['fail']==8 and summary['after']['fail']==0
