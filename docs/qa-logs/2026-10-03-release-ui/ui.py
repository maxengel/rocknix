import argparse,json,pathlib,subprocess,time
p=argparse.ArgumentParser();p.add_argument('language');p.add_argument('resolution');a=p.parse_args()
owner=pathlib.Path('/workspace/tmp/rasteratops-m7-release-ui-01')
out=owner/'artifacts'/f'{a.language}-{a.resolution}';out.mkdir(exist_ok=True)
ssh=['ssh','-i',str(owner/'pair/qa-key'),'-p','10026','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=no','-o','UserKnownHostsFile=/dev/null','-o','LogLevel=ERROR','root@127.0.0.1']
def guest(cmd,**kw):return subprocess.run(ssh+[cmd],check=True,**kw)
guest('systemctl stop essway; . /etc/profile >/dev/null 2>&1; set_setting system.language '+a.language)
config=subprocess.check_output(['./tools/cloud-test-backend','rclone-conf'])
guest('mkdir -p /storage/.config/rclone; umask 077; cat > /storage/.config/rclone/rclone.conf',input=config)
guest('cp /usr/config/cloud_sync.conf /storage/.config/cloud_sync.conf; cloud_sync_helper >/dev/null 2>&1; systemctl start essway')
for i in range(90):
 r=subprocess.run(ssh+['curl -sS -m 3 http://127.0.0.1:1234/isIdle'],capture_output=True,text=True)
 if r.returncode==0 and r.stdout.strip() and json.loads(r.stdout)==[True]:break
 time.sleep(1)
else:raise RuntimeError('UI did not become idle')
v=['./tools/vm-visual-qa','--monitor','/tmp/rocknix-qemu-monitor-d.sock']
subprocess.run(v+['dismiss'],check=True)
for walk in ['retro-achievements','cloud-sync']:
 print('START',a.language,a.resolution,walk,flush=True)
 subprocess.run(v+['run','tools/vm-walks/docs/'+walk+'.steps','--outdir',str(out/walk)],check=True)
 print('CAPTURED',a.language,a.resolution,walk,flush=True)
from PIL import Image
frames=list(out.rglob('*.png'));w,h=map(int,a.resolution.split('x'))
assert frames and all(Image.open(f).size==(w,h) for f in frames)
(out/'result.json').write_text(json.dumps({'language':a.language,'resolution':a.resolution,'frames':len(frames),'dimensions_match':True,'visual_review':'pending'},indent=2)+'\n')
print('PASS capture dimensions; visual review still required',a.language,a.resolution,len(frames),flush=True)
