/**
 * Syncs English verse text from The Gita Initiative (github.com/gita/gita, The Unlicense):
 *   translation.json → author_id 20, lang "english" (Dr. S. Sankaranarayan in upstream metadata)
 * Clears per-verse word_meanings in bhagavad-gita.json (previous BBT-style gloss was not documented).
 *
 * Run from repo root: node scripts/sync-initiative-english-layer.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const GITA_JSON = path.join(ROOT, 'src/data/bhagavad-gita.json');

const TRANSLATION_URL =
  'https://raw.githubusercontent.com/gita/gita/main/data/translation.json';

async function main() {
  const res = await fetch(TRANSLATION_URL);
  if (!res.ok) throw new Error(`Fetch translation.json failed: ${res.status}`);
  /** @type {Array<{verse_id:number, lang:string, author_id:number, description:string}>} */
  const rows = await res.json();
  const byVerseId = new Map();
  for (const r of rows) {
    if (r.lang === 'english' && r.author_id === 20 && r.verse_id != null) {
      byVerseId.set(r.verse_id, (r.description || '').replace(/\u00a0/g, ' ').trim());
    }
  }
  if (byVerseId.size !== 701) {
    throw new Error(`Expected 701 English rows for author_id=20, got ${byVerseId.size}`);
  }

  const raw = JSON.parse(fs.readFileSync(GITA_JSON, 'utf8'));
  const data = raw?.chapters ? raw : raw?.default;
  if (!data?.chapters) throw new Error('bhagavad-gita.json: missing chapters');

  let vid = 1;
  for (const ch of data.chapters) {
    for (const v of ch.verses) {
      const t = byVerseId.get(vid);
      if (t == null || !t) throw new Error(`Missing translation for verse_id=${vid} (${ch.chapter}:${v.verse})`);
      v.translation_english = t;
      v.word_meanings = '';
      vid++;
    }
  }
  if (vid !== 702) throw new Error(`Verse count mismatch: last verse_id ${vid - 1}, expected 701`);

  fs.writeFileSync(GITA_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Updated', GITA_JSON, '— English from Initiative author_id=20; word_meanings cleared.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
