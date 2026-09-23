#!/usr/bin/env python3
# The quarter turns FBNeo asks the display for, per game, from the driver flags in its source
# (fork #248). Mirrors libretro.cpp's mapping with the "Vertical mode" option off: VERTICAL -> 1,
# FLIPPED -> 2, VERTICAL|FLIPPED -> 3. Output: "<romname> <turns>" for every driver whose turn is
# not 0, sorted. fbneo-rotation-table.py <fbneo src root>
import os, re, sys
root = sys.argv[1]
drv = re.compile(r'struct\s+BurnDriver[D]?\s+BurnDrv\w+\s*=\s*\{(.*?)\};', re.S)
out = {}
for dirpath, _, files in os.walk(os.path.join(root, 'src', 'burn', 'drv')):
    for f in files:
        if not f.endswith('.cpp'):
            continue
        text = open(os.path.join(dirpath, f), errors='replace').read()
        for m in drv.finditer(text):
            body = m.group(1)
            name = re.search(r'"([^"]+)"', body)
            if not name:
                continue
            vertical = 'BDF_ORIENTATION_VERTICAL' in body
            flipped = 'BDF_ORIENTATION_FLIPPED' in body
            turns = 3 if (vertical and flipped) else 1 if vertical else 2 if flipped else 0
            if turns:
                out[name.group(1)] = turns
for k in sorted(out):
    print(k, out[k])
print('# %d games with a turn' % len(out), file=sys.stderr)
