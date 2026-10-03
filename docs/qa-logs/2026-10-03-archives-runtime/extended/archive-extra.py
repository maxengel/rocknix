"""Extend the actual replacement archive proof with independently reset cases."""
from pathlib import Path
common=Path('/workspace/tmp/rasteratops-m7-archives-01/archive-proof.py').read_text()
assert common.count('bid=guest(')==1
exec(compile(common.split('bid=guest(')[0],'<retained archive proof helpers>','exec'))
check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='134e89c4fcb08581f1c831229167364828a37e27','exact replacement BUILD_ID')
guest('systemctl stop essway; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0; set_setting global.retroachievements 0')
config=subprocess.check_output(['./tools/cloud-test-backend','rclone-conf'],text=True).rstrip()+'\n'
guest('mkdir -p /storage/.config/rclone\numask 077\ncat > /storage/.config/rclone/rclone.conf <<\'M7_QA_CONFIG\'\n'+config+'M7_QA_CONFIG\n',record=False)
conf();device=guest('cloud_device_id');legacy=guest('cloud_device_id --legacy');label=guest('cloud_device_id --label')
poisoned='M7-Previous-ee5013fc56'
guest("printf '%s\\n' "+q(poisoned)+' > /storage/.config/cloud_sync-device-id')
check(guest('cloud_device_id')==device,'actual identity helper heals poisoned stored id')
check(poisoned in guest('cloud_device_id --previous').splitlines(),'healed previous id retained by actual helper')
def reset():
    subprocess.run(['./tools/cloud-test-backend','reset'],check=True,stdout=subprocess.DEVNULL)
    (data/'Rasteratops/Saves/nes').mkdir(parents=True,exist_ok=True)
    (data/'Rasteratops/Saves/nes/Fixture.srm').write_bytes(b'owned cloud saves fixture\n')
    conf()
def create(tag):
    guest("printf 'LOCATIONS=( /storage/.config/m7-archive-sentinel )\\n' > /storage/.config/backuptool.conf\nprintf '%s\\n' "+q(tag)+' > /storage/.config/m7-archive-sentinel\nbackuptool backup')
    names=guest("find /storage/roms/backup -maxdepth 1 -type f -name '*_SETTINGS.tar.gz' | sort")
    newest=names.splitlines()[-1]
    return subprocess.check_output(ssh+['cat '+q(newest)],timeout=30)
payloads={tag:create(tag) for tag in ['own-old','own-new','foreign']}
names={'own-old':f'2026_10_03-120100-{label}-ROCKNIX_SETTINGS.tar.gz','own-new':f'2026_10_03-120200-{label}-RASTERATOPS_SETTINGS.tar.gz','foreign':'2026_10_04-120300-FOREIGN-HANDHELD-ROCKNIX_SETTINGS.tar.gz'}
def put(directory,tag):
    p=data/'Rasteratops/Backups'/directory/names[tag];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(payloads[tag]);return p
selections=[]
for case,directory,tag in [('current',device,'own-new'),('legacy-directory',legacy,'own-old'),('healed-directory',poisoned,'own-old'),('flat-root','','own-old'),('foreign-only',device,'foreign')]:
    reset();path=put(directory,tag)
    if case=='current':
        put(device,'own-old');put(device,'foreign');put(legacy,'own-old');put(poisoned,'own-old');put('','own-old')
    f=facts();expected_source='qa-cloud:/Rasteratops/Backups'+('/'+directory if directory else '')
    check(f['SOURCE']==expected_source,case+' source directory priority')
    selected=f['MINE'] or f['NEWEST']
    check(selected==names[tag],case+' selects expected archive name')
    check((f['MINE']=='')==(tag=='foreign'),case+' same-device versus foreign distinction')
    restore_sentinel(tag)
    digest=hashlib.sha256(payloads[tag]).hexdigest()
    check(sha('/storage/roms/backup/'+selected)==digest,case+' restores selected archive bytes')
    check(path.read_bytes()==payloads[tag],case+' leaves cloud archive unchanged')
    selections.append({'case':case,'facts':f,'sha256':digest,'sentinel':tag})
(out/'selection-matrix.json').write_text(json.dumps(selections,indent=2)+'\n')

