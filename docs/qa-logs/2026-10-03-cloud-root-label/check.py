"""Exercise the production pointer writer and its player-facing sentence."""
import pathlib,subprocess,tempfile,json
root=pathlib.Path(__file__).resolve().parents[3]
path='projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout'
new=(root/path).read_text();old=subprocess.check_output(['git','show','HEAD:'+path],cwd=root,text=True)
results=[]
for version,source in [('before',old),('after',new)]:
 fn=source[source.index('set_pointer() {'):source.index('\n# A tier as the player knows it')]
 with tempfile.TemporaryDirectory() as d:
  conf=pathlib.Path(d)/'conf';conf.write_text('CONTENT_REMOTE="/old"\n')
  for value in ['', '/Mine/ROMs']:
   script='''say() { echo "$@"; }
tier_words() { echo 'ROMs, BIOS, and game content'; }
conf_value() { sed -n "s/^$1=\\\"\\(.*\\)\\\"$/\\1/p" "$SYNC_CONF"; }
SYNC_CONF=$1
'''+fn+'\nset_pointer CONTENT_REMOTE "$2"\n'
   r=subprocess.run(['bash','-s','--',str(conf),value],input=script,text=True,capture_output=True)
   expected='Now using '+(value or 'the root of your cloud')+' for your ROMs, BIOS, and game content.\n'
   row={'version':version,'value':value,'rc':r.returncode,'output':r.stdout,'expected_sentence':r.stdout==expected,'stored_value_preserved':conf.read_text()=='CONTENT_REMOTE='+json.dumps(value)+'\n'}
   results.append(row)
assert results[0]['expected_sentence'] is False
assert results[0]['stored_value_preserved']
assert all(r['expected_sentence'] and r['stored_value_preserved'] and r['rc']==0 for r in results[1:])
print(json.dumps(results,indent=2))
print('PASS old root label fails; fixed root/named-folder sentences and exact stored values pass')
