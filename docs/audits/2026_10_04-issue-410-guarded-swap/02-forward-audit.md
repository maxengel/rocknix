# Forward audit

| Criterion | Verdict | Primary evidence / remaining observation |
| --- | --- | --- |
| Fixed target, root ownership, observation and RAM guards; idle checks, serialization, command failure/signal recovery | PASS for isolated software behavior | reclaim-swap trusted/swap_state/headroom/assert_idle/acquire_lock/recycle;35 final fixture tests exercise normal/refused/recovery paths. Actual kernel recycle remains untested. |
| Read-only default and explicit fixed helper call, fresh memory readback | PASS for isolated behavior | build-preflight flag parser/read_memory/helper invocation; Preflight tests include absent/denied helper, false success and malformed counters. Only fixed installed path is replaced in the fixture copy. |
| Narrow root-owned installation, valid exact-action policy, actual permission/ownership receipt | PARTIAL | installer stages and validates policy, restores old files on failed full validation; real visudo accepts policy. Source/root execution and module-path restrictions are present. Privileged installation and live permission readback have not run. |
| Future-build instructions and no mutation of frozen image | PASS for prepared source, PARTIAL for rollout | README and canonical device-build rule describe opt-in/recovery/limits. Running build uses old b137 tool bytes. Review fixes and final receipts are in04/05. Future host installation remains pending. |

No acceptance criterion that requires installation or actual kernel behavior
is closed by these source/fixture results.

Refutation: removing RAM guards fails two assertions; pre-fix regressions
prove the inactive-swap, writable-lock-parent, ESRCH and rollback findings.
The final implementation passes all35 tests; original receipts remain intact.
