# Guarded swap reclamation on serval

Host maintenance for #410/D-INFRA-015. It is not included in a handheld image.
The owner authorizes one fixed operation before a build: recycle the existing
`/swap.img` when less than20% is free. Default preflight remains read-only.

The helper requires root ownership and safe modes for itself, its directories,
the swapfile and lock. It refuses extra arguments, other swap targets, multiple
active swaps, non-default fstab activation options, an inactive swapfile,
unknown observations and a changed file/configuration. It requires available
RAM equal to used swap plus16GiB and refuses builders, compilers, watchers or
QEMU guests. It takes an exclusive lock and repeats memory/job checks before
mutation. Healthy swap is a no-op. It does not stop unrelated processes.
The lock lives directly in root-owned `/run`, outside writable `/run/lock`.
Serval's observed automatic priority is -1; other negative priorities are
refused for administrator review, rather than assumed portable. Explicit
nonnegative priorities are preserved using `swapon --priority`.

Only absolute `/usr/sbin/swapoff -- /swap.img` and corresponding `swapon` are
run, with a fixed environment. Active state, size and priority are read back.
Normal command failures and handled SIGINT/SIGTERM/SIGHUP paths attempt
reactivation before returning an error. Termination may wait for the current
command's120second timeout. SIGKILL/power loss cannot run process cleanup.
Memory observations are snapshots, not reservations against unrelated work.

## Installation

Review `reclaim-swap`, `install`, the generated policy and the retained tests.
The installer requires administrator authentication and is scoped to serval's
`max` account (uid1000). It copies the standalone helper as root:root0755 to
`/usr/local/sbin/pixelelated-reclaim-swap`, installs root:root0440 policy at
`/etc/sudoers.d/zz-pixelelated-reclaim-swap`, and validates the complete sudoers
configuration, and requires the normal direct `/etc/sudoers.d` include.
Validation failure attempts to restore both prior files and
reports any incomplete rollback with administrator recovery required. A
failed restoration of one file does not skip the other or final validation. Concurrent
installers/reclaimers share one lock. No swap operation occurs during install.

The filename places the one-command exception after `zz-fleet-hardening`.
Sudo-rs uses the last matching rule. The installer refuses later active
include files or directives after the include, and migrates only an unchanged
older `pixelelated-reclaim-swap` entry. It does not modify fleet policy.
Successful parsing and installed checksums alone do not prove effective
permission: verify the noninteractive busy refusal before calling setup ready.

The sole added permission is:

```text
max ALL=(root) NOPASSWD: NOSETENV: /usr/local/sbin/pixelelated-reclaim-swap --reclaim
```

Serval's sudo-rs0.2.13 does not implement command-digest specifications; its
real `visudo` rejected the first proposed policy. Root ownership and modes
enforce the boundary. The installer records/verifies exact SHA256 values;
the policy's hash comment is a receipt, not an enforced digest matcher.
Python uses `-I` to ignore caller module paths and Python environment options.
The installer itself is never granted passwordless access.

From the reviewed folder, the administrator runs:

```bash
sudo /usr/bin/python3 -I tools/host-maintenance/install
```

Use the exact immutable staged path supplied with the release of this host
tool when working from a frozen build checkout. Do not install from an old
checkout. A later helper update requires another reviewed administrator
installation. Re-running a completed installation is safe; an interrupted
installation must be verified/reinstalled before claiming it succeeded.

## Before a future build

Run from a checkout carrying the new preflight, **before** starting its watcher:

```bash
tools/build-preflight --reclaim-swap
```

Missing helper, missing authorization, refused guards or failed readback leave
preflight nonzero. No password prompt is opened. If guests need stopping, use
the separately authorized stop procedure and wait for exit before reclamation;
`--stop-vms` and `--reclaim-swap` cannot be combined. Never recycle swap during
an active build or VM run. A successful preflight does not prevent swap filling
again; keep supervising actual RAM pressure and package activity.
Zero active swap is also a failed preflight, including a later invocation
after unsuccessful reactivation. The helper never silently activates it.

## Recovery and verification

If reactivation cannot be verified, an administrator inspects `/proc/swaps`
and restores this existing swapfile with `/usr/sbin/swapon /swap.img` if it is
inactive. Never reformat it or run `swapoff -a` as a fallback. Retain the error
and verify active state/priority before resuming. No timer retries failures.

`python3 -I tools/host-maintenance/test-swap-reclaim` exercises the production
guard/recovery functions with isolated observations and command doubles. The
preflight integration tests replace only the installed helper path in a
temporary script copy and use fake memory/sudo commands; actual host swap and
sudoers are untouched. A memory-guard-removed negative control must fail.
These tests are not a real kernel recycle or installation proof. Keep those
later host readbacks separately scoped.
