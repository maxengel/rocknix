#!/usr/bin/env python3
import ast,sys,time
from pathlib import Path
from types import SimpleNamespace
p=Path(sys.argv[1]); tree=ast.parse(p.read_text())
fx=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='fx_link7')
cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Link')
methods=[n for n in cls.body if isinstance(n,ast.FunctionDef) and n.name in ('exercise','wait_marker','rc_line')]
seen=[]
def check(ok,*_):seen.append(ok);return ok
env=dict(LINK_TPS=2,epath=lambda x:x,backend=lambda _:kind,time=time,check=check)
exec(compile(ast.Module(body=[fx,*methods],type_ignores=[]),str(p),'exec'),env)
fail=0
for kind in ('s3','webdav'):
 def exercise(*args,**kw):
  expected='RCLONE_TPSLIMIT=2'+(' RCLONE_S3_LIST_CHUNK=1' if kind=='s3' else '')
  rows='\n'.join([f'sys{i:02d}|1' for i in range(1,25)]+['bios|1'])
  return [kw['env']==expected,kw['verify'](rows)[0],not kw['verify']('sys01|1')[0]]
 got=env['fx_link7'](SimpleNamespace(content_remote='/fixture',plant_cloud=lambda *a:None,exercise=exercise))
 for i,ok in enumerate(got):print(('PASS' if ok else 'FAIL'),kind,i);fail+=not ok
obj=SimpleNamespace(stamps=lambda:{},start=lambda *a:None,status=lambda:('', '0 100', 0))
obj.rc_line=lambda text:env['rc_line'](obj,text)
obj.wait_marker=lambda marker:env['wait_marker'](obj,marker)
result=env['exercise'](obj,'LINK7','scan',None,None,{},[])
ok=result==1 and seen==[False]; print(('PASS' if ok else 'FAIL'),'finished before cut remains a failure');fail+=not ok
print(f'{7-fail} PASS / {fail} FAIL');sys.exit(bool(fail))
