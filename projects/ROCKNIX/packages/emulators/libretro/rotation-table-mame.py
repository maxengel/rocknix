#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)
#
# rotation-table-mame.py [--min N] <core source root> <drivers dir, relative to the root>
#
# The quarter turns a MAME-family libretro core asks the display for, per
# game, read from the GAME() macros in its drivers. The cores map a plain
# ROT270 to 1, ROT180 to 2 and ROT90 to 3 (mame2003-plus src/mame2003/video.c,
# mame2010 src/osd/retro/retromain.c); a driver whose orientation combines a
# rotation with a flip is rotated by the core itself and gets no turn here.
#
# Prints "<romname> <turns>" for every game with a turn, sorted, and the
# count on stderr. With --min N it fails when fewer than N games have a
# turn: a drivers directory with no macros in it is a wrong path, not a
# smaller core. Only what the compiler reads counts: a GAME() inside /* */,
# after //, inside a string or in an #if 0 block is not read (other
# #if conditions depend on the build's defines and are read as live), and
# every live declaration counts, so a game declared ROT0 has no turn
# whatever a commented-out line said.
import os, re, sys

LEXEME = re.compile(r'//[^\n]*|/\*.*?(?:\*/|\Z)|"(?:\\.|[^"\\\n])*"|(?<![0-9])\'(?:\\.|[^\'\\\n])*\'', re.S)
STRING = re.compile(r'"(?:\\.|[^"\\\n])*"')
TURNS = {'ROT270': 1, 'ROT180': 2, 'ROT90': 3, 'ROT0': 0}


def strip_comments(text):
    """The source with its comments blanked, literals kept (a block comment
    keeps its newlines, so nothing after it moves line). A quote after a
    digit is a C++14 digit separator (1'000), not a character literal."""
    return LEXEME.sub(lambda m: (' ' + '\n' * m.group(0).count('\n')) if m.group(0)[0] == '/' else m.group(0), text)


def drop_dead(text):
    """The source with what the preprocessor never compiles blanked: the
    body of an #if 0 up to its #else, #elif or #endif, and an #if 1's #else
    and #elif arms. Any other condition depends on the build's defines,
    which are not known here, and is read as live."""
    out = []
    stack = []   # one per open #if: 'dead' or 'gone' while its current arm is not compiled
    for line in text.split('\n'):
        d = re.match(r'\s*#\s*(if|ifdef|ifndef|elif|else|endif)\b(.*)', line)
        if d:
            kind, rest = d.group(1), d.group(2).strip()
            if kind in ('if', 'ifdef', 'ifndef'):
                stack.append('dead' if kind == 'if' and rest == '0' else 'one' if kind == 'if' and rest == '1' else 'live')
            elif kind == 'else' and stack:
                stack[-1] = 'gone' if stack[-1] in ('one', 'gone') else 'live'
            elif kind == 'elif' and stack:
                stack[-1] = 'gone' if stack[-1] in ('one', 'gone') else 'live'
            elif kind == 'endif' and stack:
                stack.pop()
            out.append('')
            continue
        out.append('' if 'dead' in stack or 'gone' in stack else line)
    return '\n'.join(out)


def main(argv):
    minimum = 0
    if len(argv) >= 2 and argv[0] == '--min':
        minimum = int(argv[1])
        argv = argv[2:]
    if len(argv) != 2:
        sys.exit('usage: rotation-table-mame.py [--min N] <core source root> <drivers dir>')
    root, drivers = argv
    out = {}
    for dirpath, _, files in os.walk(os.path.join(root, drivers)):
        for f in sorted(files):
            if not (f.endswith('.c') or f.endswith('.cpp')):
                continue
            with open(os.path.join(dirpath, f), errors='replace') as fh:
                # strings blanked as well: a GAME( inside one is text, and a
                # title's commas and parentheses do not split the macro
                text = STRING.sub('""', drop_dead(strip_comments(fh.read())))
            # a macro spans lines: read to its closing parenthesis
            for m in re.finditer(r'\bGAME[A-Z]*\s*\(', text):
                start = m.end(); depth = 1; i = start
                while i < len(text) and depth:
                    if text[i] == '(':
                        depth += 1
                    elif text[i] == ')':
                        depth -= 1
                    i += 1
                args = [a.strip() for a in text[start:i - 1].split(',')]
                if len(args) < 7:
                    continue
                name = args[1]
                rot = next((a for a in args if a.startswith('ROT')), None)
                if rot is None or not re.fullmatch(r'[a-z0-9_]+', name):
                    continue
                # a combination such as "ROT90 | ORIENTATION_FLIP_X" is not in the map: no turn
                out[name] = TURNS.get(rot.replace(' ', ''), 0)
    rows = sorted(k for k in out if out[k])
    for k in rows:
        print(k, out[k])
    print('# %d games with a turn' % len(rows), file=sys.stderr)
    if len(rows) < minimum:
        sys.exit('rotation-table-mame.py: %d games with a turn, under the %d a real source tree has -- '
                 'check the source root and drivers directory handed to it' % (len(rows), minimum))


if __name__ == '__main__':
    main(sys.argv[1:])
