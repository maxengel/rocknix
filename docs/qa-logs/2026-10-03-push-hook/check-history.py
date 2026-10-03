#!/usr/bin/env python3
"""#371: exercise the real hook against isolated local Git repositories."""
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

hook = pathlib.Path(sys.argv[1]).resolve()
support = pathlib.Path(sys.argv[2]).resolve()
with tempfile.TemporaryDirectory(prefix='m7-push-history-') as tmp:
    root = pathlib.Path(tmp)
    work = root / 'work'
    remote = root / 'remote.git'
    hooks = root / 'hooks'
    hooks.mkdir()
    shutil.copy2(hook, hooks / 'pre-push')
    for name in ('guard-lib', 'secret-patterns'):
        shutil.copy2(support / name, hooks / name)
    (hooks / 'pre-push').chmod(0o755)
    env = dict(os.environ, FORBIDDEN_PATTERNS='M7_GUARD_FIXTURE_FORBIDDEN',
               GIT_AUTHOR_NAME='QA fixture', GIT_AUTHOR_EMAIL='qa@example.invalid',
               GIT_COMMITTER_NAME='QA fixture', GIT_COMMITTER_EMAIL='qa@example.invalid')
    def run(*args, check=True, data=None):
        return subprocess.run(args, cwd=work if work.exists() else root,
                              env=env, text=True, capture_output=True, input=data, check=check)
    def git(*args, **kw):
        return run('git', *args, **kw)
    def commit(message):
        git('add', '-A')
        git('commit', '-qm', message, '--allow-empty')
        return git('rev-parse', 'HEAD').stdout.strip()
    run('git', 'init', '--bare', '-q', str(remote))
    run('git', 'init', '-q', '-b', 'next', str(work))
    git('remote', 'add', 'origin', str(remote))
    (work / 'readme').write_text('base\n')
    base = commit('base #371')
    git('checkout', '-qb', 'feature/test')
    (work / 'feature').write_text('feature\n')
    commit('feature #371')
    git('push', '-q', 'origin', 'feature/test')
    git('checkout', '-q', 'next')
    secret = 'dev' + 'password=' + 'x' * 32 + '\n'
    (work / 'fixture').write_text(secret)
    commit('historical synthetic fixture #371')
    (work / 'fixture').unlink()
    commit('remove historical fixture #371')
    git('push', '-q', 'origin', 'next')
    git('checkout', '-q', 'feature/test')
    git('merge', '--no-ff', '-qm', 'merge published next #371', 'next')
    clean_tip = git('rev-parse', 'HEAD').stdout.strip()
    git('config', 'core.hooksPath', str(hooks))
    failures = 0
    def push(name, ref, allowed):
        global failures
        result = git('push', 'origin', f'HEAD:refs/heads/{ref}', check=False)
        ok = (result.returncode == 0) == allowed
        failures += not ok
        print(('PASS' if ok else 'FAIL') + f' {name}: exit={result.returncode}, expected=' + ('allow' if allowed else 'refuse'))
        if not ok:
            # The hook redacts its own diagnostics; never print fixture bytes.
            print('\n'.join(line for line in result.stderr.splitlines() if 'pre-push' in line or '[REDACTED]' in line))
    push('published history merged into existing branch', 'feature/test', True)
    git('checkout', '-qB', 'feature/fresh', clean_tip)
    (work / 'fresh').write_text(secret)
    commit('new synthetic fixture #371')
    push('new credential at tip', 'feature/test', False)
    (work / 'fresh').unlink()
    commit('remove new fixture #371')
    push('new credential removed at tip', 'feature/history', False)
    git('update-ref', 'refs/remotes/unrelated/next', 'HEAD')
    push('unrelated remote cannot exempt unpublished origin history', 'feature/unrelated', False)
    git('checkout', '-qB', 'feature/message', clean_tip)
    commit('message #371 ' + secret.strip())
    push('new credential in commit message', 'feature/message', False)
    git('checkout', '-qB', 'feature/clean', clean_tip)
    (work / 'clean').write_text('ordinary change\n')
    commit('ordinary change #371')
    push('clean new branch', 'feature/clean', True)
    tip = git('rev-parse', 'HEAD').stdout.strip()
    result = run(str(hooks / 'pre-push'), 'origin', str(remote), check=False,
                 data=f'refs/heads/feature/clean {tip} refs/heads/feature/clean ' + '1' * 40 + '\n')
    ok = result.returncode != 0
    failures += not ok
    print(('PASS' if ok else 'FAIL') + f' unreadable range: exit={result.returncode}, expected=refuse')
    sys.exit(bool(failures))
