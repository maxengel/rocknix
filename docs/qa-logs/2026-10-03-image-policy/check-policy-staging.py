#!/usr/bin/env python3
"""Execute scripts/image's actual policy-install block in isolated staging.

No copied installer. A missing block is tested as the prior no-install behavior.
Run with a distribution source tree; checks bytes, modes, identity scope and
failure propagation. This does not replace a built candidate readback (#397).
"""
from pathlib import Path
import os
import shutil
import subprocess
import sys
import tempfile

root = Path(sys.argv[1]).resolve()
source = (root / 'scripts/image').read_text()
start = '# Keep the fork\'s approved identity terms'
end = '# Replace placeholders with values in install script to eMMC'
block = source[source.index(start):source.index(end, source.index(start))] if start in source else ':'
failed = 0
for distro, missing in [('RASTERATOPS', None), ('ROCKNIX', None), ('RASTERATOPS', 'LICENSE.md'), ('RASTERATOPS', 'TRADEMARK.md')]:
    with tempfile.TemporaryDirectory(prefix='policy staging ') as work:
        work = Path(work)
        inputs = work / 'source tree'; inputs.mkdir()
        target = work / 'image root'; target.mkdir()
        for name in ('LICENSE.md', 'TRADEMARK.md'):
            if name != missing:
                shutil.copyfile(root / name, inputs / name)
        env = {**os.environ, 'DISTRONAME': distro, 'ROOT': str(inputs), 'INSTALL': str(target)}
        result = subprocess.run(['bash', '-c', 'die() { echo "$*" >&2; exit 1; };\n' + block], env=env, capture_output=True, text=True)
        policy = target / 'usr/share/licenses/rasteratops'
        if missing:
            okay = result.returncode != 0 and 'Unable to install Rasteratops identity policy' in result.stderr
        elif distro == 'ROCKNIX':
            okay = result.returncode == 0 and not policy.exists()
        else:
            okay = result.returncode == 0 and policy.is_dir() and policy.stat().st_mode & 0o777 == 0o755
            for name in ('LICENSE.md', 'TRADEMARK.md'):
                path = policy / name
                okay = okay and path.is_file() and path.read_bytes() == (inputs / name).read_bytes() and path.stat().st_mode & 0o777 == 0o644
        failed += not okay
        print(f"{'PASS' if okay else 'FAIL'} {distro}: " + (f'missing {missing} stops assembly' if missing else 'source bytes and readable modes' if distro == 'RASTERATOPS' else 'other identity unchanged'))
print(f'{4-failed} PASS / {failed} FAIL')
sys.exit(bool(failed))
