#!/usr/bin/env python3
"""Exercise the production #367 check on constructed Git histories."""
import os
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile

check = runpy.run_path(sys.argv[1])['issue_coverage']
with tempfile.TemporaryDirectory(prefix='m7-issue-coverage-') as temporary:
    root = Path(temporary)
    def git(*args, data=None, epoch=1800000000):
        env = dict(os.environ, GIT_AUTHOR_NAME='QA', GIT_AUTHOR_EMAIL='qa@example.invalid',
                   GIT_COMMITTER_NAME='QA', GIT_COMMITTER_EMAIL='qa@example.invalid',
                   GIT_AUTHOR_DATE=f'@{epoch} +0000', GIT_COMMITTER_DATE=f'@{epoch} +0000')
        return subprocess.run(['git', *args], cwd=root, env=env, input=data,
                              text=True, capture_output=True, check=True).stdout.strip()
    git('init', '-q')
    tree = git('mktree', data='')
    def commit(message, parents=(), epoch=1800000000):
        args = ['commit-tree', tree]
        for p in parents:
            args.extend(['-p', p])
        return git(*args, data=message+'\n', epoch=epoch)
    upstream = commit('upstream baseline', epoch=1799999900)
    baseline = commit('adopt policy #367', [upstream])
    check.__globals__['ROOT'] = str(root)
    def verify(label, head, expected, base=baseline, up=upstream, contains=None):
        git('update-ref', 'refs/heads/next', head)
        ok, message = check(ref='next', baseline=base, upstream=up)
        assert ok == expected, (label, ok, message)
        if contains:
            assert contains in message, (label, message)
        print(f'PASS {label}: {"ok" if ok else "FAIL"} issues: {message}')
    cited = commit('change\n\nTracked in #367.', [baseline], epoch=1800000100)
    missing = commit('change without an issue', [baseline], epoch=1800000100)
    verify('body citation accepted', cited, True, contains='1 post-adoption')
    verify('uncited new commit refused', missing, False, contains=missing[:12])
    verify('zero is not an issue', commit('change #0', [baseline], epoch=1800000100), False)
    inherited = commit('old feature work', [upstream], epoch=1799999999)
    verify('older inherited history grandfathered', commit('merge #367', [cited,inherited], epoch=1800000200), True, contains='2 post-adoption')
    verify('merge message checked', commit('uncited merge', [cited,inherited], epoch=1800000200), False)
    newer_upstream = commit('upstream change without a fork issue', [upstream], epoch=1800000100)
    verify('upstream commits excluded', commit('merge upstream #367', [cited,newer_upstream], epoch=1800000200), True, up=newer_upstream, contains='2 post-adoption')
    verify('missing baseline fails closed', cited, False, base='missing-baseline')
    verify('missing upstream fails closed', cited, False, up='missing-upstream')
    unrelated = commit('unrelated root #367', epoch=1800000100)
    verify('unrelated baseline fails closed', cited, False, base=unrelated)
print('9 controls PASS')
