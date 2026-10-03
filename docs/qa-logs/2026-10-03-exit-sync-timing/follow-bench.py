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
    configure(label)
    result=guest('head -c 2000 /dev/urandom > /storage/roms/nes/Bench.srm\ns=$(date +%s%N)\nset +e\n'+command+' > /tmp/m7-bench-last.log 2>&1\nr=$?\ne=$(date +%s%N)\nprintf "M7_SAMPLE=%s,%s\\n" "$(( (e-s)/1000000 ))" "$r"\nexit 0')
    m=re.search(r'M7_SAMPLE=(\d+),(\d+)',result);assert m,result
    row={'layout':label,'measured':measured,'milliseconds':int(m[1]),'rc':int(m[2])}
    assert row['rc']==0,row
    print('SAMPLE '+json.dumps(row),flush=True);return row
warm=[sample(x,False) for x in ['legacy','current']]
j0=int(guest('journalctl -b -t cloud_migrate_layout --no-pager | wc -l'))
rows=[]
for i in range(5):
    for label in (['legacy','current'] if i%2==0 else ['current','legacy']):
        rows.append(sample(label,True));(out/'samples.json').write_text(json.dumps({'warmup':warm,'measured':rows},indent=2)+'\n')
j1=int(guest('journalctl -b -t cloud_migrate_layout --no-pager | wc -l'))
medians={x:statistics.median([r['milliseconds'] for r in rows if r['layout']==x]) for x in ['legacy','current']}
delta=abs(medians['legacy']-medians['current'])
summary={'medians_ms':medians,'absolute_delta_ms':delta,'limit_ms':30,'migration_journal_delta':j1-j0}
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
# Extra diagnostic runs: HTTP request trace is separate from timed samples.
# Raw trace stays inside owned VM; only method/path HTTP lines are retained.
traces={}
for label in ['legacy','current']:
    configure(label)
    guest('rm -f /tmp/m7-http-trace.log\nhead -c 2000 /dev/urandom > /storage/roms/nes/Bench.srm\nRCLONE_DUMP=headers RCLONE_LOG_LEVEL=DEBUG RCLONE_LOG_FILE=/tmp/m7-http-trace.log '+command+' >/tmp/m7-traced-outcome.log 2>&1')
    safe=guest("grep -E '^(GET|PUT|POST|HEAD|PROPFIND|MKCOL|DELETE|MOVE|COPY) [^ ]+ HTTP/[0-9.]+$' /tmp/m7-http-trace.log | tr -d '\\r'",record=False)
    traces[label]=safe.splitlines()
(out/'http-requests.json').write_text(json.dumps(traces,indent=2)+'\n')
check(all(traces.values()),'separate traces capture actual HTTP requests for both layouts')
check(j1==j0,'no migration folder preparation runs during measured exit syncs')
check(delta<=30,'five-sample median difference remains within unchanged 30 ms limit')
guest('rm -f /storage/roms/nes/Bench.srm /tmp/m7-http-trace.log')
print('PASS repeated legacy/current exit-sync benchmark',flush=True)
