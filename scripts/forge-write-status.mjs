#!/usr/bin/env node
// forge-write-status.mjs — can THIS host write to the Forge as forge-automation, and if not, which
// one thing is missing? (scaffold#589, #590 — from the tursi-design report on #540)
//
// An agent that learns it must publish as `forge-automation` without a usable route goes hunting:
// keyrings, other hosts, CI secrets. This script replaces the hunt with one answer, in the six
// states the write-path protocol names, each with its evidence and the next PERMITTED action:
//
//   instruction_missing   configured custody absent/empty     → inventory named custody and delivery records
//   identity_unverified   GET /user is not forge-automation   → inventory and bounded identity diagnosis
//   not_enrolled          target write reach unproven         → inspect token restrictions and grant evidence
//   policy_denied         target's merge policy ≠ scaffold's → re-seed the corpus before writing
//   delivery_unavailable  service/metadata read failed         → diagnose transport/service, then bounded retry
//   ready                 actor, repo, permissions, policy    → write through forge-api / forge-merge-pr
//
// Identity is never inferred from a repo 200 (#590): a token can read every repo its grant names
// and still be unable to say whose it is. The legacy `scopes` field records endpoint checks
// by EFFECT, not token-scope metadata. A failed check does not diagnose a missing scope — but when
// the forge's own 401/403 body names the required scope(s) (`token does not have at least one of
// required scope(s): [read:user]`), the scope NAMES are surfaced as `scopesNamedMissing`,
// whitelisted to `read:<x>` / `write:<x>` so no provider free text reaches output. That is evidence
// to correlate with the reference index (runbook §3), never a mint trigger: state, exit code, next
// act and the printed ask are unchanged. A token cannot enumerate its own scopes (Forgejo serves
// GET /users/{username}/tokens to basic auth only), so this plus the by-effect probes is the whole
// reachable surface.
//
// When the answer is an operator's act (instruction_missing, identity_unverified, not_enrolled) the
// script also prints the ask, ready to post: an owner-queue `[action]` entry that passes
// scripts/owner-queue-lint.mjs as printed, addressed to the caller's estate queue (the issue titled
// "Owner decisions — <estate>" on the umbrella repo). Before this, the only exit from
// instruction_missing was "ask the owner in chat" (tursi-design, scaffold#540 → owner direction
// 2026-09-11). The entry names the queue issue by TITLE plus the umbrella path — its URL cannot be
// resolved from a host that has no credential, and the entry says so.
//
// Usage:
//   node scripts/forge-write-status.mjs                          # host + identity only
//   node scripts/forge-write-status.mjs --repo <org>/<repo>      # + enrolment and policy for one repo
//   node scripts/forge-write-status.mjs --repo <org>/<repo> --estate <estate>   # the entry names YOUR estate
//   node scripts/forge-write-status.mjs --repo <org>/<repo> --json               # machine shape, "entry" included
//   node scripts/forge-write-status.mjs --repo <org>/<repo> --estate <estate> --entry   # the entry only
//   --estate <name>      the CALLER's estate (e.g. tursi-design); env ESTATE is the fallback. Absent, the
//                        entry carries the placeholder <estate> and says so.
//   --umbrella <org>/<repo>  the estate's umbrella repo, where its owner queue lives (default <estate>/<estate>)
//   --home <url>         the LANE's tracker home (the issue or PR where the ruling is recorded — the queue is routing,
//                        never the record; owner-decision-queue rule 2). Env LANE_HOME is the fallback; absent, the
//                        entry carries the umbrella's issues URL with a said-aloud "replace before posting" note.
//   env: FORGE_API (default https://forge.example.invalid) · FORGE_OPS_TOKEN_FILE (default
//        ~/.config/rasteratops/forge-ops-token) · ESTATE
//
// Prints names, lengths and HTTP codes — never a token value. Exit: 0 ready · 3 instruction_missing ·
// 4 identity_unverified · 5 not_enrolled · 6 policy_denied · 7 delivery_unavailable · 2 usage.

import { readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintEntry, ownerQueueTitle } from './owner-queue-lint.mjs';

