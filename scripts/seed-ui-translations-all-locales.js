#!/usr/bin/env node
/*
  Seed UI translations for ALL supported locales.

  Why:
  - `useUiTranslations` currently generates translations per-locale on demand.
  - If you want "toutes les pages traduites" across all supported locales,
    you need to ensure keys exist in `ui_translations` for every locale.

  What this script does:
  - Scans `src/app` and `src/components` for `entries` objects used with `useUiTranslations`.
  - Extracts { key: source } pairs.
  - Calls POST /api/i18n for each locale to generate/store translations via OpenAI.

  Usage:
    1) Start the app (so /api/i18n exists):
       npm run dev
    2) Seed:
       node scripts/seed-ui-translations-all-locales.js --baseUrl=http://localhost:3000

  Options:
    --baseUrl=<url>   Base URL of the running app (default: http://localhost:3000)
    --locales=fr,en   Comma-separated locales to seed (default: all from src/lib/i18n)
    --maxEntries=50   Max entries per API call (default: 40)

  Notes:
  - Requires OPENAI_API_KEY to be configured on the running server.
  - Does NOT magically translate hardcoded strings; it seeds keys already wired via `useUiTranslations`.
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

function readLocalesFromI18nIndex() {
  const p = path.join(ROOT, 'src/lib/i18n/index.ts');
  const txt = fs.readFileSync(p, 'utf8');
  const m = txt.match(/export const LOCALES:\s*Locale\[\]\s*=\s*\[([^\]]+)\]/m);
  if (!m) return ['fr', 'en'];
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .map((s) => s.replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function extractEntriesBlocks(text) {
  // Heuristic: find occurrences of `const entries` or `entries = useMemo(`.
  // Then brace-match the object literal.
  const blocks = [];
  const anchors = ['const entries', 'let entries', 'var entries'];

  for (const anchor of anchors) {
    let idx = 0;
    while (true) {
      const found = text.indexOf(anchor, idx);
      if (found === -1) break;
      const startSearch = text.indexOf('{', found);
      if (startSearch === -1) break;

      // Brace matching ignoring strings.
      let i = startSearch;
      let depth = 0;
      let inStr = null;
      let esc = false;
      for (; i < text.length; i++) {
        const ch = text[i];
        if (inStr) {
          if (esc) {
            esc = false;
            continue;
          }
          if (ch === '\\') {
            esc = true;
            continue;
          }
          if (ch === inStr) {
            inStr = null;
          }
          continue;
        }
        if (ch === '"' || ch === "'") {
          inStr = ch;
          continue;
        }
        if (ch === '{') depth++;
        if (ch === '}') {
          depth--;
          if (depth === 0) {
            blocks.push(text.slice(startSearch, i + 1));
            idx = i + 1;
            break;
          }
        }
      }
      if (i >= text.length) break;
    }
  }

  return blocks;
}

function parseKeyValuePairsFromObjectLiteral(objText) {
  // Matches: 'key': 'value'  OR  "key": "value"
  // Value is expected to be a plain string literal.
  const re = /(["'])([^"'\\\n]+)\1\s*:\s*(["'])(?:(?!\3)[^\\\n]|\\.)*\3/g;
  const out = new Map();
  let m;
  while ((m = re.exec(objText))) {
    const key = m[2];
    const full = m[0];
    const colonIdx = full.indexOf(':');
    const valueRaw = full.slice(colonIdx + 1).trim();

    // Extract the quoted value content
    const q = valueRaw[0];
    if (q !== '"' && q !== "'") continue;

    let val = '';
    let j = 1;
    let esc = false;
    for (; j < valueRaw.length; j++) {
      const ch = valueRaw[j];
      if (esc) {
        val += ch;
        esc = false;
        continue;
      }
      if (ch === '\\') {
        esc = true;
        continue;
      }
      if (ch === q) break;
      val += ch;
    }

    // Heuristic: keep only i18n-like keys (contain a dot)
    if (!key.includes('.')) continue;

    if (!out.has(key)) out.set(key, val);
  }
  return out;
}

function collectUiEntries() {
  const files = TARGET_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
  const all = new Map();

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    if (!text.includes('useUiTranslations')) continue;

    const blocks = extractEntriesBlocks(text);
    for (const b of blocks) {
      const pairs = parseKeyValuePairsFromObjectLiteral(b);
      for (const [k, v] of pairs.entries()) {
        if (!all.has(k)) all.set(k, v);
      }
    }
  }

  return all;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const args = parseArgs(process.argv);
  const baseUrl = args.baseUrl || 'http://localhost:3000';
  const maxEntries = Number(args.maxEntries || 40);

  const locales = (args.locales ? String(args.locales).split(',') : readLocalesFromI18nIndex())
    .map((s) => s.trim())
    .filter(Boolean);

  const entriesMap = collectUiEntries();
  const entriesArr = Array.from(entriesMap.entries()).map(([key, source]) => ({ key, source }));

  console.log(`Collected ${entriesArr.length} UI translation key(s).`);
  console.log(`Target locales: ${locales.join(', ')}`);

  for (const locale of locales) {
    console.log(`\nSeeding locale: ${locale}`);

    for (let i = 0; i < entriesArr.length; i += maxEntries) {
      const chunk = entriesArr.slice(i, i + maxEntries);
      const { ok, status, data } = await postJson(`${baseUrl}/api/i18n`, {
        locale,
        entries: chunk,
      });

      if (!ok) {
        console.error(`  ✗ Failed chunk ${i}-${i + chunk.length} (HTTP ${status})`);
        console.error(data);
        process.exitCode = 1;
        return;
      }

      process.stdout.write(`  ✓ ${Math.min(i + chunk.length, entriesArr.length)}/${entriesArr.length}\r`);
    }

    console.log(`  ✓ Done locale ${locale}`);
  }

  console.log('\nAll locales seeded.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
