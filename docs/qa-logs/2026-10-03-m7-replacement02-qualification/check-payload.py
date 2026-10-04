import hashlib,json,pathlib,subprocess,sys
owner=pathlib.Path('/workspace/tmp/rasteratops-m7-replacement-qa-02')
def guest(command):
    return subprocess.check_output(['./tools/vm-pair','ssh','a',command],text=True).strip()
expected='61b64817bf8ab48237e51abb395484e36cbf924b'
bid=guest('sed -n \'s/^BUILD_ID=//p\' /etc/os-release').strip('"')
assert bid==expected,bid
mapping={f'/usr/share/licenses/rasteratops/{name}':pathlib.Path(name) for name in ['LICENSE.md','TRADEMARK.md']}
mapping.update({f'/usr/bin/{name}':pathlib.Path('projects/ROCKNIX/packages/network/rclone/sources')/name for name in ['cloud_content_backup','cloud_content_restore','cloud_content_transfer','cloud_backup','cloud_restore','cloud_migrate_layout']})
proof={}
for remote,local in mapping.items():
    line=guest('sha256sum '+remote)
    want=hashlib.sha256(local.read_bytes()).hexdigest()
    assert line.split()[0]==want,(remote,line)
    mode=guest("stat -c '%a' "+remote)
    assert mode==('644' if '/licenses/' in remote else '755'),(remote,mode)
    proof[remote]={'sha256':want,'mode':mode}
out={'phase':sys.argv[1],'build_id':bid,'files':proof,'passed':True}
(owner/'artifacts'/('payload-'+sys.argv[1]+'.json')).write_text(json.dumps(out,indent=2)+'\n')
print('PASS '+sys.argv[1]+' exact BUILD_ID, installed content scripts and policy bytes/modes')