export const STATES = ['ready', 'instruction_missing', 'identity_unverified', 'not_enrolled', 'policy_denied', 'delivery_unavailable'];
export const EXIT = { ready: 0, instruction_missing: 3, identity_unverified: 4, not_enrolled: 5, policy_denied: 6, delivery_unavailable: 7 };
export const ACTOR = 'forge-automation';
export const RUNBOOK = 'docs/runbooks/forge-automation-credential.md';
export const PREFLIGHT = 'docs/runbooks/credential-preflight.md';
export const GRANTS = '.forgejo/governance/fleet-identities.json';
export const POLICY_PATH = '.forgejo/governance/agent-merge-policy.json';

// Exported: forge-api / forge-merge-pr print the instruction_missing line VERBATIM when the custody
// file is absent, so every route on a host names the same one next act.
export const NEXT = {
  instruction_missing: `inventory named existing custody and issuance/delivery records — ${PREFLIGHT}; repair proven delivery via ${RUNBOOK} §2; never search unrelated hosts, keyrings or CI secrets`,
  identity_unverified: `stop writes; inventory existing credentials for the intended principal, purpose and custodian, then diagnose the failed identity check — ${PREFLIGHT}; request owner-only metadata, never values; a new token is not justified by this state alone`,
  not_enrolled: `inspect token restrictions and declared/live grant evidence — ${PREFLIGHT} and ${GRANTS} (scaffold#492); this state alone does not justify a new grant or wider scope`,
  policy_denied: 'verify the target merge policy against the current corpus before writing; reconcile an unreadable or different policy through its governed path',
  delivery_unavailable: 'inspect the failed transport, service or metadata-read stage; wait and retry within the runbook bounds once justified. Cause remains unproven; do not replace a credential from this state alone',
  ready: 'write through the approved helpers (`forge-api`, `forge-merge-pr`) — never the API merge route, never as a human',
};

/** Read the custody file. Returns { present, length } — never the value. */
export function readCustody(file, { fsm = { existsSync, readFileSync } } = {}) {
  if (!fsm.existsSync(file)) return { present: false, length: 0, token: null };
  const token = String(fsm.readFileSync(file, 'utf8')).trim();
  return { present: token.length > 0, length: token.length, token: token || null };
}

/**
 * The scope names the forge's own 401/403 body names, or []. Forgejo refuses a scope miss with
 * `{"message":"token does not have at least one of required scope(s): [read:user]"}` — the list is
 * space-separated (Go %v; observed on GET /user 2026-09-14, scaffold#590). Only the bracketed list is
 * read, split on whitespace/commas and whitelisted to `read:<x>` / `write:<x>`: provider free text, a
 * token echo or any other junk never reaches the caller. Pure; never throws on a foreign body.
 */
export function requiredScopesNamed(body) {
  const message = body?.message;
  const m = typeof message === 'string' ? /required scope\(s\): \[([^\]]*)\]/.exec(message) : null;
  if (!m) return [];
  return [...new Set(m[1].split(/[\s,]+/).filter((s) => /^(read|write):[a-z]+$/.test(s)))];
}

/**
 * The classifier — pure over injected fetch. Returns { state, evidence[], next, actor?, repo?,
 * permissions?, policy?, scopes }. Never includes the token.
 */
