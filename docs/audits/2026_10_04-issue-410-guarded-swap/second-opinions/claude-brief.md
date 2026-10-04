# Independent issue410 security review

Review this bounded root-helper implementation before installation. You cannot execute commands or read files outside this packet. First identify your own concrete defects, then attempt to refute/narrow the primary analysis, then name unproven coverage. Prioritize realistic privilege escalation, incorrect swap restoration, unsafe busy/RAM gates, sudo-rs compatibility and installer rollback. Cite packet file:line and a reproducible trigger. Do not treat pending installation as a newly discovered defect; it is explicitly pending. No code changes during this review. This is one independent audit call, not a council. Return concrete findings with severity; avoid speculative generic hardening.


## File: docs/audits/2026_10_04-issue-410-guarded-swap/01-research-notes.md

```text
1: # Research notes — issue410
2: 
3: Scope: one host-maintenance issue, independent depth. Primary: Codex/OpenAI,
4: exact served model suffix not attested. Reviewer: installed Anthropic Fable5.1
5: xhigh via verified Facilitator/OpenRouter, one refutation call. This bounded
6: privilege-boundary audit does not complete M7.P4 or review the product image.
7: Current skill bytes equal next. Scope source hashes are retained; no code
8: mutation while the reviewer is evaluating this version.
9: 
10: Spec: #410 and D-INFRA-015, user request for a guarded host helper. Existing
11: build-preflight detects but does not reclaim swap. Current running cold build
12: b137 is isolated and unchanged. Root helper install is pending interactive
13: owner authentication; fixture passes are not a real kernel recycle.
14: 
15: Primary sources: five files in evidence/source-hashes.json, actual30 fixture
16: tests (subcases included), memory-guard-removed negative control, real host
17: visudo-rs parser and prior rejected digest policy. Host is serval, sudo-rs
18: 0.2.13, one /swap.img with fstab default sw flags and root:root0600 ownership.
19: No external account/cloud data appears in this packet.
```


## File: docs/audits/2026_10_04-issue-410-guarded-swap/02-forward-audit.md

```text
1: # Forward audit
2: 
3: | Criterion | Verdict | Primary evidence / remaining observation |
4: | --- | --- | --- |
5: | Fixed target, root ownership, observation and RAM guards; idle checks, serialization, command failure/signal recovery | PASS for isolated software behavior | reclaim-swap trusted/swap_state/headroom/assert_idle/acquire_lock/recycle;30 fixture tests exercise normal/refused/recovery paths. Actual kernel recycle remains untested. |
6: | Read-only default and explicit fixed helper call, fresh memory readback | PASS for isolated behavior | build-preflight flag parser/read_memory/helper invocation; Preflight tests include absent/denied helper, false success and malformed counters. Only fixed installed path is replaced in the fixture copy. |
7: | Narrow root-owned installation, valid exact-action policy, actual permission/ownership receipt | PARTIAL | installer stages and validates policy, restores old files on failed full validation; real visudo accepts policy. Source/root execution and module-path restrictions are present. Privileged installation and live permission readback have not run. |
8: | Future-build instructions and no mutation of frozen image | PASS for prepared source, PARTIAL for rollout | README and canonical device-build rule describe opt-in/recovery/limits. Running build uses old b137 tool bytes. Future host installation remains pending. |
9: 
10: No acceptance criterion that requires installation or actual kernel behavior
11: is closed by these source/fixture results.
```


## File: docs/audits/2026_10_04-issue-410-guarded-swap/03-retrospective.md

```text
1: # Retrospective and interactions
2: 
3: The exact host policy validator rejected command-digest syntax: sudo-rs does
4: not support it. Retained the failure and changed to an exact path/argument,
5: NOSETENV grant protected by root-owned files/directories. Hashes remain verified
6: installation receipts, not policy-enforced digest claims.
7: 
8: Interaction boundaries: helper and installer share a root-owned flock;
9: preflight remains report-only without opt-in; a build watcher must be launched
10: after reclamation. Active build/VM/compile work blocks mutation. The shell tool
11: in the frozen active checkout is untouched. No daemon/timer is introduced.
12: 
13: The helper preserves the known default fstab activation and current priority;
14: unknown flags/non-default negative priorities refuse. After deactivation,
15: normal failures/handled signals attempt reactivation and verify proc state.
16: SIGKILL/power loss require explicit administrator recovery. Available RAM is
17: a snapshot, not a reservation against unrelated allocators starting later.
```


## File: docs/audits/2026_10_04-issue-410-guarded-swap/04-analysis.md

```text
1: # Analysis — guarded host swap helper
2: 
3: ## Executive summary
4: 
5: Source and isolated tests support the intended narrow privilege boundary.
6: Installation and actual kernel recycle are pending. No blocker defect remains
7: in the primary source review, but independent review has not yet completed.
8: The cold product build is unaffected and is not qualified by this audit.
9: 
10: ## Acceptance-criteria scorecard
11: 
12: Four criteria inspected: two have complete prepared-source/fixture proof;
13: two retain installation/rollout observations. Actual host mutation is untested.
14: Do not convert partial criteria into closed issue checkboxes.
15: 
16: ## Risk assessment
17: 
18: The granted command must never load writable Python modules or accept a path,
19: threshold, command or environment override. Fixed absolute commands, isolated
20: Python, trusted ownership/modes, exact sudo arguments and default-only swap
21: configuration enforce that boundary. Busy/low-RAM races are narrowed by repeat
22: checks; there is no global RAM reservation. Kernel or process death can bypass
23: cleanup. README names the administrator recovery and makes no atomicity claim.
24: 
25: ## Finding Verification
26: 
27: The unsupported command-digest policy was a confirmed implementation issue,
28: resolved before this snapshot by real parser validation. No general sudo grant
29: was substituted. The memory-guard-removed negative control fails the exact
30: headroom and second-observation tests, demonstrating meaningful assertions.
31: Primary self-refutation considered a source-copy root invocation, additional
32: swap devices, symlinks/hardlinks, process namespace hiding, concurrent calls,
33: failed swapoff/swapon, delayed signals, policy rollback and false success.
34: The source guards/tests cover these within the stated fixture boundary.
35: 
36: ## Coverage boundary
37: 
38: No real helper is installed, no sudo grant is active and no kernel recycle
39: has run through this code. Installation/recovery/permission claims remain
40: partial until observed on the host after administrator bootstrap. No fleet-wide
41: provisioning or product-image security audit is implied. Fixtures replace
42: privileged observations/commands; actual signal delivery/kernel scheduling is
43: not simulated as a complete host kernel proof.
44: 
45: ## Quality self-check
46: 
47: Every claim names source and executable receipts; retained failed digest policy
48: and memory mutation demonstrate negative outcomes. Scope is one issue and one
49: host boundary, not the release milestone. No instruction-recommendation mode
50: or council voting is used. Independent response is graded against primary
51: artifacts before any owner installation is requested.
52: 
53: ## Second opinion
54: 
55: Pending: one Anthropic Fable5.1/xhigh refutation call through the Facilitator.
56: Existing project authorization covers independent review of implementation
57: work; the packet contains only this code, public issue/design and test receipts.
```


## File: tools/host-maintenance/reclaim-swap

