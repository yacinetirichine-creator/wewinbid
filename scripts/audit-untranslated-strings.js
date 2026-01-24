#!/usr/bin/env node
/*
  Audit untranslated UI strings in TS/TSX sources.

  Goal:
  - Find likely user-facing hardcoded strings not wired through i18n.
  - Help achieve "pages traduites à fond" across all locales.

  What it does (heuristics, no AST):
  - Scans `src/app` and `src/components` for:
    - JSX text nodes: >Some text<
    - Common attribute literals: title="...", aria-label="...", placeholder="...", alt="..."
  - Filters out obvious non-UI strings (empty, only punctuation, URLs, classNames, keys like foo.bar).

  Usage:
    node scripts/audit-untranslated-strings.js --out=untranslated-report.json

  Options:
    --out=<file>         Output JSON file (default: untranslated-report.json)
    --maxPerFile=<n>     Limit findings per file (default: 200)
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIRS = ['src/app', 'src/components'];
const EXTENSIONS = new Set(['.ts', '.tsx']);

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.replace(/^--/, '').split('=');
    out[k] = v === undefined ? true : v;
  }
  return out;
}

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      out.push(...walk(full));
    } else {
      const ext = path.extname(ent.name);
      if (EXTENSIONS.has(ext)) out.push(full);
    }
  }
  return out;
}

function looksLikeNoise(text) {
  const t = text.trim();
  if (!t) return true;
  if (t.length <= 1) return true;
  if (/^[-–—•·,.;:!?()[\]{}]+$/.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  if (/^(https?:\/\/|\/)/.test(t)) return true;
  if (/^[A-Za-z0-9_.-]+$/.test(t) && t.includes('.')) return true; // likely key / identifier
  if (t.includes('className=') || t.includes('data-')) return true;
  return false;
}

function extractJsxTextNodes(source) {
  // Very rough: capture >TEXT< where TEXT does not contain { or <
  const out = [];
  const re = />((?:(?!<).)*?)</g;
  let m;
  while ((m = re.exec(source))) {
    const raw = m[1];
    if (!raw) continue;
    // Skip if it contains JSX expression braces
    if (raw.includes('{') || raw.includes('}')) continue;
    const text = raw.replace(/\s+/g, ' ').trim();
    if (looksLikeNoise(text)) continue;
    // Skip if this is obviously not a UI text node
    if (text === ' ') continue;
    out.push(text);
  }
  return out;
}

function extractLiteralAttributes(source) {
  const out = [];
  const attrNames = ['title', 'aria-label', 'placeholder', 'alt', 'label'];
  const re = new RegExp(`\\b(${attrNames.map((a) => a.replace('-', '\\-')).join('|')})\\s*=\\s*(["'])(.*?)\\2`, 'g');
  let m;
  while ((m = re.exec(source))) {
    const name = m[1];
    const value = (m[3] || '').trim();
    if (looksLikeNoise(value)) continue;

    // Heuristic: ensure we're inside a JSX tag (avoid matching JS like `const label = '...'`).
    const idx = m.index;
    const ctxStart = Math.max(0, idx - 250);
    const ctx = source.slice(ctxStart, idx);
    const lastOpen = ctx.lastIndexOf('<');
    const lastClose = ctx.lastIndexOf('>');
    if (lastOpen === -1 || lastOpen < lastClose) continue;

    out.push({ name, value });
  }
  return out;
}

function findLineNumber(haystack, needle, fromIndex) {
  const idx = haystack.indexOf(needle, fromIndex);
  if (idx === -1) return { idx: -1, line: -1 };
  const upTo = haystack.slice(0, idx);
  const line = upTo.split('\n').length;
  return { idx, line };
}

function main() {
  const args = parseArgs(process.argv);
  const outFile = args.out || 'untranslated-report.json';
  const maxPerFile = Number(args.maxPerFile || 200);

  const files = TARGET_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
  const report = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);

    // Skip Next.js API routes (server-only)
    if (rel.startsWith(`src${path.sep}app${path.sep}api${path.sep}`)) continue;

    // Skip tests/specs and generated fixtures
    if (rel.includes(`${path.sep}__tests__${path.sep}`)) continue;
    if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue;
    if (rel.endsWith('.spec.ts') || rel.endsWith('.spec.tsx')) continue;

    const text = fs.readFileSync(file, 'utf8');

    // Heuristic skip: ignore translation dictionaries and obvious non-UI files
    if (file.endsWith('landing-translations.ts')) continue;
    if (file.includes('/lib/i18n/')) continue;
    if (file.includes('/types/')) continue;

    const findings = [];

    // JSX text nodes
    const texts = extractJsxTextNodes(text);
    let cursor = 0;
    for (const t of texts) {
      if (findings.length >= maxPerFile) break;
      const { idx, line } = findLineNumber(text, t, cursor);
      cursor = idx !== -1 ? idx + t.length : cursor;
      findings.push({ kind: 'jsx-text', text: t, line });
    }

    // Literal attributes
    const attrs = extractLiteralAttributes(text);
    let attrCursor = 0;
    for (const a of attrs) {
      if (findings.length >= maxPerFile) break;
      const needle = `${a.name}=`;
      const { idx, line } = findLineNumber(text, needle, attrCursor);
      attrCursor = idx !== -1 ? idx + needle.length : attrCursor;
      findings.push({ kind: 'attr', attr: a.name, text: a.value, line });
    }

    // Filter: ignore common false positives
    const filtered = findings
      .filter((f) => !String(f.text).includes('console.') && !String(f.text).includes('use client'))
      .filter((f) => !String(f.text).includes('http'))
      .slice(0, maxPerFile);

    if (filtered.length) {
      report.push({
        file: path.relative(ROOT, file),
        count: filtered.length,
        findings: filtered,
      });
    }
  }

  report.sort((a, b) => b.count - a.count);

  fs.writeFileSync(path.join(ROOT, outFile), JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalFiles: report.length,
    totalFindings: report.reduce((acc, r) => acc + r.count, 0),
    report,
  }, null, 2));

  console.log(`Wrote ${outFile}`);
  console.log(`Files with findings: ${report.length}`);
  console.log(`Total findings: ${report.reduce((acc, r) => acc + r.count, 0)}`);
  if (report[0]) {
    console.log(`Top file: ${report[0].file} (${report[0].count})`);
  }
}

main();
