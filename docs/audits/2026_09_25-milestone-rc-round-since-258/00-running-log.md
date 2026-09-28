# Milestone Audit Running Log — the RC round since #258, up to the candidate `664ad9ac64`

**Auditor:** Code Auditor skill (orchestrator: Claude Opus 5.5, `claude-opus-5-5`)
**Started:** 2026-09-25 05:14 UTC
**Scope:** the release-candidate round's product changes since the last audit -- #258 (milestone tier, at `443028ff7a`) and #260's second-opinion items, both fixed by the twentieth cut `c041be7e98` -- up to the candidate `664ad9ac64`: #195 (EmulationStation `5067f7a1b`, `296aa5966`; D-UI-087, D-UI-089), #192 (`cloud_net_ready`, `3a200b0b50`; D-CLOUD-136), #255 (RetroArch patch 0017, `eb131d112f`, `24badef3cb`; D-UI-088), #263 (GENERIC_X64 RetroArch surface, `eb131d112f`; D-QA-042). Ordered by D-QA-047: findings fixed in a new build before the maintainer's soak (#236).
**Spec:** the issue bodies of #195, #192, #255, #263 and the register rows they cite.

---

## Log Entries

### [Phase 0] 05:14 — Setup

Skill copy verified current against `next` (SKILL.md and the three references, `diff -q`, identical). **Tier: milestone, not epic** -- the invocation said epic, but the skill's own table decides: the four issues sit in different epics (save state manager / cloud saves, the startup card, RetroArch widgets, the VM harness) and meet only in the round (#236), and "any scope crossing an epic boundary" is milestone tier; #258 was milestone tier on the same basis. So this log is mandatory, prior verdicts are sequestered until Phase 2.5, and Phase 4.6 runs the seat twice (blind, then refutation).

Model: the orchestrator is Opus 5.5. The agent memory asks audit subagents to run on Fable 5.1, which hit its monthly spend limit earlier today; this audit uses no Claude subagents -- every pass is the orchestrator's -- and its adversarial second opinion is the council's GPT seat. Seat prerequisites checked before starting: the Facilitator (`tools/council/run`), the key (`~/.config/council/env`, 0600, `OPENROUTER_API_KEY` present, OpenRouter's key status valid, no cap) and `openai/gpt-6-astra` listed; nothing spent.

In-flight work outside the scope: the EmulationStation checkout's HEAD is `b09ca9409` (a folder re-read after a game exits), past the candidate's pin `296aa5966`; not in the candidate, not audited.

### [Phase 1.1-1.2] — The four issues and seven rows read in full

#192, #263, #195, #255 read body and comments; D-UI-087/089/088/084/086, D-CLOUD-136/072/112, D-QA-042 read. Leads: (1) D-CLOUD-136 says a launch during WAITING *cancels* (`cancelIfWaitingForNetwork`), D-CLOUD-130 and #192's comment say automatic syncs *ask* -- which does the pin do; (2) #255's body has all five criteria open while its comment claims three done; (3) #195's French forms are nowhere framed; (4) #263's surface is a race, not a fix (today's first offline launch was 240x256).

### [Phase 1.3, paused] 05:26 — Scope widened by the maintainer; paused on the Claude seat

D-QA-048: this candidate goes upstream, and before it goes it gets a full code audit of everything going upstream -- the distribution's diff against `upstream/next` (226 product files, +35,312/-606 lines at `next` = `664ad9ac64`'s product state) and the EmulationStation fork's changes -- from two agents, **Fable 5.1 and GPT-6 Astra**. This audit's delta scope is folded into it; the notes above carry over. **Paused**: the Fable 5.1 probe failed with HTTP 429, "You've hit your monthly spend limit" (`claude-fable-5-1`); the maintainer decides between raising the limit, starting with Astra's blind pass, or another Claude model. Nothing here is published until the audit completes; the folder stays uncommitted until then.

### [Phase 1.3, resumed] 2026-09-27 23:10 UTC — The two seats serve; the scope is the candidate `7911c53bb4`