```text
1: #!/usr/bin/python3 -I
2: """Reclaim only serval's existing /swap.img before a build (#410).
3: 
4: No caller-controlled paths, thresholds, subprocesses or environment settings.
5: The installed, root-owned copy is the only privileged entry point.
6: """
7: import fcntl
8: import os
9: from pathlib import Path
10: import signal
11: import stat
12: import subprocess
13: import sys
14: 
15: TARGET = Path('/swap.img')
16: INSTALLED = Path('/usr/local/sbin/pixelelated-reclaim-swap')
17: LOCK = Path('/run/lock/pixelelated-reclaim-swap.lock')
18: RESERVE_KIB = 16 * 1024 * 1024
19: ENV = {'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'LC_ALL': 'C'}
20: SIGNALS = (signal.SIGINT, signal.SIGTERM, signal.SIGHUP)
21: PENDING_SIGNAL = None
22: 
23: 
24: class Refused(RuntimeError):
25:     pass
26: 
27: 
28: class Interrupted(RuntimeError):
29:     pass
30: 
31: 
32: def trusted(path, directory=False, private=False):
33:     info = path.lstat()
34:     kind = stat.S_ISDIR if directory else stat.S_ISREG
35:     if not kind(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
36:         raise Refused(f'unsafe ownership, type or writable mode: {path}')
37:     if not directory and info.st_nlink != 1:
38:         raise Refused(f'hard-linked file refused: {path}')
39:     if private and info.st_mode & 0o077:
40:         raise Refused(f'private mode required: {path}')
41:     return info
42: 
43: 
44: def swap_state():
45:     lines = Path('/proc/swaps').read_text().splitlines()
46:     if not lines or lines[0].split() != ['Filename', 'Type', 'Size', 'Used', 'Priority']:
47:         raise Refused('cannot parse /proc/swaps header')
48:     rows = []
49:     for line in lines[1:]:
50:         fields = line.split()
51:         if len(fields) != 5:
52:             raise Refused('cannot parse /proc/swaps row')
53:         name, kind = fields[:2]
54:         try:
55:             size, used, priority = map(int, fields[2:])
56:         except ValueError as error:
57:             raise Refused('invalid swap counters') from error
58:         if size <= 0 or not 0 <= used <= size or not -32768 <= priority <= 32767:
59:             raise Refused('invalid swap counters or priority')
60:         rows.append((name, kind, size, used, priority))
61:     if len(rows) > 1 or (rows and rows[0][:2] != (str(TARGET), 'file')):
62:         raise Refused('only one active swapfile, /swap.img, is supported')
63:     return rows[0] if rows else None
64: 
65: 
66: def available_kib():
67:     values = []
68:     for line in Path('/proc/meminfo').read_text().splitlines():
69:         if line.startswith('MemAvailable:'):
70:             fields = line.split()
71:             if len(fields) != 3 or fields[2] != 'kB' or not fields[1].isdigit():
72:                 raise Refused('invalid MemAvailable observation')
73:             values.append(int(fields[1]))
74:     if len(values) != 1:
75:         raise Refused('missing or duplicate MemAvailable observation')
76:     return values[0]
77: 
78: 
79: def assert_idle():
80:     # Require the host process view. Container/sandbox PID views miss other jobs.
81:     if Path('/proc/1/comm').read_text().strip() != 'systemd':
82:         raise Refused('host systemd process namespace required')
83:     builders = {'make', 'gmake', 'ninja', 'cc1', 'cc1plus', 'gcc', 'g++',
84:                 'clang', 'clang++', 'rustc', 'rust-lld', 'ld', 'ld.bfd', 'ld.gold'}
85:     for proc in Path('/proc').glob('[0-9]*'):
86:         try:
87:             words = (proc / 'cmdline').read_bytes().split(b'\0')
88:         except FileNotFoundError:
89:             continue  # Process exited during the observation.
90:         except OSError as error:
91:             raise Refused(f'cannot inspect process {proc.name}') from error
92:         names = [os.fsdecode(word).rsplit('/', 1)[-1] for word in words[:3] if word]
93:         if not names:
94:             continue
95:         compiler = names[0] in builders or names[0].endswith(('-gcc', '-g++', '-clang', '-clang++'))
96:         guest = names[0].startswith('qemu-system-')
97:         watched = 'watch-build' in names or 'watch-job' in names
98:         if compiler or guest or watched:
99:             raise Refused(f'active build, compiler, watcher or VM: PID {proc.name}')
100: 
101: 
102: def file_identity():
103:     trusted(Path('/'), directory=True)
104:     info = trusted(TARGET, private=True)
105:     if info.st_size < 4096:
106:         raise Refused('swapfile is unexpectedly small')
107:     return info.st_dev, info.st_ino, info.st_size
108: 
109: 
110: def assert_default_activation():
111:     # /proc/swaps exposes priority but not discard/other activation flags.
112:     # Limit this helper to the reviewed default host configuration.
113:     rows = [line.split() for line in Path('/etc/fstab').read_text().splitlines()
114:             if line.strip() and not line.lstrip().startswith('#')]
115:     selected = [row for row in rows if row[0] == str(TARGET)]
116:     if (len(selected) != 1 or len(selected[0]) != 6 or
117:             selected[0][1:3] != ['none', 'swap'] or selected[0][3] not in ('sw', 'defaults') or
118:             selected[0][4:] != ['0', '0']):
119:         raise Refused('only the reviewed default /swap.img fstab activation is supported')
120: 
121: 
122: def headroom(row):
123:     available = available_kib()
124:     required = row[3] + RESERVE_KIB
125:     if available < required:
126:         raise Refused(f'need {required} KiB available RAM; observed {available} KiB')
127: 
128: 
129: def command(argv):
130:     result = subprocess.run(argv, env=ENV, stdin=subprocess.DEVNULL,
131:                             stdout=subprocess.PIPE, stderr=subprocess.PIPE,
132:                             text=True, timeout=120, check=False)
133:     if result.returncode:
134:         raise Refused(f'{Path(argv[0]).name} failed with exit {result.returncode}')
135: 
136: 
137: def recycle():
138:     identity = file_identity()
139:     before = swap_state()
140:     if before is None:
141:         raise Refused('/swap.img must already be active; use administrator recovery if inactive')
142:     if (before[2] - before[3]) * 5 >= before[2]:
143:         print('READY: swap has at least 20% free; no change')
144:         return
145:     assert_default_activation()
146:     if before[4] < -1:
147:         raise Refused('cannot preserve a non-default negative swap priority')
148:     assert_idle()
149:     headroom(before)
150:     # Re-read immediately before mutation; headroom is a snapshot, not a reservation.
151:     current = swap_state()
152:     if current is None or current[:3] != before[:3] or current[4] != before[4]:
153:         raise Refused('swap configuration changed during checks')
154:     headroom(current)
155:     assert_idle()
156:     if file_identity() != identity:
157:         raise Refused('swapfile changed during checks')
158:     if PENDING_SIGNAL:
159:         raise Interrupted(f'interrupted by signal {PENDING_SIGNAL} before mutation')
160:     print('Reclaiming /swap.img with 16 GiB RAM reserve', flush=True)
161:     try:
162:         command(['/usr/sbin/swapoff', '--', str(TARGET)])
163:     finally:
164:         # Handled termination cannot interrupt our reactivation attempt. SIGKILL
165:         # and power loss remain outside a process's recovery guarantee.
166:         previous = signal.pthread_sigmask(signal.SIG_BLOCK, SIGNALS)
167:         try:
168:             if file_identity() != identity:
169:                 raise Refused('swapfile changed; administrator recovery required')
170:             active = swap_state()
171:             if active is None:
172:                 args = ['/usr/sbin/swapon']
173:                 if before[4] >= 0:
174:                     args += ['--priority', str(before[4])]
175:                 command(args + ['--', str(TARGET)])
176:             after = swap_state()
177:             if after is None or after[:3] != before[:3] or after[4] != before[4]:
178:                 raise Refused('swap activation/size/priority readback differs')
179:         except BaseException as error:
180:             raise Refused('reactivation could not be verified; administrator must inspect '
181:                           '/proc/swaps and recover with /usr/sbin/swapon /swap.img') from error
182:         finally:
183:             signal.pthread_sigmask(signal.SIG_SETMASK, previous)
184:     if (after[2] - after[3]) * 5 < after[2]:
185:         raise Refused('swap is active but still nearly full; not ready for a build')
186:     if PENDING_SIGNAL:
187:         raise Interrupted(f'interrupted by signal {PENDING_SIGNAL}; swap reactivation verified')
188:     print(f'READY: /swap.img active, priority {after[4]}, {after[2] - after[3]} KiB free')
189: 
190: 
191: def interrupted(signum, _frame):
192:     # Defer termination until the critical section has restored swap. Raising
193:     # asynchronously here could interrupt subprocess cleanup or mask a failed
194:     # reactivation when the signal mask is restored.
195:     global PENDING_SIGNAL
196:     PENDING_SIGNAL = signum
197: 
198: 
199: def acquire_lock():
200:     os.umask(0o077)
201:     trusted(Path('/run'), directory=True)
202:     parent = LOCK.parent.lstat()
203:     if not stat.S_ISDIR(parent.st_mode) or parent.st_uid != 0:
204:         raise Refused('unsafe lock directory')
205:     if parent.st_mode & 0o022 and not parent.st_mode & stat.S_ISVTX:
206:         raise Refused('writable lock directory must be sticky')
207:     fd = os.open(LOCK, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600)
208:     try:
209:         info = os.fstat(fd)
210:         if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o077 or info.st_nlink != 1:
211:             raise Refused('unsafe lock file')
212:         try:
213:             fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
214:         except BlockingIOError as error:
215:             raise Refused('another swap reclamation owns the lock') from error
216:         return fd
217:     except BaseException:
218:         os.close(fd)
219:         raise
220: 
221: 
222: def main(args):
223:     if args != ['--reclaim']:
224:         raise Refused('only --reclaim is supported; no paths or overrides accepted')
225:     if os.geteuid() != 0:
226:         raise Refused('use sudo -n /usr/local/sbin/pixelelated-reclaim-swap --reclaim')
227:     if Path(__file__).absolute() != INSTALLED:
228:         raise Refused('only the installed helper may run as root')
229:     for directory in (Path('/'), Path('/usr'), Path('/usr/local'), INSTALLED.parent):
230:         trusted(directory, directory=True)
231:     trusted(INSTALLED)
232:     fd = acquire_lock()
233:     try:
234:         for sig in SIGNALS:
235:             signal.signal(sig, interrupted)
236:         recycle()
237:     finally:
238:         os.close(fd)
239: 
240: 
241: if __name__ == '__main__':
242:     try:
243:         main(sys.argv[1:])
244:     except (Refused, Interrupted, OSError, subprocess.SubprocessError) as error:
245:         print('REFUSED: ' + str(error), file=sys.stderr)
246:         sys.exit(1)
```


## File: tools/host-maintenance/install

