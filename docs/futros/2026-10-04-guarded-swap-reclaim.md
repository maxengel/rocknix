# Futro: guarded build-host swap reclamation (#410)

## 1. What do we know and what are we assuming?

The owner authorized a guarded host helper after manually resetting swap.
The existing build-preflight is report-only except its explicit stop-vms flag.
Serval has one active root-owned /swap.img; Python3, util-linux swapoff/swapon,
sudo and systemd are installed. Actual sudo -n requires authentication; an
old cloud-init NOPASSWD example is not current host policy. The cold b137
build is now running under the frozen watcher. Changes stay in the feature
checkout, never the active build. Next/feature instructions agree.

Use existing Linux tools with a narrow wrapper, not a daemon or a new memory
manager. Normal memory reclamation remains the kernel's. The helper performs
one explicit pre-build maintenance action only when swap is nearly full.

## 2. What known unknowns need investigation?

One-time root installation requires owner authentication; prepare the exact
reviewable installer/helper/policy and isolated evidence before asking for
that action. A real recycle cannot be tested while the current build runs.
Source tests can verify syscall command scope, guard refusal and recovery;
read-only installation proof is distinct from a real kernel transition.
Root-owned host policy takes precedence over the historical provisioning
example; do not change fleet hardening or acquire root through Docker.

## 3. What patterns from prior work apply that we haven't named?

Build-preflight/watch-job introduction4d20659b77 records how memory pressure
killed both a compiler and its watcher. Current watcher guards provide process
ownership/results and package-log activity; retain them. D-INFRA-002's narrow
standalone mechanism and checked preconditions apply. Existing D-INFRA-009
confines its Docker exception to a pinned flashing device, not host root.

## 4. What could we be missing?

A future agent could call swapoff -a, accept a caller-controlled path or
threshold, grant unrestricted sudo, run a writable Python module as root,
interpret a positive command status as successful reactivation, or clear
swap during a build. Fix the target/commands/policy, use isolated Python,
validate ownership/modes and active state, serialize helpers, require swap
used plus16GiB available headroom, refuse active builders/guests and re-read
before mutation. Attempt reactivation in failure and handled-signal paths;
verify actual active swap and restored priority. SIGKILL/power loss cannot
be repaired by a finally block; keep the explicit recovery command visible.
The memory check is a snapshot, not a RAM reservation against unrelated work.

## 5. What adjustments or investigations must happen BEFORE execution?

Record #410 and this bounded design; inspect proc state, actual command paths
and installer destinations. Test with injected observations/commands and
retain failure cases; use no runtime environment or CLI test bypass in the
installed helper. Only the reviewed root-owned fixed action gets sudoers
permission. Default preflight stays read-only; explicit reclaim precedes the
watcher/build. No timers, broad privilege grants, unrelated process stops or
changes to the frozen image inputs. Current build remains supervised.
