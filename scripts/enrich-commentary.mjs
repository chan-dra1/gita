/**
 * Bhagavad Gita Commentary Enrichment Script
 *
 * Generates original spiritual commentary for every verse using Gemini AI.
 * Inspired by public-domain masters (Adi Shankara, Mahatma Gandhi, Swami
 * Vivekananda, Sri Aurobindo) but written as entirely new original content.
 *
 * Usage:
 *   node scripts/enrich-commentary.mjs            # all 700 verses
 *   node scripts/enrich-commentary.mjs --preview  # first 5 only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Config ────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL   = 'gemini-2.5-flash-lite';
const PREVIEW_MODE   = process.argv.includes('--preview');
const DELAY_MS       = 800; // 0.8s between requests (flash-lite is fast)

// Paths
const GITA_DATA      = path.join(ROOT, 'src/data/bhagavad-gita.json');
const COMMENTARY_OUT = path.join(ROOT, 'src/data/commentary.json');
const SCHOLAR_OUT    = path.join(ROOT, 'src/data/scholar_answers.json');
const PROGRESS_FILE  = path.join(ROOT, 'scripts/.enrich-progress.json');

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set. Run with: GEMINI_API_KEY=... node ...');
  process.exit(1);
}

// ── Load data ─────────────────────────────────────────────────────────────────
const gitaData   = JSON.parse(fs.readFileSync(GITA_DATA, 'utf8'));
const commentary = fs.existsSync(COMMENTARY_OUT)
  ? JSON.parse(fs.readFileSync(COMMENTARY_OUT, 'utf8'))
  : { commentaries: {} };
if (!commentary.commentaries) commentary.commentaries = {};

const scholarData = fs.existsSync(SCHOLAR_OUT)
  ? JSON.parse(fs.readFileSync(SCHOLAR_OUT, 'utf8'))
  : {};
const progress = fs.existsSync(PROGRESS_FILE)
  ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
  : { completed: [] };

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isPlaceholder(text) {
  if (!text) return true;
  if (text.startsWith('Summary for Chapter')) return true;
  if (text.includes("emphasizes the importance of following one's dharma")) return true;
  if (text.startsWith('{')) return true;
  if (text.startsWith('```')) return true;
  return false;
}

/**
 * Robustly extract parsed JSON from Gemini's response text.
 * Handles: thinking text prefix, markdown fences, partial objects.
 */