export async function classify({ token, repo, forge = 'https://forge.example.invalid', fetchImpl = fetch, scaffoldRepo = 'scaffold/scaffold' } = {}) {
  const evidence = [];
  const scopes = {};
  const out = (state, extra = {}) => ({ state, evidence, next: NEXT[state], scopes, ...extra });
  if (!token) { evidence.push('custody file absent or empty'); return out('instruction_missing'); }
  const H = { headers: { Authorization: `token ${token}`, Accept: 'application/json', 'User-Agent': 'scaffold/forge-write-status' } };
  const get = async (p) => {
    try {
      const r = await fetchImpl(`${forge}/api/v1${p}`, H);
      if (r.status >= 500) return { status: r.status, body: null, down: true };
      const body = r.status === 204 ? null : await r.json().catch(() => null);
      return { status: r.status, body, down: false };
    } catch { return { status: 0, body: null, down: true, error: 'transport-failed' }; }
  };

  // 1. identity — the only probe that names the actor
  const me = await get('/user');
  if (me.down) { evidence.push(`GET /user did not answer (${me.error || `HTTP ${me.status}`})`); return out('delivery_unavailable'); }
  scopes['read:user'] = me.status === 200;
  if (me.status === 403 || me.status === 401) {
    // #590: the forge names the scope it wants where it can — surface the NAMES as evidence. The
    // state, exit code, next act and ask are the same as for a bare status: this is not a mint request.
    const scopesNamedMissing = requiredScopesNamed(me.body);
    if (scopesNamedMissing.length) {
      const prefix = me.status === 403 ? 'GET /user → 403: identity unverified;' : 'GET /user → 401: authentication failed;';
      evidence.push(`${prefix} the forge's own message names required scope(s) this token does not hold: ${scopesNamedMissing.join(', ')} (provider diagnosis — additional evidence to correlate with the reference index, runbook §3; not a mint request)`);
      return out('identity_unverified', { scopesNamedMissing });
    }
  }
  if (me.status === 403) { evidence.push('GET /user → 403: identity unverified; status alone does not establish the cause'); return out('identity_unverified'); }
  if (me.status === 401) { evidence.push('GET /user → 401: authentication failed; cause unverified'); return out('identity_unverified'); }
  if (me.status !== 200 || !me.body?.login) { evidence.push(`GET /user → HTTP ${me.status}, no login`); return out('identity_unverified'); }
  if (me.body.login !== ACTOR) { evidence.push(`GET /user → "${me.body.login}": unexpected actor; this route requires ${ACTOR}`); return out('identity_unverified', { actor: me.body.login }); }
  evidence.push(`GET /user → ${ACTOR} (200)`);
  const actor = me.body.login;

  if (!repo) return out('ready', { actor });

  // 2. enrolment — the grant, read as its effect on the target repo
  const r = await get(`/repos/${repo}`);
  if (r.down) { evidence.push(`GET /repos/${repo} did not answer`); return out('delivery_unavailable', { actor }); }
  if (r.status === 404) { evidence.push(`GET /repos/${repo} → 404: repository not visible through this request; cause unverified`); return out('not_enrolled', { actor, repo }); }
  if (r.status !== 200 || !r.body) { evidence.push(`GET /repos/${repo} → HTTP ${r.status}`); return out('not_enrolled', { actor, repo }); }
  const permissions = r.body.permissions || {};
  scopes['read:repository'] = true;
  if (!permissions.push) { evidence.push(`GET /repos/${repo} → readable, permissions.push=false: write reach unproven; cause unverified`); return out('not_enrolled', { actor, repo, permissions }); }
  evidence.push(`GET /repos/${repo} → push=${permissions.push} admin=${!!permissions.admin}`);

  // Endpoint results under legacy scope keys (reads only; not token-scope metadata).
  const issues = await get(`/repos/${repo}/issues?limit=1&state=all`);
  scopes['read:issue'] = issues.status === 200;
  const branches = await get(`/repos/${repo}/branches?limit=1`);
  scopes['read:repository'] = branches.status === 200;

  // 3. policy — the target's merge policy must be the one scaffold main carries
  const [mine, theirs] = await Promise.all([get(`/repos/${scaffoldRepo}/raw/${POLICY_PATH}`), get(`/repos/${repo}/raw/${POLICY_PATH}`)]);
  if (mine.down || theirs.down) { evidence.push('policy read did not answer'); return out('delivery_unavailable', { actor, repo, permissions }); }
  const want = mine.body?.version;
  if (!want) { evidence.push(`scaffold's ${POLICY_PATH} unreadable (HTTP ${mine.status}) — cannot compare`); return out('delivery_unavailable', { actor, repo, permissions }); }
  if (theirs.status === 404) {
    evidence.push(`${repo} carries no ${POLICY_PATH} (scaffold's is ${want}) — merges there fall to scaffold's policy file; not a denial`);
    return out('ready', { actor, repo, permissions, policy: { scaffold: want, target: null } });
  }
  const have = theirs.body?.version;
  if (have !== want) { evidence.push(`${repo} merge policy ${have ?? 'unreadable'} ≠ scaffold ${want}: stale policy cannot authorize`); return out('policy_denied', { actor, repo, permissions, policy: { scaffold: want, target: have ?? null } }); }
  evidence.push(`merge policy ${have} on both`);
  return out('ready', { actor, repo, permissions, policy: { scaffold: want, target: have } });
}