```text
1: #!/usr/bin/python3 -I
2: """One-time administrator installation of the reviewed fixed-action helper."""
3: import hashlib
4: import fcntl
5: import os
6: from pathlib import Path
7: import pwd
8: import stat
9: import subprocess
10: import sys
11: import tempfile
12: 
13: HELPER = Path('/usr/local/sbin/pixelelated-reclaim-swap')
14: POLICY = Path('/etc/sudoers.d/pixelelated-reclaim-swap')
15: ENV = {'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'LC_ALL': 'C'}
16: LOCK = Path('/run/lock/pixelelated-reclaim-swap.lock')
17: 
18: 
19: def policy(data):
20:     digest = hashlib.sha256(data).hexdigest()
21:     return ('# Managed by pixelelated tools/host-maintenance/install (#410).\n'
22:             '# Only this root-owned helper and literal argument; no environment grants.\n'
23:             f'# Installed helper SHA256 {digest} (receipt; sudo-rs has no digest matcher).\n'
24:             'max ALL=(root) NOPASSWD: NOSETENV: '
25:             '/usr/local/sbin/pixelelated-reclaim-swap --reclaim\n').encode()
26: 
27: 
28: def secure(path, directory=False):
29:     info = path.lstat()
30:     expected = stat.S_ISDIR if directory else stat.S_ISREG
31:     if not expected(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
32:         raise RuntimeError(f'unsafe root installation path: {path}')
33:     if not directory and info.st_nlink != 1:
34:         raise RuntimeError(f'hard-linked installation target: {path}')
35: 
36: 
37: def stage(target, data, mode):
38:     fd, name = tempfile.mkstemp(prefix='.' + target.name + '-', dir=target.parent)
39:     path = Path(name)
40:     try:
41:         with os.fdopen(fd, 'wb') as stream:
42:             stream.write(data)
43:             stream.flush()
44:             os.fchown(stream.fileno(), 0, 0)
45:             os.fchmod(stream.fileno(), mode)
46:             os.fsync(stream.fileno())
47:         return path
48:     except BaseException:
49:         path.unlink(missing_ok=True)
50:         raise
51: 
52: 
53: def validate(path):
54:     subprocess.run(['/usr/sbin/visudo', '-c', '-f', str(path)], env=ENV,
55:                    stdin=subprocess.DEVNULL, check=True)
56: 
57: 
58: def install(data):
59:     if os.geteuid() != 0:
60:         raise RuntimeError('administrator authentication is required for installation')
61:     if pwd.getpwnam('max').pw_uid != 1000:
62:         raise RuntimeError('expected serval account max with uid1000')
63:     if Path('/proc/sys/kernel/hostname').read_text().strip() != 'serval':
64:         raise RuntimeError('this reviewed installer is scoped to serval')
65:     for path in [Path('/'), Path('/usr'), Path('/usr/local'), HELPER.parent,
66:                  Path('/etc'), POLICY.parent]:
67:         secure(path, directory=True)
68:     for path in [HELPER, POLICY]:
69:         if path.exists() or path.is_symlink():
70:             secure(path)
71:     validate(Path('/etc/sudoers'))
72:     old_helper = HELPER.read_bytes() if HELPER.exists() else None
73:     old_policy = POLICY.read_bytes() if POLICY.exists() else None
74:     new_helper = None
75:     new_policy = None
76:     changed = False
77:     try:
78:         new_helper = stage(HELPER, data, 0o755)
79:         new_policy = stage(POLICY, policy(data), 0o440)
80:         validate(new_policy)
81:         # Both versions permit only the same root-owned fixed action. Policy is
82:         # validated before replacement; a failed final check restores both files.
83:         new_helper.replace(HELPER)
84:         changed = True
85:         new_policy.replace(POLICY)
86:         validate(Path('/etc/sudoers'))
87:         for path, expected, mode in [(HELPER, data, 0o755), (POLICY, policy(data), 0o440)]:
88:             secure(path)
89:             assert path.read_bytes() == expected and stat.S_IMODE(path.stat().st_mode) == mode
90:             print(f'VERIFIED {path} root:{path.stat().st_gid} mode{mode:o} '
91:                   f'sha256:{hashlib.sha256(expected).hexdigest()}')
92:     except BaseException:
93:         if changed:
94:             for path, old, mode in [(POLICY, old_policy, 0o440), (HELPER, old_helper, 0o755)]:
95:                 if old is None:
96:                     path.unlink(missing_ok=True)
97:                 else:
98:                     stage(path, old, mode).replace(path)
99:             validate(Path('/etc/sudoers'))
100:         raise
101:     finally:
102:         if new_helper:
103:             new_helper.unlink(missing_ok=True)
104:         if new_policy:
105:             new_policy.unlink(missing_ok=True)
106:     print('Installed fixed action only; no swap operation was run.')
107: 
108: 
109: if __name__ == '__main__':
110:     try:
111:         if sys.argv[1:]:
112:             raise RuntimeError('installer accepts no arguments')
113:         source = Path(__file__).absolute().with_name('reclaim-swap')
114:         data = source.read_bytes()
115:         if not data.startswith(b'#!/usr/bin/python3 -I\n'):
116:             raise RuntimeError('helper must use isolated system Python')
117:         compile(data, str(source), 'exec')
118:         if os.geteuid() != 0:
119:             raise RuntimeError('administrator authentication is required for installation')
120:         secure(Path('/run'), directory=True)
121:         lock_parent = LOCK.parent.lstat()
122:         if (not stat.S_ISDIR(lock_parent.st_mode) or lock_parent.st_uid != 0 or
123:                 (lock_parent.st_mode & 0o022 and not lock_parent.st_mode & stat.S_ISVTX)):
124:             raise RuntimeError('unsafe lock directory')
125:         os.umask(0o077)
126:         fd = os.open(LOCK, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600)
127:         try:
128:             info = os.fstat(fd)
129:             if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o077 or info.st_nlink != 1:
130:                 raise RuntimeError('unsafe lock file')
131:             fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
132:             install(data)
133:         finally:
134:             os.close(fd)
135:     except (OSError, RuntimeError, AssertionError, subprocess.SubprocessError) as error:
136:         print('INSTALL FAILED: ' + str(error), file=sys.stderr)
137:         sys.exit(1)
```


## File: tools/host-maintenance/test-swap-reclaim

