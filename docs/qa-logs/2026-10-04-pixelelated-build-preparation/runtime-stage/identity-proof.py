from pathlib import Path
common=Path(__file__).with_name('archive-proof.py').read_text()
exec(compile(common.split('bid=guest(')[0],'<retained QA helpers>','exec'))
check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='b137d8c37323abbf07788af8bf8dbd495a31e9c9','exact upgraded pixelelated BUILD_ID')
check(guest("sed -n 's/^OS_NAME=//p' /etc/os-release").strip('"')=='pixelelated','installed OS_NAME is pixelelated')
timers=guest('systemctl list-timers --all --no-pager')
(out/'timers.txt').write_text(timers+'\n')
check('rocknix-report-stats' not in timers,'booted guest has no statistics timer')
mask=guest('systemctl is-enabled rocknix-report-stats.timer || true')
check(mask=='masked','statistics timer remains masked on upgraded guest')
check(guest("grep -ic 'rocknix.org' /usr/bin/rocknix-report-stats || true")=='0','shipped statistics shim contains no upstream endpoint')
for name in ['rocknix-report-stats','rocknix-update']:
 src=Path('/workspace/repos/rocknix.worktrees/m7-pixelelated/projects/ROCKNIX/packages/rocknix/sources/scripts')/name
 check(sha('/usr/bin/'+name)==hashlib.sha256(src.read_bytes()).hexdigest(),'installed '+name+' exactly matches reviewed inert entry point')
query=guest('''set +e
/usr/bin/rocknix-update check > /tmp/m7-update-query.log 2>&1
r=$?
printf 'QUERY_RC=%s\n' "$r"
wc -c < /tmp/m7-update-query.log
exit 0''')
check(query=='QUERY_RC=1\n0','legacy update query declines silently')
helptext=guest('/usr/bin/rocknix-update --help')
check('manual updates' in helptext and 'github.com/pixelelated/distribution/releases' in helptext,'manual update help points to pixelelated releases')
for name in ['LICENSE.md','TRADEMARK.md']:
 local=Path('/workspace/repos/rocknix.worktrees/m7-pixelelated')/name
 check(sha('/usr/share/licenses/pixelelated/'+name)==hashlib.sha256(local.read_bytes()).hexdigest(),'installed '+name+' matches approved terms')
print('PASS installed OS identity, retired reporting/update entry points and policy bytes',flush=True)
