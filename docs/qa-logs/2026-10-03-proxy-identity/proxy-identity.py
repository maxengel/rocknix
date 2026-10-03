from pathlib import Path
common=Path('/workspace/tmp/rasteratops-m7-archives-01/archive-proof.py').read_text()
exec(compile(common.split('bid=guest(')[0],'<retained QA helpers>','exec'))
check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='134e89c4fcb08581f1c831229167364828a37e27','exact replacement BUILD_ID')
guest('systemctl stop essway raofflineproxy; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0')
script=r'''python3 - <<'PROBE'
import json,tempfile,pathlib
from unittest import mock
from raofflineproxy import config,auth,storage
with tempfile.TemporaryDirectory(prefix='m7-proxy-account-') as d:
 p=pathlib.Path(d);cfg=p/'system.cfg'
 cfg.write_text('global.retroachievements.username=M7Synthetic\nglobal.retroachievements.token=synthetic-no-provider-token\n')
 with mock.patch.object(config,'DEFAULT_ROCKNIX_SYSTEM_CFG',cfg):
  detected=config.detect_rocknix_system_cfg({})
  explicit=config.detect_rocknix_system_cfg({'rocknix_system_cfg':str(cfg)})
  # Omit all real account paths: only this synthetic source is eligible.
  with mock.patch.object(auth,'detect_retroarch_cfg',return_value=str(p/'absent.cfg')), mock.patch.object(auth,'load_spruce_credentials',return_value=None):
   store=storage.Storage(database_path=p/'probe.sqlite3')
   automatic=auth.resolve_credentials(store,{})
   direct=auth.resolve_credentials(store,{'rocknix_system_cfg':str(cfg)})
   store.close()
 result={'module':config.__file__,'os_name':next(x for x in pathlib.Path('/etc/os-release').read_text().splitlines() if x.startswith('OS_NAME=')),'recognized_platform':config.running_on_rocknix(),'automatic_detected':detected is not None,'explicit_detected':explicit==str(cfg),'automatic_credentials':automatic is not None,'explicit_credentials_correct':bool(direct and direct.get('user')=='M7Synthetic' and direct.get('token')=='synthetic-no-provider-token')}
 print(json.dumps(result))
PROBE
'''
result=json.loads(guest(script));(out/'packaged-identity.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result),flush=True)
check(result['explicit_detected'] and result['explicit_credentials_correct'],'synthetic account and existing credential parser are valid')
check(result['recognized_platform'] and result['automatic_detected'] and result['automatic_credentials'],'branded image automatically discovers canonical account settings')
