#!/usr/bin/env node
/**
 * Batch Spiritual Audio Generator — Chapter-by-Chapter with Auto-Deploy
 * =====================================================================
 * Generates all audio for one chapter at a time, then auto-commits
 * and pushes to GitHub (triggering Vercel deployment).
 *
 * FAILSAFE: Skips existing files, so you can restart anytime without losing progress.
 *
 * Usage:
 *   node scripts/batch-generate-all.mjs [--start-chapter 1] [--end-chapter 18]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ─── Config ────────────────────────────────────────────────────────
const API_KEY = (() => {
  try {
    const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    return envContent.match(/EXPO_PUBLIC_GEMINI_API_KEY=(.+)/)?.[1]?.trim();
  } catch { return null; }
})();

if (!API_KEY) {
  console.error('❌ No Gemini API key found in .env');
  process.exit(1);
}

const MODEL = 'gemini-3.1-flash-tts-preview';
const VOICE_NAME = 'Aoede';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const OUTPUT_DIR = path.join(ROOT, 'public', 'audio');
const LANGUAGES = ['sanskrit', 'english', 'hindi'];
const RATE_LIMIT_MS = 7000; // 7s between calls (10 req/min quota)
const RETRY_WAIT_MS = 35000; // 35s wait on rate limit errors

// ─── Spiritual Prompts ─────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  sanskrit: `You are a sacred Sanskrit scholar and spiritual chanter (Devi वाणी). 
Chant the following Bhagavad Gita shloka in a slow, meditative, deeply devotional manner.
Your voice should evoke the feeling of being in a peaceful temple at dawn.
Pronunciation must be flawless Devanagari Sanskrit with proper chandas (meter).
Pace: Very slow and reverent. Each word should breathe and resonate.
Add natural pauses between half-verses (marked by |).
Do not add any commentary or introduction — chant only the shloka text.`,

  english: `You are a gentle spiritual guide (Devi वाणी) explaining the Bhagavad Gita.
Read the following English translation in a calm, peaceful, meditative voice.
Speak slowly and clearly, as if guiding someone through a quiet meditation.
Your tone should be warm, compassionate, and deeply peaceful.
Do not add any commentary beyond the provided text.
Pace: Slow and contemplative, with natural breathing pauses.`,

  hindi: `आप एक शांत आध्यात्मिक मार्गदर्शक (देवी वाणी) हैं जो भगवद्गीता का हिंदी अनुवाद पढ़ रही हैं।
निम्नलिखित हिंदी अनुवाद को धीमी, शांत, ध्यानमग्न आवाज़ में पढ़ें।
आपकी आवाज़ में करुणा, शांति और आध्यात्मिकता होनी चाहिए।
गति: धीमी और चिंतनशील। प्राकृतिक विराम लें।
केवल दिया गया पाठ पढ़ें, कोई टिप्पणी न जोड़ें।`,
};

// ─── Data ──────────────────────────────────────────────────────────
function loadGitaData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'bhagavad-gita.json'), 'utf8'));
}

function loadHindiTranslations() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'languages', 'hi.json'), 'utf8'));
  } catch { return {}; }
}

// ─── WAV Helper ────────────────────────────────────────────────────
function createWavHeader(dataLength, sampleRate = 24000, bitsPerSample = 16, channels = 1) {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

// ─── Generate Single Audio ─────────────────────────────────────────
async function generateAudio(text, language, retries = 3) {
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.english;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const body = {
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n---\n\n${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } } },
        },
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429 || res.status === 503) {
        console.log(` ⏳ Rate limited (attempt ${attempt}/${retries}), waiting ${RETRY_WAIT_MS/1000}s...`);
        await sleep(RETRY_WAIT_MS);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API ${res.status}: ${errText.substring(0, 150)}`);
      }

      const json = await res.json();
      const audioPart = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!audioPart) throw new Error('No audio data in response');

      const rawPcm = Buffer.from(audioPart.inlineData.data, 'base64');
      const wavHeader = createWavHeader(rawPcm.length);
      return Buffer.concat([wavHeader, rawPcm]);

    } catch (err) {
      if (attempt === retries) throw err;
      console.log(` ⚠️ Attempt ${attempt} failed: ${err.message.substring(0, 80)}, retrying...`);
      await sleep(10000);
    }
  }
}

// ─── Deploy Chapter ────────────────────────────────────────────────
function deployChapter(chapter) {
  try {
    execSync(`git add public/audio/ && git commit -m "audio: Chapter ${chapter} spiritual audio (Devi वाणी)" && git push`, {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 60000,
    });
    console.log(`  🚀 Chapter ${chapter} deployed to GitHub → Vercel!`);
    return true;
  } catch (err) {
    console.log(`  ⚠️ Deploy failed (will retry next chapter): ${err.message.substring(0, 80)}`);
    return false;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getProgressFile() {
  return path.join(ROOT, 'scripts', '.audio-gen-progress.json');
}

function saveProgress(chapter, verse, lang, status) {
  const file = getProgressFile();
  let data = {};
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  if (!data.chapters) data.chapters = {};
  if (!data.chapters[chapter]) data.chapters[chapter] = { completed: 0, total: 0, lastVerse: 0, lastLang: '' };
  data.chapters[chapter].lastVerse = verse;
  data.chapters[chapter].lastLang = lang;
  if (status === 'done') data.chapters[chapter].completed++;
  data.lastUpdate = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const startChapter = parseInt(args.find((a, i) => args[i - 1] === '--start-chapter') || '1');
  const endChapter = parseInt(args.find((a, i) => args[i - 1] === '--end-chapter') || '18');

  const gitaData = loadGitaData();
  const hiTranslations = loadHindiTranslations();

  // Ensure output dirs
  for (const lang of LANGUAGES) {
    fs.mkdirSync(path.join(OUTPUT_DIR, lang), { recursive: true });
  }

  console.log(`\n🙏 Batch Spiritual Audio Generator — Devi वाणी`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📖 Chapters: ${startChapter} → ${endChapter}`);
  console.log(`🗣️  Model: Gemini 3.1 Flash TTS (Aoede)`);
  console.log(`🌐 Languages: Sanskrit, English, Hindi`);
  console.log(`💾 Failsafe: Skips existing files, deploys per chapter`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const chapter of gitaData.chapters) {
    if (chapter.chapter < startChapter || chapter.chapter > endChapter) continue;

    const chNum = chapter.chapter;
    const verses = chapter.verses;
    console.log(`\n📖 CHAPTER ${chNum}: ${chapter.name} (${verses.length} verses)`);
    console.log(`${'─'.repeat(50)}`);

    let chapterGenerated = 0;

    for (const verse of verses) {
      for (const lang of LANGUAGES) {
        const outFile = `${chNum}_${verse.verse}.mp3`;
        const outPath = path.join(OUTPUT_DIR, lang, outFile);

        // FAILSAFE: Skip if already exists
        if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
          totalSkipped++;
          continue;
        }

        // Get text
        let text = '';
        if (lang === 'sanskrit') {
          text = verse.sanskrit;
        } else if (lang === 'english') {
          text = verse.translation_english;
        } else if (lang === 'hindi') {
          const key = `${chNum}_${verse.verse}`;
          text = hiTranslations[key] || '';
          if (!text) continue; // No Hindi translation available
        }
        if (!text) continue;

        // Generate
        process.stdout.write(`  🎵 ${lang}/${outFile}...`);
        try {
          const wavData = await generateAudio(text, lang);

          // Try ffmpeg conversion, fallback to WAV-as-mp3
          const wavPath = outPath.replace('.mp3', '.wav');
          fs.writeFileSync(wavPath, wavData);
          try {
            execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -qscale:a 2 "${outPath}" 2>/dev/null`, { timeout: 30000 });
            fs.unlinkSync(wavPath);
          } catch {
            fs.renameSync(wavPath, outPath);
          }

          const sizeMB = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
          console.log(` ✅ ${sizeMB}MB`);
          totalGenerated++;
          chapterGenerated++;
          saveProgress(chNum, verse.verse, lang, 'done');
        } catch (err) {
          console.log(` ❌ ${err.message.substring(0, 100)}`);
          totalFailed++;
          saveProgress(chNum, verse.verse, lang, 'failed');
        }

        // Rate limit
        await sleep(RATE_LIMIT_MS);
      }
    }

    // Deploy after each chapter
    if (chapterGenerated > 0) {
      console.log(`\n  📦 Chapter ${chNum} complete: ${chapterGenerated} new files`);
      deployChapter(chNum);
    } else {
      console.log(`  ✅ Chapter ${chNum}: All files already exist, nothing to generate`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ✅ Generated: ${totalGenerated}`);
  console.log(`  ⏭️  Skipped:   ${totalSkipped}`);
  console.log(`  ❌ Failed:    ${totalFailed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n🙏 Hari Om Tat Sat\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
