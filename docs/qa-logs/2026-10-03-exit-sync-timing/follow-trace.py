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
rclone() {
 local task_arg task_skip=0
 local -a task_args=()
 for task_arg in "$@"; do
  if [ "$task_skip" = 1 ]; then task_skip=0; continue; fi
  case "$task_arg" in --log-file|--log-level|--dump) task_skip=1;; --log-file=*|--log-level=*|--dump=*) ;; *) task_args+=("$task_arg");; esac
 done
 command rclone "${task_args[@]}" --dump headers --log-level DEBUG --log-file /tmp/m7-http-trace.log
}
export -f rclone
rm -f /tmp/m7-http-trace.log
head -c 2000 /dev/urandom > /storage/roms/nes/Bench.srm
"""
    guest(wrapper+command+' >/tmp/m7-traced-outcome.log 2>&1')
    safe=guest("tr -d '\\r' < /tmp/m7-http-trace.log | grep -E '^(GET|PUT|POST|HEAD|PROPFIND|MKCOL|DELETE|MOVE|COPY) [^ ]+ HTTP/[0-9.]+'",record=False)
    traces[label]=safe.splitlines()
    check(bool(traces[label]),label+' actual HTTP requests retained without headers')
(out/'http-requests.json').write_text(json.dumps(traces,indent=2)+'\n')
print(json.dumps(traces,indent=2),flush=True)
# Repeated uninstrumented isolated parent-listing startup cost.
probe=guest('for i in 1 2 3 4 5; do s=$(date +%s%N); rclone lsf --dirs-only qa-cloud:/ROCKNIX >/dev/null; e=$(date +%s%N); echo $(( (e-s)/1000000 )); done')
(out/'parent-listing-ms.txt').write_text(probe+'\n')
print('Parent listing ms: '+probe.replace('\n',', '),flush=True)
guest('rm -f /tmp/m7-http-trace.log /storage/roms/nes/Bench.srm')
