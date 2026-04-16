const fs = require('fs');
const path = require('path');
const https = require('https');

// Load the actual Gita data
const gitaData = require('../src/data/bhagavad-gita.json');
const chapters = gitaData.chapters;

// Working Google Cloud TTS API Key
const TTS_API_KEY = 'AIzaSyAidgMX7t1VryZFNKbG-8Mw8hfbCDb9jG8';

const AUDIO_DIR = path.join(__dirname, '../public/audio');

// Ensure output directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function generateGoogleTTS(text, language, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Skip: ${path.basename(outputPath)}`);
    return Promise.resolve('skipped');
  }

  // Choose voice based on language
  const voiceConfig = language === 'sanskrit'
    ? { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A' }
    : { languageCode: 'en-US', name: 'en-US-Journey-F' };

  const audioConfig = language === 'sanskrit'
    ? { audioEncoding: 'MP3', speakingRate: 0.85 }
    : { audioEncoding: 'MP3', speakingRate: 0.92 };

  // Clean up text for TTS (remove verse numbering markers like ||1-1||)
  const cleanText = text.replace(/\|\|[\d\-]+\|\|/g, '').replace(/\|/g, ',').trim();

  const payload = JSON.stringify({
    input: { text: cleanText },
    voice: voiceConfig,
    audioConfig: audioConfig
  });

  const options = {
    hostname: 'texttospeech.googleapis.com',
    path: `/v1/text:synthesize?key=${TTS_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode === 429) {
          console.log(`  ⏳ Rate limited. Waiting 10s...`);
          setTimeout(() => {
            generateGoogleTTS(text, language, outputPath).then(resolve).catch(reject);
          }, 10000);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`TTS error ${res.statusCode}: ${body.substring(0, 200)}`));
          return;
        }

        try {
          const parsed = JSON.parse(body);
          const buffer = Buffer.from(parsed.audioContent, 'base64');
          fs.writeFileSync(outputPath, buffer);
          const sizeKB = Math.round(buffer.length / 1024);
          console.log(`  ✅ ${path.basename(outputPath)} (${sizeKB} KB)`);
          resolve('generated');
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateAll() {
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');
  const fromChapter = parseInt(args.find(a => a.startsWith('--from='))?.split('=')[1] || '1');

  let totalVerses = 0;
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const ch of chapters) totalVerses += ch.verses.length;

  console.log(`\n🕉️  Bhagavad Gita CDN Audio Generator`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Provider: Google Cloud TTS (Neural2 + Journey)`);
  console.log(`Sanskrit: hi-IN-Neural2-A (calm, devotional)`);
  console.log(`English:  en-US-Journey-F (warm, human-like)`);
  console.log(`Total chapters: ${chapters.length}`);
  console.log(`Total verses: ${totalVerses}`);
  console.log(`Files to generate: ${totalVerses * 2} (Sanskrit + English)`);
  console.log(`Output: ${AUDIO_DIR}`);
  console.log(`Mode: ${testMode ? 'TEST (Ch1, 3 verses)' : 'FULL'}`);
  console.log(`Starting from chapter: ${fromChapter}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  for (const chapter of chapters) {
    if (chapter.chapter < fromChapter) continue;

    const verses = testMode && chapter.chapter === 1 ? chapter.verses.slice(0, 3) : chapter.verses;
    if (testMode && chapter.chapter > 1) break;

    console.log(`\n📖 Chapter ${chapter.chapter}: ${chapter.name} (${verses.length} verses)`);

    for (const verse of verses) {
      const sanskritPath = path.join(AUDIO_DIR, `ch${chapter.chapter}_v${verse.verse}_sanskrit.mp3`);
      const englishPath = path.join(AUDIO_DIR, `ch${chapter.chapter}_v${verse.verse}_english.mp3`);

      try {
        // Sanskrit
        const r1 = await generateGoogleTTS(verse.sanskrit, 'sanskrit', sanskritPath);
        if (r1 === 'skipped') skipped++; else generated++;
        await delay(250); // Small delay to stay under rate limits

        // English
        const r2 = await generateGoogleTTS(verse.translation_english, 'english', englishPath);
        if (r2 === 'skipped') skipped++; else generated++;
        await delay(250);
      } catch (err) {
        console.error(`  ❌ Ch${chapter.chapter} V${verse.verse}: ${err.message}`);
        failed++;
        continue;
      }
    }
  }

  // Summary
  const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
  const totalSizeMB = files.reduce((sum, f) => sum + fs.statSync(path.join(AUDIO_DIR, f)).size, 0) / (1024 * 1024);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Generation complete!`);
  console.log(`   New files: ${generated}`);
  console.log(`   Skipped (already exist): ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total MP3s on disk: ${files.length}`);
  console.log(`   Total size: ${totalSizeMB.toFixed(1)} MB`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

generateAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