Orchestrator now: Claude Fable 5.1 in the session (`claude-fable-5-1`); the seats through the Facilitator on OpenRouter, probed with a one-word prompt at 23:0x: `anthropic/claude-fable-5.1` (effort xhigh) and `openai/gpt-6-astra` (effort max), both `outcome=success`, models verified by the Facilitator. The spend limit that paused this audit on 2026-09-25 is gone.

Scope, measured on the candidate: the distribution's fork-only diff from its merge base with `upstream/next` (`e9ff9dbd11`) to `next` (`7911c53bb4`'s product state; 232 files, +35,590/-622), and the EmulationStation fork from its merge base with `rocknix/master` (`bccd715707`) to the pin `7eae8ed91` (158 files, +31,262/-984). The maintainer's word tonight (D-WORKFLOW-053): after `7911c53bb4` the round moves to this audit; smaller play-testing notes wait for the candidate's feedback.

### [Phase 2, dispatched] 2026-09-27 23:1x UTC — Ten packets, two seats each

The diff is read by the five PR buckets of D-WORKFLOW-034 plus the gaps the path map shows, ten packets in `seats/`: 1-raoffline (48 files, 477 KB), 2-wifi (6, 83), 3-rclone-setup (12, 294), 4-backup-restore (3, 89), 5-cloud-sync-and-saves (37, 839), 6-retroarch-widgets (11, 103), 7-generic-x64-vm (47, 366), 8-es-menus-and-core (107, 1,062), 9-emulators (21, 80), 10-packages-and-build (96, 301). Each packet is the bucket's diff plus the conventions it is judged by (`packaging-and-patches.md`, `es-player-text.md`, `es-code-traps.md`, `es-ui-style-guide.md`, `upgrade-and-install.md`, `rclone-cloud-sync.md`, `packages/README.md` as the bucket needs, and the audit's anti-patterns), embedded by the Facilitator's source manifest (sha256-verified). The brief (`seats/<bucket>.brief.md`) asks each seat for findings in the punch-list item shape with severity, where, failure scenario, evidence, fix and confidence; an upstream-fit section; and a coverage boundary. Twenty calls launched detached (`audit-rc.py --launch`); outputs land as `seats/<bucket>-<member>.md` with provenance siblings. Phase 2 here is the seats' forward audit over the whole upstream diff; the orchestrator's Phase 4.5 (refutation of every Critical and High against the source) and Phase 4.6 (the second seat's opinion is built in: two seats per bucket, neither seeing the other) follow, then the punch list.

### [Phase 4.5] 23:42 -- rclone-setup (gpt) refuted; the ES gpt seat failed and is re-dispatched

F-RS-04 refuted as stated (no argument logging; a 200-byte rclone stderr excerpt is the only sink; Low). F-RS-06 mechanism confirmed, Medium (no SIGTERM handler; both ES callers cancel with no window up; `close` recovers). F-RS-07 survives at Medium (no failure transition on the device path). F-RS-08, F-RS-09 survive High (phone page: pre-typed text dropped, Back bypasses the box). F-RS-11 survives High pending a fact (wait returns under the grab; e4597faf23 wrote both halves; no device fact). 16 of 20 seat outputs in; `8-es-menus-and-core-gpt` failed three buffered attempts (`http=200 content=0b response_body_error`, 615/888/320 s) -- the 1 MB packet; `--transport sse` is refused for gpt; re-dispatch pending (split or another transport). Proof-298 on 7911c53bb4: 35/35 at 23:29 UTC; records, QA log, catalog committed (`ea59da6e59`).

### [Phase 2] 23:44 -- bucket 8's gpt seat re-dispatched as two half packets

