#!/usr/bin/env python3
"""Host process/log controls for #393; accepts an uninstalled watcher copy."""
import argparse
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import time

parser = argparse.ArgumentParser()
parser.add_argument('watcher', type=Path)
parser.add_argument('--baseline', action='store_true')
args = parser.parse_args()
watcher = str(args.watcher.resolve())
passed = 0


def check(condition, label):
    global passed
    if not condition:
        raise AssertionError(label)
    passed += 1
    print('PASS:', label, flush=True)


with tempfile.TemporaryDirectory(prefix='watch-job-393-') as temporary:
    root = Path(temporary)
    processes = []
    detached = []

    def setup(name):
        directory = root / name
        directory.mkdir()
        (directory / 'package logs').mkdir()
        (directory / 'build.log').write_text('[636/642] complete\n')
        return directory

    def command(directory, extra=(), activity=True, pid=None):
        result = [watcher, '--log', str(directory / 'build.log'),
                  '--rc', str(directory / 'build.rc'),
                  '--status', str(directory / 'build.status'),
                  '--pid', str(os.getpid() if pid is None else pid),
                  '--interval', '1']
        if activity:
            result += ['--activity-dir', str(directory / 'package logs')]
        return result + list(extra)

    def start(directory, extra=(), activity=True, pid=None):
        proc = subprocess.Popen(command(directory, extra, activity, pid),
                                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
                                start_new_session=True)
        processes.append(proc)
        return proc

    def status(directory, state):
        deadline = time.monotonic() + 5
        data = ''
        while time.monotonic() < deadline:
            try:
                data = (directory / 'build.status').read_text()
            except FileNotFoundError:
                pass
            if data.startswith('state:       ' + state + '\n'):
                if not args.baseline and state in ('finished', 'died', 'error'):
                    assert 'terminal result; heartbeat stops here' in data and 'if this is stale' not in data, data
                return data
            time.sleep(.025)
        raise AssertionError(f'expected {state}: {data}')

    def old(path):
        age = time.time() - 1200
        os.utime(path, (age, age))

    def stop(proc):
        if proc.poll() is None:
            os.killpg(proc.pid, signal.SIGTERM)
        proc.wait(timeout=5)

    try:
        d = setup('buffered build')
        old(d / 'build.log')
        package = d / 'package logs' / '580.log'
        package.write_text('[7958/8578] Compiling WebKit\n')
        p = start(d, activity=not args.baseline)
        if args.baseline:
            status(d, 'stalled')
            check(time.time() - package.stat().st_mtime < 5,
                  'old watcher falsely reports stalled with fresh WebKit log')
        else:
            data = status(d, 'running')
            check(str(package) in data and 'progress:    [636/642]' in data
                  and 'activity_progress: [7958/8578]' in data,
                  'fresh package log prevents false stall; both progress counters retained')
        stop(p)

        if not args.baseline:
            d = setup('nested QA')
            old(d / 'build.log')
            nested = d / 'package logs' / 'suite' / 'cases'
            nested.mkdir(parents=True)
            (nested / 'proof.log').write_text('case advanced\n')
            p = start(d)
            check('suspected stall' in status(d, 'stalled'),
                  'nested QA logs are opt-in; default build observation stays shallow')
            stop(p)
            p = start(d, extra=['--recursive-activity'])
            check(str(nested / 'proof.log') in status(d, 'running'),
                  'recursive QA activity prevents a false stall from a quiet summary')
            old(nested / 'proof.log')
            (nested / 'heartbeat.status').write_text('alive\n')
            check('suspected stall' in status(d, 'stalled'),
                  'nested non-log heartbeat does not mask quiet QA')
            stop(p)
            result = subprocess.run(command(d, ['--recursive-activity'], activity=False),
                                    capture_output=True, text=True, timeout=5)
            check(result.returncode == 2, 'recursive activity refuses a missing scope')

            d = setup('quiet build')
            old(d / 'build.log')
            (d / 'package logs' / '580.log').write_text('quiet\n')
            old(d / 'package logs' / '580.log')
            (d / 'package logs' / 'monitor.status').write_text('unrelated heartbeat\n')
            p = start(d)
            check('suspected stall' in status(d, 'stalled'),
                  'quiet logs stall; unrelated heartbeat files do not mask it')
            (d / 'package logs' / '581.log').write_text('[1/2] new package\n')
            check('581.log' in status(d, 'running'),
                  'new package log resumes activity after stall')
            before = (d / 'build.status').stat().st_mtime_ns
            time.sleep(1.2)
            check((d / 'build.status').stat().st_mtime_ns > before,
                  'live watcher refreshes heartbeat without package completion')
            stop(p)
            before = (d / 'build.status').stat().st_mtime_ns
            time.sleep(1.2)
            check((d / 'build.status').stat().st_mtime_ns == before,
                  'stopping watcher leaves detectably stale heartbeat')

            for code in ('0', '23'):
                d = setup('result-' + code)
                (d / 'build.rc').write_text(code + '\n')
                p = start(d)
                check('outcome:     rc=' + code in status(d, 'finished'),
                      'result code ' + code + ' preserved')
                check(p.wait(timeout=5) == 0, 'finished observer exits for result ' + code)

            d = setup('death')
            job = subprocess.Popen(['sleep', '60'])
            try:
                p = start(d, pid=job.pid)
                status(d, 'running')
                job.terminate()
                job.wait(timeout=5)
                check('NO EXIT CODE WRITTEN' in status(d, 'died'),
                      'job death without result is detected')
                p.wait(timeout=5)
            finally:
                if job.poll() is None:
                    job.terminate()
                    job.wait()

            d = setup('zombie')
            job = subprocess.Popen(['true'])
            try:
                # Keep the child unreaped: kill -0 alone incorrectly says alive.
                time.sleep(.1)
                p = start(d, pid=job.pid)
                check('alive=no' in status(d, 'died'), 'unreaped zombie is not a live job')
                p.wait(timeout=5)
            finally:
                job.wait()

            for result in ('', 'invalid', '256'):
                d = setup('bad-result-' + (result or 'empty'))
                (d / 'build.rc').write_text(result)
                p = start(d)
                check('OBSERVATION ERROR' in status(d, 'error') and p.wait(timeout=5) == 2,
                      'invalid result fails closed: ' + repr(result))

            d = setup('never logged')
            (d / 'build.log').unlink()
            p = start(d, extra=['--stall-min', '0'])
            check('no log yet' in status(d, 'stalled'),
                  'job that never writes a log eventually stalls')
            stop(p)

            d = setup('lost log directory')
            p = start(d)
            status(d, 'running')
            (d / 'package logs').rmdir()
            check('cannot scan' in status(d, 'error') and p.wait(timeout=5) == 2,
                  'lost activity directory is an observation error')

            d = setup('detached')
            old(d / 'build.log')
            (d / 'package logs' / '580.log').write_text('[1/2] fresh\n')
            launch = subprocess.run(command(d, ['--detach']), capture_output=True, text=True, timeout=10)
            pid = int((d / 'build.status.pid').read_text())
            detached.append(pid)
            data = status(d, 'running')
            check(launch.returncode == 0 and f'watcher_pid: {pid}\n' in data
                  and '580.log' in data, 'detach retains activity argument and acknowledges actual child')
            (d / 'build.rc').write_text('7\n')
            check('rc=7' in status(d, 'finished'), 'detached watcher records subsequent failure')

            for extra in (['--interval', '0'], ['--stall-min', '-1'],
                          ['--pid', '0'], ['--pattern', '['], ['--log'],
                          ['--activity-dir', str(root / 'absent')],
                          ['--status', str(d / 'build.log')],
                          ['--status', str(d / 'package logs' / 'self.log')],
                          ['--status', str(root / 'absent' / 'status'), '--detach']):
                invalid = subprocess.run(command(d, extra), capture_output=True, timeout=10)
                check(invalid.returncode == 2, 'refuse invalid setup ' + ' '.join(extra[:2]))

            help_result = subprocess.run([watcher, '--help'], capture_output=True, text=True, timeout=5)
            check(help_result.returncode == 0 and '--activity-dir' in help_result.stdout,
                  'help is side effect free and documents package activity')
    finally:
        for p in processes:
            stop(p)
        for pid in detached:
            try:
                os.kill(pid, signal.SIGTERM)
            except ProcessLookupError:
                pass

print(f'{passed} PASS; 0 FAIL')
