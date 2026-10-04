"""Five alternating exit-sync samples per layout; separate HTTP-call trace."""
from pathlib import Path
common=Path(__file__).with_name('archive-proof.py').read_text()
exec(compile(common.split('bid=guest(')[0],'<retained QA helpers>','exec'))
import statistics
check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='b137d8c37323abbf07788af8bf8dbd495a31e9c9','exact pixelelated BUILD_ID')
guest('systemctl stop essway; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0; mkdir -p /storage/roms/nes')
config=subprocess.check_output(['./tools/cloud-test-backend','rclone-conf'],text=True).rstrip()+'\n'
guest('mkdir -p /storage/.config/rclone\numask 077\ncat > /storage/.config/rclone/rclone.conf <<\'M7_QA_CONFIG\'\n'+config+'M7_QA_CONFIG\n',record=False)
subprocess.run(['./tools/cloud-test-backend','reset'],check=True,stdout=subprocess.DEVNULL)
for root in ['ROCKNIX','pixelelated']:
    for sub in ['Saves/nes','Backups']:(data/root/sub).mkdir(parents=True,exist_ok=True)
    (data/root/'Saves/nes/Fleet.srm').write_bytes(b'owned existing fleet save\n')
command='/usr/bin/cloud_backup --yes --saves-only --recent --automatic'
def configure(label):
    root='/ROCKNIX' if label=='legacy' else '/pixelelated'
    conf(root+'/Saves',root+'/Backups',root+'/Content')
def sample(label,measured):
    time.sleep(1.15)  # Outside measurement: WebDAV upload-time precision is one second.
    configure(label)
    result=guest('head -c 2000 /dev/urandom > /storage/roms/nes/Bench.srm\ns=$(date +%s%N)\nset +e\n'+command+' > /tmp/m7-bench-last.log 2>&1\nr=$?\ne=$(date +%s%N)\nprintf "M7_SAMPLE=%s,%s\\n" "$(( (e-s)/1000000 ))" "$r"\nexit 0')
    m=re.search(r'M7_SAMPLE=(\d+),(\d+)',result);assert m,result
    row={'layout':label,'measured':measured,'milliseconds':int(m[1]),'rc':int(m[2])}
    assert row['rc']==0,row
    remote=data/('ROCKNIX' if label=='legacy' else 'pixelelated')/'Saves/nes/Bench.srm'
    row['sentinel_sha256']=sha('/storage/roms/nes/Bench.srm')
    assert hashlib.sha256(remote.read_bytes()).hexdigest()==row['sentinel_sha256'], 'sync did not transfer changed bytes'
    row['cloud_bytes_match']=True
    print('SAMPLE '+json.dumps(row),flush=True);return row


source=Path('/workspace/repos/rocknix.worktrees/m7-pixelelated/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup')
check(sha('/usr/bin/cloud_backup')==hashlib.sha256(source.read_bytes()).hexdigest(),'installed cloud_backup matches frozen reviewed source without override')
guest('rm -f /storage/.cache/cloud_sync/last-backup /storage/roms/nes/Bench.srm')
warm=[sample(x,False) for x in ['legacy','current']]
j0=int(guest('journalctl -b -t cloud_migrate_layout --no-pager | wc -l'))
rows=[]
for i in range(5):
 for label in (['legacy','current'] if i%2==0 else ['current','legacy']):
  rows.append(sample(label,True))
  (out/'installed-samples.json').write_text(json.dumps({'warmup':warm,'measured':rows},indent=2)+'\n')
j1=int(guest('journalctl -b -t cloud_migrate_layout --no-pager | wc -l'))
medians={x:statistics.median([r['milliseconds'] for r in rows if r['layout']==x]) for x in ['legacy','current']}
delta=abs(medians['legacy']-medians['current'])
summary={'medians_ms':medians,'absolute_delta_ms':delta,'limit_ms':30,'migration_journal_delta':j1-j0,'source_sha256':sha('/usr/bin/cloud_backup')}
(out/'comparison.json').write_text(json.dumps(summary,indent=2)+'\n')
print('RESULT '+json.dumps(summary),flush=True)
check(j1==j0,'no migration preparation during measured syncs')
check(delta<=30,'installed legacy/current five-sample median difference within unchanged30ms limit')
print('PASS installed exact-byte alternating exit-sync timing',flush=True)