# Setup must preserve settings-only old layouts too; scan is the UI's reader.
for root,backups in [('/ROCKNIX','/ROCKNIX/Backups'),('/GAMES','/GAMES/backup')]:
    subprocess.run(['./tools/cloud-test-backend','reset'],check=True,stdout=subprocess.DEVNULL)
    p=data/backups.lstrip('/')/device/names['own-old'];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(payloads['own-old'])
    conf('/GAMES' if root=='/GAMES' else root+'/Saves',backups,root+'/Content')
    guest('cloud_setup --seed-folders')
    f=facts()
    check(pointers()['SETTINGS_REMOTE']==backups and f['MINE']==names['own-old'],root+' setup and transfer scan retain settings-only archive')
    restore_sentinel('own-old')

# Explicit empty CONTENT_REMOTE is a chosen cloud root, independently of saves.
content_cases=[]
for mode in ['--join','--follow','--settle','--apply']:
    reset()
    for sub,filename,value in [('ROMs/nes','M7-root.nes',b'root ROM sentinel\n'),('BIOS','M7-root.bin',b'root BIOS sentinel\n')]:
        p=data/sub/filename;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(value)
    old=data/'ROCKNIX/Saves/nes/Old.srm';old.parent.mkdir(parents=True,exist_ok=True);old.write_bytes(b'old saves\n')
    if mode=='--join':
        shutil=__import__('shutil');shutil.rmtree(data/'Rasteratops/Saves')
        conf('/Rasteratops/Saves','/Rasteratops/Backups','')
    else:
        conf('/ROCKNIX/Saves','/ROCKNIX/Backups','')
        if mode=='--apply':
            __import__('shutil').rmtree(data/'Rasteratops/Saves')
    before=pointers();guest('cloud_migrate_layout '+mode,allowed=(0,3));after=pointers()
    check(after['CONTENT_REMOTE']=='',mode+' preserves explicit cloud-root selection')
    scan=guest('cloud_content_restore --scan')
    check(any(x.startswith('nes|') for x in scan.splitlines()) and any(x.startswith('bios|') for x in scan.splitlines()),mode+' scan finds root ROMs and BIOS')
    guest('rm -f /storage/roms/nes/M7-root.nes /storage/roms/bios/M7-root.bin\ncloud_content_restore nes bios')
    for remote,want in [('/storage/roms/nes/M7-root.nes',b'root ROM sentinel\n'),('/storage/roms/bios/M7-root.bin',b'root BIOS sentinel\n')]:
        check(sha(remote)==hashlib.sha256(want).hexdigest(),mode+' restores root sentinel '+remote)
    content_cases.append({'mode':mode,'before':before,'after':after,'scan':scan})
reset();guest("sed -i '/^CONTENT_REMOTE=/d' /storage/.config/cloud_sync.conf\ncloud_sync_helper >/dev/null 2>&1")
check(pointers()['CONTENT_REMOTE']=='/Rasteratops/Content','missing content key gains current default')
(out/'content-root-cases.json').write_text(json.dumps(content_cases,indent=2)+'\n')

# The final frame must be writer-shaped, not a manually populated flat folder.
reset();guest("printf 'ui-writer\\n' > /storage/.config/m7-archive-sentinel\nbackuptool backup\ncloud_backup --yes --system-only")
f=facts();check(bool(f['MINE']) and f['SOURCE'].endswith('/'+device),'final UI fixture comes from production writer')
rom=pathlib.Path('/workspace/artifacts/rocknix-qa-roms/ninoid/Ninoid.gb').read_bytes()
subprocess.run(ssh+['mkdir -p /storage/roms/gb; cat > /storage/roms/gb/Ninoid.gb'],input=rom,check=True)
guest('set_setting system.language en_US; systemctl start essway')
for i in range(90):
    r=subprocess.run(ssh+['curl -sS -m 3 http://127.0.0.1:1234/isIdle'],text=True,capture_output=True)
    if r.returncode==0 and r.stdout.strip() and json.loads(r.stdout)==[True]:break
    time.sleep(1)
else:raise RuntimeError('archive UI did not become idle')
v=['./tools/vm-visual-qa','--monitor','/tmp/rocknix-qemu-monitor.sock']
subprocess.run(v+['dismiss'],check=True)
subprocess.run(v+['run','tools/vm-walks/to-manage-cloud-storage.steps','--outdir',str(out/'hub')],check=True)
subprocess.run(v+['run','tools/vm-walks/restore-page.steps','--outdir',str(out/'restore-page')],check=True)
(out/'ui-writer-selection.json').write_text(json.dumps(f,indent=2)+'\n')
guest('systemctl stop essway');restore_sentinel('ui-writer')
print('PASS archive selection, settings-only setup, explicit-root transitions and writer UI capture; visual review required',flush=True)