```text
1: #!/usr/bin/python3 -I
2: """Isolated guard/recovery tests; never issue real swap commands or install policy."""
3: import argparse
4: from contextlib import ExitStack
5: import importlib.machinery
6: import importlib.util
7: import os
8: from pathlib import Path
9: import signal
10: import stat
11: import subprocess
12: import tempfile
13: from types import SimpleNamespace
14: import unittest
15: from unittest.mock import patch
16: 
17: parser = argparse.ArgumentParser()
18: parser.add_argument('--helper', type=Path, default=Path(__file__).with_name('reclaim-swap'))
19: args = parser.parse_args()
20: if os.geteuid() == 0:
21:     parser.error('run the fixture suite unprivileged')
22: 
23: 
24: def load(name, path):
25:     loader = importlib.machinery.SourceFileLoader(name, str(path))
26:     module = importlib.util.module_from_spec(importlib.util.spec_from_loader(name, loader))
27:     loader.exec_module(module)
28:     return module
29: 
30: 
31: helper = load('swap_helper', args.helper)
32: installer = load('swap_installer', Path(__file__).with_name('install'))
33: ROW = ('/swap.img', 'file', 8 * 1024 * 1024, 7 * 1024 * 1024, -1)
34: HEADER = 'Filename Type Size Used Priority\n'
35: 
36: 
37: class Observations(unittest.TestCase):
38:     def test_activation_flags_are_not_silently_lost(self):
39:         for text in ['/swap.img none swap sw 0 0', '/swap.img none swap defaults 0 0']:
40:             with patch.object(Path, 'read_text', return_value=text):
41:                 helper.assert_default_activation()
42:         for text in ['', '/swap.img none swap sw,discard 0 0', '/swap.img none swap sw 1 0',
43:                      '/swap.img none swap sw 0 0\n/swap.img none swap sw 0 0']:
44:             with self.subTest(text=text), patch.object(Path, 'read_text', return_value=text):
45:                 with self.assertRaises(helper.Refused):
46:                     helper.assert_default_activation()
47: 
48:     def test_lock_excludes_concurrent_reclamation(self):
49:         with tempfile.TemporaryDirectory() as directory, ExitStack() as stack:
50:             lock = Path(directory) / 'lock'
51:             stack.enter_context(patch.object(helper, 'LOCK', lock))
52:             stack.enter_context(patch.object(helper, 'trusted'))
53:             stack.enter_context(patch.object(Path, 'lstat', return_value=SimpleNamespace(st_mode=stat.S_IFDIR | 0o700, st_uid=0)))
54:             original = os.fstat
55:             def root_owned(fd):
56:                 info = original(fd)
57:                 return SimpleNamespace(st_mode=info.st_mode, st_uid=0, st_nlink=info.st_nlink)
58:             stack.enter_context(patch.object(helper.os, 'fstat', side_effect=root_owned))
59:             first = helper.acquire_lock()
60:             try:
61:                 with self.assertRaisesRegex(helper.Refused, 'another swap reclamation'):
62:                     helper.acquire_lock()
63:             finally:
64:                 os.close(first)
65:             second = helper.acquire_lock()
66:             os.close(second)
67: 
68:     def test_swap_exact_and_empty(self):
69:         for text, wanted in [(HEADER + '/swap.img file 8192 8100 -1\n', ('/swap.img', 'file', 8192, 8100, -1)), (HEADER, None)]:
70:             with self.subTest(text=text), patch.object(Path, 'read_text', return_value=text):
71:                 self.assertEqual(helper.swap_state(), wanted)
72: 
73:     def test_swap_malformed_or_other_target_refused(self):
74:         for text in ['', 'wrong header\n', HEADER + '/dev/sda partition 10 9 -1', HEADER + '/other file 10 9 -1',
75:                      HEADER + '/swap.img file 10 9 -1\n/swap.img file 10 9 -1', HEADER + '/swap.img file x 9 -1',
76:                      HEADER + '/swap.img file 0 0 -1', HEADER + '/swap.img file 10 11 -1',
77:                      HEADER + '/swap.img file 10 -1 -1', HEADER + '/swap.img file 10 9 32768']:
78:             with self.subTest(text=text), patch.object(Path, 'read_text', return_value=text):
79:                 with self.assertRaises(helper.Refused):
80:                     helper.swap_state()
81: 
82:     def test_available_ram_missing_or_invalid_refused(self):
83:         for text in ['', 'MemAvailable: -1 kB', 'MemAvailable: 2 MB', 'MemAvailable: 2 kB\nMemAvailable: 3 kB']:
84:             with self.subTest(text=text), patch.object(Path, 'read_text', return_value=text):
85:                 with self.assertRaises(helper.Refused):
86:                     helper.available_kib()
87:         with patch.object(Path, 'read_text', return_value='MemAvailable: 12345 kB\n'):
88:             self.assertEqual(helper.available_kib(), 12345)
89: 
90:     def test_unsafe_ownership_mode_links_and_type_refused(self):
91:         for uid, mode, links in [(1000, stat.S_IFREG | 0o600, 1), (0, stat.S_IFREG | 0o620, 1),
92:                                  (0, stat.S_IFREG | 0o604, 1), (0, stat.S_IFLNK | 0o777, 1),
93:                                  (0, stat.S_IFREG | 0o600, 2)]:
94:             with self.subTest(uid=uid, mode=mode, links=links), patch.object(Path, 'lstat', return_value=SimpleNamespace(st_uid=uid, st_mode=mode, st_nlink=links)):
95:                 with self.assertRaises(helper.Refused):
96:                     helper.trusted(Path('/swap.img'), private=True)
97: 
98:     def test_active_jobs_and_container_namespace_refused(self):
99:         for cmd in [b'/usr/bin/make\0all\0', b'/usr/bin/cc1plus\0', b'/toolchain/x86_64-linux-gnu-g++\0',
100:                     b'/usr/bin/qemu-system-x86_64\0', b'/usr/bin/python3\0/repo/tools/watch-build\0',
101:                     b'/bin/bash\0/repo/tools/watch-job\0']:
102:             with self.subTest(cmd=cmd), patch.object(Path, 'read_text', return_value='systemd\n'), patch.object(Path, 'glob', return_value=[Path('/proc/42')]), patch.object(Path, 'read_bytes', return_value=cmd):
103:                 with self.assertRaisesRegex(helper.Refused, 'PID 42'):
104:                     helper.assert_idle()
105:         with patch.object(Path, 'read_text', return_value='bash\n'):
106:             with self.assertRaisesRegex(helper.Refused, 'namespace'):
107:                 helper.assert_idle()
108: 
109:     def test_idle_process_exit_and_unreadable_process(self):
110:         with patch.object(Path, 'read_text', return_value='systemd\n'), patch.object(Path, 'glob', return_value=[Path('/proc/42')]):
111:             with patch.object(Path, 'read_bytes', return_value=b'/usr/bin/postgres\0'):
112:                 helper.assert_idle()
113:             with patch.object(Path, 'read_bytes', side_effect=FileNotFoundError):
114:                 helper.assert_idle()
115:             with patch.object(Path, 'read_bytes', side_effect=PermissionError):
116:                 with self.assertRaises(helper.Refused):
117:                     helper.assert_idle()
118: 
119:     def test_args_nonroot_and_source_copy_cannot_mutate(self):
120:         with patch.object(helper, 'recycle') as mutation:
121:             for argv in [[], ['--reclaim', '/other'], ['--check'], ['--reclaim', '--force']]:
122:                 with self.subTest(argv=argv), self.assertRaises(helper.Refused):
123:                     helper.main(argv)
124:             with patch.object(helper.os, 'geteuid', return_value=1000), self.assertRaises(helper.Refused):
125:                 helper.main(['--reclaim'])
126:             with patch.object(helper.os, 'geteuid', return_value=0), self.assertRaisesRegex(helper.Refused, 'installed'):
127:                 helper.main(['--reclaim'])
128:             mutation.assert_not_called()
129: 
130:     def test_command_uses_fixed_environment_no_shell_and_failure_propagates(self):
131:         with patch.object(helper.subprocess, 'run', return_value=SimpleNamespace(returncode=0)) as run:
132:             helper.command(['/usr/sbin/swapoff', '--', '/swap.img'])
133:             self.assertEqual(run.call_args.args[0], ['/usr/sbin/swapoff', '--', '/swap.img'])
134:             self.assertEqual(run.call_args.kwargs['env'], {'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'LC_ALL': 'C'})
135:             self.assertNotIn('shell', run.call_args.kwargs)
136:         with patch.object(helper.subprocess, 'run', return_value=SimpleNamespace(returncode=2)):
137:             with self.assertRaises(helper.Refused):
138:                 helper.command(['/usr/sbin/swapoff', '--', '/swap.img'])
139: 
140: 
141: class Reclamation(unittest.TestCase):
142:     def setUp(self):
143:         self.stack = ExitStack()
144:         self.addCleanup(self.stack.close)
145:         self.row = ROW
146:         self.calls = []
147:         self.identity = self.stack.enter_context(patch.object(helper, 'file_identity', return_value=(1, 2, 8589934592)))
148:         self.stack.enter_context(patch.object(helper, 'swap_state', side_effect=lambda: self.row))
149:         self.memory = self.stack.enter_context(patch.object(helper, 'available_kib', return_value=32 * 1024 * 1024))
150:         self.idle = self.stack.enter_context(patch.object(helper, 'assert_idle'))
151:         self.stack.enter_context(patch.object(helper, 'assert_default_activation'))
152:         self.stack.enter_context(patch.object(helper, 'PENDING_SIGNAL', None))
153:         self.action = self.stack.enter_context(patch.object(helper, 'command', side_effect=self.command))
154: 
155:     def command(self, argv):
156:         self.calls.append(argv)
157:         if argv[0] == '/usr/sbin/swapoff':
158:             self.row = None
159:         elif argv[0] == '/usr/sbin/swapon':
160:             priority = int(argv[2]) if '--priority' in argv else -1
161:             self.row = (*ROW[:3], 0, priority)
162:         else:
163:             raise AssertionError('unexpected command')
164: 
165:     def test_reclaims_only_one_file_and_restores_priority(self):
166:         helper.recycle()
167:         self.assertEqual(self.calls, [['/usr/sbin/swapoff', '--', '/swap.img'], ['/usr/sbin/swapon', '--', '/swap.img']])
168:         self.assertEqual(self.row, (*ROW[:3], 0, -1))
169:         self.calls.clear()
170:         self.row = (*ROW[:4], 17)
171:         helper.recycle()
172:         self.assertEqual(self.calls[-1], ['/usr/sbin/swapon', '--priority', '17', '--', '/swap.img'])
173:         self.assertEqual(self.row[4], 17)
174: 
175:     def test_healthy_noop_and_inactive_refusal(self):
176:         self.row = (*ROW[:3], 0, -1)
177:         helper.recycle()
178:         self.action.assert_not_called()
179:         self.row = None
180:         with self.assertRaises(helper.Refused):
181:             helper.recycle()
182:         self.action.assert_not_called()
183: 
184:     def test_unrestorable_negative_priority_refuses(self):
185:         self.row = (*ROW[:4], -2)
186:         with self.assertRaisesRegex(helper.Refused, 'negative swap priority'):
187:             helper.recycle()
188:         self.action.assert_not_called()
189: 
190:     def test_insufficient_memory_and_boundary(self):
191:         self.memory.return_value = ROW[3] + helper.RESERVE_KIB - 1
192:         with self.assertRaisesRegex(helper.Refused, 'available RAM'):
193:             helper.recycle()
194:         self.action.assert_not_called()
195:         self.memory.return_value += 1
196:         helper.recycle()
197:         self.assertEqual(len(self.calls), 2)
198: 
199:     def test_second_memory_read_refuses_new_pressure(self):
200:         self.memory.side_effect = [32 * 1024 * 1024, 1]
201:         with self.assertRaises(helper.Refused):
202:             helper.recycle()
203:         self.action.assert_not_called()
204: 
205:     def test_job_started_during_checks_refuses_before_mutation(self):
206:         self.idle.side_effect = [None, helper.Refused('new active build')]
207:         with self.assertRaisesRegex(helper.Refused, 'new active build'):
208:             helper.recycle()
209:         self.action.assert_not_called()
210: 
211:     def test_active_job_and_changed_file_refuse_before_mutation(self):
212:         self.idle.side_effect = helper.Refused('active job')
213:         with self.assertRaises(helper.Refused):
214:             helper.recycle()
215:         self.action.assert_not_called()
216:         self.idle.side_effect = None
217:         self.identity.side_effect = [(1, 2, 8589934592), (1, 3, 8589934592)]
218:         with self.assertRaises(helper.Refused):
219:             helper.recycle()
220:         self.action.assert_not_called()
221: 
222:     def test_failed_swapoff_still_active_is_not_success(self):
223:         self.action.side_effect = helper.Refused('swapoff failed')
224:         with self.assertRaisesRegex(helper.Refused, 'swapoff failed'):
225:             helper.recycle()
226:         self.assertEqual(self.row, ROW)
227:         self.assertEqual(self.action.call_count, 1)
228: 
229:     def test_partial_swapoff_failure_and_interruption_reactivate(self):
230:         for error in [helper.Refused('swapoff failed after deactivation'), helper.Interrupted('cancelled')]:
231:             with self.subTest(error=error):
232:                 self.row, self.calls = ROW, []
233:                 def command(argv):
234:                     self.command(argv)
235:                     if argv[0].endswith('swapoff'):
236:                         raise error
237:                 self.action.side_effect = command
238:                 with self.assertRaises(type(error)):
239:                     helper.recycle()
240:                 self.assertEqual(self.row[3], 0)
241:                 self.assertEqual(len(self.calls), 2)
242: 
243:     def test_failed_swapon_never_reports_success(self):
244:         def command(argv):
245:             if argv[0].endswith('swapon'):
246:                 raise helper.Refused('swapon failed')
247:             self.command(argv)
248:         self.action.side_effect = command
249:         with self.assertRaisesRegex(helper.Refused, 'administrator must inspect'):
250:             helper.recycle()
251:         self.assertIsNone(self.row)
252: 
253:     def test_false_swapon_success_and_priority_drift_refused(self):
254:         for wrong in [None, (*ROW[:3], 0, 9)]:
255:             self.row = ROW
256:             def command(argv):
257:                 self.command(argv)
258:                 if argv[0].endswith('swapon'):
259:                     self.row = wrong
260:             self.action.side_effect = command
261:             with self.assertRaisesRegex(helper.Refused, 'reactivation'):
262:                 helper.recycle()
263: 
264:     def test_signal_acknowledged_only_after_reactivation(self):
265:         def command(argv):
266:             self.command(argv)
267:             if argv[0].endswith('swapoff'):
268:                 helper.interrupted(signal.SIGTERM, None)
269:         self.action.side_effect = command
270:         with self.assertRaisesRegex(helper.Interrupted, 'reactivation verified'):
271:             helper.recycle()
272:         self.assertEqual(self.row[3], 0)
273:         self.assertEqual(len(self.calls), 2)
274: 
275: 
276: class Preflight(unittest.TestCase):
277:     def setUp(self):
278:         self.directory = tempfile.TemporaryDirectory()
279:         self.addCleanup(self.directory.cleanup)
280:         root = Path(self.directory.name)
281:         self.state = root / 'reclaimed'
282:         self.calls = root / 'calls'
283:         self.helper_path = root / 'installed-helper'
284:         self.script = root / 'build-preflight'
285:         source = Path(__file__).resolve().parents[1] / 'build-preflight'
286:         self.script.write_text(source.read_text().replace('/usr/local/sbin/pixelelated-reclaim-swap', str(self.helper_path)))
287:         fixtures = {
288:             'pgrep': '#!/bin/sh\nexit 1\n',
289:             'free': '''#!/bin/sh
290: [ "$TEST_MODE" = invalid ] && { echo malformed; exit 0; }
291: used=8191; remaining=1
292: [ -f "$TEST_STATE" ] && { used=0; remaining=8192; }
293: printf 'total used free shared buff/cache available\nMem: 64000 16000 1000 0 47000 48000\nSwap: 8192 %s %s\n' "$used" "$remaining"
294: ''',
295:             'sudo': '''#!/bin/sh
296: printf '%s\n' "$@" > "$TEST_CALLS"
297: [ "$#" = 4 ] && [ "$1" = -n ] && [ "$2" = -- ] && [ "$3" = "$TEST_HELPER" ] && [ "$4" = --reclaim ] || exit 96
298: [ "$TEST_MODE" = denied ] && exit 1
299: [ "$TEST_MODE" = stale ] || touch "$TEST_STATE"
300: exit 0
301: ''',
302:             'installed-helper': '#!/bin/sh\nexit 97\n',
303:         }
304:         for name, text in fixtures.items():
305:             path = root / name
306:             path.write_text(text)
307:             path.chmod(0o755)
308:         self.env = {'PATH': str(root) + ':/usr/bin:/bin', 'LC_ALL': 'C',
309:                     'TEST_MODE': 'success', 'TEST_STATE': str(self.state),
310:                     'TEST_CALLS': str(self.calls), 'TEST_HELPER': str(self.helper_path)}
311: 
312:     def run_preflight(self, *args):
313:         return subprocess.run(['/bin/bash', str(self.script), *args], env=self.env,
314:                               capture_output=True, text=True)
315: 
316:     def test_default_is_read_only(self):
317:         result = self.run_preflight()
318:         self.assertEqual(result.returncode, 1)
319:         self.assertFalse(self.calls.exists())
320:         self.assertFalse(self.state.exists())
321: 
322:     def test_opt_in_uses_only_fixed_sudo_action_and_fresh_readback(self):
323:         result = self.run_preflight('--reclaim-swap')
324:         self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
325:         self.assertEqual(self.calls.read_text().splitlines(), ['-n', '--', str(self.helper_path), '--reclaim'])
326:         self.assertIn('0MB used, 8192MB free', result.stdout)
327: 
328:     def test_missing_permission_or_false_success_does_not_pass(self):
329:         for mode in ['denied', 'stale']:
330:             with self.subTest(mode=mode):
331:                 self.env['TEST_MODE'] = mode
332:                 result = self.run_preflight('--reclaim-swap')
333:                 self.assertEqual(result.returncode, 1)
334:                 self.assertNotIn('\nREADY\n', result.stdout)
335: 
336:     def test_missing_helper_is_visible(self):
337:         self.helper_path.unlink()
338:         result = self.run_preflight('--reclaim-swap')
339:         self.assertEqual(result.returncode, 1)
340:         self.assertIn('RECLAIM UNAVAILABLE', result.stdout)
341:         self.assertFalse(self.calls.exists())
342: 
343:     def test_bad_observations_or_options_never_mutate(self):
344:         self.env['TEST_MODE'] = 'invalid'
345:         result = self.run_preflight('--reclaim-swap')
346:         self.assertEqual(result.returncode, 1)
347:         self.assertIn('cannot read valid', result.stdout)
348:         for argv in [('--force',), ('--stop-vms', '--reclaim-swap')]:
349:             self.assertEqual(self.run_preflight(*argv).returncode, 2)
350:         self.assertFalse(self.calls.exists())
351: 
352: 
353: class Installation(unittest.TestCase):
354:     def test_policy_is_exact_action_with_hash_receipt_and_valid_sudoers(self):
355:         data = args.helper.read_bytes()
356:         policy = installer.policy(data).decode()
357:         self.assertIn('max ALL=(root) NOPASSWD: NOSETENV: ', policy)
358:         self.assertIn(installer.hashlib.sha256(data).hexdigest(), policy)
359:         self.assertEqual(len([line for line in policy.splitlines() if not line.startswith('#')]), 1)
360:         self.assertTrue(policy.endswith(' /usr/local/sbin/pixelelated-reclaim-swap --reclaim\n'))
361:         self.assertNotIn('*', policy)
362:         with tempfile.TemporaryDirectory() as directory:
363:             target = Path(directory) / 'policy'
364:             target.write_text(policy)
365:             result = subprocess.run(['/usr/sbin/visudo', '-c', '-f', str(target)], capture_output=True, text=True)
366:             self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
367: 
368:     def test_unprivileged_installation_cannot_write(self):
369:         with patch.object(installer, 'stage') as stage, self.assertRaises(RuntimeError):
370:             installer.install(b'irrelevant')
371:         stage.assert_not_called()
372: 
373:     def test_policy_validation_failure_rolls_back_both_files(self):
374:         with tempfile.TemporaryDirectory() as directory, ExitStack() as stack:
375:             helper_path, policy_path = Path(directory) / 'helper', Path(directory) / 'policy'
376:             helper_path.write_bytes(b'old-helper'); helper_path.chmod(0o755)
377:             policy_path.write_bytes(b'old-policy'); policy_path.chmod(0o440)
378:             stack.enter_context(patch.object(installer, 'HELPER', helper_path))
379:             stack.enter_context(patch.object(installer, 'POLICY', policy_path))
380:             stack.enter_context(patch.object(installer.os, 'geteuid', return_value=0))
381:             stack.enter_context(patch.object(installer.pwd, 'getpwnam', return_value=SimpleNamespace(pw_uid=1000)))
382:             stack.enter_context(patch.object(Path, 'read_text', return_value='serval\n'))
383:             stack.enter_context(patch.object(installer, 'secure'))
384:             stack.enter_context(patch.object(installer.os, 'fchown'))
385:             stack.enter_context(patch.object(installer, 'validate', side_effect=[None, None, RuntimeError('full policy rejected'), None]))
386:             with self.assertRaisesRegex(RuntimeError, 'full policy rejected'):
387:                 installer.install(b'new-helper')
388:             self.assertEqual(helper_path.read_bytes(), b'old-helper')
389:             self.assertEqual(policy_path.read_bytes(), b'old-policy')
390:             self.assertEqual(sorted(p.name for p in Path(directory).iterdir()), ['helper', 'policy'])
391: 
392: 
393: if __name__ == '__main__':
394:     unittest.main(argv=['test-swap-reclaim'], verbosity=2)
```


