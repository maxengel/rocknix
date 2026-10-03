from pathlib import Path
import subprocess,time,json,hashlib
owner=Path('/workspace/tmp/rasteratops-m7-proxy-runtime-04');out=owner/'artifacts';seed=Path('/tmp/m7-proxy-predecessor')
ssh=['ssh','-i',str(owner/'pair/qa-key'),'-p','10026','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=no','-o','UserKnownHostsFile=/dev/null','-o','LogLevel=ERROR','root@127.0.0.1']
def guest(cmd,**kw):return subprocess.run(ssh+[cmd],check=True,**kw)
for i in range(40):
 if subprocess.run(ssh+['true'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:break
 time.sleep(2)
else:raise RuntimeError('guest d did not authenticate')
bid=guest('sed -n "s/^BUILD_ID=//p" /etc/os-release',capture_output=True,text=True).stdout.strip().strip('"')
assert bid=='61b64817bf8ab48237e51abb395484e36cbf924b',bid
print('PASS exact replacement02 BUILD_ID',flush=True)
guest('systemctl stop essway raofflineproxy; . /etc/profile >/dev/null 2>&1; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0; set_setting global.retroachievements 0; set_setting global.retroachievements.username QA; set_setting global.retroachievements.token "<synthetic>"; ip route del default; mkdir -p /storage/.cache/m7-proxy-runtime-04/image_cache/static/Badge')
for src,dst in [(seed/'store.sqlite3','proxy.sqlite3'),(seed/'before.json','before.json'),(seed/'static/Badge/old.png','image_cache/static/Badge/old.png'),(owner/'guest-proof.py','guest-proof.py')]:
 guest('cat > /storage/.cache/m7-proxy-runtime-04/'+dst,input=src.read_bytes())
r=subprocess.run(ssh+['python3 /storage/.cache/m7-proxy-runtime-04/guest-proof.py'],text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=150)
(out/'guest-proof.log').write_text(r.stdout);print(r.stdout,flush=True)
for name in ['assertions.json']:
 r2=guest('cat /storage/.cache/m7-proxy-runtime-04/'+name,capture_output=True);(out/name).write_bytes(r2.stdout)
assert r.returncode==0,r.returncode
(out/'provenance.json').write_text(json.dumps({'build_id':bid,'predecessor_db_sha256':hashlib.sha256((seed/'store.sqlite3').read_bytes()).hexdigest(),'packaged_modules':True,'provider_contact':False},indent=2)+'\n')