/** The three states whose next act is the operator's — the ones that earn a queue entry. */
export const ASK_STATES = ['instruction_missing', 'identity_unverified', 'not_enrolled'];
export const FORGE_WEB = 'https://forge.example.invalid';
const RUNBOOK_URL = `${FORGE_WEB}/scaffold/scaffold/src/branch/main/${RUNBOOK}`;
const GRANT_ISSUE_URL = `${FORGE_WEB}/scaffold/scaffold/issues/492`;

/**
 * The ready-to-post owner-queue entry for an ASK state, or null for the other three (nothing to
 * ask: ready writes, policy_denied re-seeds, delivery_unavailable waits). One `[action]` entry =
 * one operator act (owner-decision-queue rule 1; the runbook's mint §1 + place §2 is a single
 * delivery act, the grant §0 a single declaration). Never a paste, never a value. Pure.
 *   estate    the caller's estate; absent → the literal placeholder "<estate>", said aloud
 *   umbrella  <org>/<repo> of the estate's umbrella (default <estate>/<estate>)
 *   custodyFile / host  where the credential must land (the ask is undeliverable without them)
 */
export function ownerQueueEntry(res, { estate, umbrella, home, custodyFile = '~/.config/rasteratops/forge-ops-token', host = 'this host' } = {}) {
  if (!ASK_STATES.includes(res.state)) return null;
  const named = !!estate;
  const est = named ? estate : '<estate>';
  const umb = umbrella || `${est}/${est}`;
  const title = ownerQueueTitle(est);
  // home = the LANE's record (its issue or PR), never the queue itself (owner-decision-queue rule 2: routing, never
  // record). Without --home the entry still lints (a URL is required) but says aloud that the URL must be replaced.
  const homeUrl = home || `${FORGE_WEB}/${umb}/issues`;
  const homeNote = home ? '' : ' (placeholder — replace with your lane\'s issue or PR URL before posting: --home <url> or LANE_HOME)';
  const queue = `${homeUrl}${homeNote}; post the entry itself on the issue titled "${title}" on ${FORGE_WEB}/${umb}/issues`;
  const placeholder = named ? '' : ' — <estate> is a placeholder: pass --estate <name> or set ESTATE before posting';
  const repo = res.repo || '<org>/<repo>';
  const lines = [];
  if (res.state === 'not_enrolled') {
    lines.push(`**[action] Grant forge-automation write access to ${repo} so ${est} can publish there**`);
    lines.push(`- lane: ${est} agent session (forge-write-status on ${host}) · home: ${queue}`);
    lines.push(`- blocking-scope: this lane — every write to ${repo} idles until the grant is real`);
    lines.push(`- consent: merge: the grant declaration for ${repo} in ${GRANTS} (scaffold#492, ${GRANT_ISSUE_URL}) — provisioning applies it; or reply "approved" and the lane files the declaration`);
    lines.push(`- Evidence: ${res.evidence.join('; ')}. Runbook §0: a token authenticates, the grant authorizes; an agent never widens its own access and never routes around a missing grant with a personal token${placeholder}.`);
  } else {
    const verb = res.state === 'identity_unverified'
      ? `Re-mint the forge-automation credential with the §1 scope set (read:user included) and replace it on ${host}`
      : `Deliver the forge-automation credential to ${host} so ${est} can write to the Forge`;
    lines.push(`**[action] ${verb}**`);
    lines.push(`- lane: ${est} agent session (forge-write-status on ${host}) · home: ${queue}`);
    lines.push(`- blocking-scope: this lane — every Forge write from ${host} idles until the file is in place`);
    lines.push(`- consent: the delivery itself, one operator act — mint as forge-automation on the forge host (${RUNBOOK_URL} §1) and place the token by file at ${custodyFile}, mode 0600 (§2); reply "delivered" here when it lands`);
    lines.push(`- Evidence: ${res.evidence.join('; ')}. The lane re-runs forge-write-status and proceeds only on ready; it never searches other hosts, keyrings or CI secrets for a credential (runbook §2)${placeholder}.`);
  }
  const text = lines.join('\n') + '\n';
  const lint = lintEntry(text);
  if (!lint.ok) throw new Error(`owner-queue entry does not lint: ${lint.problems.join('; ')}`);
  return text;
}

