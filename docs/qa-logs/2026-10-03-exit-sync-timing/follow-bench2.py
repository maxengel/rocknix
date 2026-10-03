"""Five alternating exit-sync samples per layout; separate HTTP-call trace."""
from pathlib import Path
common=Path('/workspace/tmp/rasteratops-m7-archives-01/archive-proof.py').read_text()
exec(compile(common.split('bid=guest(')[0],'<retained QA helpers>','exec'))
import statistics
check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='134e89c4fcb08581f1c831229167364828a37e27','exact replacement BUILD_ID')
guest('systemctl stop essway; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0; mkdir -p /storage/roms/nes')
config=subprocess.check_output(['./tools/cloud-test-backend','rclone-conf'],text=True).rstrip()+'\n'
guest('mkdir -p /storage/.config/rclone\numask 077\ncat > /storage/.config/rclone/rclone.conf <<\'M7_QA_CONFIG\'\n'+config+'M7_QA_CONFIG\n',record=False)
subprocess.run(['./tools/cloud-test-backend','reset'],check=True,stdout=subprocess.DEVNULL)
for root in ['ROCKNIX','Rasteratops']:
    for sub in ['Saves/nes','Backups']:(data/root/sub).mkdir(parents=True,exist_ok=True)
    (data/root/'Saves/nes/Fleet.srm').write_bytes(b'owned existing fleet save\n')
command='/usr/bin/cloud_backup --yes --saves-only --recent --automatic'
def configure(label):
    root='/ROCKNIX' if label=='legacy' else '/Rasteratops'
    conf(root+'/Saves',root+'/Backups',root+'/Content')
def sample(label,measured):
    time.sleep(1.15)  # Outside measurement: WebDAV upload-time precision is one second.
    configure(label)
    result=guest('head -c 2000 /dev/urandom > /storage/roms/nes/Bench.srm\ns=$(date +%s%N)\nset +e\n'+command+' > /tmp/m7-bench-last.log 2>&1\nr=$?\ne=$(date +%s%N)\nprintf "M7_SAMPLE=%s,%s\\n" "$(( (e-s)/1000000 ))" "$r"\nexit 0')
    m=re.search(r'M7_SAMPLE=(\d+),(\d+)',result);assert m,result
    row={'layout':label,'measured':measured,'milliseconds':int(m[1]),'rc':int(m[2])}
    assert row['rc']==0,row
    remote=data/('ROCKNIX' if label=='legacy' else 'Rasteratops')/'Saves/nes/Bench.srm'
    row['sentinel_sha256']=sha('/storage/roms/nes/Bench.srm')
    assert hashlib.sha256(remote.read_bytes()).hexdigest()==row['sentinel_sha256'], 'sync did not transfer changed bytes'
    row['cloud_bytes_match']=True
    print('SAMPLE '+json.dumps(row),flush=True);return row

all_results={}
source=Path('/workspace/repos/rocknix.worktrees/conflict-resolution/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup')
source_bytes=source.read_bytes()
for version in ['before','directory-slash']:
    if version=='directory-slash':
        subprocess.run(ssh+['cat > /tmp/m7-cloud_backup'],input=source_bytes,check=True)
        guest('chmod 755 /tmp/m7-cloud_backup; test ! -L /usr/bin/cloud_backup; mount --bind /tmp/m7-cloud_backup /usr/bin/cloud_backup')
        check(sha('/usr/bin/cloud_backup')==hashlib.sha256(source_bytes).hexdigest(),'mounted diagnostic source exactly matches reviewed file')
    # Independently reset both cloud roots and the successful-backup timestamp.
    subprocess.run(['./tools/cloud-test-backend','reset'],check=True,stdout=subprocess.DEVNULL)
    for root in ['ROCKNIX','Rasteratops']:
        for sub in ['Saves/nes','Backups']:(data/root/sub).mkdir(parents=True,exist_ok=True)
        (data/root/'Saves/nes/Fleet.srm').write_bytes(b'owned existing fleet save\n')
    guest('rm -f /storage/.cache/cloud_sync/last-backup /storage/roms/nes/Bench.srm')
    warm=[sample(x,False) for x in ['legacy','current']]
    j0=int(guest('journalctl -b -t cloud_migrate_layout --no-pager | wc -l'))
    rows=[]
    for i in range(5):
        for label in (['legacy','current'] if i%2==0 else ['current','legacy']):
            rows.append(sample(label,True))
            (out/(version+'-samples.json')).write_text(json.dumps({'warmup':warm,'measured':rows},indent=2)+'\n')
    j1=int(guest('journalctl -b -t cloud_migrate_layout --no-pager | wc -l'))
    medians={x:statistics.median([r['milliseconds'] for r in rows if r['layout']==x]) for x in ['legacy','current']}
    delta=abs(medians['legacy']-medians['current'])
    summary={'medians_ms':medians,'absolute_delta_ms':delta,'limit_ms':30,'migration_journal_delta':j1-j0,'source_sha256':sha('/usr/bin/cloud_backup')}
    all_results[version]=summary
    (out/'comparison.json').write_text(json.dumps(all_results,indent=2)+'\n')
    print('RESULT '+version+' '+json.dumps(summary),flush=True)
    check(j1==j0,version+' no migration folder preparation during measured syncs')
check(all_results['directory-slash']['absolute_delta_ms']<=30,'directory slash keeps five-sample median difference within unchanged 30 ms limit')
guest('umount /usr/bin/cloud_backup; rm -f /storage/roms/nes/Bench.srm')
print('PASS exact-byte repeated exit-sync diagnostic source comparison; rebuilt-image proof still required',flush=True)
