#!/usr/bin/env node
// owner-queue-lint.mjs — rejects prose-only owner-decision-queue entries
// (.github/instructions/owner-decision-queue.instructions.md, scaffold#487).
//
// An entry is ONE comment on the estate's `Owner decisions — <estate>` issue. It must name
// its class, its lane, its tracker home, its blocking-scope, and the owner's one consent
// act; an action entry must be a single dispatch, never a paste. Prose that merely asks is
// not an entry.
//
// Usage:
//   node scripts/owner-queue-lint.mjs <entry.md>      # exit 0 = entry, exit 1 = not an entry
//   cat entry.md | node scripts/owner-queue-lint.mjs
//   (import { lintEntry } from './owner-queue-lint.mjs' for programmatic use)

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// The surface's title convention, in ONE place: the estate-provisioning probe imports these so a
// second definition of "what the queue issue is called" cannot drift from the card (scaffold#552:
// four estates had no queue issue two days after the card landed, and nothing looked).
export const OWNER_QUEUE_TITLE_PREFIX = 'Owner decisions — ';
export const ownerQueueTitle = (estate) => `${OWNER_QUEUE_TITLE_PREFIX}${estate}`;
/** True when `title` is the queue issue for any of the estate's names (product, org). */
export const isOwnerQueueTitle = (title, names) => {
  const t = String(title ?? '').trim().toLowerCase();
  return [...new Set(names.filter(Boolean))].some((n) => t === ownerQueueTitle(n).toLowerCase());
};

const CLASSES = ['decision', 'action', 'choice'];
const HEAD = /^\*\*\[(decision|action|choice)\]\s+\S.*\*\*\s*$/m;
const URL_RE = /https?:\/\/\S+/;

/** Returns { ok: boolean, class?: string, problems: string[] } — pure, no I/O. */
export function lintEntry(text) {
  const problems = [];
  const head = HEAD.exec(text);
  if (!head) problems.push(`first line must be **[${CLASSES.join(' | ')}] <one-line ask>**`);
  const cls = head?.[1];

  const field = (name) => {
    const m = new RegExp(`^-\\s*(?:.*·\\s*)?${name}:\\s*(.+)$`, 'm').exec(text) ?? new RegExp(`${name}:\\s*([^·\\n]+)`, 'm').exec(text);
    return m?.[1]?.trim();
  };
  const lane = field('lane');
  const home = field('home');
  const scope = field('blocking-scope');
  const consent = field('consent');
  const precedent = field('precedent');

  if (!lane) problems.push('missing `lane:`');
  if (!home) problems.push('missing `home:`');
  else if (!URL_RE.test(home)) problems.push('`home:` must be the URL of the issue or PR where the ruling is recorded');
  if (!scope) problems.push('missing `blocking-scope:`');
  if (!consent) problems.push('missing `consent:` (the owner\'s one act)');

  if ((cls === 'decision' || cls === 'choice') && !precedent) {
    problems.push('a decision or choice entry carries a `precedent:` line — found & reused / found & rejected (why) / none found — searched: <sources> (prior-art-sweep §At decision time)');
  }
  if ((cls === 'decision' || cls === 'choice') && precedent && !/found\s*&\s*reused|found\s*&\s*rejected|none found\s*[—-]+\s*searched:/i.test(precedent)) {
    problems.push('the `precedent:` line names its outcome: `found & reused — …`, `found & rejected — …`, or `none found — searched: …`');
  }
  if (cls === 'decision' && consent && !/`[^`]+`/.test(consent)) {
    problems.push('a decision entry names exact reply strings in backticks (e.g. `ratified` / `edit: <what>`)');
  }
  if (cls === 'action') {
    if (consent && !URL_RE.test(consent) && !/\b(approve|merge|label|workflow_dispatch|dispatch)\b|`!`|(^|\s)!/i.test(consent)) {
      problems.push('an action entry\'s consent is a link to approve/merge, a label, a dispatch name, or one `!`-command');
    }
    // A paste: a fenced block with more than one non-empty line.
    const fences = [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)];
    for (const f of fences) {
      const lines = f[1].split('\n').filter((l) => l.trim().length);
      if (lines.length > 1) {
        problems.push('an action entry never carries a paste (fenced block with more than one command line) — per operator-asks, a paste names a missing channel; file the channel');
        break;
      }
    }
  }
  if (cls === 'choice' && !/^\s*\d+[.)]\s+\S/m.test(text)) {
    problems.push('a choice entry lists numbered options, recommended first, answerable by number');
  }
  return { ok: problems.length === 0, class: cls, problems };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const src = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : readFileSync(0, 'utf8');
  const r = lintEntry(src);
  if (r.ok) {
    console.log(`✅ owner-queue entry (${r.class})`);
  } else {
    console.error('❌ not an owner-queue entry:');
    for (const p of r.problems) console.error(`   • ${p}`);
    process.exit(1);
  }
}
