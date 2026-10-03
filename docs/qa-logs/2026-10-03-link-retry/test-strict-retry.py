#!/usr/bin/env python3
"""Exercise the actual retry/content verdict blocks, including timeout/lock controls."""
import ast,contextlib,io,sys
from pathlib import Path
from types import SimpleNamespace
path=Path(sys.argv[1]);tree=ast.parse(path.read_text())
cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Link')
method=next(n for n in cls.body if isinstance(n,ast.FunctionDef) and n.name=='exercise')
start=next(i for i,n in enumerate(method.body) if isinstance(n,ast.If) and 'locked' in ast.unparse(n.test) and 'archive_whole' in ast.unparse(n.test))
code=compile(ast.Module(body=method.body[start:start+2],type_ignores=[]),str(path),'exec')
cases=[('success',0,False,False,True,0),('stall at 100 percent',124,False,True,True,1),('stale lock',1,True,False,True,1),('lock and changed bytes',1,True,False,False,2),('retry reset timeout',124,False,False,True,1),('successful exit with wrong bytes',0,False,False,False,1)]
failures=0
for label,rc,locked,drained,whole,expected in cases:
 seen=[]
 def check(value,good,bad):seen.append(bool(value));return value
 env=dict(f=0,rc2=rc,locked=locked,drained=drained,archive_whole=True,strict_retry=True,receiving=('cloud','fixture'),verify=None,last='retained output',sources={'archive':(42,'expected')},check=check,self=SimpleNamespace(settle=lambda side:{'archive':(42,'expected' if whole else 'changed')}))
 with contextlib.redirect_stdout(io.StringIO()) as capture:exec(code,env)
 okay=env['f']==expected and len(seen)==2 and 'SKIP' not in capture.getvalue()
 failures+=not okay
 print(('PASS' if okay else 'FAIL')+' '+label+f": expected failures={expected}, observed={env['f']}, assertions={len(seen)}")
print(f'{len(cases)-failures} PASS / {failures} FAIL')
sys.exit(bool(failures))