/** Human rendering. */
export function render(res, { custodyFile, tokenLength, entry = null, estate } = {}) {
  const icon = res.state === 'ready' ? '✅' : res.state === 'delivery_unavailable' ? '⚠️' : '❌';
  const lines = [`${icon} ${res.state}`];
  if (custodyFile) lines.push(`   custody: ${custodyFile} (${tokenLength ? `${tokenLength} chars` : 'absent'})`);
  for (const e of res.evidence) lines.push(`   • ${e}`);
  if (res.scopesNamedMissing?.length) lines.push(`   forge-named missing scope(s): ${res.scopesNamedMissing.join(', ')}`);
  const sc = Object.entries(res.scopes);
  if (sc.length) lines.push(`   checks by effect (not token-scope metadata): ${sc.map(([k, v]) => `${k}=${v ? 'passed' : 'failed'}`).join(' · ')}`);
  lines.push(`   next: ${res.next}`);
  if (entry) lines.push('', `   the ask, ready to post on your owner queue (${ownerQueueTitle(estate || '<estate>')}; it lints as printed):`, '', entry.trimEnd());
  return lines.join('\n');
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    // The header block up to its first blank line — never a fixed line count (it grew with #590).
    const head = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1);
    const end = head.findIndex((l) => !l.startsWith('//'));
    console.log(head.slice(0, end < 0 ? head.length : end).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(2);
  }
  const ri = argv.indexOf('--repo');
  const repo = ri > -1 ? argv[ri + 1] : undefined;
  if (ri > -1 && !/^[\w.-]+\/[\w.-]+$/.test(repo || '')) { console.error('❌ --repo wants <org>/<repo>'); process.exit(2); }
  const ei = argv.indexOf('--estate');
  const estate = (ei > -1 ? argv[ei + 1] : process.env.ESTATE) || undefined;
  if (ei > -1 && !/^[\w.-]+$/.test(estate || '')) { console.error('❌ --estate wants a name (e.g. tursi-design)'); process.exit(2); }
  const ui = argv.indexOf('--umbrella');
  const umbrella = ui > -1 ? argv[ui + 1] : undefined;
  if (ui > -1 && !/^[\w.-]+\/[\w.-]+$/.test(umbrella || '')) { console.error('❌ --umbrella wants <org>/<repo>'); process.exit(2); }
  const hi = argv.indexOf('--home');
  const home = (hi > -1 ? argv[hi + 1] : process.env.LANE_HOME) || undefined;
  if (hi > -1 && !/^https?:\/\/\S+$/.test(home || '')) { console.error('❌ --home wants the URL of your lane\'s issue or PR'); process.exit(2); }
  const custodyFile = process.env.FORGE_OPS_TOKEN_FILE || path.join(os.homedir(), '.config', 'rasteratops', 'forge-ops-token');
  const forge = (process.env.FORGE_API || 'https://forge.example.invalid').replace(/\/$/, '');
  const c = readCustody(custodyFile);
  const res = await classify({ token: c.token, repo, forge });
  const entry = ownerQueueEntry(res, { estate, umbrella, home, custodyFile, host: os.hostname() });
  if (argv.includes('--json')) console.log(JSON.stringify({ ...res, custodyFile, tokenLength: c.length, estate: estate ?? null, entry }, null, 2));
  else if (argv.includes('--entry')) { if (entry) process.stdout.write(entry); else console.error(`ℹ️  ${res.state}: no owner ask — next: ${res.next}`); }
  else console.log(render(res, { custodyFile, tokenLength: c.length, entry, estate }));
  process.exit(EXIT[res.state]);
}