## File: tools/host-maintenance/README.md

```text
1: # Guarded swap reclamation on serval
2: 
3: Host maintenance for #410/D-INFRA-015. It is not included in a handheld image.
4: The owner authorizes one fixed operation before a build: recycle the existing
5: `/swap.img` when less than20% is free. Default preflight remains read-only.
6: 
7: The helper requires root ownership and safe modes for itself, its directories,
8: the swapfile and lock. It refuses extra arguments, other swap targets, multiple
9: active swaps, non-default fstab activation options, an inactive swapfile,
10: unknown observations and a changed file/configuration. It requires available
11: RAM equal to used swap plus16GiB and refuses builders, compilers, watchers or
12: QEMU guests. It takes an exclusive lock and repeats memory/job checks before
13: mutation. Healthy swap is a no-op. It does not stop unrelated processes.
14: 
15: Only absolute `/usr/sbin/swapoff -- /swap.img` and corresponding `swapon` are
16: run, with a fixed environment. Active state, size and priority are read back.
17: Normal command failures and handled SIGINT/SIGTERM/SIGHUP paths attempt
18: reactivation before returning an error. Termination may wait for the current
19: command's120second timeout. SIGKILL/power loss cannot run process cleanup.
20: Memory observations are snapshots, not reservations against unrelated work.
21: 
22: ## Installation
23: 
24: Review `reclaim-swap`, `install`, the generated policy and the retained tests.
25: The installer requires administrator authentication and is scoped to serval's
26: `max` account (uid1000). It copies the standalone helper as root:root0755 to
27: `/usr/local/sbin/pixelelated-reclaim-swap`, installs root:root0440 policy at
28: `/etc/sudoers.d/pixelelated-reclaim-swap`, and validates the complete sudoers
29: configuration. Validation failure restores both prior files. Concurrent
30: installers/reclaimers share one lock. No swap operation occurs during install.
31: 
32: The sole added permission is:
33: 
34: ```text
35: max ALL=(root) NOPASSWD: NOSETENV: /usr/local/sbin/pixelelated-reclaim-swap --reclaim
36: ```
37: 
38: Serval's sudo-rs0.2.13 does not implement command-digest specifications; its
39: real `visudo` rejected the first proposed policy. Root ownership and modes
40: enforce the boundary. The installer records/verifies exact SHA256 values;
41: the policy's hash comment is a receipt, not an enforced digest matcher.
42: Python uses `-I` to ignore caller module paths and Python environment options.
43: The installer itself is never granted passwordless access.
44: 
45: From the reviewed folder, the administrator runs:
46: 
47: ```bash
48: sudo /usr/bin/python3 -I tools/host-maintenance/install
49: ```
50: 
51: Use the exact immutable staged path supplied with the release of this host
52: tool when working from a frozen build checkout. Do not install from an old
53: checkout. A later helper update requires another reviewed administrator
54: installation. Re-running a completed installation is safe; an interrupted
55: installation must be verified/reinstalled before claiming it succeeded.
56: 
57: ## Before a future build
58: 
59: Run from a checkout carrying the new preflight, **before** starting its watcher:
60: 
61: ```bash
62: tools/build-preflight --reclaim-swap
63: ```
64: 
65: Missing helper, missing authorization, refused guards or failed readback leave
66: preflight nonzero. No password prompt is opened. If guests need stopping, use
67: the separately authorized stop procedure and wait for exit before reclamation;
68: `--stop-vms` and `--reclaim-swap` cannot be combined. Never recycle swap during
69: an active build or VM run. A successful preflight does not prevent swap filling
70: again; keep supervising actual RAM pressure and package activity.
71: 
72: ## Recovery and verification
73: 
74: If reactivation cannot be verified, an administrator inspects `/proc/swaps`
75: and restores this existing swapfile with `/usr/sbin/swapon /swap.img` if it is
76: inactive. Never reformat it or run `swapoff -a` as a fallback. Retain the error
77: and verify active state/priority before resuming. No timer retries failures.
78: 
79: `python3 -I tools/host-maintenance/test-swap-reclaim` exercises the production
80: guard/recovery functions with isolated observations and command doubles. The
81: preflight integration tests replace only the installed helper path in a
82: temporary script copy and use fake memory/sudo commands; actual host swap and
83: sudoers are untouched. A memory-guard-removed negative control must fail.
84: These tests are not a real kernel recycle or installation proof. Keep those
85: later host readbacks separately scoped.
```


