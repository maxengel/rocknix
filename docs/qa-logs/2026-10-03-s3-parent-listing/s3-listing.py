"""Real S3 parent-listing refusal through a transparent, owned HTTP proxy."""
from pathlib import Path
common=Path('/workspace/tmp/rasteratops-m7-archives-01/archive-proof.py').read_text().split('bid=guest(')[0]
common=common.replace("/'data'","/'s3/data'").replace("=='webdav'","=='s3'")
exec(compile(common,'<retained QA helpers>','exec'))
import http.client,http.server,threading,urllib.parse
state={'deny':False,'events':[]}
class Proxy(http.server.BaseHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def log_message(self,*args):pass
    def do_HEAD(self):self.route()
    def do_GET(self):self.route()
    def route(self):
        url=urllib.parse.urlsplit(self.path);query=urllib.parse.parse_qs(url.query)
        prefix=query.get('prefix',[''])[0]
        deny=state['deny'] and self.command=='GET' and prefix=='Rasteratops/'
        event={'method':self.command,'path':url.path,'prefix':prefix,'denied':deny}
        state['events'].append(event)
        if deny:
            body=b'<Error><Code>AccessDenied</Code><Message>Owned QA parent-listing fault</Message></Error>'
            self.send_response(403);self.send_header('Content-Type','application/xml');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
            event['status']=403
        else:
            c=http.client.HTTPConnection('127.0.0.1',9032,timeout=30)
            c.request(self.command,self.path,headers={k:v for k,v in self.headers.items() if k.lower() not in ['connection','proxy-connection']})
            r=c.getresponse();body=r.read();event['status']=r.status
            self.send_response(r.status)
            for k,v in r.getheaders():
                if k.lower() not in ['connection','transfer-encoding','content-length']:self.send_header(k,v)
            self.send_header('Content-Length',str(len(body)));self.end_headers()
            if self.command!='HEAD':self.wfile.write(body)
            c.close()
        (out/'proxy-events.json').write_text(json.dumps(state['events'],indent=2)+'\n')
server=http.server.ThreadingHTTPServer(('0.0.0.0',9033),Proxy)
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='134e89c4fcb08581f1c831229167364828a37e27','exact replacement BUILD_ID')
    guest('systemctl stop essway; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0')
    config=subprocess.check_output(['./tools/cloud-test-backend','rclone-conf'],text=True).rstrip()+'\n'
    assert config.count(':9032')==1
    config=config.replace(':9032',':9033')
    guest('mkdir -p /storage/.config/rclone\numask 077\ncat > /storage/.config/rclone/rclone.conf <<\'M7_QA_CONFIG\'\n'+config+'M7_QA_CONFIG\n',record=False)
    conf('/rocknix-qa/Rasteratops/Saves','/rocknix-qa/Rasteratops/Backups','/rocknix-qa/Rasteratops/Content')
    subprocess.run(['./tools/cloud-test-backend','reset'],check=True,stdout=subprocess.DEVNULL)
    seed=out/'seed';(seed/'nes').mkdir(parents=True,exist_ok=True)
    payload=b'S3 parent-listing sentinel from synthetic QA cloud\n';(seed/'nes/M7Listing.srm').write_bytes(payload)
    subprocess.run(['./tools/cloud-test-backend','put',str(seed),'Rasteratops/Saves'],check=True,stdout=subprocess.DEVNULL)
    remote_digest=hashlib.sha256(payload).hexdigest()
    guest('cloud_restore --yes --saves-only')
    check(sha('/storage/roms/nes/M7Listing.srm')==remote_digest,'present S3 folder restores exact cloud sentinel')
    guest("printf 'local before refused parent read\\n' > /storage/roms/nes/M7Listing.srm")
    before=sha('/storage/roms/nes/M7Listing.srm');start=len(state['events']);state['deny']=True
    output=guest('set +e\ncloud_restore --yes --saves-only\nTASK_RC=$?\nprintf "\\nM7_RESTORE_RC=%s\\n" "$TASK_RC"\nexit 0')
    refused=state['events'][start:]
    (out/'refused-output.txt').write_text(output+'\n')
    check(any(e['denied'] for e in refused),'actual parent-prefix ListObjects request refused by proxy')
    check(any(e['prefix']=='Rasteratops/Saves/' and e.get('status')==200 for e in refused),'child directory listing succeeds before parent predicate is refused')
    m=re.search(r'M7_RESTORE_RC=(\d+)',output)
    check(bool(m) and int(m.group(1))!=0,'failed parent listing produces nonzero whole-script outcome')
    check('>>> offer create-saves-folder' not in output,'failed parent listing cannot offer folder creation')
    check('COULDN\'T FINISH' in output.upper() or 'COULDN\'T REACH' in output.upper(),'refusal reports failed restore in player language')
    check(sha('/storage/roms/nes/M7Listing.srm')==before,'refused listing preserves local sentinel')
    state['deny']=False
    cloud=subprocess.check_output(['./tools/cloud-test-backend','cat','Rasteratops/Saves/nes/M7Listing.srm'])
    check(hashlib.sha256(cloud).hexdigest()==remote_digest,'refused listing preserves cloud sentinel')
    guest('cloud_restore --yes --saves-only')
    check(sha('/storage/roms/nes/M7Listing.srm')==remote_digest,'fault removal permits successful exact-byte retry')
    (out/'sentinels.json').write_text(json.dumps({'before_local_sha256':before,'cloud_and_restored_sha256':remote_digest},indent=2)+'\n')
    print('PASS actual S3 parent-read failure, truthful refusal, preservation and retry',flush=True)
finally:server.shutdown();server.server_close()
