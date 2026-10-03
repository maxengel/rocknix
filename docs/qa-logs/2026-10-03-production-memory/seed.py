from pathlib import Path
import subprocess,time,hashlib,json
owner=Path('/workspace/tmp/rasteratops-m7-production-memory-01')
ssh=['ssh','-i',str(owner/'pair/qa-key'),'-p','10026','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=no','-o','UserKnownHostsFile=/dev/null','-o','LogLevel=ERROR','root@127.0.0.1']
def guest(cmd,**kw):return subprocess.run(ssh+[cmd],check=True,**kw)
for i in range(40):
 r=subprocess.run(ssh+['true'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 if r.returncode==0:break
 time.sleep(3)
else:raise RuntimeError('guest d did not authenticate')
build=guest('sed -n "s/^BUILD_ID=//p" /etc/os-release',capture_output=True,text=True).stdout.strip().strip('"')
assert build=='503e24e10dde6a59aa6c631f789b88b89f8e92e1',build
print('PASS guest d exact BUILD_ID',build,flush=True)
guest('systemctl stop essway; . /etc/profile >/dev/null 2>&1; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0; set_setting global.retroachievements 0')
romroot=Path('/workspace/artifacts/rocknix-qa-roms')
for src,dst in [('ninoid/Ninoid.gb','/storage/roms/gb/Ninoid.gb'),('tobu/Tobu Tobu Girl Deluxe.gb','/storage/roms/gbc/Tobu Tobu Girl Deluxe.gb'),('bobl/Bobl (v1.2)-unpacked/böbl-1.2.nes','/storage/roms/nes/Bobl.nes')]:
 data=(romroot/src).read_bytes()
 guest("mkdir -p '"+str(Path(dst).parent)+"' && cat > '"+dst+"'",input=data)
 actual=guest("sha256sum '"+dst+"'",capture_output=True,text=True).stdout.split()[0]
 assert actual==hashlib.sha256(data).hexdigest(),dst
 print('PASS QA ROM bytes',dst,actual,flush=True)
guest('systemctl start essway')
for i in range(90):
 r=subprocess.run(ssh+['curl -sS -m 3 http://127.0.0.1:1234/isIdle'],capture_output=True,text=True)
 if r.returncode==0 and r.stdout.strip() and json.loads(r.stdout)==[True]:break
 time.sleep(1)
else:raise RuntimeError('guest d interface did not become idle')
print('PASS guest d seeded and idle',flush=True)
