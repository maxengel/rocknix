# Independent review — issue410 guarded swap helper

Scope honored: packet-only, no execution, pending installation is not a finding. Order: my defects → refute/narrow primary → unproven coverage.

## A. Concrete defects

### F1 — Priority gate refuses the kernel's actual default; helper is fail-closed dead-on-arrival on any ≥4.14 kernel
**Severity: High (functional blocker) / none (security — refusal happens before mutation)**
- `reclaim-swap:146-147` refuses when `before[4] < -1`. Since Linux 4.14 (`least_priority` initialised to -1, `--least_priority` on activation), the first swap activated without `pri=` gets priority **-2**, not -1. `01-research-notes:17-18` attests fstab flags and 0600 ownership but never the `/proc/swaps` priority; the fixture hard-codes -1 (`test-swap-reclaim:33`, `:69`) and `test_unrestorable_negative_priority_refuses` (`:184-188`) enshrines -2 as "unrestorable".
- Restoration mechanics are otherwise sound: swapoff does `least_priority++` and a plain `swapon` (`reclaim-swap:172-175`) yields -2 again for a sole swap, so the readback at `:177` would pass if the gate accepted it. The gate, not the restore, is wrong.
- Trigger (pre-install, read-only): `awk 'NR>1{print $5}' /proc/swaps` on serval. If `-2`, every `--reclaim-swap` run with <20% free ends `REFUSED: cannot preserve a non-default negative swap priority`; preflight prints `RECLAIM REFUSED` (`build-preflight:72-74`). `03-retrospective:13-14` ("preserves … current priority") is false for the host's own default.

### F2 — Negative-control receipt is from a different revision of the test suite
**Severity: Medium (evidence integrity)**
- `tests.log:47` "Ran 30 tests"; `negative-memory-guard.log:66` "Ran 29 tests". `test_job_started_during_checks_refuses_before_mutation` (`tests.log:31`) has no counterpart in the negative log (`:28-31`). The two expected failures do appear, but `04-analysis:29-30`, `README:83` and `01-research-notes:16` present this as a receipt against the shipped suite; it is not. `evidence/source-hashes.json` is referenced (`01:15`) but absent from the packet, so the mismatch cannot be resolved here.
- Trigger: diff test names between the two logs.

### F3 — Shared lock in world-writable sticky `/run/lock` can be pre-empted by any local user, every boot
**Severity: Low (local DoS, fail-closed)**
- `reclaim-swap:17`, `:205-206` explicitly accept a writable+sticky parent; `:207` `O_CREAT` opens a pre-existing file; `:210` then refuses `uid≠0` (or `open` fails EACCES under `fs.protected_regular`). Same in `install:16`, `:120-131`, so installer and helper are both blocked.
- Trigger: any uid ≠0 after boot: `touch /run/lock/pixelelated-reclaim-swap.lock` → `REFUSED: unsafe lock file` / `INSTALL FAILED` until root removes it; /run is tmpfs so the window reopens each reboot. The helper's own `trusted()` rules would reject this directory class anywhere else.

### F4 — After a failed reactivation, default preflight hides the missing swap
**Severity: Low**
- `build-preflight:67` and `:88` are both gated on `swap_total -gt 0`. If the helper exits via `reclaim-swap:179-181` with `/swap.img` off, the *invoking* run is nonzero (README:65 holds), but any later `tools/build-preflight` prints `Swap 0MB total…`, emits no swap warning, and prints `READY` if `mem_avail ≥16000` and no guests. `--reclaim-swap` in that state silently never calls the helper.
- Trigger: `/swap.img` inactive → `tools/build-preflight` → `READY` possible.

### F5 — 120 s swapoff timeout is likely short for the only case it runs
**Severity: Low (spurious refusal, wasted I/O; safe)**
- `reclaim-swap:132` `timeout=120`; `:142` means swapoff only runs with ≥80% used (≥6.4 GiB on 8 GiB). On timeout `subprocess.run` SIGKILLs swapoff; kernel `try_to_unuse` returns -EINTR and re-inserts the swap, so state is safe and `:170-178` passes, but the run ends `REFUSED` with a `TimeoutExpired` message after up to 120 s of random 4K swap-in. Realistic on SATA/HDD; `README:19` frames the timeout as a termination bound, not a success bound.

