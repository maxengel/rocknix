#!/usr/bin/env python3
# The quarter turns a MAME-family libretro core asks the display for, per game, from the GAME() macros
# in its drivers (fork #248). The cores map a plain ROT270 to 1, ROT180 to 2, ROT90 to 3 (mame2003-plus
# video.c, mame2010 retromain.c); a driver whose orientation is a combination with a flip is rotated by
# the core itself and gets no turn here. Output "<romname> <turns>" for every game with a turn, sorted.
# rotation-table-mame.py <src root> <drivers dir relative to root>
import os, re, sys
root, drivers = sys.argv[1], sys.argv[2]
macro = re.compile(r'\bGAME[A-Z]*\s*\((.*?)\)\s*$', re.S | re.M)
turns_of = {'ROT270': 1, 'ROT180': 2, 'ROT90': 3, 'ROT0': 0}
out = {}
for dirpath, _, files in os.walk(os.path.join(root, drivers)):
    for f in files:
        if not (f.endswith('.c') or f.endswith('.cpp')):
            continue
        text = open(os.path.join(dirpath, f), errors='replace').read()
        # a macro spans lines; join continuation lines and split at the closing paren
        for m in re.finditer(r'\bGAME[A-Z]*\s*\(', text):
            start = m.end(); depth = 1; i = start
            while i < len(text) and depth:
                if text[i] == '(': depth += 1
                elif text[i] == ')': depth -= 1
                i += 1
            args = [a.strip() for a in text[start:i - 1].split(',')]
            if len(args) < 7:
                continue
            name = args[1]
            rot = next((a for a in args if a.startswith('ROT')), None)
            if rot is None or not re.fullmatch(r'[a-z0-9_]+', name):
                continue
            turns = turns_of.get(rot.replace(' ', ''), None)   # a combination such as "ROT90 | ORIENTATION_FLIP_X" is not in the map
            if turns:
                out[name] = turns
for k in sorted(out):
    print(k, out[k])
print('# %d games with a turn' % len(out), file=sys.stderr)
