import json,pathlib,subprocess,time
root=pathlib.Path('/workspace/tmp/rasteratops-m7-watch-stall-01');root.mkdir(mode=0o700)
runner='/workspace/repos/rocknix.worktrees/conflict-resolution/tools/watch-build'
with (root/'console.log').open('wb') as log:
 p=subprocess.Popen([runner,'--interval','1','--stall-min','0','--','bash','-c','echo synthetic-stall-probe; sleep 5; echo synthetic-probe-resumed'],cwd=root,stdout=log,stderr=subprocess.STDOUT)
 deadline=time.monotonic()+10
 while True:
  runs=list((root/'.build-runs').glob('20*')) if (root/'.build-runs').exists() else []
  if runs and (runs[0]/'build.status').exists():
   status=(runs[0]/'build.status').read_text()
   if status.startswith('state:       stalled\n'):
    (root/'suspected-stall.status').write_text(status)
    print('EXPECTED suspected stall observed; probe still alive; no automatic restart',flush=True)
    assert p.poll() is None
    break
  assert time.monotonic()<deadline,'quiet job not detected'
  time.sleep(.1)
 assert p.wait(timeout=15)==0
 status=(runs[0]/'build.status').read_text()
 assert status.startswith('state:       finished\n') and (runs[0]/'build.rc').read_text().strip()=='0'
 (root/'finished.status').write_text(status)
 (root/'result.json').write_text(json.dumps({'test_stall_minutes':0,'actual_qa_stall_minutes':5,'suspected_stall_observed':True,'job_kept_running':True,'terminal_rc':0,'passed':True},indent=2)+'\n')
 print('PASS quiet-job detection followed by normal successful completion',flush=True)