## File: tools/build-preflight

```text
1: #!/bin/bash
2: # SPDX-License-Identifier: GPL-2.0-or-later
3: # Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)
4: #
5: # build-preflight -- what the machine has before a build takes it.
6: #
7: #   tools/build-preflight            # report only
8: #   tools/build-preflight --stop-vms # also stop running QA guests
9: #   tools/build-preflight --reclaim-swap # guarded host helper, before a build
10: #
11: # Builds here are memory-bound, not disk-bound, and the two are easy to
12: # confuse: /workspace has terabytes free while the box runs out of RAM. On
13: # 2026-09-19 a cold GENERIC_X64 build reached webkitgtk, compiled WebCore at
14: # CONCURRENCY_MAKE_LEVEL=nproc=24, and the kernel killed cc1plus twice. It
15: # also killed a running QA guest and a background watcher, so the first
16: # symptom was silence rather than an error.
17: #
18: # What this checks, and why each one:
19: #
20: #   RAM        the constraint. A heavyweight C++ package wants 1.5-2.5 GB per
21: #              parallel compiler.
22: #   Swap       a full swap means there is no cushion left: the next spike goes
23: #              to the OOM killer rather than degrading. Reclaiming it needs
24: #              root. Default mode reports only; --reclaim-swap uses the installed guarded helper.
25: #   QA guests  each QEMU guest holds ~2 GB and they are often left up for
26: #              days. They are also what the build will kill first.
27: #   Disk       reported for completeness; it has never been the limit here.
28: #
29: # It exits 0 when the machine looks ready, 1 when something is worth fixing
30: # first. It never stops a guest without --stop-vms, because a guest may be
31: # holding QA state someone is in the middle of.
32: 
33: set -u
34: STOP_VMS=0
35: RECLAIM_SWAP=0
36: for option in "$@"; do
37:     case "$option" in
38:         --stop-vms) STOP_VMS=1 ;;
39:         --reclaim-swap) RECLAIM_SWAP=1 ;;
40:         -h|--help)
41:             echo 'usage: tools/build-preflight [--stop-vms] [--reclaim-swap]'
42:             echo 'Default is read-only. Reclaim runs the installed fixed-action helper before a build.'
43:             exit 0 ;;
44:         *) echo "build-preflight: unknown option: $option" >&2; exit 2 ;;
45:     esac
46: done
47: if [ "$STOP_VMS" = 1 ] && [ "$RECLAIM_SWAP" = 1 ]; then
48:     echo 'Stop guests first, wait for them to exit, then run --reclaim-swap separately.' >&2
49:     exit 2
50: fi
51: 
52: verdict=0
53: say() { printf '%s\n' "$*"; }
54: 
55: read_memory() {
56:     local observation value
57:     observation=$(free -m) || return 1
58:     read -r _ mem_total mem_used _ _ _ mem_avail <<<"$(awk 'NR==2' <<<"$observation")"
59:     read -r _ swap_total swap_used swap_free <<<"$(awk 'NR==3' <<<"$observation")"
60:     for value in "$mem_total" "$mem_used" "$mem_avail" "$swap_total" "$swap_used" "$swap_free"; do
61:         [[ "$value" =~ ^[0-9]+$ ]] || return 1
62:     done
63:     [ "$mem_total" -gt 0 ] && [ "$mem_avail" -le "$mem_total" ] &&
64:         [ "$swap_free" -le "$swap_total" ] && [ "$swap_used" -le "$swap_total" ]
65: }
66: read_memory || { say 'ERROR: cannot read valid host memory counters'; exit 1; }
67: if [ "$RECLAIM_SWAP" = 1 ] && [ "$swap_total" -gt 0 ] && [ "$swap_free" -lt $(( swap_total / 5 )) ]; then
68:     helper=/usr/local/sbin/pixelelated-reclaim-swap
69:     if [ ! -x "$helper" ]; then
70:         say '  RECLAIM UNAVAILABLE: install the reviewed tools/host-maintenance helper first.'
71:         verdict=1
72:     elif ! sudo -n -- "$helper" --reclaim; then
73:         say '  RECLAIM REFUSED: helper guards or administrator installation need attention.'
74:         verdict=1
75:     fi
76:     # The helper's exit status is not the memory observation; read the host again.
77:     read_memory || { say 'ERROR: cannot read valid host memory counters after reclaim'; exit 1; }
78: fi
79: say "RAM    ${mem_total}MB total, ${mem_used}MB used, ${mem_avail}MB available"
80: say "Swap   ${swap_total}MB total, ${swap_used}MB used, ${swap_free}MB free"
81: say "Disk   $(df -h /workspace | awk 'NR==2{print $4" free of "$2}')  (not the usual limit)"
82: say ""
83: 
84: if [ "$mem_avail" -lt 16000 ]; then
85:     say "  LOW: under 16GB available. A heavyweight package will not fit beside this."
86:     verdict=1
87: fi
88: if [ "$swap_total" -gt 0 ] && [ "$swap_free" -lt $(( swap_total / 5 )) ]; then
89:     say "  SWAP EXHAUSTED: ${swap_free}MB of ${swap_total}MB free. There is no cushion;"
90:     say "    the next spike is an OOM kill rather than a slowdown. To reclaim it:"
91:     say '      tools/build-preflight --reclaim-swap'
92:     say '    Uses the installed guarded /swap.img helper; see tools/host-maintenance/README.md.'
93:     verdict=1
94: fi
95: 
96: guests=$(pgrep -f 'qemu-system-x86_64' 2>/dev/null)
97: if [ -n "$guests" ]; then
98:     say "  QA guests running:"
99:     for p in $guests; do
100:         rss=$(( $(ps -o rss= -p "$p" 2>/dev/null || echo 0) / 1024 ))
101:         [ "$rss" -lt 64 ] && continue
102:         mon=$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null | grep -oE 'monitor-[a-z]\.sock' | head -1)
103:         up=$(ps -o etime= -p "$p" 2>/dev/null | tr -d ' ')
104:         say "      pid $p  ${mon:-unknown}  ${rss}MB  up ${up}"
105:         if [ "$STOP_VMS" = 1 ]; then
106:             kill "$p" 2>/dev/null && say "        stopped"
107:         fi
108:     done
109:     if [ "$STOP_VMS" = 0 ]; then
110:         say "    Each is ~2GB, and a build under pressure will kill them before it fails"
111:         say "    itself -- one was lost that way on 2026-09-19. Stop the idle ones with"
112:         say "    --stop-vms, or leave them knowingly."
113:         verdict=1
114:     fi
115: fi
116: 
117: say ""
118: [ "$verdict" = 0 ] && say "READY" || say "Worth clearing the above first; a build that finishes beats one that is fast."
119: exit "$verdict"
```


