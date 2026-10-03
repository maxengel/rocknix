#!/usr/bin/env python3
"""Reproduce the actual Mesa allocator unload control against a configured tree.

The tree supplies Mesa headers/generated configuration; retained before/after
allocator files supply the only changed translation unit. No image is mutated.
"""
import argparse
import json
import subprocess
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--mesa-source', type=Path, required=True)
p.add_argument('--build-dir', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
a = p.parse_args()
here = Path(__file__).resolve().parent
source = a.mesa_source.resolve()
build = a.build_dir.resolve()
out = a.output.resolve()
out.mkdir(parents=True, exist_ok=False)
flags = json.loads((here / 'rtasm-host-flags.json').read_text())
flags = [f for f in flags if not f.startswith('-I/workspace/')]
flags += ['-I' + str(source / 'src/gallium/auxiliary/rtasm')]
common = [str(source / 'src/util/u_mm.c'), str(source / 'src/util/futex.c')]

def run(args, log, expected=0, cwd=None):
    with (out / log).open('w') as stream:
        result = subprocess.run(args, cwd=cwd, stdout=stream, stderr=subprocess.STDOUT)
    (out / (log + '.rc')).write_text(str(result.returncode) + '\n')
    if result.returncode != expected:
        raise SystemExit(f'{log}: expected {expected}, got {result.returncode}')

run(['gcc', '-pthread', str(here / 'rtasm-reload.c'), '-ldl', '-o', str(out / 'reload')], 'driver-build.log')
for version, expected in [('before', 1), ('after', 0)]:
    library = out / (version + '.so')
    run(['gcc', *flags, '-shared', '-fPIC', str(here / ('rtasm_execmem.' + version + '.c')),
         *common, '-o', str(library)], version + '-build.log', cwd=build)
    run([str(out / 'reload'), str(library)], version + '-reload.log', expected)
print('PASS: before retains executable mappings; after unloads every arena (50 reloads, four allocation threads)')
