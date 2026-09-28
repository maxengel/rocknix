# Analysis — the whole feature drop, both repositories, against upstream

**Auditor:** Code Auditor skill (milestone tier; two council seats per packet, D-QA-048)
**Date:** 2026-09-28
**Subject:** the fork-only diff of the distribution (`e9ff9dbd11..7911c53bb4`) and of EmulationStation against ROCKNIX's master
**Spec:** the rule files and the decision register (scope: `01-research-notes.md` § 1.7)

---

## Executive summary

Twenty seat calls over ten packets returned 409 findings (Claude 185, GPT 224 across the two halves of
bucket 8): the seats filed 18 Critical and 66 High. The orchestrator read every Critical and High against the
source, and eight of them on the guest itself (`02-forward-audit.md` § Verification, 93 entries). After that
pass: **1 Critical stands** (a content match that deletes a system whose cloud listing failed, found by both
seats), **31 Highs stand, 29 punch items** (two pairs share a fix; two more confirmed on the target's own tools -- nmcli's escaping of a passphrase,
and the VM quirk scripts writing to a read-only `/etc`), one High is pending a physical fact (the pad grab
at a successful sign-in), 46 of the filed Criticals and Highs came down to Medium on reading (real, bounded,
or reachable only by a caller that does not exist), and seven were refuted or are dead code (the VM
bootloader updater copies nothing; the unit edits never land; the credential-logging claim; the Windows
branch). Nothing found is a credential leaving the device by default, and nothing found deletes a player's
saves on the default paths; the deletions that stand are behind `--match --apply`, a custom location, or a
migration.

The shape of what stands is the retrospective's: one idea copied into seven scripts and drifting in each --
an unchecked write before a rename, a listing whose failure reads as absence, a phase result dropped under
`|| true`, a lock that proceeds on timeout. The fork's own rules name every one of these; the lines that
break them were written after the rule, by the rule's own author, in the copy that was not revisited.

**The recommendation:** resolve the Critical and the 31 Highs before any PR is cut (Phase 7 before step 7,
`release-candidates.md`), the Mediums in the fork before the next candidate, and the GENERIC_X64 items after a
register row says whether that device is ever published. The seats' upstream-fit sections
(`seats/digest-upstream-fit-and-coverage.md`) say what every PR will be asked to remove first: decision IDs
and issue numbers in comments, the fork-only tools named in shipped scripts, the ES pin on a personal
repository.

## Acceptance-criteria scorecard

The spec for this scope is the rules and the register, so the scorecard is per packet: what each seat filed,
what the reading left standing.

| Packet | Claude (C/H/M/L) | GPT (C/H/M/L) | Filed Critical+High | Stand after verification | Refuted / dead | Notes |
| --- | --- | --- | ---: | --- | ---: | --- |
| 1-raoffline | 0/1/10/12 | 0/8/19/1 | 9 | H: F-RA-01 (claude); M: F-RA-01..08 (gpt) | 0 | the seats disagree on what "sent" means (F-RA-01 both) |
| 2-wifi | 0/0/5/8 | 0/2/5/1 | 2 | H: F-WF-02 (guest-confirmed); M: F-WF-01 | 0 | |
| 3-rclone-setup | 0/1/11/14 | 3/8/13/2 | 12 | H: F-RS-03/F-RS-01c (both seats), F-RS-08, F-RS-09, F-RS-11 (pending a fact); M: F-RS-02/05/06/07/10, F-RS-01 | 1 | the phone page carries two Highs; F-RS-04 refuted |
| 4-backup-restore | 0/3/6/10 | 4/8/7/1 | 15 | H: F-BR-01c, F-BR-02c+F-BR-04g (both), F-BR-03c, F-BR-01g, F-BR-02g, F-BR-05g, F-BR-12g; M: F-BR-03g/06/07/08/09/11; L: F-BR-10 | 0 | the most Highs of any packet |
| 5-cloud-sync-and-saves | 0/2/13/13 | 7/12/16/2 | 21 | C: F-CS-01 (both); H: F-CS-02c=F-CS-13g (both), F-CS-03/05/06/08/09/10/12; M: F-CS-04/07/11/14..19 | 0 | every Critical the GPT seat filed was real and bounded |
| 6-retroarch-widgets | 0/1/4/5 | 0/0/3/1 | 1 | M: F-RW-01c, F-RW-01g; L: F-RW-02g | 0 | |
| 7-generic-x64-vm | 0/2/14/3 (C 1) | 1/4/14/0 | 9 | H: F-VM-03c (if shipped), F-VM-04c; M: F-VM-01g, F-VM-03g; L: F-VM-02g, F-VM-04/05g (dead) | 4 | fork-only device; no publication decision; F-VM-01/02c refuted, F-VM-04/05g dead |
| 8-es-menus-and-core (8a/8b) | 0/1/10/19 | 0/4/-/- + 5/1/-/- | 11 | H: F-ES-01c, F-ES-01a, F-ES-03a, F-ES-02b; M: F-ES-02a, F-ES-04a, F-ES-01b/03b/04b/06b; L: F-ES-05b | 1 | F-ES-05b not applicable |
| 9-emulators | 0/0/7/8 | 0/1/4/1 | 1 | H: F-EM-01 | 0 | |
| 10-packages-and-build | 0/3/11/7 | 3/10/12/0 | 16 | H: F-PB-02/03c (guest-confirmed), F-PB-08g; M: F-PB-01/02/04/06/07/09/10/13g; L: F-PB-03, F-PB-05 (dead), F-PB-11/12 (fork-only guard) | 1 | |
| **Total** | 0/14/91/99 | 18/58/93/9 | 97 (dedup 93 entries) | **C 1, H 31 (+1 pending), M 46, L 9** | 7 | |

