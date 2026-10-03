import hashlib,json,pathlib,shutil,subprocess
root=pathlib.Path('/workspace/repos/rocknix.worktrees/conflict-resolution')
out=root/'docs/qa-logs/2026-10-03-transfer-sample'
out.mkdir(exist_ok=True)
baseline=pathlib.Path('/workspace/artifacts/rocknix-images/walk-baseline')
walks=pathlib.Path('/workspace/tmp/rasteratops-m7-replacement-qa-01/artifacts/rocknix-images/qa-134e89c4fc-webdav-a-20261003-2103/walks')
def hashes(p):return {str(f.relative_to(p)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(p.rglob('*')) if f.is_file()}
before=hashes(baseline)
claims=(root/'tools/vm-walks/claims.txt').read_text()
controls=[]
for name,text,want in [('missing', '\n'.join(s for s in claims.splitlines() if '#406' not in s)+'\n',1),('narrow',claims.replace('415 412 866 427 #406','415 412 865 427 #406'),1),('current',claims,0)]:
    claim=out/(name+'-claims.txt');claim.write_text(text)
    args=[str(root/'tools/frame-diff'),'compare',str(baseline),str(walks),'--masks',str(root/'tools/vm-walks/masks.txt'),'--claims',str(claim),'--report',str(out/(name+'.md'))]
    p=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    (out/(name+'.log')).write_text(p.stdout)
    controls.append({'control':name,'actual_rc':p.returncode,'expected_rc':want,'passed':p.returncode==want})
    assert p.returncode==want,(name,p.stdout)
assert before==hashes(baseline),'baseline changed'
(out/'baseline-sha256.json').write_text(json.dumps(before,indent=2)+'\n')
for name,path in [('baseline-t05',baseline/'run-transfer-frames/08-t05.png'),('candidate-t05',walks/'run-transfer-frames/08-t05.png'),('candidate-t08',walks/'run-transfer-frames/09-t08.png'),('candidate-t60',walks/'run-transfer-frames/22-t60.png')]:
    shutil.copyfile(path,out/(name+'.png'))
(out/'controls.json').write_text(json.dumps(controls,indent=2)+'\n')
print('PASS 3 frame-claim controls; accepted baseline unchanged; 78 frames compared')