## File: docs/audits/2026_10_04-issue-410-guarded-swap/evidence/tests.log

```text
1: test_policy_is_exact_action_with_hash_receipt_and_valid_sudoers (__main__.Installation.test_policy_is_exact_action_with_hash_receipt_and_valid_sudoers) ... ok
2: test_policy_validation_failure_rolls_back_both_files (__main__.Installation.test_policy_validation_failure_rolls_back_both_files) ... ok
3: test_unprivileged_installation_cannot_write (__main__.Installation.test_unprivileged_installation_cannot_write) ... ok
4: test_activation_flags_are_not_silently_lost (__main__.Observations.test_activation_flags_are_not_silently_lost) ... ok
5: test_active_jobs_and_container_namespace_refused (__main__.Observations.test_active_jobs_and_container_namespace_refused) ... ok
6: test_args_nonroot_and_source_copy_cannot_mutate (__main__.Observations.test_args_nonroot_and_source_copy_cannot_mutate) ... ok
7: test_available_ram_missing_or_invalid_refused (__main__.Observations.test_available_ram_missing_or_invalid_refused) ... ok
8: test_command_uses_fixed_environment_no_shell_and_failure_propagates (__main__.Observations.test_command_uses_fixed_environment_no_shell_and_failure_propagates) ... ok
9: test_idle_process_exit_and_unreadable_process (__main__.Observations.test_idle_process_exit_and_unreadable_process) ... ok
10: test_lock_excludes_concurrent_reclamation (__main__.Observations.test_lock_excludes_concurrent_reclamation) ... ok
11: test_swap_exact_and_empty (__main__.Observations.test_swap_exact_and_empty) ... ok
12: test_swap_malformed_or_other_target_refused (__main__.Observations.test_swap_malformed_or_other_target_refused) ... ok
13: test_unsafe_ownership_mode_links_and_type_refused (__main__.Observations.test_unsafe_ownership_mode_links_and_type_refused) ... ok
14: test_bad_observations_or_options_never_mutate (__main__.Preflight.test_bad_observations_or_options_never_mutate) ... ok
15: test_default_is_read_only (__main__.Preflight.test_default_is_read_only) ... ok
16: test_missing_helper_is_visible (__main__.Preflight.test_missing_helper_is_visible) ... ok
17: test_missing_permission_or_false_success_does_not_pass (__main__.Preflight.test_missing_permission_or_false_success_does_not_pass) ... ok
18: test_opt_in_uses_only_fixed_sudo_action_and_fresh_readback (__main__.Preflight.test_opt_in_uses_only_fixed_sudo_action_and_fresh_readback) ... ok
19: test_active_job_and_changed_file_refuse_before_mutation (__main__.Reclamation.test_active_job_and_changed_file_refuse_before_mutation) ... ok
20: test_failed_swapoff_still_active_is_not_success (__main__.Reclamation.test_failed_swapoff_still_active_is_not_success) ... Reclaiming /swap.img with 16 GiB RAM reserve
21: ok
22: test_failed_swapon_never_reports_success (__main__.Reclamation.test_failed_swapon_never_reports_success) ... Reclaiming /swap.img with 16 GiB RAM reserve
23: ok
24: test_false_swapon_success_and_priority_drift_refused (__main__.Reclamation.test_false_swapon_success_and_priority_drift_refused) ... Reclaiming /swap.img with 16 GiB RAM reserve
25: Reclaiming /swap.img with 16 GiB RAM reserve
26: ok
27: test_healthy_noop_and_inactive_refusal (__main__.Reclamation.test_healthy_noop_and_inactive_refusal) ... ok
28: test_insufficient_memory_and_boundary (__main__.Reclamation.test_insufficient_memory_and_boundary) ... READY: swap has at least 20% free; no change
29: Reclaiming /swap.img with 16 GiB RAM reserve
30: ok
31: test_job_started_during_checks_refuses_before_mutation (__main__.Reclamation.test_job_started_during_checks_refuses_before_mutation) ... ok
32: test_partial_swapoff_failure_and_interruption_reactivate (__main__.Reclamation.test_partial_swapoff_failure_and_interruption_reactivate) ... READY: /swap.img active, priority -1, 8388608 KiB free
33: Reclaiming /swap.img with 16 GiB RAM reserve
34: Reclaiming /swap.img with 16 GiB RAM reserve
35: ok
36: test_reclaims_only_one_file_and_restores_priority (__main__.Reclamation.test_reclaims_only_one_file_and_restores_priority) ... Reclaiming /swap.img with 16 GiB RAM reserve
37: READY: /swap.img active, priority -1, 8388608 KiB free
38: Reclaiming /swap.img with 16 GiB RAM reserve
39: ok
40: test_second_memory_read_refuses_new_pressure (__main__.Reclamation.test_second_memory_read_refuses_new_pressure) ... ok
41: test_signal_acknowledged_only_after_reactivation (__main__.Reclamation.test_signal_acknowledged_only_after_reactivation) ... READY: /swap.img active, priority 17, 8388608 KiB free
42: Reclaiming /swap.img with 16 GiB RAM reserve
43: ok
44: test_unrestorable_negative_priority_refuses (__main__.Reclamation.test_unrestorable_negative_priority_refuses) ... ok
45: 
46: ----------------------------------------------------------------------
47: Ran 30 tests in 0.196s
48: 
49: OK
```


## File: docs/audits/2026_10_04-issue-410-guarded-swap/evidence/negative-memory-guard.log