(c = the Claude seat's number, g = the GPT seat's, a/b = the 8a/8b halves. The GPT column for bucket 7's
Claude cell reads the seat's own line: it filed one Critical, refuted here.)

## Code Quality Assessment

### Strengths
- The scripts say why: nearly every guard carries the incident it answers, and the seats could refute claims
  from the comments alone (F-CS-03's comment names the guard it does not implement -- which is how it was found).
- The interface's long jobs have one shape (`GuiCloudTransfer`, `GuiOfflineScan`) and the cards one
  vocabulary; no seat found a fourth-tier page that could be left running.
- `tools/last-good-scripts-test` runs the scripts under the image's busybox; the retire refusal (#258 PL-002)
  and the index-offline case were caught by it, not by a device.

### Concerns
- Seven copies of the write-verify-rename idea with seven different gaps (§ 3.1 of the retrospective).
- `GuiMenu.cpp` is the home of the hub, the wizard, the pickers and the transfer flows; both Highs in the
  ES application half are in it.
- The outcome vocabulary is enforced on the card and not on the reducer under it: four places compute
  "completed" from a subset of the run's parts.

### Complexity hotspots
- `raofflineproxy-ctl` (1,700 lines of bash with four embedded Python programs; eight of the GPT seat's
  Highs, all Medium on reading, all in its scan and top-up paths).
- `backuptool`'s rewrite hunk (`-15,54 +16,860`): the packet with the most Highs standing.
- `cloud_content_restore --match`: the one Critical and its sibling High.

## Cornerstone Conformance

### Findings (the rows of `03-retrospective.md` § 3.2)
- **Guards must fail closed** -- broken by F-CS-05, F-CS-10, F-BR-02/04, F-ES-02 (8b), F-RA-01, F-PB-08.
- **Outcome vocabulary, D-UI-030** -- broken by F-CS-12, F-CS-11, F-CS-19, F-RA-06, F-RA-08.
- **Least surprise, D-UI-042** -- broken by F-ES-01 (8a), F-ES-02 (8a), F-RS-08/09.
- **Fixing forward is not enough** -- broken by F-ES-03 (8b), F-CS-08/09.
- **Packaging** -- F-VM-04, F-PB-02/03.
- **No fork identifiers upstream** -- every packet's upstream-fit section; not a finding, a PR-prep pass.

## Spec Fidelity

### Aligned
D-UI-078 (the fourth tier), D-UI-109 (saves first), D-CLOUD-129 (the launch waits for the jobs it knows),
D-CLOUD-133 (the retire records before the unlink), D-RA-035 (the link's return lists once for a pending index).

### Diverged
D-CLOUD-053 (F-CS-04: a relative retire argument), D-CLOUD-133 (F-ES-04 8a: the capture is not a launch
guard), D-RA-035 (F-RA-02: the marker consumed before the listing), the settings-first promise (F-ES-01 8a),
the `--max-delete` comment's claim (F-CS-03).

## Missing Artifacts
A shared atomic-write helper; a register row on GENERIC_X64's publication; a scan cursor; device facts for
F-RS-11 and F-ES-04 (8a); five `last-good-scripts-test` cases (a rules file cut short, a listing that fails, a
saves 9 beside a settings failure, a relative retire argument, a game-list pass that fails).

## Risk assessment

| Risk | Where | Likelihood | Impact | Standing |
| --- | --- | --- | --- | --- |
| A system's local content deleted on a cloud hiccup | `cloud_content_restore --match --apply` (F-CS-01/03) | low (needs `--match --apply` and a failed listing at that moment) | high (ROMs gone locally; the cloud keeps them) | Critical, both seats |
| A credential in an archive that leaves the device | `backuptool` (F-BR-02/04, F-BR-02g, F-BR-03c) | medium under a custom `LOCATIONS`; the default set is covered | high (D-INFRA-006) | High |
| A settings archive silently not written while the run says COMPLETED | `cloud_backup`/`cloud_restore` (F-CS-12), `backuptool` (F-BR-05) | medium (a saves phase with nothing to move is the common case) | medium (found weeks later) | High |
| The saves allowlist replaced by a truncated file, and the ROMs synced as saves | `cloud_sync_helper` (F-CS-05) | low (a write failure on `/storage` at that step) | high | High |
| A player's chosen ticks ignored after a settings-first restore | `main.cpp` continuation (F-ES-01 8a) | high (every settings-first restore) | medium (a restore they did not ask for, over Wi-Fi) | High |
| The interface's settings save overwrites a script's change | `SystemConf` lock timeout (F-ES-02 8b) | low (the script must hold the lock five seconds) | medium | High |
| A migration that leaves the pointers stale or nests the backups | `cloud_migrate_layout` (F-CS-08/09/10) | low (one-off, `--apply`) | high | High |
| The VM's quirk set does nothing and its bootloader updater copies nothing | GENERIC_X64 (F-PB-02/03, F-VM-01/02) | certain (confirmed on the guest) | low here, high if published | High / Low |
| The pad lost after a successful on-device sign-in | `cloud_oauth wait` (F-RS-11) | unknown -- no fact either way | high on a device | High, pending |

## Coverage boundary

- The seats read diffs and rule files, not the tree; every "callee outside the packet" they named is in
  `seats/digest-upstream-fit-and-coverage.md` § 3, and the orchestrator's reading closed the ones a verdict
  needed (the callers of `cancel`, the image's `/usr/share/bootloader`, the guest's `/etc`).
- Runtime evidence was taken on guest d for eight findings; no device was touched (D-QA-015). Two findings
  need a fact the VM cannot give (F-RS-11: a real pad's grab; F-ES-04 8a: the capture's duration on an A53).
- Mediums and Lows were not refuted individually (the protocol's kill pass is for Critical/High); their
  severities are the seats' own, cross-checked only where two seats filed the same line.
- The pinned RAOfflineProxy sources, the RetroArch tree outside the hunks and the ES files outside bucket 8
  were not in any packet; F-RA-04's `achievementsets` claim and F-RW-01's font tables were checked against
  the ctl and the patch text, not against the proxy's Python or RetroArch's renderer.
- Commit hygiene is outside this audit: the packets are range diffs, and the PR series is built by content.

## Finding Verification (Phase 4.5)

93 entries in `02-forward-audit.md` § Verification, one per filed Critical/High (siblings merged where the
fix is one). Counts: 1 Critical stands, 31 High stand, 1 High pending a fact, 46 to Medium, 7 refuted, dead
or not applicable, 7 Low. Eight were settled on guest d (`7911c53bb4`): nmcli's escaping (F-WF-02), the quirk
scripts' `Read-only file system` (F-PB-02/03, F-VM-04/05), the bootloader directory's contents (F-VM-01/02c),
the serial shell's state (F-VM-03c), the installed quirk set (F-VM-04c).

## Instruction File Recommendations

### Coverage Gaps (would-have-prevented)
- `engineering-practices.md` § Guards must fail closed already names every shape found; what it lacks is
  the audited stage: a `last-good-scripts-test` case per shape (the five in § Missing Artifacts).
- `rclone-cloud-sync.md` should say that the rules file is an allowlist whose last line is load-bearing,
  and that every consumer asserts it.

### Codification Gaps (needs-new-rule; 3+ instances)
- **A phase result is folded into the run's status, never dropped** -- F-CS-11, F-CS-12, F-CS-18, F-RA-08,
  F-RA-06, F-PB-08: six instances of a part's failure not reaching the outcome word. A rule in
  `engineering-practices.md` with the `case ... 0|9)` shape, and a `tools/vm-qa` check that greps the
  scripts for `|| true` on a transfer line.
- **One write helper.** Three instances of the temp-and-rename idea with a different gap each (F-CS-05,
  F-ES-01 8b, F-ES-04 8b). The rule is the helper.

### Recommended Action Sequence
1. The Critical and the Highs in buckets 1-5 (the PR series), with their test cases.
2. The Mediums in the same buckets, in the fork's next cut.
3. A register row on GENERIC_X64; then its Highs or their removal.
4. The PR-prep pass the seats describe (comments, fork tools named in scripts, the ES pin), which is #256's
   work, not this audit's.

## Second opinion (Phase 4.6)

Every packet had two seats by construction -- Claude Fable 5.1 and GPT-6 Astra, neither seeing the other's
output -- so the second opinion is not a separate stage here; it is the second column of every packet. Where
they met: F-CS-01 (the Critical), F-CS-02/13, F-BR-02/04, F-RS-03/01, F-RA-01 -- all stand. Where they
disagreed: F-RS-08 (Medium vs High; High stands: the text is lost), F-RS-06 (both Medium after the callers
were read), F-RA-01 (the Claude seat's High is the image pass's cancel, the GPT seat's the send's proof --
different findings under one number). Bucket 8's GPT seat ran as two half packets; its findings carry the
half in the index. The `second-opinions/` folder is empty on purpose: the seats' outputs are in `seats/`.

## Quality self-check

- Every verdict names the file and line it was read from, or the guest command and time; no verdict rests on
  a seat's word alone (the evidence floor's rule 3).
- The findings index is regenerated from the outputs, not typed (409 rows); the scorecard's per-seat counts
  are the digest's, from the files.
- What this audit did not do: refute the Mediums one by one; run the scripts' failure shapes on the guest
  (the five test cases are punch items, not proofs); read the RetroArch or proxy sources outside the packets.
- The running log (`00-running-log.md`) records the dispatches, the failed calls, the split and every
  verification batch with its time.
