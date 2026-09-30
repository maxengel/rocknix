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
