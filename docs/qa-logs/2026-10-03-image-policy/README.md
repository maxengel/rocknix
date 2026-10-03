# Missing image policy files — #397 / #359

The first branded candidate503e24e10d has the expected OS identity but lacks
`/usr/share/licenses/rasteratops/LICENSE.md` and `TRADEMARK.md`. The source
policies were present; the image recipe never installed them. The retained
guest inventory is the negative control, not a hypothetical finding.

The correction in `scripts/image` installs both authoritative files after
the filesystem overlays, only for DISTRONAME=RASTERATOPS. Image assembly
always reads current source bytes; a package stamp cannot hide text edits.
It fails if either file cannot be installed. Terms and artwork are unchanged.

`check-policy-staging.py` runs that actual source block with source/target
paths containing spaces. Original image recipe:1PASS/3FAIL; corrected:4PASS/0FAIL.
Checks cover exact bytes,0644 files/0755 directory, other identity isolation,
and failure when either source file is absent. Bash syntax passes. These
controls are not a replacement image or clean/upgrade readback; those remain
required. The replacement input manifest must include both root policy files
as explicit hashes, and source/old candidate custody must remain preserved.