`--transport sse` is refused for the gpt seat (only the Foundry and Bedrock recipes stream), so the 1 MB packet is split by path: `8a-es-app` (56 hunks, 464 KB: es-app/) and `8b-es-core` (51 hunks, 556 KB: es-core/, tests/, the French locale), each with its own manifest (the diff's sha256 recomputed) and a brief that says the other half is outside the packet. Both dispatched buffered, `--max-retries 2`. The claude seat's single-packet output (`8-es-menus-and-core-claude.md`) stands; the gpt findings for bucket 8 will carry the half's prefix in the index.

### [Phase 4.5] 23:58 -- all twenty seat calls in; verdicts for the cloud-sync Criticals and the raoffline Highs

`7-generic-x64-vm-claude` (attempt 3, 40 KB, 23:52), `8a-es-app-gpt` (attempt 1, 33 KB, 23:57) and `8b-es-core-gpt` (attempt 1, 27 KB, 23:56) landed; `5-cloud-sync-and-saves-gpt` had landed at 23:49 on its third attempt. The two half packets succeeded first time, which says the 1 MB packet was the cause. Guest d reads settled F-WF-02 (nmcli escapes; High stands) and F-VM-04/05 (the quirk scripts' unit edits never land on the read-only `/etc`; Low, dead code; Claude's F-PB-02/03 confirmed High). Written: F-CS-03 High, F-CS-04 Medium, F-CS-05 High, F-CS-06 High, F-CS-07 Medium, F-RA-01..08 Medium. The seats' upstream-fit and coverage sections are digested into `seats/digest-upstream-fit-and-coverage.md` (a subagent's extraction; a lead for Phase 3). Left in Phase 4.5: F-CS-08..19 (gpt Highs), and the Critical/High of the three new outputs.

### [Phase 4.5] 00:05 -- the pass is complete: every Critical/High across twenty outputs has a verdict

