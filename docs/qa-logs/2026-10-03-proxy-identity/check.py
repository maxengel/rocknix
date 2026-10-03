"""Whole config-module identity/discovery controls; credentials are synthetic."""
import argparse,pathlib,sys,tempfile,os,json
from unittest import mock
p=argparse.ArgumentParser();p.add_argument('--source',type=pathlib.Path,required=True);p.add_argument('--expect-old',action='store_true');a=p.parse_args()
with tempfile.TemporaryDirectory(prefix='m7-proxy-identity-') as d:
 root=pathlib.Path(d);os.environ['RAOFFLINEPROXY_CONFIG_DIR']=str(root/'config')
 sys.path.insert(0,str(a.source/'linux'))
 from raofflineproxy import config,auth,storage
 cfg=root/'system.cfg';cfg.write_text('global.retroachievements.username=M7Synthetic\nglobal.retroachievements.token=synthetic-no-provider-token\n')
 release=root/'os-release';rows=[]
 for identity,expected in [('OS_NAME="ROCKNIX"',True),('OS_NAME="RASTERATOPS"',True),('OS_NAME="OTHER"',False),('OS_NAME="ROCKNIX_REMIX"',False),('# OS_NAME="ROCKNIX"',False),('PREVIOUS_OS_NAME="ROCKNIX"',False)]:
  release.write_text(identity+'\n')
  with mock.patch.object(config,'OS_RELEASE_PATH',release),mock.patch.object(config,'DEFAULT_ROCKNIX_SYSTEM_CFG',cfg),mock.patch.object(auth,'detect_retroarch_cfg',return_value=str(root/'absent')),mock.patch.object(auth,'load_spruce_credentials',return_value=None):
   recognized=config.running_on_rocknix();detected=config.detect_rocknix_system_cfg({})
   store=storage.Storage(database_path=root/('probe-'+str(len(rows))+'.sqlite3'))
   credentials=auth.resolve_credentials(store,{})
   explicit=auth.resolve_credentials(store,{'rocknix_system_cfg':str(cfg)})
   store.close()
   row={'identity':identity,'recognized':recognized,'detected_canonical':detected==str(cfg),'credentials_correct':bool(credentials and credentials.get('user')=='M7Synthetic' and credentials.get('token')=='synthetic-no-provider-token'),'explicit_override_correct':bool(explicit and explicit.get('user')=='M7Synthetic'),'expected':expected}
   row['passed']=all(row[k]==expected for k in ['recognized','detected_canonical','credentials_correct']) and row['explicit_override_correct'];rows.append(row)
 release.unlink()
 with mock.patch.object(config,'OS_RELEASE_PATH',release):
  rows.append({'identity':'missing file','passed':config.running_on_rocknix() is False})
 print(json.dumps(rows,indent=2))
 failures=sum(not r['passed'] for r in rows)
 if a.expect_old:assert failures>=1 and not rows[1]['passed'];print('PASS negative control: old code fails Rasteratops recognition')
 else:assert failures==0;print('PASS all seven identity/discovery controls, including explicit overrides')
