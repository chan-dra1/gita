#!/usr/bin/env node
/**
 * Spiritual Audio Generator – Gemini 2.5 Flash TTS
 * =================================================
 * Generates calm, meditative chanting audio for Bhagavad Gita slokas.
 *
 * Voice: "Aoede" (UI name: "Devi वाणी")
 * Languages: Sanskrit (chanting), English (meaning), Hindi (अर्थ)
 *
 * Usage:
 *   node scripts/generate-spiritual-audio.mjs --chapter 1 [--verses 1-5] [--lang sanskrit,english,hindi]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ─── Config ────────────────────────────────────────────────────────
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY
  || process.env.GEMINI_API_KEY
  || (() => {
    try { return fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/EXPO_PUBLIC_GEMINI_API_KEY=(.+)/)?.[1]?.trim(); } catch { return null; }
  })();

if (!API_KEY) {
  console.error('❌ No Gemini API key found. Set GEMINI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY.');
  process.exit(1);
}

const MODEL = 'gemini-3.1-flash-tts-preview';
const VOICE_NAME = 'Aoede'; // Calm, breezy female voice — UI name: "Devi वाणी"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const OUTPUT_DIR = path.join(ROOT, 'public', 'audio');

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

// ─── Data Loading ──────────────────────────────────────────────────

function loadVerses(chapter) {
  const gitaPath = path.join(ROOT, 'src', 'data', 'bhagavad-gita.json');
  const data = JSON.parse(fs.readFileSync(gitaPath, 'utf8'));
  const ch = data.chapters.find(c => c.chapter === chapter);
  if (!ch) throw new Error(`Chapter ${chapter} not found`);
  return ch.verses;
}

function loadHindiTranslations() {
  try {
    const hiPath = path.join(ROOT, 'src', 'data', 'languages', 'hi.json');
    return JSON.parse(fs.readFileSync(hiPath, 'utf8'));
  } catch {
    console.warn('⚠️ Hindi translations not found at src/data/languages/hi.json');
    return {};
  }
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
  header.writeUInt32LE(16, 16);          // PCM
  header.writeUInt16LE(1, 20);           // Audio format (PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

// ─── Gemini TTS Generation ─────────────────────────────────────────

async function generateAudio(text, language) {
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.english;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n---\n\n${text}` }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: VOICE_NAME,
          },
        },
      },
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 300)}`);
  }

  const json = await res.json();
  
  // Extract audio data from response
  const candidate = json.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error('No audio content in response');
  }

  const audioPart = candidate.content.parts.find(p => p.inlineData);
  if (!audioPart) {
    throw new Error('No inline audio data found in response');
  }

  const rawPcm = Buffer.from(audioPart.inlineData.data, 'base64');
  const wavHeader = createWavHeader(rawPcm.length);
  return Buffer.concat([wavHeader, rawPcm]);
}

// ─── WAV → MP3 Conversion (optional via ffmpeg) ──────────────────

async function convertToMp3(wavPath, mp3Path) {
  const { execSync } = await import('child_process');
  try {
    execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -qscale:a 2 "${mp3Path}" 2>/dev/null`);
    fs.unlinkSync(wavPath); // clean up wav
    return true;
  } catch {
    console.warn('  ⚠️ ffmpeg not available, keeping WAV format');
    // Rename .wav to .mp3 extension for compatibility (it's still WAV data but works)
    fs.renameSync(wavPath, mp3Path);
    return false;
  }
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const chapterArg = args.find((a, i) => args[i - 1] === '--chapter') || '1';
  const versesArg = args.find((a, i) => args[i - 1] === '--verses') || null;
  const langArg = args.find((a, i) => args[i - 1] === '--lang') || 'sanskrit,english,hindi';
  const forceRegenerate = args.includes('--force');
  
  const chapter = parseInt(chapterArg);
  const languages = langArg.split(',').map(l => l.trim());
  
  console.log(`\n🙏 Spiritual Audio Generator — Devi वाणी`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📖 Chapter: ${chapter}`);
  console.log(`🗣️  Voice: Aoede (Devi वाणी)`);
  console.log(`🌐 Languages: ${languages.join(', ')}`);
  console.log(`📂 Output: public/audio/\n`);

  const verses = loadVerses(chapter);
  const hiTranslations = loadHindiTranslations();

  // Parse verse range
  let verseRange = verses;
  if (versesArg) {
    const [start, end] = versesArg.split('-').map(Number);
    verseRange = verses.filter(v => v.verse >= start && v.verse <= (end || start));
  }

  console.log(`📝 Processing ${verseRange.length} verses...\n`);

  // Ensure output directories
  for (const lang of languages) {
    const langDir = path.join(OUTPUT_DIR, lang);
    fs.mkdirSync(langDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (const verse of verseRange) {
    for (const lang of languages) {
      const verseNum = verse.verse;
      const outFile = `${chapter}_${verseNum}.mp3`;
      const outPath = path.join(OUTPUT_DIR, lang, outFile);

      // Skip if already exists (unless --force)
      if (fs.existsSync(outPath) && !forceRegenerate) {
        console.log(`  ✅ ${lang}/${outFile} — already exists, skipping`);
        continue;
      }

      // Get text for this language
      let text = '';
      if (lang === 'sanskrit') {
        text = verse.sanskrit;
      } else if (lang === 'english') {
        text = verse.translation_english;
      } else if (lang === 'hindi') {
        // Hindi file uses underscore keys: "1_1", "1_2" etc.
        const key = `${chapter}_${verseNum}`;
        text = hiTranslations[key] || '';
        if (!text) {
          console.log(`  ⚠️ ${lang}/${outFile} — no Hindi translation, skipping`);
          continue;
        }
      }

      if (!text) {
        console.log(`  ⚠️ ${lang}/${outFile} — no text found, skipping`);
        continue;
      }

      // Generate audio
      process.stdout.write(`  🎵 Generating ${lang}/${outFile}...`);
      try {
        const wavData = await generateAudio(text, lang);
        const wavPath = outPath.replace('.mp3', '.wav');
        fs.writeFileSync(wavPath, wavData);
        await convertToMp3(wavPath, outPath);
        
        const sizeMB = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
        console.log(` ✅ (${sizeMB} MB)`);
        successCount++;
      } catch (err) {
        console.log(` ❌ ${err.message.substring(0, 200)}`);
        failCount++;
        // If rate limited, wait longer
        if (err.message.includes('429') || err.message.includes('quota')) {
          console.log('  ⏳ Rate limited, waiting 30s...');
          await new Promise(r => setTimeout(r, 30000));
        }
      }

      // Rate limiting: pause 7s between requests (10 req/min quota)
      await new Promise(r => setTimeout(r, 7000));
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Generated: ${successCount} | ❌ Failed: ${failCount}`);
  console.log(`📂 Files saved to: public/audio/`);
  console.log(`\n🙏 Hari Om Tat Sat\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
