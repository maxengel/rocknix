#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)
#
# rotation-table-fba.py [--min N] <core source root>
#
# The quarter turns an FBA-family libretro core (fbneo, fbalpha2012,
# fbalpha2019) asks the display for, per game, read from the BurnDriver
# tables under <root>/src/burn/drv. The three cores' libretro.cpp map the
# driver flags the same way with the "Vertical mode" option off:
# BDF_ORIENTATION_VERTICAL -> 1, BDF_ORIENTATION_FLIPPED -> 2, both -> 3.
#
# Prints "<romname> <turns>" for every driver whose turn is not 0, sorted,
# and the count on stderr. With --min N it fails when fewer than N games
# have a turn: a source root with no drivers under it is a wrong path, not
# a smaller core. Only what the compiler reads counts: a driver or a flag
# inside /* */, after // or in an #if 0 block is not read (other #if
# conditions depend on the build's defines and are read as live), and a
# flag is read from the driver's fields, never from the text of its strings.
import os, re, sys

LEXEME = re.compile(r'//[^\n]*|/\*.*?(?:\*/|\Z)|"(?:\\.|[^"\\\n])*"|(?<![0-9])\'(?:\\.|[^\'\\\n])*\'', re.S)
STRING = re.compile(r'"(?:\\.|[^"\\\n])*"')
DRIVER = re.compile(r'struct\s+BurnDriver[D]?\s+BurnDrv\w+\s*=\s*\{(.*?)\};', re.S)


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
    if len(argv) != 1:
        sys.exit('usage: rotation-table-fba.py [--min N] <core source root>')
    out = {}
    for dirpath, _, files in os.walk(os.path.join(argv[0], 'src', 'burn', 'drv')):
        for f in sorted(files):
            if not f.endswith('.cpp'):
                continue
            with open(os.path.join(dirpath, f), errors='replace') as fh:
                text = drop_dead(strip_comments(fh.read()))
            for m in DRIVER.finditer(text):
                body = m.group(1)
                name = STRING.search(body)
                if not name:
                    continue
                fields = STRING.sub('""', body)
                vertical = re.search(r'\bBDF_ORIENTATION_VERTICAL\b', fields) is not None
                flipped = re.search(r'\bBDF_ORIENTATION_FLIPPED\b', fields) is not None
                turns = 3 if (vertical and flipped) else 1 if vertical else 2 if flipped else 0
                out[name.group(0)[1:-1]] = turns
    rows = sorted(k for k in out if out[k])
    for k in rows:
        print(k, out[k])
    print('# %d games with a turn' % len(rows), file=sys.stderr)
    if len(rows) < minimum:
        sys.exit('rotation-table-fba.py: %d games with a turn, under the %d a real source tree has -- '
                 'check the source root handed to it' % (len(rows), minimum))


if __name__ == '__main__':
    main(sys.argv[1:])
