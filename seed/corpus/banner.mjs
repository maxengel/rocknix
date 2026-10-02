// banner.mjs — the ONE construction of the MANAGED-BY-SCAFFOLD provenance banner
// (ADR-0028 §3). Shared by seed-corpus.mjs (injects) and check-corpus.mjs (strips
// EXACT BYTES before hashing in seeded repos): any tampered byte — including inside
// the comment — fails the strip and therefore fails the sha pin. A lazy regex here
// would let arbitrary content (e.g. prompt-injection text) hide inside the comment
// invisibly; exact-match is the tamper signal.
export const MANAGED_MARK = '<!-- MANAGED BY SCAFFOLD';
export const managedBanner = (version) =>
  `${MANAGED_MARK} — corpus v${version} (class: verbatim). DO NOT EDIT in this\n` +
  `repo: main is push-protected (whitelisted writer + PR path, verified against declared\n` +
  `intent — #172), and edits here fail the corpus drift guard. Changes go to scaffold/scaffold\n` +
  `(seed/corpus); updates arrive as scaffold-authored PRs (ADR-0028). -->\n\n`;
