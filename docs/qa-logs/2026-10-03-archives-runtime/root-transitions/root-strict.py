from pathlib import Path
common=Path('/workspace/tmp/rasteratops-m7-archives-01/archive-proof.py').read_text()
exec(compile(common.split('bid=guest(')[0],'<retained archive proof helpers>','exec'))
import shutil
check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='134e89c4fcb08581f1c831229167364828a37e27','exact replacement BUILD_ID')
guest('systemctl stop essway; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0; set_setting global.retroachievements 0')

# Retained production-writer archive: navigate and toggle SETTINGS, proving
# that its visible switch is operable, not merely a filename on a screenshot.
f=facts();check(bool(f['MINE']),'retained production writer archive still selected')
guest('set_setting system.language en_US; systemctl start essway')
for i in range(90):
    r=subprocess.run(ssh+['curl -sS -m 3 http://127.0.0.1:1234/isIdle'],text=True,capture_output=True)
    if r.returncode==0 and r.stdout.strip() and json.loads(r.stdout)==[True]:break
    time.sleep(1)
else:raise RuntimeError('UI did not become idle')
v=['./tools/vm-visual-qa','--monitor','/tmp/rocknix-qemu-monitor.sock']
subprocess.run(v+['dismiss'],check=True)
subprocess.run(v+['run','tools/vm-walks/to-manage-cloud-storage.steps','--outdir',str(out/'hub')],check=True)
subprocess.run(v+['run','tools/vm-walks/restore-page.steps','--outdir',str(out/'restore')],check=True)
steps='key down\nwait-for-change\nkey down\nwait-for-change\nkey down\nwait-for-change\nsettle\nshot settings-focused\nkey right\nwait-for-change\nsettle\nshot settings-selected\n'
subprocess.run(v+['run','-','--outdir',str(out/'settings-selected')],input=steps,text=True,check=True)
(out/'ui-selection.json').write_text(json.dumps(f,indent=2)+'\n')
guest('systemctl stop essway')

results=[]
for mode in ['--join','--follow','--settle','--apply']:
    subprocess.run(['./tools/cloud-test-backend','reset'],check=True,stdout=subprocess.DEVNULL)
    for directory,name,content in [('ROMs/nes','M7-root.nes',b'root ROM sentinel\n'),('BIOS','M7-root.bin',b'root BIOS sentinel\n')]:
        p=data/directory/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(content)
    if mode in ['--join','--apply']:
        p=data/'ROCKNIX/Saves/nes/Old.srm';p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b'old save sentinel\n')
    else:
        p=data/'Rasteratops/Saves/nes/Current.srm';p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b'current save sentinel\n')
    start='/Rasteratops/Saves' if mode=='--join' else '/ROCKNIX/Saves'
    want='/ROCKNIX/Saves' if mode=='--join' else '/Rasteratops/Saves'
    conf(start,start.rsplit('/',1)[0]+'/Backups','')
    before=pointers();output=guest('cloud_migrate_layout '+mode);after=pointers()
    check(before['SAVES_REMOTE']!=after['SAVES_REMOTE'] and after['SAVES_REMOTE']==want,mode+' performs the intended saves-pointer transition')
    check(after['CONTENT_REMOTE']=='',mode+' preserves explicitly selected cloud root across actual transition')
    scan=guest('cloud_content_restore --scan')
    check(any(x.startswith('nes|') for x in scan.splitlines()) and any(x.startswith('bios|') for x in scan.splitlines()),mode+' scan finds root ROMs and BIOS')
    guest('rm -f /storage/roms/nes/M7-root.nes /storage/roms/bios/M7-root.bin\ncloud_content_restore nes bios')
    for remote,value in [('/storage/roms/nes/M7-root.nes',b'root ROM sentinel\n'),('/storage/roms/bios/M7-root.bin',b'root BIOS sentinel\n')]:
        check(sha(remote)==hashlib.sha256(value).hexdigest(),mode+' restores sentinel '+remote)
    results.append({'mode':mode,'before':before,'after':after,'output':output,'scan':scan})
    (out/'transitions.json').write_text(json.dumps(results,indent=2)+'\n')
print('PASS all four actual layout transitions preserve chosen root and restore sentinels; review settings-toggle frames',flush=True)
