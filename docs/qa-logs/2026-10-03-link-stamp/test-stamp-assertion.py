#!/usr/bin/env python3
"""Execute Link.exercise's actual stamp loop without touching a guest (#398)."""
import ast
from pathlib import Path
import sys

path = Path(sys.argv[1])
tree = ast.parse(path.read_text())
cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'Link')
method = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == 'exercise')
loop = next(n for n in method.body if isinstance(n, ast.For) and isinstance(n.iter, ast.Name) and n.iter.id == 'stamps')
code = compile(ast.Module(body=[loop], type_ignores=[]), str(path), 'exec')
cases = [
    ('legacy failure', '1791054543 69', True),
    ('partial transfer failure', '1791054543 69 gaps YOU WENT OFFLINE PART-WAY THROUGH', True),
    ('failure with reason', '1791054543 5 cloud_refused', True),
    ('highest shell exit', '1791054543 255', True),
    ('success', '1791054543 0', False),
    ('success plus misleading reason', '1791054543 0 gaps failure', False),
    ('zero-padded success', '1791054543 00', False),
    ('unknown exit', '1791054543 rubbish', False),
    ('negative exit', '1791054543 -1', False),
    ('out-of-range exit', '1791054543 256', False),
    ('missing exit', '1791054543', False),
    ('missing epoch', '69 gaps reason', False),
    ('nonnumeric epoch', 'now 69', False),
    ('unchanged absence', '', True),
]
passed = failed = 0
for label, stamp, expected in cases:
    seen=[]
    def check(value, good, bad):
        seen.append(bool(value)); return value
    env=dict(stamps=['last-backup'], before={'last-backup':''}, after={'last-backup':stamp}, f=0, check=check)
    exec(code, env)
    okay=seen==[expected] and env['f']==int(not expected)
    passed+=okay;failed+=not okay
    print(f"{'PASS' if okay else 'FAIL'} {label}: expected={expected} observed={seen}")
print(f'{passed} PASS / {failed} FAIL')
sys.exit(bool(failed))
