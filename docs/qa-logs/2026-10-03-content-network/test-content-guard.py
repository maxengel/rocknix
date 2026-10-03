#!/usr/bin/env python3
"""Run each real content copy call against controlled rclone processes.

The old source is read from --before, never recreated as a proposed fix.
Only the configured I/O timeout is shortened (1s + production 6s grace).
"""
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import re
import shlex
import signal
import subprocess
import time

p = argparse.ArgumentParser()
p.add_argument("--repo", type=Path, required=True)
p.add_argument("--output", type=Path, required=True)
p.add_argument("--before", default="1fde95670d29ab83b29e5f368139e63d1e38015f")
a = p.parse_args()
a.output.mkdir(parents=True, exist_ok=False)
rel = Path("projects/ROCKNIX/packages/network/rclone/sources")
helper = (a.repo / rel / "cloud_content_transfer").read_text()
shim = '''#!/usr/bin/env python3
import os, time
from pathlib import Path
Path(os.environ["CASE_ROOT"], "child.pid").write_text(str(os.getpid()))
mode = os.environ["MODE"]
if mode == "failure": raise SystemExit(6)
if mode == "plain": print("Transferred: 1 / 1, 100%"); raise SystemExit(0)
for n in range(12):
    if mode == "progress": print(f"Transferred: {n + 1} KiB / 12 KiB, 0%, 0 B/s, -", flush=True)
    elif mode == "large": print(f"Transferred: {3 + n / 10:.1f} GiB / 6 GiB, 0%, 0 B/s, -", flush=True)
    elif mode == "listing": print(f"Checks: 0 / 0, Listed {n + 1}", flush=True)
    elif mode == "retry": print(f"Transferred: {4 if n % 2 else 2} KiB / {12+n} KiB, 0%, 0 B/s, -", flush=True)
    else: print("Transferred: 1 KiB / 12 KiB, 0%, 0 B/s, -", flush=True)
    time.sleep(1)
'''


def run(version, script, mode):
    d = a.output / f"{version}-{script}-{mode}"
    d.mkdir()
    (d / "rclone").write_text(shim)
    (d / "rclone").chmod(0o700)
    source = ((a.repo / rel / script).read_text() if version == "after" else
              subprocess.check_output(["git", "-C", str(a.repo), "show", f"{a.before}:{rel / script}"], text=True))
    (d / "source").write_text(source)
    # The exact first copy statement and its arguments from production.
    m = re.search(r'^    (?:bounded_content_rclone|rclone) copy "\$\{SRC\}".*?^    RC=\$\?', source, re.M | re.S)
    assert m, script
    call = m.group(0)
    (d / "cloud_content_transfer").write_text(helper)
    setup = f". {shlex.quote(str(d / 'cloud_content_transfer'))}\n" if version == "after" else ""
    command = setup + '''
log_message() { printf '%s\n' "$*" >> "$CASE_ROOT/guard.log"; }
SRC=/fixture/source TARGET=/fixture/target LOG_FILE="$CASE_ROOT/rclone.log"
RCLONE_NET_OPTS_ARRAY=(--timeout 1s --low-level-retries 10 --retries 1)
''' + call + '\nprintf "CALL_RESULT=%s\\n" "$RC"\nexit "$RC"\n'
    (d / "call.sh").write_text(command)
    env = dict(os.environ, PATH=str(d) + ":" + os.environ["PATH"], MODE=mode,
               CASE_ROOT=str(d), CEILING_DIR_ROOT=str(d if mode != "fifo_failure" else d / "missing"))
    start = time.monotonic()
    with (d / "stdout").open("w") as out:
        proc = subprocess.Popen(["bash", str(d / "call.sh")], env=env, stdout=out,
                                stderr=subprocess.STDOUT, start_new_session=True)
        if mode == "cancel":
            deadline = time.monotonic() + 5
            while not (d / "child.pid").exists() and proc.poll() is None and time.monotonic() < deadline:
                time.sleep(.05)
            assert (d / "child.pid").exists(), "cancellation must hit a live transfer"
            os.killpg(proc.pid, signal.SIGTERM)
        try:
            rc = proc.wait(timeout=20)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGKILL)
            rc = proc.wait()
    elapsed = time.monotonic() - start
    expected = {"stall": 124, "retry": 124, "failure": 6, "fifo_failure": 1}.get(mode, 0)
    ok = rc == expected
    if mode in ("stall", "retry"):
        ok &= 6 <= elapsed < 11
    if mode in ("progress", "large", "listing"):
        ok &= elapsed >= 11
    if mode == "cancel":
        time.sleep(.3)
        child = int((d / "child.pid").read_text())
        stat = Path(f"/proc/{child}/stat")
        alive = stat.exists() and stat.read_text().rsplit(")", 1)[1].split()[0] != "Z"
        ok = rc != 0 and elapsed < 5 and not alive
    if mode == "fifo_failure":
        ok &= not (d / "child.pid").exists()
    if version == "after":
        ok &= not list(d.glob("cloud-content.*"))
    result = dict(version=version, script=script, mode=mode, rc=rc,
                  seconds=round(elapsed, 3), passed=bool(ok))
    (d / "result.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result), flush=True)
    return result


cases = [(version, script, mode)
         for version in ("before", "after")
         for script in ("cloud_content_backup", "cloud_content_restore")
         for mode in ("stall", "retry", "plain", "failure", "progress", "large", "listing", "cancel", "fifo_failure")]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    results = list(pool.map(lambda case: run(*case), cases))
summary = {v: {"pass": sum(r["passed"] for r in results if r["version"] == v),
               "fail": sum(not r["passed"] for r in results if r["version"] == v)}
           for v in ("before", "after")}
(a.output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
print(json.dumps(summary), flush=True)
assert summary["before"]["fail"] >= 6, "the original unguarded calls must expose the gap"
assert summary["after"]["fail"] == 0, "the corrected calls must satisfy every control"