Written since 00:30: F-VM-01/02 (claude) refuted on the guest (the updater's source files are not in the image; Low, a no-op), F-VM-03 High-if-shipped (the serial root shell is the QA channel; `ConditionVirtualization=vm` is the fix), F-VM-04 High (the orphan quirk tree is dead since June), F-ES-01 (8a) High, F-ES-02 Medium, F-ES-03 High, F-ES-04 Medium, F-ES-01..06 (8b) Medium/High/Medium/Medium/Low/Medium, F-CS-08/09/10/12 High, F-CS-11/14/15/16/17/18/19 Medium, F-CS-13 = claude's F-CS-02. The findings index is regenerated (409 rows). Next: Phase 3 (retrospective), Phase 4 (analysis, with § Second opinion stating that every bucket had two seats by construction), Phase 5 (punch list + YAML), the lint, the issue.

### [Phase 3-5] 00:12 -- retrospective, analysis and punch list written; the lint

`01-research-notes.md` § 1.7 records the widened scope. `03-retrospective.md` (the copies that drifted, the rules broken and where, five register rows contradicted, four seams). `04-analysis.md` with the five sections the lint requires, a per-packet scorecard and § Second opinion (the GPT column is the second opinion by construction; its provenance copied to `second-opinions/`). `05-punch-list.md`: 78 items (1 Critical, 29 High, 42 Medium, 6 Low), the Phase 7 table open, the YAML index `open` throughout. `tools/lint-audit-artifacts`: the structure passes; the 78 open outcomes fail by design until Phase 7 records them -- the lint is the folder's closing gate, not its opening one. Next: Phase 6, the issue with one checkbox per item.

### [Phase 6] 00:20 -- #307 filed; the packets' one fixture line redacted for the push

#307 carries the summary and one checkbox per punch item (`tools/lint-audit-artifacts --issue 307`: 78 items referenced; `tools/box-check` 0 fail after PL-017's wording). The push guard refused `next` for two lines in the committed copies of the bucket-8 packets: the EmulationStation unit test's fixture URL `...?z=bob&y=<value>` has the `&y=KEY` shape. The value is a test fixture, not a credential; the committed copies carry `<key>` in its place, so the packets as committed differ from the packets as sent in that one line -- the manifests' sha256 are the sent packets'. Headings in this log and the day's work log that had been written ahead of the clock were set to the commit times (records 23:35, frames 23:48, the audit 00:17 UTC).

### [Phase 7] 01:13 -- stream F1 landed and merged

F1 (GENERIC_X64) reported at 01:10 UTC: 9 commits, all 7 punch items resolved (PL-019/022/023/033/034/042/073), 29 of 29 sweep rows with an outcome (20 fixed or duplicates by commit, 6 withdrawn with evidence, 3 refuted for this image); the scripts test PASSED with 428 checks, the F1 block failing 26 on the old tree. Merged into `next` at `f0f263b8cc` (`integrate-pl.sh f1`: pkgcheck, the scripts test PASSED). Left for the integrator: the guest proofs (Read-only file system count 0, `ConditionResult=yes` on the serial unit, the RetroArch surface following the mode, the rehearsal's new seeds), `scripts/clean rocknix` before the chain (the rocknix stamp does not hash the deleted updater), and `emergency.target` reachable again. Two rows' open parts (F-VM-08/16 in three GENERIC_X64 emulator configs) and two stale vulkan comments were sent back to the stream as a follow-up. The stream ran `generic-x64-vm`'s print and bundle verbs inside bwrap with a QEMU shim against the brief's letter; no guest was reached, and it said so.

### [Phase 7] 01:20 -- stream F2 landed and merged; the scripts test's two blocks reconciled

F2 (packages, RetroArch patches, the rotation generators) reported at 01:15 UTC: 15 commits, PL-002 and PL-043 resolved, PL-032 resolved in code with its frame half open on a measured fact (every shipped profile draws M+ 1p, which has no sharp size inside D-UI-088's band at the panel sizes -- D-UI-110 recorded, D-UI-111 open for the maintainer), PL-076 handed to F1 (its file; the line is dead text in RetroArch 1.22.2); 38 of 38 sweep rows with an outcome (24 fixed by commit, 2 duplicates, 5 refuted, 3 to PR-prep #256, 4 to other streams -- gpt F-PB-20's comm-truncation defect in `rocknix-corekeep` sent to B, F-PB-18/19 to E1). Merged into `next` at `da51e95c76`; the one conflict was the two streams' blocks appended at the same place in `tools/last-good-scripts-test`, resolved by keeping both; the suite PASSED. Found outside its files and left for the integrator: `tools/pkgcheck` given a path checks nothing and exits 0; upstream's `0004-drm-resolution.patch` applies only with fuzz.

### [Phase 7] 01:24 -- F1's follow-up merged

Three more commits on `feature/pl-f1`: the three GENERIC_X64 emulator configs (F-VM-08/16 closed: no handheld's pad name or panel size in mupen64plus, flycast, m8c; started from F2's copy of `mupen64plus.cfg` so the branches met without a conflict), PL-076 (the dead armhf core-updater line deleted; RetroArch 1.22.2 never reads the key), the two stale vulkan comments in `tools/ra-offline-test` and `tools/time-to-play`. Merged; the suite PASSED.

### [Phase 7] 01:27 -- stream E1 landed and merged into the ES integration branch

E1 (EmulationStation core) reported at 01:25 UTC: 22 commits, all 10 punch items resolved (PL-024/041 ES half/063/064/065/068/069/072/075/078), 26 of 26 sweep rows with an outcome (17 fixed, 9 withdrawn with reasons); es-unit-tests 144 cases / 1573 assertions, a new `es-file-tests` (12 cases, 3291 assertions) for the tests that touch files, a `.githooks/pre-push-test` (12 cases), es-untranslated 573/573, vocabulary 0 wrong. Merged into `test/qa-integration` at `165fa334e`; es-syntax-check PASS on all 11 changed sources of the merged tree, no non-ASCII comment. Routed: PL-064's upgrade half (chksysconfig deletes the `.tmp` before ES sees it) and PL-041's shell half (`flock` on the reaper) to B; PL-068's queued delete (SaveStateBookkeeper) to E2; E1's new helpers (`localizedWhy`, `cleanLine`, the join's exit code, IN USE -> CONNECTED) to E2's follow-up after its merge. Mine at integration: untrack `build-tests/es-unit-tests` and ignore `build-tests/`; the why-sentence drift in the rule files (F-CS-28); the VM proofs E1 lists (PL-024, 069 by VmSize, 072 with the link cut mid-transfer, F-CS-14, the Wi-Fi picker frames). The integrate script skips `tests/` sources in its syntax check now (ninja has no command for them).
