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
# Trace only; the completed timing measurements remain unchanged.
traces={}
for label in ['legacy','current']:
    configure(label)
    wrapper="""
# Bind a run-owned tracing wrapper over the regular ELF only for diagnostic runs.
test ! -L /usr/bin/rclone
if ! mountpoint -q /usr/bin/rclone; then
 cp /usr/bin/rclone /tmp/m7-rclone-real
 cat > /tmp/m7-rclone-tracer <<'TRACE_SCRIPT'
#!/bin/bash
args=(); skip=0
for arg in "$@"; do
 if [ "$skip" = 1 ]; then skip=0; continue; fi
 case "$arg" in --log-file|--log-level|--dump) skip=1;; --log-file=*|--log-level=*|--dump=*) ;; *) args+=("$arg");; esac
done
exec /tmp/m7-rclone-real "${args[@]}" --dump headers --log-level DEBUG --log-file /tmp/m7-http-trace.log
TRACE_SCRIPT
 chmod 755 /tmp/m7-rclone-tracer
 mount --bind /tmp/m7-rclone-tracer /usr/bin/rclone
fi
rm -f /tmp/m7-http-trace.log
head -c 2000 /dev/urandom > /storage/roms/nes/Bench.srm
"""
    guest(wrapper+command+' >/tmp/m7-traced-outcome.log 2>&1')
    script=r"""python3 - <<'READTRACE'
import pathlib,re,json
p=pathlib.Path('/tmp/m7-http-trace.log');s=p.read_text()
# Keep only method/path/version, never request headers.
lines=[]
for line in s.splitlines():
 m=re.search(r'\b(GET|PUT|POST|HEAD|PROPFIND|MKCOL|DELETE|MOVE|COPY)\s+(\S+)\s+HTTP/[0-9.]+',line)
 if m:lines.append(m.group(0))
print(json.dumps({'bytes':len(s),'lines':len(s.splitlines()),'http_mentions':s.count('HTTP'),'requests':lines}))
# Private raw trace stays inside this owned overlay for diagnosis.
d=pathlib.Path('/storage/.cache/m7-http-private');d.mkdir(exist_ok=True)
(d/'trace.log').write_text(s);(d/'outcome.log').write_bytes(pathlib.Path('/tmp/m7-traced-outcome.log').read_bytes())
READTRACE
"""
    info=json.loads(guest(script,record=False));print('TRACE '+label+' '+json.dumps(info),flush=True)
    safe='\n'.join(info['requests'])
    traces[label]=safe.splitlines()
    check(bool(traces[label]),label+' actual HTTP requests retained without headers')
(out/'http-requests.json').write_text(json.dumps(traces,indent=2)+'\n')
print(json.dumps(traces,indent=2),flush=True)
guest('umount /usr/bin/rclone')
# Repeated uninstrumented isolated parent-listing startup cost.
probe=guest('for i in 1 2 3 4 5; do s=$(date +%s%N); rclone lsf --dirs-only qa-cloud:/ROCKNIX >/dev/null; e=$(date +%s%N); echo $(( (e-s)/1000000 )); done')
(out/'parent-listing-ms.txt').write_text(probe+'\n')
print('Parent listing ms: '+probe.replace('\n',', '),flush=True)
guest('rm -f /tmp/m7-http-trace.log /storage/roms/nes/Bench.srm')

for procs in [1,2]:
    ms=guest('for i in 1 2 3 4 5; do s=$(date +%s%N); GOMAXPROCS='+str(procs)+' rclone lsf --dirs-only qa-cloud:/ROCKNIX >/dev/null; e=$(date +%s%N); echo $(( (e-s)/1000000 )); done')
    (out/('parent-listing-gomaxprocs-'+str(procs)+'.txt')).write_text(ms+'\n')
    print('GOMAXPROCS='+str(procs)+' ms: '+ms.replace('\n',', '),flush=True)
