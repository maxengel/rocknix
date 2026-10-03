"""Owned guest-d archive/layout proof; run after replacement upgrade QA ends."""
import argparse,hashlib,json,os,pathlib,re,shlex,subprocess,time

p=argparse.ArgumentParser();p.add_argument('--key',required=True);p.add_argument('--port',type=int,default=10026);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--inherited',action='store_true');a=p.parse_args()
out=a.output;out.mkdir(parents=True,exist_ok=True)
data=pathlib.Path(os.environ['CLOUD_QA_STATE'])/'data'
assert str(data).startswith('/workspace/tmp/rasteratops-m7-') and data.is_dir() and not data.is_symlink()
assert os.environ.get('CLOUD_QA_BACKEND')=='webdav'
ssh=['ssh','-i',a.key,'-p',str(a.port),'-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=no','-o','UserKnownHostsFile=/dev/null','-o','LogLevel=ERROR','root@127.0.0.1']
seq=0;checks=[]
def guest(script,allowed=(0,),record=True):
    global seq
    r=subprocess.run(ssh+['bash -s'],input='. /etc/profile >/dev/null 2>&1\nset -e\n'+script,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=180)
    seq+=1
    if record:(out/f'{seq:03d}.log').write_text(r.stdout)
    if r.returncode not in allowed:raise AssertionError(f'guest step{seq} rc{r.returncode}: {r.stdout[-500:]}')
    return r.stdout.strip()
def check(ok,label):
    checks.append({'assertion':label,'passed':bool(ok)})
    print(('PASS ' if ok else 'FAIL ')+label,flush=True)
    (out/'assertions.json').write_text(json.dumps(checks,indent=2)+'\n')
    assert ok,label
def q(v):return shlex.quote(str(v))
def sha(remote):return guest('sha256sum '+q(remote)).split()[0]
def conf(saves='/Rasteratops/Saves',backups='/Rasteratops/Backups',content='/Rasteratops/Content'):
    values={'SAVES_REMOTE':saves,'SETTINGS_REMOTE':backups,'CONTENT_REMOTE':content,'LAYOUT_KEEP':'','SETTINGS_BACKUPS':'/storage/roms/backup'}
    code="""import pathlib,re,json
p=pathlib.Path('/storage/.config/cloud_sync.conf')
s=pathlib.Path('/usr/config/cloud_sync.conf').read_text()
for k,v in json.loads(VALUES).items():
 s=re.sub(r'^'+k+r'=.*$',k+'='+json.dumps(v),s,flags=re.M) if re.search(r'^'+k+r'=',s,re.M) else s+'\\n'+k+'='+json.dumps(v)+'\\n'
p.write_text(s)
""".replace('VALUES',repr(json.dumps(values)))
    guest('python3 - <<\'PY\'\n'+code+'\nPY\ncloud_sync_helper >/dev/null 2>&1')
def facts():
    guest('cloud_scan')
    s=guest('cat /storage/.cache/cloud_sync/scan/settings')
    return dict(x.split('=',1) for x in s.splitlines() if '=' in x)
def pointers():
    s=guest("grep -E '^(SAVES_REMOTE|SETTINGS_REMOTE|CONTENT_REMOTE|LAYOUT_KEEP)=' /storage/.config/cloud_sync.conf")
    return {k:v.strip('\"') for k,v in (x.split('=',1) for x in s.splitlines())}
def restore_sentinel(expected):
    guest("mkdir -p /storage/roms/backup/m7-preserved\nfind /storage/roms/backup -maxdepth 1 -type f -name '*_SETTINGS.tar.gz' -exec mv '{}' /storage/roms/backup/m7-preserved/ ';'\nprintf 'changed locally\\n' > /storage/.config/m7-archive-sentinel\ncloud_restore --yes --system-only\nbackuptool restore --no-restart")
    got=guest('cat /storage/.config/m7-archive-sentinel')
    check(got==expected,'production cloud/local restore recovers sentinel '+expected)

bid=guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')
check(bid=='134e89c4fcb08581f1c831229167364828a37e27','exact replacement BUILD_ID')
guest('systemctl stop essway; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0; set_setting global.retroachievements 0')
if a.inherited:
    before=guest("find /storage/roms/backup -maxdepth 1 -type f -name '*ROCKNIX_SETTINGS.tar.gz' -exec sha256sum '{}' ';'")
    check(bool(before),'actual RC2 settings archive survived update')
    guest('set_setting rehearsal.marker changed-after-upgrade\nbackuptool restore --no-restart')
    check(guest('get_setting rehearsal.marker')=='134e89c4fc','local recovery restores actual RC2 archive setting')
    check(guest("find /storage/roms/backup -maxdepth 1 -type f -name '*ROCKNIX_SETTINGS.tar.gz' -exec sha256sum '{}' ';'")==before,'local recovery retains inherited archive bytes')

