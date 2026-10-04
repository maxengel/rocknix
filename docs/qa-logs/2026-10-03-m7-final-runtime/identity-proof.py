from pathlib import Path
common=Path('/workspace/tmp/rasteratops-m7-archives-01/archive-proof.py').read_text()
exec(compile(common.split('bid=guest(')[0],'<retained QA helpers>','exec'))
check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='61b64817bf8ab48237e51abb395484e36cbf924b','exact upgraded replacement02 BUILD_ID')
check(guest("sed -n 's/^OS_NAME=//p' /etc/os-release").strip('"')=='RASTERATOPS','installed OS_NAME is RASTERATOPS')
timers=guest('systemctl list-timers --all --no-pager')
(out/'timers.txt').write_text(timers+'\n')
check('rocknix-report-stats' not in timers,'booted guest has no statistics timer')
mask=guest('systemctl is-enabled rocknix-report-stats.timer || true')
check(mask=='masked','statistics timer remains masked on upgraded guest')
check(guest("grep -ic 'rocknix.org' /usr/bin/rocknix-report-stats || true")=='0','shipped statistics shim contains no upstream endpoint')
for name in ['rocknix-report-stats','rocknix-update']:
 src=Path('/workspace/repos/rocknix.worktrees/m7-generic-x64/projects/ROCKNIX/packages/rocknix/sources/scripts')/name
 check(sha('/usr/bin/'+name)==hashlib.sha256(src.read_bytes()).hexdigest(),'installed '+name+' exactly matches reviewed inert entry point')
query=guest('''set +e
/usr/bin/rocknix-update check > /tmp/m7-update-query.log 2>&1
r=$?
printf 'QUERY_RC=%s\n' "$r"
wc -c < /tmp/m7-update-query.log
exit 0''')
check(query=='QUERY_RC=1\n0','legacy update query declines silently')
helptext=guest('/usr/bin/rocknix-update --help')
check('manual updates' in helptext and 'github.com/rasteratops/distribution/releases' in helptext,'manual update help points to Rasteratops releases')
for name in ['LICENSE.md','TRADEMARK.md']:
 local=Path('/workspace/repos/rocknix.worktrees/m7-generic-x64')/name
 check(sha('/usr/share/licenses/rasteratops/'+name)==hashlib.sha256(local.read_bytes()).hexdigest(),'installed '+name+' matches approved terms')
print('PASS installed OS identity, retired reporting/update entry points and policy bytes',flush=True)
