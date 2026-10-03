import json,os,pathlib,signal,subprocess,time
root=pathlib.Path('/workspace/tmp/rasteratops-m7-watch-loss-01')
root.mkdir(mode=0o700)
runner='/workspace/repos/rocknix.worktrees/conflict-resolution/tools/watch-build'
results=[]
for mode in ['job-death-without-result','monitor-loss']:
    here=root/mode;here.mkdir()
    with (here/'console.log').open('wb') as log:
        p=subprocess.Popen([runner,'--interval','1','--stall-min','1','--','bash','-c','echo synthetic-watch-probe; sleep 4'],cwd=here,stdout=log,stderr=subprocess.STDOUT)
        deadline=time.monotonic()+10
        while True:
            runs=list((here/'.build-runs').glob('20*')) if (here/'.build-runs').exists() else []
            if runs and (runs[0]/'command.pid').exists() and (runs[0]/'build.status').exists():break
            assert time.monotonic()<deadline,'probe did not arm'
            time.sleep(.05)
        run=runs[0];watcher=int((run/'watcher.pid').read_text());child=int((run/'command.pid').read_text())
        assert int((run/'build.pid').read_text())==p.pid
        if mode=='job-death-without-result':
            os.kill(p.pid,signal.SIGKILL);assert p.wait(timeout=5)==-signal.SIGKILL
            deadline=time.monotonic()+10
            while not (run/'build.status').read_text().startswith('state:       died\n'):
                assert time.monotonic()<deadline,'death was not recorded'
                time.sleep(.1)
            assert not (run/'build.rc').exists(),'death falsely produced a result'
            # Only the owned sleep process group survives its killed runner.
            try:os.killpg(child,signal.SIGTERM)
            except ProcessLookupError:pass
            observed='died; no build.rc'
        else:
            os.kill(watcher,signal.SIGTERM)
            assert p.wait(timeout=15)==125,'monitor loss did not fail closed'
            assert (run/'build.rc').read_text().strip()=='0'
            assert 'watcher did not record completion' in (run/'runner-error').read_text()
            observed='command rc0; runner rc125; explicit monitoring failure'
        result={'case':mode,'runner_pid':p.pid,'watcher_pid':watcher,'run':str(run),'observed':observed,'passed':True}
        results.append(result);print(json.dumps(result),flush=True)
(root/'results.json').write_text(json.dumps(results,indent=2)+'\n')