# Backend tool supplies only the owned synthetic endpoint's configuration.
config=subprocess.check_output(['./tools/cloud-test-backend','rclone-conf'],text=True).rstrip()+'\n'
guest('mkdir -p /storage/.config/rclone\numask 077\ncat > /storage/.config/rclone/rclone.conf <<\'M7_QA_CONFIG\'\n'+config+'M7_QA_CONFIG\n',record=False)
conf()
device=guest('cloud_device_id');label=guest('cloud_device_id --label')
check(bool(re.fullmatch(r'[A-Za-z0-9_-]+',device)) and bool(re.fullmatch(r'[A-Za-z0-9_-]+',label)),'safe actual device id/label read')
(out/'identity.json').write_text(json.dumps({'build_id':bid,'device':device,'label':label},indent=2)+'\n')
if a.inherited:
    guest('cloud_backup --yes --system-only')
    f=facts();check(bool(f.get('MINE','').endswith('-ROCKNIX_SETTINGS.tar.gz')),'scan selects uploaded inherited RC2 archive')
    name=f['MINE'];h=sha('/storage/roms/backup/'+name)
    guest('mkdir -p /storage/roms/backup/m7-preserved\nmv '+q('/storage/roms/backup/'+name)+' /storage/roms/backup/m7-preserved/\nset_setting rehearsal.marker changed-before-cloud-restore\ncloud_restore --yes --system-only\nbackuptool restore --no-restart')
    check(guest('get_setting rehearsal.marker')=='134e89c4fc','cloud recovery restores actual RC2 archive setting')
    check(sha('/storage/roms/backup/'+name)==h,'cloud restore returns inherited archive byte-identically')

# Create the writer-shaped fixture with the real local and cloud writers.
guest("mkdir -p /storage/roms/backup/m7-preserved\nfind /storage/roms/backup -maxdepth 1 -type f -name '*_SETTINGS.tar.gz' -exec mv '{}' /storage/roms/backup/m7-preserved/ ';'\nprintf 'LOCATIONS=( /storage/.config/m7-archive-sentinel )\\n' > /storage/.config/backuptool.conf\nprintf 'writer-proof\\n' > /storage/.config/m7-archive-sentinel\nbackuptool backup\ncloud_backup --yes --system-only")
f=facts();name=f['MINE'];check(name.endswith('-ROCKNIX_SETTINGS.tar.gz'),'production writer retains compatible ROCKNIX suffix')
source=data/f['SOURCE'].split(':',1)[1].lstrip('/')/name
check(source.is_file() and source.parent.name==device,'scan selects actual per-device writer archive')
original=source.read_bytes();digest=hashlib.sha256(original).hexdigest()
check(sha('/storage/roms/backup/'+name)==digest,'writer, scan and local archive bytes agree')
restore_sentinel('writer-proof')
(out/'writer-selection.json').write_text(json.dumps({'facts':f,'sha256':digest},indent=2)+'\n')

# Independently reset settings-only old layouts: actual writer bytes, no saves.
for root,backups in [('/ROCKNIX','/ROCKNIX/Backups'),('/GAMES','/GAMES/backup')]:
    for mode in ['--follow','--settle']:
        subprocess.run(['./tools/cloud-test-backend','reset'],check=True,stdout=subprocess.DEVNULL)
        (data/'Rasteratops/Saves').mkdir(parents=True,exist_ok=True)
        old=data/backups.lstrip('/')/device/name;old.parent.mkdir(parents=True,exist_ok=True);old.write_bytes(original)
        conf('/GAMES' if root=='/GAMES' else root+'/Saves',backups,root+'/Content')
        guest('cloud_migrate_layout '+mode,allowed=(0,3))
        chosen=pointers()['SETTINGS_REMOTE'];selected=facts()
        check(chosen==backups and selected.get('MINE')==name,root+' '+mode+' keeps settings-only archive discoverable')
        check(hashlib.sha256(old.read_bytes()).hexdigest()==digest,root+' '+mode+' keeps original cloud bytes')
        restore_sentinel('writer-proof')

print('PASS inherited/writer/settings-only archive guest proofs',flush=True)
