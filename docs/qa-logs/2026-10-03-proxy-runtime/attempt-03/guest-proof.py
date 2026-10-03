"""Run only packaged proxy modules, with predecessor-written synthetic state."""
import os,json,sys,time,hashlib,subprocess,urllib.request,urllib.error
from pathlib import Path
root=Path('/storage/.cache/m7-proxy-runtime-03');os.environ['RAOFFLINEPROXY_CONFIG_DIR']=str(root)
from raofflineproxy import config,storage,cache_keys,rom_cache,image_cache,auth
checks=[]
def check(ok,name):
 checks.append({'assertion':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 (root/'assertions.json').write_text(json.dumps(checks,indent=2)+'\n');assert ok,name
check(config.__file__.startswith('/usr/lib/python3.14/site-packages/'),'actual packaged modules, no source override')
check(config.running_on_rocknix(),'packaged detector recognizes Rasteratops')
check(config.detect_rocknix_system_cfg({})=='/storage/.config/system/configs/system.cfg','canonical account path is discovered without override')
before=json.loads((root/'before.json').read_text())
for i in range(2):
 st=storage.Storage()
 check(st.get_all_cache_by_prefix('')==before['cache'],f'reopen {i+1} retains all predecessor cache rows')
 check(st.get_pending_awards()==before['awards'],f'reopen {i+1} retains all predecessor pending rows')
 check(rom_cache.build_achievement_game_ids(st.get_all_cache_by_prefix(cache_keys.PREFIX_PATCH),st.get_all_cache_by_prefix(cache_keys.PREFIX_ACHIEVEMENTSETS))=={1:100,2:200},f'reopen {i+1} retains base/subset award mapping')
 check(st.load_login_credentials()=={'user':'QA','token':'<synthetic>'},f'reopen {i+1} retains synthetic cached sign-in')
 st.close()
check(image_cache.resolve_cached_static_asset('/Badge/old.png').read_bytes()==(root/'image_cache/static/Badge/old.png').read_bytes(),'legacy unsharded image path remains readable')
st=storage.Storage();cred=auth.resolve_credentials(st,{});st.close()
check(bool(cred and cred.get('user')=='QA' and cred.get('token')=='<synthetic>'),'packaged resolver reads canonical synthetic account automatically')
(root/'config.json').write_text(json.dumps({'proxy_host':'127.0.0.1','proxy_port':18080,'upstream_host':'http://127.0.0.1:9','cache_images':False,'upload_logs':False,'upload_usage_stats':False}))
# No default route exists in this disposable guest; upstream is also loopback.
log=(root/'service-private.log').open('wb')
p=subprocess.Popen(['/usr/bin/python3','-m','raofflineproxy.main','run-service'],env=dict(os.environ),stdout=log,stderr=subprocess.STDOUT)
(root/'owned-service.pid').write_text(str(p.pid)+'\n')
def get(path,as_json=True):
 req=urllib.request.Request('http://127.0.0.1:18080'+path,headers={'X-RA-Store-Only':'1'})
 with urllib.request.urlopen(req,timeout=5) as response:
  data=response.read();return json.loads(data) if as_json else data
try:
 for i in range(60):
  if p.poll() is not None:raise RuntimeError('packaged service exited before readiness')
  try:patch=get('/dorequest.php?r=patch&g=100&u=QA');break
  except (OSError,ValueError):time.sleep(.5)
 else:raise RuntimeError('packaged service did not become ready')
 check(patch.get('PatchData',{}).get('Title')=='old cached game','real packaged service serves inherited game cache')
 sets=get('/dorequest.php?r=achievementsets&m=abc&u=QA')
 check([x['GameId'] for x in sets['Sets']]==[100,200],'real service serves inherited base and subset sets')
 for game,achievement in [(100,1),(200,2)]:
  response=get(f'/dorequest.php?r=unlocks&g={game}&u=QA')
  check(achievement in response.get('UserUnlocks',[]),f'queued award remains visible in game {game}')
 check(get('/Badge/old.png',False)==(root/'image_cache/static/Badge/old.png').read_bytes(),'real service serves original legacy image bytes')
 st=storage.Storage();awards=st.get_pending_awards();st.close()
 check(len(awards)==2 and {x['achievementId'] for x in awards}=={1,2},'offline service retains both queued awards without flushing')
finally:
 p.terminate()
 try:p.wait(timeout=15)
 except subprocess.TimeoutExpired:p.kill();p.wait();raise
 log.close()
check(p.poll() is not None,'owned packaged service stops cleanly')
print('PASS packaged account discovery, predecessor cache/sign-in/queue reopen and offline HTTP service',flush=True)
