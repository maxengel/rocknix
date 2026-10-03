#!/usr/bin/env python3
"""Execute real entrypoint prefixes and Makefile with isolated build payloads."""
import argparse
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import tempfile
import time

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[3])
args = parser.parse_args()
root = args.root.resolve()
passed = 0
entries = ('build_distro', 'image', 'build', 'build_compat', 'install')


def check(value, label):
    global passed
    if not value:
        raise AssertionError(label)
    passed += 1
    print('PASS:', label, flush=True)


def executable(path, body):
    path.write_text(body)
    path.chmod(0o755)


def wait_for(predicate, seconds=10):
    until = time.monotonic() + seconds
    while time.monotonic() < until:
        result = predicate()
        if result:
            return result
        time.sleep(.025)
    raise AssertionError('timed out waiting for fixture state')


with tempfile.TemporaryDirectory(prefix='watch-build-394-') as temporary:
    base = Path(temporary)
    count = 0

    def fixture():
        global count
        count += 1
        d = base / str(count)
        d.mkdir()
        (d / 'tools').mkdir()
        (d / 'scripts').mkdir()
        for name in ('watch-build', 'watch-job'):
            shutil.copy2(root / 'tools' / name, d / 'tools' / name)
        shutil.copy2(root / 'Makefile', d / 'Makefile')
        shutil.copy2(root / 'scripts/get_env', d / 'scripts/get_env')
        for name in entries:
            text = (root / 'scripts' / name).read_text()
            marker = 'unset RASTERATOPS_WATCH_EXEC\n'
            if marker not in text or 'exec ./tools/watch-build --entry -- "$0" "$@"' not in text:
                raise AssertionError('unmonitored entrypoint: scripts/' + name)
            prefix = text[:text.index(marker) + len(marker)]
            body = '\nprintf "%s\\n" "fixture-' + name + ':$*:$TEST_ENV"\n'
            if name == 'build_distro':
                body += 'make image\n'
            elif name == 'image':
                body += './scripts/install fake\n'
            elif name == 'install':
                body += './scripts/build fake\n'
            executable(d / 'scripts' / name, prefix + body)
        return d

    def environment(d):
        # No personal account/environment values enter fixtures or receipts.
        return {'PATH': os.environ['PATH'], 'HOME': str(d), 'TEST_ENV': 'retained',
                'LC_ALL': 'C'}

    def run(d, command, env=None):
        return subprocess.run(command, cwd=d, env=env or environment(d),
                              capture_output=True, text=True, timeout=35)

    def only_run(d):
        runs = [p for p in (d / '.build-runs').iterdir() if p.is_dir()]
        if len(runs) != 1:
            raise AssertionError(f'expected one outer run; got {len(runs)}')
        return runs[0]

    def finished(d, code):
        r = only_run(d)
        return ((r / 'build.rc').read_text().strip() == str(code)
                and (r / 'build.status').read_text().startswith('state:       finished\n')
                and (r / 'watch-job').exists())

    d = fixture()
    activity = d / 'qa artifacts'
    activity.mkdir()
    script = d / 'qa.py'
    script.write_text('import time\nfrom pathlib import Path\ntime.sleep(1.2)\n'
                      'p=Path("qa artifacts/suite")\np.mkdir()\n'
                      '(p/"proof.log").write_text("case advanced\\n")\n')
    result = run(d, ['./tools/watch-build', '--interval', '1', '--stall-min', '1',
                     '--activity-dir', str(activity), '--recursive-activity',
                     '--', 'python3', str(script)])
    check(result.returncode == 0 and finished(d, 0)
          and str(activity / 'suite/proof.log') in (only_run(d) / 'build.status').read_text(),
          'shared runner observes nested QA logs and retains terminal result')

    for name in entries:
        d = fixture()
        result = run(d, ['./scripts/' + name, 'an argument', 'literal;$value'])
        check(result.returncode == 0 and finished(d, 0), 'automatic direct entry: ' + name)
        check(f'fixture-{name}:an argument literal;$value:retained' in result.stdout,
              'arguments and environment preserved: ' + name)
        r = only_run(d)
        check(r.stat().st_mode & 0o777 == 0o700 and (r / 'build.log').stat().st_mode & 0o777 == 0o600,
              'private run and logs: ' + name)

    for target in ('GENERIC_X64', 'image', 'package'):
        d = fixture()
        result = run(d, ['make', target, 'PACKAGE=fake'])
        check(result.returncode == 0 and finished(d, 0), 'native make route: ' + target)

    d = fixture()
    executable(d / 'scripts/build', '#!/bin/bash\necho unmonitored\n')
    negative = subprocess.run(['python3', str(Path(__file__).resolve()), '--root', str(d)],
                              capture_output=True, text=True, timeout=10)
    check(negative.returncode != 0 and 'unmonitored entrypoint: scripts/build' in negative.stderr,
          'routing regression check fails when an entrypoint loses its hook')

    d = fixture()
    (d / 'bin').mkdir()
    executable(d / 'bin/docker', '''#!/usr/bin/env python3
import os,sys,subprocess,json
from pathlib import Path
if sys.argv[1:]==['--version']:
 print('Docker fixture'); sys.exit(0)
a=sys.argv[1:]
if a[0]!='run': raise SystemExit(2)
assert '-e' in a and 'RASTERATOPS_BUILD_RUN' in a
assert os.environ.get('RASTERATOPS_BUILD_RUN')
Path('docker-run.json').write_text(json.dumps({'relative_run':os.environ['RASTERATOPS_BUILD_RUN']}))
at=next(i for i,v in enumerate(a) if v.startswith('ghcr.io/rasteratops/build@'))
sys.exit(subprocess.call(a[at+1:]))
''')
    env = environment(d)
    env['PATH'] = str(d / 'bin') + ':' + env['PATH']
    result = run(d, ['make', 'docker-GENERIC_X64'], env)
    check(result.returncode == 0 and finished(d, 0), 'Docker host runner and inner scripts share one run')
    check(not (d / '.env').exists() and json.loads((d / 'docker-run.json').read_text())['relative_run'].startswith('.build-runs/'),
          'Docker gets relative mounted run; environment file is removed')
    dry = run(d, ['make', '-n', 'docker-shell'], env)
    check('./tools/watch-build --docker -- docker run' not in dry.stdout,
          'interactive docker-shell does not gain an outer monitor')

    for code in (0, 37):
        d = fixture()
        result = run(d, ['./tools/watch-build', '--interval', '1', '--',
                         'bash', '-c', f'echo out; echo err >&2; exit {code}'])
        r = only_run(d)
        check(result.returncode == code and finished(d, code), 'actual command exit preserved: ' + str(code))
        check('out\nerr\n' in result.stdout and (r / 'build.log').read_text() == 'out\nerr\n',
              'console and durable combined output preserved: ' + str(code))

    d = fixture()
    env = environment(d)
    env['RASTERATOPS_BUILD_RUN'] = '.build-runs/missing'
    result = run(d, ['./scripts/build', 'fake'], env)
    check(result.returncode != 0 and 'fixture-build' not in result.stdout,
          'stale inherited marker cannot bypass monitoring')

    d = fixture()
    result = subprocess.run(['./tools/watch-build', '--interval', '1', '--',
                             'bash', '-c', 'touch product-file; mkdir product-directory'],
                            cwd=d, env=environment(d), capture_output=True,
                            preexec_fn=lambda: os.umask(0o022), timeout=10)
    check(result.returncode == 0 and (d / 'product-file').stat().st_mode & 0o777 == 0o644
          and (d / 'product-directory').stat().st_mode & 0o777 == 0o755,
          'private monitor permissions do not change build artifact umask')

    d = fixture()
    executable(d / 'tools/watch-job', '#!/bin/sh\nexit 23\n')
    result = run(d, ['./tools/watch-build', '--', 'touch', 'should-not-exist'])
    check(result.returncode != 0 and not (d / 'should-not-exist').exists(),
          'watcher startup failure refuses command launch')

    d = fixture()
    result = run(d, ['./tools/watch-build', '--interval', '1', '--', 'bash', '-c',
                     'kill -TERM "$(cat "$RASTERATOPS_BUILD_RUN/watcher.pid")"; sleep 1; echo completed'])
    r = only_run(d)
    check(result.returncode == 125 and (r / 'build.rc').read_text().strip() == '0'
          and (r / 'runner-error').exists(), 'lost watcher cannot produce a green monitored run')

    d = fixture()
    p = subprocess.Popen(['./tools/watch-build', '--interval', '1', '--', 'sleep', '30'],
                         cwd=d, env=environment(d), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        wait_for(lambda: list((d / '.build-runs').glob('*/command.pid')) if (d / '.build-runs').exists() else [])
        blocked = run(d, ['./tools/watch-build', '--', 'touch', 'second-command'])
        check(blocked.returncode != 0 and not (d / 'second-command').exists(),
              'one top-level build per worktree')
        p.send_signal(signal.SIGTERM)
        check(p.wait(timeout=10) == 143 and finished(d, 143), 'termination forwards to child and retains143')
    finally:
        if p.poll() is None:
            p.terminate()
            p.wait(timeout=10)

    d = fixture()
    executable(d / 'activity.py', '''#!/usr/bin/env python3
import os,time
from pathlib import Path
run=Path(os.environ['RASTERATOPS_BUILD_RUN'])
p=Path(os.environ['BUILD_DIR'])/'build.fixture/.threads/logs'
p.mkdir(parents=True)
(p/'1.log').write_text('[7/10] compiling\\n')
os.utime(run/'build.log',(time.time()-1200,time.time()-1200))
time.sleep(2)
s=(run/'build.status').read_text()
assert 'state:       running' in s and 'activity_progress: [7/10]' in s,s
print('new cold root observed')
''')
    env = environment(d)
    env['BUILD_DIR'] = str(d / 'new-external-build-root')
    result = run(d, ['./tools/watch-build', '--interval', '1', '--', './activity.py'], env)
    check(result.returncode == 0 and 'new cold root observed' in result.stdout,
          'cold build roots discovered after launch; buffered progress observed')

    d = fixture()
    p = subprocess.Popen(['./tools/watch-build', '--interval', '1', '--', 'sleep', '30'],
                         cwd=d, env=environment(d), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    child_pid = None
    try:
        paths = wait_for(lambda: list((d / '.build-runs').glob('*/command.pid')) if (d / '.build-runs').exists() else [])
        child_pid = int(paths[0].read_text())
        p.kill()
        p.wait(timeout=5)
        r = only_run(d)
        wait_for(lambda: 'state:       died\n' in (r / 'build.status').read_text())
        check(not (r / 'build.rc').exists(), 'detached monitor records killed runner without inventing result')
    finally:
        if child_pid is not None:
            try:
                os.killpg(child_pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
        if p.poll() is None:
            p.kill()
            p.wait()

print(f'{passed} PASS; 0 FAIL')
