#!/usr/bin/env python3
"""Assemble a recursion-round council prompt.

tools/council/build-council-prompt.ts injects the artifact paths declared in
council-run-manifest.json, and that manifest has no round dimension -- its
step2 entry names the r1 peer reviews. So a recursion round's prompts are
assembled here instead, reproducing the builder's injection format byte for
byte: each sibling wrapped in "=== START <basename> ===" / "=== END ... ===",
trailing whitespace trimmed, blocks joined by a blank line, the target
member's own artifact excluded, and roster order preserved.

Usage: build-round-prompt.py --template T --member M --placeholder P \
                             --inject <file> [<file> ...] --out O
"""
import argparse
import os

ap = argparse.ArgumentParser()
ap.add_argument("--template", required=True)
ap.add_argument("--member", required=True)
ap.add_argument("--placeholder", required=True)
ap.add_argument("--inject", nargs="+", required=True)
ap.add_argument("--out", required=True)
a = ap.parse_args()

siblings = [f for f in a.inject if not os.path.basename(f).startswith(a.member)]
if len(siblings) != len(a.inject) - 1:
    raise SystemExit(
        f"[FAIL sibling_count] {a.member}: expected {len(a.inject) - 1} siblings, "
        f"got {len(siblings)} from {[os.path.basename(f) for f in a.inject]}"
    )

chunks = []
for f in siblings:
    label = os.path.basename(f)
    with open(f, encoding="utf-8") as fh:
        body = fh.read().rstrip()
    chunks.append(f"=== START {label} ===\n\n{body}\n\n=== END {label} ===")

with open(a.template, encoding="utf-8") as fh:
    template = fh.read()
if a.placeholder not in template:
    raise SystemExit(f"[FAIL placeholder_missing] {a.placeholder} not in {a.template}")

out = template.replace(a.placeholder, "\n\n".join(chunks))
if not out.endswith("\n"):
    out += "\n"
with open(a.out, "w", encoding="utf-8") as fh:
    fh.write(out)
print(f"{a.member}: {len(siblings)} siblings -> {a.out} ({len(out)} bytes)")
