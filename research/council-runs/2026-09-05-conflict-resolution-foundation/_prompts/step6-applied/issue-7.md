**What changed.** The boot sync exists (`autostart/102-cloud-saves`) and is wrong twice: it gates on `ping -c1 google.com` — which fails for a LAN remote and passes while the player's provider is down (`.claude/rules/rclone-cloud-sync.md` § Reachability means the remote) — and it runs the newest-wins pair (blindspot 28). Both are fixed by the #22 cutover in the same image.

### Requirements

- Boot: wait for a **default route** (`ip route`, the shipped `check_network_link`), not ICMP; then `cloud_reconcile --full --yes` under `L_T`. The reconciler's own listing is the reachability test; failure words the reason.
- Unattended: never opens the wizard; counts and badges (#22 R11; D-CLOUD-035).
- While it runs, game launch is refused with the shipped sync message and the exit push, if it collides, exits 3 as SKIPPED (D-CLOUD-038; changelog test 5 remains the fixture).
- Shutdown: a `cloud_reconcile --to-cloud --yes` before network teardown, through `L_T`, as a systemd unit ordered before the network target. Not part of #11's drop; sequenced after the cutover so it never adds a second writer.
- Stamps keep their names (D-UI-017/018/020); the row lines stay two (D-UI-023).

### Acceptance

- [ ] A LAN-only WebDAV remote syncs at boot with no internet; a device on a network that blocks `google.com` syncs at boot.
- [ ] With the provider down, boot reports a failure naming the remote, not a success.
- [ ] Both-sides-changed at boot: neither copy is overwritten; the row shows `1 waiting` (A1's boot leg).
- [ ] Launch a game within a minute of boot with both toggles on: the shipped refusal appears while the pass runs; the log shows one reconciler run, not two writers.

**Does not build**: nothing outside `cloud_reconcile`; no ICMP anywhere in the saves path.

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*
