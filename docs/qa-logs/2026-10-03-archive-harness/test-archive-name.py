#!/usr/bin/env python3
"""Execute the actual writer-name assertion from a cloud-round-trip source.

Usage: test-archive-name.py /path/to/tools/cloud-round-trip
Extract the AST between the label query and the installed-reader query in
run_steps. No copied matcher and no guest/cloud actions. The old harness
must fail two controls on the RASTERATOPS display identity (#396).
"""
import ast
import os
from pathlib import Path
import re
import sys

source = Path(sys.argv[1])
tree = ast.parse(source.read_text())
run = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'run_steps')
body = run.body
# Scope to the archive writer step so another label query cannot stand in.
step = next(i for i, n in enumerate(body) if isinstance(n, ast.Expr)
            and isinstance(n.value, ast.Call)
            and n.value.args and isinstance(n.value.args[0], ast.Constant)
            and n.value.args[0].value == 'the settings archive is a tar archive named for this device, and every reader finds it')
def assigns(node, name):
    return isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in node.targets)
start = next(i for i in range(step, len(body)) if assigns(body[i], 'label'))
end = next(i for i in range(start, len(body)) if assigns(body[i], 'installed'))
code = compile(ast.Module(body=body[start:end], type_ignores=[]), str(source), 'exec')

cases = [
    ('compatible writer', 'GENERIC-X64', '2026_10_03-143318-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz', True),
    ('display suffix must not replace contract', 'GENERIC-X64', '2026_10_03-143318-GENERIC-X64-RASTERATOPS_SETTINGS.tar.gz', False),
    ('foreign device', 'GENERIC-X64', '2026_10_03-143318-OTHER-ROCKNIX_SETTINGS.tar.gz', False),
    ('missing label in filename', 'GENERIC-X64', '2026_10_03-143318-ROCKNIX_SETTINGS.tar.gz', False),
    ('unavailable device label', '', '2026_10_03-143318-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz', False),
    ('malformed stamp', 'GENERIC-X64', '2026_10_03-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz', False),
    ('wrong format', 'GENERIC-X64', '2026_10_03-143318-GENERIC-X64-ROCKNIX_SETTINGS.zip', False),
    ('anchored suffix', 'GENERIC-X64', '2026_10_03-143318-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz.partial', False),
]
passed = failed = 0
for display in ('ROCKNIX', 'RASTERATOPS'):
    for title, label, filename, expected in cases:
        class Device:
            def run(self, command):
                assert command == 'cloud_device_id --label 2>/dev/null || true'
                return label
        observed = []
        def check(value, good, bad):
            observed.append(bool(value))
            return value
        env = dict(dev=Device(), os_name=lambda _: display, newest='/storage/qa/' + filename,
                   os=os, re=re, check=check, failures=0)
        exec(code, env)
        okay = observed == [expected] and env['failures'] == int(not expected)
        passed += okay
        failed += not okay
        print(f"{'PASS' if okay else 'FAIL'} {display}: {title}; expected={expected}, observed={observed}")
print(f'{passed} PASS / {failed} FAIL')
sys.exit(bool(failed))