function extractJSON(text) {
  // Remove markdown code fences
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Try to parse from the last '{' character backwards (handles thinking prefix)
  let idx = cleaned.lastIndexOf('{');
  while (idx >= 0) {
    try {
      const obj = JSON.parse(cleaned.substring(idx));
      if (obj && typeof obj === 'object' && obj.meaning) return obj;
    } catch { /* keep searching */ }
    idx = cleaned.lastIndexOf('{', idx - 1);
  }

  // Field-by-field regex fallback
  const get = (field) => {
    // matches "field": "value" with escaped characters inside
    const re = new RegExp('"' + field + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"');
    const m = cleaned.match(re);
    return m ? m[1].replace(/\\n/g, ' ').replace(/\\t/g, ' ').trim() : null;
  };

  return {
    meaning: get('meaning'),
    application: get('application'),
    question: get('question'),
    answer: get('answer')
  };
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${err.substring(0, 200)}`);
  }

  const data = await resp.json();
  // gemini-2.5-flash returns thinking tokens in part[0] + answer in later parts
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || '').join('').trim();
}

function buildPrompt(chapter, verse, sanskrit, translation, wordMeanings) {
  return `You are writing original spiritual commentary for a premium Bhagavad Gita app called "The Sanctuary". Your commentary is inspired by the depth of Adi Shankara's Advaita Vedanta philosophy, the practical wisdom of Mahatma Gandhi, and the universal spirituality of Swami Vivekananda. It is entirely your own original writing — do NOT copy any existing text.

VERSE: Bhagavad Gita ${chapter}.${verse}
SANSKRIT: ${(sanskrit || '').substring(0, 200)}
ENGLISH: ${translation || ''}
WORD MEANINGS: ${(wordMeanings || '').substring(0, 300)}

Respond with ONLY a valid JSON object, no markdown, no code fences, no explanation — just raw JSON:
{"meaning":"[2-3 sentence deep spiritual insight — poetic but clear, referencing key Sanskrit terms]","application":"[2-3 sentence practical guide for modern daily life — specific and actionable]","question":"[A meaningful spiritual question a seeker would ask about this verse]","answer":"[3-4 sentence illuminating answer connecting this verse to real human experience]"}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const DEFAULTS = {
    meaning: 'This verse from the Bhagavad Gita reveals profound spiritual wisdom about the eternal nature of the Self.',
    application: 'Practice self-inquiry and mindful awareness to embody the timeless wisdom of this verse in your daily life.',
    question: 'What is the core spiritual message of this verse?',
    answer: 'This verse illuminates the path toward liberation through self-knowledge, right action, and devotion to the Divine.'
  };

  let enriched = 0;
  let skipped = 0;
  let previewCount = 0;

  console.log('\n🕉  Bhagavad Gita Commentary Enrichment');
  console.log(`   Mode: ${PREVIEW_MODE ? 'PREVIEW (5 verses)' : 'FULL (all 700 verses)'}`);
  console.log(`   Completed so far: ${progress.completed.length} verses\n`);

  outer: for (const chapter of gitaData.chapters) {
    for (const verseData of chapter.verses) {
      const key = `${chapter.chapter}.${verseData.verse}`;
      const scholarKey = `${chapter.chapter}:${verseData.verse}`;

      // Already done?
      if (progress.completed.includes(key)) {
        skipped++;
        continue;
      }

      // Has real content already?
      const existing = commentary.commentaries[key];
      if (existing && !isPlaceholder(existing.meaning) && !isPlaceholder(existing.application)) {
        progress.completed.push(key);
        skipped++;
        continue;
      }

      // Preview limit
      if (PREVIEW_MODE && previewCount >= 5) {
        console.log('\n✅ Preview complete. Remove --preview to enrich all verses.');
        break outer;
      }
      previewCount++;

      process.stdout.write(`  [${chapter.chapter}.${verseData.verse}] Generating... `);

      try {
        const prompt = buildPrompt(
          chapter.chapter,
          verseData.verse,
          verseData.sanskrit,
          verseData.translation_english,
          verseData.word_meanings
        );

        const raw = await callGemini(prompt);
        const extracted = extractJSON(raw);

        // Merge with defaults for any missing fields
        const final = {
          meaning:      extracted?.meaning      || DEFAULTS.meaning,
          application:  extracted?.application  || DEFAULTS.application,
          question:     extracted?.question     || DEFAULTS.question,
          answer:       extracted?.answer       || DEFAULTS.answer
        };

        // Save commentary
        commentary.commentaries[key] = {
          sankara: '',
          meaning: final.meaning,
          application: final.application
        };

        // Save scholar Q&A
        scholarData[scholarKey] = [{
          question: final.question,
          answer: final.answer
        }];

        // Mark progress & persist
        progress.completed.push(key);
        enriched++;

        fs.writeFileSync(COMMENTARY_OUT, JSON.stringify(commentary, null, 2));
        fs.writeFileSync(SCHOLAR_OUT, JSON.stringify(scholarData, null, 2));
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

        const isDefault = final.meaning === DEFAULTS.meaning;
        console.log(isDefault ? '⚠️  (default used)' : '✅');

        await sleep(DELAY_MS);

      } catch (err) {
        console.log(`❌ ${err.message.substring(0, 80)}`);
        await sleep(3000);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Enriched this run: ${enriched}`);
  console.log(`   Skipped (done):    ${skipped}`);
  console.log(`   Total completed:   ${progress.completed.length}`);
  console.log(`\n✨ src/data/commentary.json`);
  console.log(`✨ src/data/scholar_answers.json\n`);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