### F6 — Idle gate hard-refuses on ESRCH race
**Severity: Info (fail-closed)**
- `reclaim-swap:86-91` tolerates only `FileNotFoundError`; a task reaped between `open` and `read` of `cmdline` yields `ProcessLookupError` (ESRCH) → `Refused('cannot inspect process')`. Rare, spurious, safe.

### F7 — Installer rollback is not exception-safe and leaks rollback temps
**Severity: Low**
- `install:92-100`: if `stage()`/`replace()` for POLICY raises during rollback, HELPER restoration (`:94` loop) and the final `validate` (`:99`) are skipped and the original cause is shadowed; `finally` (`:101-105`) cleans only `new_helper`/`new_policy`, not temps staged by rollback. Fixture test (`test-swap-reclaim:373-390`) mocks `secure`, `validate`, `fchown` and only the happy rollback ordering. README:54-55 does warn to re-verify interrupted installs.

### Privilege escalation — none realistic found
Surface examined: argv (`reclaim-swap:223`), env (`-I` shebang `:1`, `NOSETENV` + fixed child `ENV` `:19`, `:130`), module path (`-I`, root-owned stdlib), subprocess targets (absolute `:162`, `:172`), caller-influenced reads (`/proc/*/cmdline` as bytes, PID-only in error text `:99`), file identity/mode/hardlink checks (`:32-41`, `:102-107`), lock (`:199-219`). Residual is availability only: anything running as `max` (including a non-interactive agent) can force an up-to-8 GiB swap-in whenever the snapshot gates pass. That is the intended grant.

## B. Refute / narrow the primary analysis (04-analysis.md)

- `04:6` "No blocker defect remains": **narrowed** — F1 is a fail-closed functional blocker unless serval's priority is attested -1 (unlikely on a sudo-rs 0.2.13-era kernel).
- `04:29-30` negative control "demonstrating meaningful assertions": **narrowed** by F2 — receipt is from a 29-test revision.
- `04:31-34` "concurrent calls … policy rollback … covered": concurrency is covered only among root callers (F3 unconsidered); rollback is covered only with `secure/validate/fchown` mocked (F7).
- `04:21-22` busy/RAM races "narrowed by repeat checks": **holds**, with two bounds not stated there — no gate runs during the ≤120 s swapoff (acknowledged at `reclaim-swap:150`), and the busy gate is a name list anchored on `make`/driver processes (`:83-84`); `cc`, `c++`, `collect2`, `lto1`, `ld.lld`, `mold`, `cargo` are absent. Adequate for make-driven ROCKNIX builds, not general.
- `02-forward-audit:5` row-1 PASS: **narrowed** to "PASS against a -1-priority fixture".
- `README:28-29` "validates the complete sudoers configuration" (`install:71`, `:86`): true only if sudo-rs `visudo -c -f /etc/sudoers` traverses `@includedir`; not evidenced.
- sudo-rs compatibility that **is** proven by real-parser receipts: `NOPASSWD: NOSETENV:` + exact path/argument accepted (`tests.log:1`), digest matcher rejected (`initial-digest-policy-rejection.log:44-47`). `04:27-29` holds.

## C. Unproven coverage (closeable without installing unless noted)
1. `/proc/swaps` priority on serval (F1) — one read.
2. `ls -ld /usr/local /usr/local/sbin`: Debian-style `root:staff 2775` fails `reclaim-swap:229-230` and `install:65-67`.
3. `@includedir /etc/sudoers.d` present in serval's `/etc/sudoers`; sudo-rs `visudo -c -f` include traversal; installer has no grant-effectiveness check (e.g., `sudo -n -l` as max) — only file bytes/modes are verified (`install:87-91`). (Effectiveness itself requires install.)
4. sudo-rs CLI acceptance of `-n --` exactly as `build-preflight:72` issues it — exercised only against a shell fixture (`test-swap-reclaim:295-301`).
5. Signal-mask inheritance into the `swapon` child (`reclaim-swap:166` + fork) and SIGHUP relay under sudo-rs `use_pty` — reasoned safe, not observed.
6. Real swapoff duration on serval's storage vs 120 s (F5).
7. `source-hashes.json` absent; correspondence between reviewed bytes and tested bytes asserted only (F2).
8. Real kernel recycle, rollback with real visudo as root — explicitly pending; not counted.

## Verdict
Boundary design is sound; no escalation path. Hold installation on F1 (one read of `/proc/swaps` decides it) and regenerate the negative-control receipt (F2). F3–F7 are fail-closed quality items.