```text
1: test_policy_is_exact_action_with_hash_receipt_and_valid_sudoers (__main__.Installation.test_policy_is_exact_action_with_hash_receipt_and_valid_sudoers) ... ok
2: test_policy_validation_failure_rolls_back_both_files (__main__.Installation.test_policy_validation_failure_rolls_back_both_files) ... ok
3: test_unprivileged_installation_cannot_write (__main__.Installation.test_unprivileged_installation_cannot_write) ... ok
4: test_activation_flags_are_not_silently_lost (__main__.Observations.test_activation_flags_are_not_silently_lost) ... ok
5: test_active_jobs_and_container_namespace_refused (__main__.Observations.test_active_jobs_and_container_namespace_refused) ... ok
6: test_args_nonroot_and_source_copy_cannot_mutate (__main__.Observations.test_args_nonroot_and_source_copy_cannot_mutate) ... ok
7: test_available_ram_missing_or_invalid_refused (__main__.Observations.test_available_ram_missing_or_invalid_refused) ... ok
8: test_command_uses_fixed_environment_no_shell_and_failure_propagates (__main__.Observations.test_command_uses_fixed_environment_no_shell_and_failure_propagates) ... ok
9: test_idle_process_exit_and_unreadable_process (__main__.Observations.test_idle_process_exit_and_unreadable_process) ... ok
10: test_lock_excludes_concurrent_reclamation (__main__.Observations.test_lock_excludes_concurrent_reclamation) ... ok
11: test_swap_exact_and_empty (__main__.Observations.test_swap_exact_and_empty) ... ok
12: test_swap_malformed_or_other_target_refused (__main__.Observations.test_swap_malformed_or_other_target_refused) ... ok
13: test_unsafe_ownership_mode_links_and_type_refused (__main__.Observations.test_unsafe_ownership_mode_links_and_type_refused) ... ok
14: test_bad_observations_or_options_never_mutate (__main__.Preflight.test_bad_observations_or_options_never_mutate) ... ok
15: test_default_is_read_only (__main__.Preflight.test_default_is_read_only) ... ok
16: test_missing_helper_is_visible (__main__.Preflight.test_missing_helper_is_visible) ... ok
17: test_missing_permission_or_false_success_does_not_pass (__main__.Preflight.test_missing_permission_or_false_success_does_not_pass) ... ok
18: test_opt_in_uses_only_fixed_sudo_action_and_fresh_readback (__main__.Preflight.test_opt_in_uses_only_fixed_sudo_action_and_fresh_readback) ... ok
19: test_active_job_and_changed_file_refuse_before_mutation (__main__.Reclamation.test_active_job_and_changed_file_refuse_before_mutation) ... ok
20: test_failed_swapoff_still_active_is_not_success (__main__.Reclamation.test_failed_swapoff_still_active_is_not_success) ... Reclaiming /swap.img with 16 GiB RAM reserve
21: ok
22: test_failed_swapon_never_reports_success (__main__.Reclamation.test_failed_swapon_never_reports_success) ... Reclaiming /swap.img with 16 GiB RAM reserve
23: ok
24: test_false_swapon_success_and_priority_drift_refused (__main__.Reclamation.test_false_swapon_success_and_priority_drift_refused) ... Reclaiming /swap.img with 16 GiB RAM reserve
25: Reclaiming /swap.img with 16 GiB RAM reserve
26: ok
27: test_healthy_noop_and_inactive_refusal (__main__.Reclamation.test_healthy_noop_and_inactive_refusal) ... ok
28: test_insufficient_memory_and_boundary (__main__.Reclamation.test_insufficient_memory_and_boundary) ... READY: swap has at least 20% free; no change
29: Reclaiming /swap.img with 16 GiB RAM reserve
30: FAIL
31: test_partial_swapoff_failure_and_interruption_reactivate (__main__.Reclamation.test_partial_swapoff_failure_and_interruption_reactivate) ... READY: /swap.img active, priority -1, 8388608 KiB free
32: Reclaiming /swap.img with 16 GiB RAM reserve
33: Reclaiming /swap.img with 16 GiB RAM reserve
34: ok
35: test_reclaims_only_one_file_and_restores_priority (__main__.Reclamation.test_reclaims_only_one_file_and_restores_priority) ... Reclaiming /swap.img with 16 GiB RAM reserve
36: READY: /swap.img active, priority -1, 8388608 KiB free
37: Reclaiming /swap.img with 16 GiB RAM reserve
38: ok
39: test_second_memory_read_refuses_new_pressure (__main__.Reclamation.test_second_memory_read_refuses_new_pressure) ... READY: /swap.img active, priority 17, 8388608 KiB free
40: Reclaiming /swap.img with 16 GiB RAM reserve
41: FAIL
42: test_signal_acknowledged_only_after_reactivation (__main__.Reclamation.test_signal_acknowledged_only_after_reactivation) ... READY: /swap.img active, priority -1, 8388608 KiB free
43: Reclaiming /swap.img with 16 GiB RAM reserve
44: ok
45: test_unrestorable_negative_priority_refuses (__main__.Reclamation.test_unrestorable_negative_priority_refuses) ... ok
46: 
47: ======================================================================
48: FAIL: test_insufficient_memory_and_boundary (__main__.Reclamation.test_insufficient_memory_and_boundary)
49: ----------------------------------------------------------------------
50: Traceback (most recent call last):
51:   File "/workspace/repos/rocknix.worktrees/conflict-resolution/tools/host-maintenance/test-swap-reclaim", line 192, in test_insufficient_memory_and_boundary
52:     with self.assertRaisesRegex(helper.Refused, 'available RAM'):
53:          ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
54: AssertionError: Refused not raised
55: 
56: ======================================================================
57: FAIL: test_second_memory_read_refuses_new_pressure (__main__.Reclamation.test_second_memory_read_refuses_new_pressure)
58: ----------------------------------------------------------------------
59: Traceback (most recent call last):
60:   File "/workspace/repos/rocknix.worktrees/conflict-resolution/tools/host-maintenance/test-swap-reclaim", line 201, in test_second_memory_read_refuses_new_pressure
61:     with self.assertRaises(helper.Refused):
62:          ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^
63: AssertionError: Refused not raised
64: 
65: ----------------------------------------------------------------------
66: Ran 29 tests in 0.202s
67: 
68: FAILED (failures=2)
```


## File: docs/audits/2026_10_04-issue-410-guarded-swap/evidence/initial-digest-policy-rejection.log

```text
1: test_policy_is_digest_bound_exact_action_and_valid_sudoers (__main__.Installation.test_policy_is_digest_bound_exact_action_and_valid_sudoers) ... FAIL
2: test_policy_validation_failure_rolls_back_both_files (__main__.Installation.test_policy_validation_failure_rolls_back_both_files) ... ok
3: test_unprivileged_installation_cannot_write (__main__.Installation.test_unprivileged_installation_cannot_write) ... ok
4: test_active_jobs_and_container_namespace_refused (__main__.Observations.test_active_jobs_and_container_namespace_refused) ... ok
5: test_args_nonroot_and_source_copy_cannot_mutate (__main__.Observations.test_args_nonroot_and_source_copy_cannot_mutate) ... ok
6: test_available_ram_missing_or_invalid_refused (__main__.Observations.test_available_ram_missing_or_invalid_refused) ... ok
7: test_command_uses_fixed_environment_no_shell_and_failure_propagates (__main__.Observations.test_command_uses_fixed_environment_no_shell_and_failure_propagates) ... ok
8: test_idle_process_exit_and_unreadable_process (__main__.Observations.test_idle_process_exit_and_unreadable_process) ... ok
9: test_swap_exact_and_empty (__main__.Observations.test_swap_exact_and_empty) ... ok
10: test_swap_malformed_or_other_target_refused (__main__.Observations.test_swap_malformed_or_other_target_refused) ... ok
11: test_unsafe_ownership_mode_links_and_type_refused (__main__.Observations.test_unsafe_ownership_mode_links_and_type_refused) ... ok
12: test_active_job_and_changed_file_refuse_before_mutation (__main__.Reclamation.test_active_job_and_changed_file_refuse_before_mutation) ... ok
13: test_failed_swapoff_still_active_is_not_success (__main__.Reclamation.test_failed_swapoff_still_active_is_not_success) ... Reclaiming /swap.img with 16 GiB RAM reserve
14: ok
15: test_failed_swapon_never_reports_success (__main__.Reclamation.test_failed_swapon_never_reports_success) ... Reclaiming /swap.img with 16 GiB RAM reserve
16: ok
17: test_false_swapon_success_and_priority_drift_refused (__main__.Reclamation.test_false_swapon_success_and_priority_drift_refused) ... Reclaiming /swap.img with 16 GiB RAM reserve
18: Reclaiming /swap.img with 16 GiB RAM reserve
19: ok
20: test_healthy_noop_and_inactive_refusal (__main__.Reclamation.test_healthy_noop_and_inactive_refusal) ... ok
21: test_insufficient_memory_and_boundary (__main__.Reclamation.test_insufficient_memory_and_boundary) ... READY: swap has at least 20% free; no change
22: Reclaiming /swap.img with 16 GiB RAM reserve
23: ok
24: test_partial_swapoff_failure_and_interruption_reactivate (__main__.Reclamation.test_partial_swapoff_failure_and_interruption_reactivate) ... READY: /swap.img active, priority -1, 8388608 KiB free
25: Reclaiming /swap.img with 16 GiB RAM reserve
26: Reclaiming /swap.img with 16 GiB RAM reserve
27: ok
28: test_reclaims_only_one_file_and_restores_priority (__main__.Reclamation.test_reclaims_only_one_file_and_restores_priority) ... Reclaiming /swap.img with 16 GiB RAM reserve
29: READY: /swap.img active, priority -1, 8388608 KiB free
30: Reclaiming /swap.img with 16 GiB RAM reserve
31: ok
32: test_second_memory_read_refuses_new_pressure (__main__.Reclamation.test_second_memory_read_refuses_new_pressure) ... ok
33: test_signal_acknowledged_only_after_reactivation (__main__.Reclamation.test_signal_acknowledged_only_after_reactivation) ... READY: /swap.img active, priority 17, 8388608 KiB free
34: Reclaiming /swap.img with 16 GiB RAM reserve
35: ok
36: 
37: ======================================================================
38: FAIL: test_policy_is_digest_bound_exact_action_and_valid_sudoers (__main__.Installation.test_policy_is_digest_bound_exact_action_and_valid_sudoers)
39: ----------------------------------------------------------------------
40: Traceback (most recent call last):
41:   File "/workspace/repos/rocknix.worktrees/conflict-resolution/tools/host-maintenance/test-swap-reclaim", line 245, in test_policy_is_digest_bound_exact_action_and_valid_sudoers
42:     self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
43:     ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
44: AssertionError: 1 != 0 : /tmp/tmp3e3416gu/policy:3:36: syntax error: digest specifications are not supported
45: max ALL=(root) NOPASSWD: NOSETENV: sha256:98de1079421657946196e17d43ada3b1b7c20028353fb64660f0329cb38c20fd /usr/local/sbin/pixelelated-reclaim-swap --reclaim
46:                                    ^~~~~~
47: visudo: invalid sudoers file
48: 
49: 
50: ----------------------------------------------------------------------
51: Ran 21 tests in 0.016s
52: 
53: FAILED (failures=1)
```
