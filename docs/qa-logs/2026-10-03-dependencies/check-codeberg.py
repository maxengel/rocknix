#!/usr/bin/env python3
"""Exercise the real freshness runner with controlled Codeberg responses."""
import json, os, pathlib, shutil, subprocess, sys, tempfile
source=pathlib.Path(sys.argv[1]).resolve()
with tempfile.TemporaryDirectory(prefix="freshness-codeberg-") as tmp:
 root=pathlib.Path(tmp); (root/'tools').mkdir(); (root/'bin').mkdir()
 recipe=root/'projects/ROCKNIX/packages/tllist/package.mk'; recipe.parent.mkdir(parents=True)
 recipe.write_text('PKG_NAME="tllist"\nPKG_VERSION="1.1.0"\nPKG_SITE="https://codeberg.org/dnkl/tllist"\nPKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"\n')
 runner=root/'tools/fork-package-freshness';shutil.copyfile(source,runner);runner.chmod(0o755)
 git=root/'bin/git';git.write_text('#!/bin/sh\nprintf "%s\\n" projects/ROCKNIX/packages/tllist/package.mk\n');git.chmod(0o755)
 curl=root/'bin/curl';curl.write_text('#!/usr/bin/env python3\nimport os,sys\nassert sys.argv[-1] == "https://codeberg.org/api/v1/repos/dnkl/tllist/tags?limit=50", sys.argv\nsys.stdout.write(os.environ["FIXTURE_BODY"])\nsys.exit(int(os.environ["FIXTURE_RC"]))\n');curl.chmod(0o755)
 cases=[('stable-before-prerelease',[{'name':'v9.0.0-rc1'},{'name':'1.1.0'},{'name':'1.0.5'}],0,0,'CURRENT'),('new-stable',[{'name':'v1.2.0'},{'name':'1.1.0'}],0,1,'BEHIND'),('empty',[],0,2,'UNKNOWN'),('malformed','invalid-json',0,2,'UNKNOWN'),('request-failure','',22,2,'UNKNOWN'),('failed-request-with-body',[{'name':'1.1.0'}],18,2,'UNKNOWN')]
 failed=0
 for name,body,status,expected,verdict in cases:
  env=dict(os.environ,PATH=str(root/'bin')+os.pathsep+os.environ['PATH'],FIXTURE_BODY=json.dumps(body) if not isinstance(body,str) else body,FIXTURE_RC=str(status))
  result=subprocess.run([str(runner),'tllist'],env=env,text=True,capture_output=True)
  ok=result.returncode==expected and verdict in result.stdout
  failed+=not ok
  print(('PASS' if ok else 'FAIL')+f' {name}: rc={result.returncode} expected={expected}; '+result.stdout.strip().splitlines()[-1])
 sys.exit(bool(failed))
