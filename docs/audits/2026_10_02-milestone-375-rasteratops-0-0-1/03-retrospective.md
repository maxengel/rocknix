# Retrospective audit — Rasteratops 0.0.1

## Architectural coherence

The cloud work has reusable components: one scan protocol, one folder-question
presenter, and copy/check/remove for moves. The main remaining weakness is the
boundary between those components. Layout selection asks whether files exist;
backup asks whether a directory exists; restore also requires its parent; boot
eligibility reads only local configuration. The state table records the resulting
behavior for seven actors. A new global per-sync scan would recreate the cost
D-CLOUD-170 deliberately removed.

`GuiMenu.cpp` remains a large coordinator, but its split is explicitly outside
0.0.1. No refactor is proposed simply to improve its shape before this cut.

## Project conformance

| Rule face | Relevance | Finding |
| --- | --- | --- |
| engineering-practices / working-principles | Primary artifacts and negative controls | Current host suite and corrected pair executed; raw logs retained. Predicate probes have limited scope explicitly stated. |
| rclone-cloud-sync | Progress retention, allowlist, unknown versus absent | Copy/check/remove read; source-pointer write precedes deletion. Bucket helper collapses failed read into absence (F-02). |
| upgrade-and-install | Old state on a renamed OS | Current OS-name archive match conflicts with legacy archive discovery after rebrand (F-01). |
| vm-first / generic-x64-vm-testing | VM before hardware | #375 records VM answer; pair uses isolated QA cloud and scratch disks; no physical-device actions. |
| es-native-ui / es-ui-style-guide / es-code-traps | Pages, worker lifetime, callbacks | Boot waits for worker but not result-card lifetime. Saved E frame corroborates overlap; existing #363/#365. |
| es-player-text / player-language / least-surprise | Outcome vocabulary and approved wording | Vocabulary check freshly passes; old issue proposals must yield to D-CLOUD-164/167. |
| time-to-play | Measure automatic cost | Old-folder 59 ms delta remains above 30 ms criterion; current-folder exit comparison is not that benchmark. |
| change-log / documentation-accuracy / es-menu-map | Claims correspond to implementation | Menu check passes; held changelog claim “no sync checks” is false while backup probes. Public docs remain child acceptance work. |
| decision-register / issue-tracking | Decisions reflected in bodies | #344 still carries superseded topology/owner/shadow questions; #349/#350/#352 contain old proposals. Reconcile bodies, do not ask settled questions again. |
| learning-capture / ceremonies | Durable prerequisite | State table and runs95–101 mini-retro written; #365 stays open for executable coverage and in-tree proof. |
| release-candidates / bugs-are-agent-first | No known bug at candidate declaration | Current review is a readiness FAIL; run101 is an intermediate cut. No release, draft or device staging performed. |
| fork-workflow / worktrees / instruction-files | Current rules and isolated work | Instruction tree matches next. Dirty cloud changelog and build-generated file preserved; no blanket merge of old feature history. |
| device-builds / handheld-evidence | Physical evidence custody | No new physical claim; later RG35XX SP adoption and per-device smoke checks retain their own required authorizations. |
| adversarial-council / council-substrate-integrity | Independent review | Phase4.6 requires two Facilitator GPT Astra calls at milestone tier; verify pins and served identity. |

Blindspot checks applied: 1/30 (verify code, not resumed summary), 13 (a tick is not
a frame), 22/31 (test actually reaches intended path), 27/51 (superseded issue
wording), 39 (negative controls), 54 (real guest surface), 64/65 (fixture versus
product), 71/72 (old defaults and failed reads). The recurring fixture and
false-absence shapes are already known; strengthen their existing guard homes
under #365/#366 rather than adding another generic rule.

## Platform architecture conformance

| Check | Relevance | Finding |
| --- | --- | --- |
| Reference implementation / tenant zero | Not applicable | OS build system, no tenant architecture. |
| Schema before code | Relevant to folder protocol | State/actor table now exists; numbered migration contract remains #356. |
| Dogfooding gate | Relevant | Retained VM cut tested; final branded candidate and physical adoption remain. |
| API first | Limited | CLI protocol remains shared by UI and tests; duplicated archive/existence predicates are the problem. |
| Build versus adopt register | Not applicable | No such governing register for these extensions to existing project tools. |

## Cross-system interactions

| Interaction | Shared state and risk | Coverage |
| --- | --- | --- |
| Rename × archive readers/writers | OS_NAME in on-disk/cloud archive names; old archives can disappear from selection | Exact matcher probe reproduces; full branded-image restore required (F-01) |
| Startup restore × backup × later folder step | C and remote contents; an empty C can be populated before join | Table T08/T11/T12; whole-boot fixtures still required by #365 |
| Worker completion × visible card × boot GUI | mInstance cleared before linger; folder page opens underneath | Source trace plus opened saved E frame; #363/#365 |
| Bucket parent lookup × backup guard | Failed lsf becomes false, then list_rc=3 | Extracted production helper/control-block probe; S3 whole-script proof required (F-02) |
| Setup failure × seeding | Unsuccessful settle ignored; subsequent mkdir can succeed | Source-read only, T17; fault-injection case needed before deciding policy |
| Old writer × new fleet layout | Local lock does not coordinate different devices | Fresh pair 42/0 includes staged old-writer merge; not simultaneous-writer proof |
| Retention × merge shelf | Source and replaced destination versions share shelf | Read merge_into:555–622; content comparison fallback and preservation require real-provider tests where relevant |
| Fixture default × missing-legacy-root guard | QA asks for newly forbidden /GAMES | Raw 0/9 upload explains downstream failures; #366 |
| Release branding × updater/publisher | Old endpoint, date naming, migration tar check | Source-read; #337/#344 implementation remains |

## Spec fidelity and missing artifacts

Marker `layout=2` exists; a general numbered migration ladder does not. Literal
search: `rg -n 'LAYOUT_VERSION|layout=|version|step [12]' cloud_migrate_layout`
finds marker handling, not a step dispatcher. `rg --files docs/rasteratops` and
direct read find no `cloud-layout.md`. Existing #356 explicitly owns both; this
is pre-existing tracked scope, not a new punch item.

`rg --files tools` plus the #365 issue and recent history locate the current epic
proof only under `/workspace/tmp/rocknix-session/epic-proof-101.sh`; promotion and
case reset are still owed. C/F/G have frames without assertion calls. No absence
claim is based solely on a filename guessed from memory.

The archive matcher search found the same suffix dependency in cloud_scan:219,
cloud_restore:2125,2143, cloud_backup:2387, and backuptool:143–167,1459,1463,1827.
F-01 must cover readers, writer/retention policy and local recovery, not just the
new scan. Bucket helpers occur in both cloud_backup and cloud_restore; F-02 must
classify both callers and parent/root probes. Neither finding is called fixed.

## Retrospective summary

Keep the approved setup-step direction. Finish the actor model's missing cases,
fix the fixture and error-classification seams, then integrate identity once.
The dedicated mini-retro is `docs/retros/2026-10-02-cloud-runs-95-101.md` and must
be propagated to the cloud epic and affected criteria before this review closes.
