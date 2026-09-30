# The cloud provider and the network for the fork's small machines (read 2026-09-30)

Maintainer, 2026-09-30: *"I'd rather go with what we think is the best longer term cloud provider. I'd never used Hostinger until yesterday, and so if you'd like to research the two and what would be best for our longer term needs as well between Vulture and Hostinger, let's pick between those two."* And: *"we could create another one for the agent, and we could lock this all down inside of a tailnet, or if it's easy enough to do, a headscale."*

Every number below was read on 2026-09-30 from the vendor's own page or API, except where marked; prices move, so the issue that buys a machine re-reads them.

## What the machines are for

| Need | Now | Later |
| --- | --- | --- |
| The secret store, OpenBao in a container (#347) | one tiny always-on VM, no public ports | the same |
| The agent's host, rasterabot (#348) | one small VM: `gh`, git, Node 24 for the Facilitator, Python for the mail SDK, ssh to serval over the tailnet | the same |
| A runner or a cloud build box (#344 P5, D-WORKFLOW-084) | none | a 24 to 32 vCPU, 64 to 128 GB, 500 GB+ NVMe machine, or bare metal, for cold builds and hosted QA experiments |
| The placeholder site (#345) | GitHub Pages, no VM | the same |
| Domain and mail | Hostinger | Hostinger |

## Vultr (public API, 2026-09-30)

- 151 instance plans, 33 regions, 23 bare-metal plans.
- Smallest: `vc2-1c-0.5gb` 1 vCPU, 512 MB, 10 GB at $3.50/month; `vc2-1c-1gb` 1 vCPU, 1 GB, 25 GB at $5; `vhf-1c-1gb` (high frequency) at $6; `vhf-2c-4gb` 2 vCPU, 4 GB, 128 GB at $24.
- Build-box class: `voc-c-32c-64gb-500s-amd` 32 vCPU, 64 GB, 500 GB at $640/month; `vx1-g-32c-128g-1920s` 32 vCPU, 128 GB, 1.9 TB at $893; bare metal from `vbm-4c-32gb` at $120 to `vbm-8c-132gb` 8 cores, 128 GB, two 1.9 TB disks at $350.
- Hourly billing; block storage, snapshots and automatic backups exist (their prices could not be read by an automated fetch; Vultr's published rates as previously known are backups at a fifth of the instance price, snapshots and NVMe block storage per GB per month; verify on the pricing page at purchase).
- Terraform: `vultr/terraform-provider-vultr`, Vultr's own, v2.32.0 (2026-07-14), repository updated 2026-09-28.
- Third-party reads: 32 to 33 locations; one 90-day uptime test at 99.998%; a poor Trustpilot score in one comparison.

## Hostinger VPS (vendor page and API docs, 2026-09-30)

- Four plans, KVM 1 to KVM 8: 1 vCPU, 4 GB, 50 GB at $6.49/month ($11.99 on renewal) up to 8 vCPU, 32 GB, 400 GB at $25.99 ($49.99 on renewal). **8 vCPU and 32 GB is the ceiling**; nothing larger, no bare metal, no GPU.
- AMD EPYC, NVMe, 1 Gbps; free weekly backups; manual snapshots; a firewall; DDoS filtering; a malware scanner; a Docker Compose manager; monthly billing at a promotional price that roughly doubles on renewal.
- API: 63 VPS endpoints in 13 sections, including firewall (11), snapshots (4), backups (2), recovery (2), Docker manager (10), public keys (4); bearer tokens; 90 requests a minute; official CLI and SDKs (PHP, Python, TypeScript).
- Terraform: `hostinger/terraform-provider-hostinger`, Hostinger's own, 0.1.23 (2026-09-07); manages VPS instances, SSH keys, post-install scripts and DNS records; snapshots and firewall rules are API-only, not Terraform.

## The network: Tailscale or Headscale

- **Tailscale, Personal plan (free):** up to 6 users, unlimited devices, 3 ACL groups, 50 tagged resources, Tailscale SSH on up to 5 hosts, subnet routers and exit nodes. Standard is $8 per user per month for unlimited users, 10 ACL groups and SSO. The fleet here is one person and about seven machines (the Mac, serval, marvin, the second Lenovo, the store, the agent, perhaps an SBC): well inside the free plan.
- **Headscale** (`juanfont/headscale`, v0.29.4 on 2026-09-23, 44,000 stars): an open-source, self-hosted implementation of Tailscale's control server; the same Tailscale clients talk to it. Supports ACLs and grants, MagicDNS, exit nodes, subnet routers, Tailscale SSH, OIDC registration, an embedded DERP relay, Taildrop. Not supported: Funnel, Serve, network flow logs; tailnet lock and node sharing are not listed. It needs a host with a public IP (dual-stack recommended), HTTPS on 443, UDP 3478 if the embedded DERP is used, SQLite by default; every device re-registers against it.
- What that means here: everything the plan needs (an ACL that lets the bot reach serval and the store and nothing else reach the store; MagicDNS; ssh over the tailnet) is in both. Headscale adds one public endpoint to run, patch and back up, and a control plane whose outage stops new connections; the free Tailscale plan adds nothing to run and nothing to pay.

## Recommendation

1. **Vultr for every machine.** It scales from a $3.50 instance to bare metal under one account, bills hourly, has Vultr's own Terraform provider, and was already the vendor named for any cloud box. Hostinger's VPS ceiling of 8 vCPU and 32 GB rules it out for a build box, and its pricing is promotional then double. **Hostinger keeps the domain and the mail**, which it does well and whose API and CLI are good.
2. **Two small Vultr instances, not one:** the store on the smallest plan with a mounted volume, the agent on a 2 vCPU, 4 GB instance; both with the vendor firewall closed except the tailnet, snapshots on a schedule. About $30 a month for both. The store's unseal material stays outside both.
3. **Tailscale's free plan now; Headscale as an experiment, not a migration.** Lock the fleet down inside the existing tailnet with a three-group ACL (owner, bot, hosts). Once the store's VM exists, run Headscale beside OpenBao on it for a month with a second, throwaway tailnet of two or three devices; move the fleet only if it proves itself and the free plan's limits (6 users, 5 SSH hosts, 3 ACL groups) start to bind, or if control is wanted for its own sake. The maintainer's principle, *"the more control we have over the stack, the better"*, points at Headscale eventually; the plan's principle, nothing in advance of a shown need, says not yet.

## Sources

Vultr public API (`/v2/plans`, `/v2/plans-metal`, `/v2/regions`); Hostinger's VPS page and `docs.hostinger.com/api-reference`; `github.com/vultr/terraform-provider-vultr`; `github.com/hostinger/terraform-provider-hostinger`; `headscale.net/stable/about/features/` and `/setup/requirements/`; `tailscale.com/pricing`; comparison pages found by search (vpsbenchmarks, hostadvice, 1vps), read as third-party opinion only.

## Added the same day: DNS, the two-networks question, and storage

**DNS (D-WORKFLOW-104, 105).** The domain stays at its registrar, iwantmyname; its name servers move from there to Cloudflare, whose DNS points each record to its service: MX to Hostinger for the mail, a CNAME to GitHub Pages for the placeholder, anything else to where it lives, with Cloudflare's proxy and firewall in front of any web-facing name. The earlier assumption that DNS sat at Hostinger was wrong and is corrected in #345.

**One tailnet, not two.** serval is already a member of the maintainer's personal tailnet with marvin and the Mac. A Tailscale node belongs to one tailnet at a time, so a second tailnet for the fork's machines would need a bridge: either a subnet router in each network advertising the other's addresses, or two `tailscaled` daemons on serval with separate state, sockets and TUN devices, which works on Linux and is the trick people describe. Neither is needed here. The fork's machines are the maintainer's machines; they join the existing tailnet under **tags** (`tag:rasteratops-store`, `tag:rasteratops-agent`, `tag:build`) and the ACL says who reaches what: the agent may ssh to serval and reach the store; the owner may reach everything; nothing else reaches the store. That is three ACL groups, inside the free plan. If the fleet later moves to Headscale, that is when a second control plane exists, and the subnet-router bridge is the way to keep serval reachable from both during the move.

**Storage.** Backblaze B2's own documentation (2026) lists Vultr among the compute partners to which egress from B2 is free, beside Cloudflare, and the maintainer already runs a Plex server that way: compute on Vultr, media on B2, no transfer fees between them. The fork's storage needs are the same shape and small: the off-host backup scope of #344 row 14 (unpushed work, local-only configuration, release records, retained candidates), the archive of fetched source tarballs (about 38 GB today), copies of the immutable candidates (an image is 1 to 2 GB), and QA frames if they are ever kept. So: **B2 buckets for the archive and the backup scope, Vultr instances for compute**, with the restore drill pulling from B2 to a fresh Vultr instance at no transfer cost. Vultr's own object storage is the alternative if one vendor matters more than the maintainer's existing account and the free egress. B2's list price is about $6 per TB per month; the buying issue reads the current figure.

## Corrected the same evening: serval is on the maintainer's work tailnet

Maintainer, 2026-09-30: *"Currently, Servel is connected to my work telnet because occasionally it needs access to it. Maybe the better policy would be to figure out a way to just share several machines within the telnet to Servel and allow Servel to disconnect from that telnet, or think of another strategy."*

That reverses the "one tailnet" paragraph above: the fork's machines must never join an employer's tailnet, and serval should not have it as home. Read from Tailscale's own documentation today:

- **Fast user switching.** One device may be logged into several accounts, so several tailnets, with one active at a time; `tailscale switch <account>` swaps on Linux, and the apps do it on macOS, iOS, Windows and Android; switching back needs no re-authentication unless the node key expired. The limit: *"A device is not able to transmit packets on multiple tailnets simultaneously"*; connections on the inactive tailnet drop while switched.
- **Node sharing.** Only an Owner, Admin or IT admin of the sharing tailnet can share a machine; the recipient gets inbound access to it, the shared machine cannot start connections into the recipient's tailnet, the sharing tailnet's ACLs apply, and it works on every plan including the free one.

**Recommendation.** serval's home becomes a tailnet of the maintainer's own (the free plan, a personal account), with the store, the agent, marvin and the Mac; the fork's ACL lives there. For the occasional work access, serval keeps the work account logged in and the maintainer runs `tailscale switch` to it for the task and back afterwards: no bridge, no second daemon, nothing to ask of the employer. While switched, serval is off the fork's tailnet, so the agent cannot reach it and the store is unreachable from it; that is acceptable for short, deliberate windows, is never done by the bot, and is recorded in the action log like any other state change on the box. Sharing work machines into the personal tailnet would need a work admin's action and puts the employer's ACLs on those machines, so it is the fallback, not the plan; two daemons on serval is the fallback after that. The alternative that avoids switching altogether: do the occasional work task from the Mac, which is on the work tailnet already, and let serval leave it entirely.

**Added: the maintainer is the work tailnet's admin, and the machines are headless.** Maintainer, 2026-09-30: *"I am the work admin, if that makes any difference. Also, since these are all headless machines, can the Tailscale network switch be done via the CLI?"* It does make a difference: node sharing needs an Owner, Admin or IT admin of the sharing tailnet, so the ranking above reverses. **Sharing first:** serval's home is the personal tailnet; the few work machines it occasionally needs are shared into it by the maintainer as the work admin, reached without switching, under the work tailnet's ACLs; the reverse direction, if ever needed, is serval shared from the personal tailnet to the work user. Whether sharing employer machines into a personal tailnet is within the employer's policy is the maintainer's judgement; admin rights give the ability, not the permission. **Switching second**, for anything that is not a single shareable node. And yes, all of it is CLI on a headless box: `tailscale login` adds a second account as a new profile while the first stays logged in; `tailscale switch --list` shows them; `tailscale switch <account>` swaps the active one; `tailscale logout` removes one; against a Headscale server, `tailscale login --login-server <url>`.
