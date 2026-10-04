# Retrospective and interactions

The exact host policy validator rejected command-digest syntax: sudo-rs does
not support it. Retained the failure and changed to an exact path/argument,
NOSETENV grant protected by root-owned files/directories. Hashes remain verified
installation receipts, not policy-enforced digest claims.

Interaction boundaries: helper and installer share a root-owned flock;
preflight remains report-only without opt-in; a build watcher must be launched
after reclamation. Active build/VM/compile work blocks mutation. The shell tool
in the frozen active checkout is untouched. No daemon/timer is introduced.

The helper preserves the known default fstab activation and current priority;
unknown flags/non-default negative priorities refuse. After deactivation,
normal failures/handled signals attempt reactivation and verify proc state.
SIGKILL/power loss require explicit administrator recovery. Available RAM is
a snapshot, not a reservation against unrelated allocators starting later.

External review improved the lock location, zero-swap reporting, process-exit
race and rollback recovery. The current negative-control receipt now matches
the final35-test suite; old29/30-test receipts are historical, not final proof.
