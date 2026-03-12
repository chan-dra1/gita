/**
 * Test script v2: Generate audio for 1 sloka (Chapter 2, Verse 47)
 * Fixed prompts for TTS-only model (no text generation allowed).
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node test-single-sloka-audio.mjs
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ Set GEMINI_API_KEY environment variable first!');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const VOICE = 'Aoede';
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'data', 'audio');

const SLOKA = {
  chapter: 2,
  verse: 47,
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन |\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ||२-४७||',
  transliteration: 'karmaṇy evādhikāras te mā phaleṣhu kadāchana, mā karma-phala-hetur bhūr mā te saṅgo stv akarmaṇi',
  translation_english: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results of your activities, nor be attached to inaction.',
};

// TTS-only model requires simple "read this text" prompts — no instructions to "generate" or "translate"
const LANGUAGES = [
  {
    code: 'sanskrit',
    // For Sanskrit: just read the transliteration clearly
    prompt: `Read the following Sanskrit verse aloud slowly and reverently:

${SLOKA.transliteration}`,
  },
  {
    code: 'english',
    prompt: `Read the following text aloud calmly and wisely:

Bhagavad Gita, Chapter ${SLOKA.chapter}, Verse ${SLOKA.verse}.

${SLOKA.translation_english}`,
  },
  {
    code: 'hindi',
    // Give it pre-translated Hindi text, not asking it to translate
    prompt: `निम्नलिखित पाठ को शांत और श्रद्धापूर्ण स्वर में पढ़ें:

भगवद्गीता, अध्याय ${SLOKA.chapter}, श्लोक ${SLOKA.verse}।

कर्म करने में ही तुम्हारा अधिकार है, फल में कभी नहीं। कर्मफल की इच्छा तुम्हारे कर्म का हेतु न बने और कर्म न करने में भी तुम्हारी आसक्ति न हो।`,
  },
];

function pcmToWav(pcmData, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(headerSize - 8 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}

async function generateAudio(lang, retries = 2) {
  console.log(`\n🎙️  Generating ${lang.code} audio...`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ role: 'user', parts: [{ text: lang.prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: VOICE },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (!audioData?.data) {
        console.error(`   ❌ No audio data (attempt ${attempt}/${retries})`);
        if (attempt < retries) {
          console.log('   🔄 Retrying in 3s...');
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        return null;
      }

      const pcmBuffer = Buffer.from(audioData.data, 'base64');
      const mimeType = audioData.mimeType || 'audio/pcm;rate=24000';
      console.log(`   📦 Raw: ${pcmBuffer.length} bytes | MIME: ${mimeType}`);

      const wavBuffer = pcmToWav(pcmBuffer, 24000);
      const filename = `${SLOKA.chapter}_${SLOKA.verse}_${lang.code}.wav`;
      const filepath = path.join(OUTPUT_DIR, filename);

      fs.writeFileSync(filepath, wavBuffer);

      const sizeKB = Math.round(wavBuffer.length / 1024);
      const durationSec = Math.round(pcmBuffer.length / (24000 * 2));

      console.log(`   ✅ Saved: ${filename}`);
      console.log(`   📏 Size: ${sizeKB} KB`);
      console.log(`   ⏱️  Duration: ~${durationSec} seconds`);

      return { filename, sizeBytes: wavBuffer.length, durationSec };
    } catch (error) {
      console.error(`   ❌ Error (attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt < retries) {
        console.log('   🔄 Retrying in 3s...');
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  return null;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  🕉️  Gita Audio Test v2 — Single Sloka');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Voice: ${VOICE} (Female - Calm)`);
  console.log(`  Verse: Chapter ${SLOKA.chapter}, Verse ${SLOKA.verse}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalSize = 0;
  const results = [];

  for (const lang of LANGUAGES) {
    const result = await generateAudio(lang);
    if (result) {
      totalSize += result.sizeBytes;
      results.push(result);
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('  📊 RESULTS');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Files generated: ${results.length}/${LANGUAGES.length}`);
  console.log(`  Total size: ${Math.round(totalSize / 1024)} KB\n`);

  if (results.length > 0) {
    const avgSize = totalSize / results.length;
    const avgDuration = results.reduce((s, r) => s + r.durationSec, 0) / results.length;

    console.log(`  Average per file: ${Math.round(avgSize / 1024)} KB, ~${Math.round(avgDuration)}s`);
    console.log(`\n  📐 STORAGE ESTIMATES FOR 700 VERSES (WAV):`);
    console.log(`     1 language:  ~${Math.round((avgSize * 700) / (1024 * 1024))} MB`);
    console.log(`     3 languages: ~${Math.round((avgSize * 700 * 3) / (1024 * 1024))} MB`);
    console.log(`\n  📐 STORAGE ESTIMATES FOR 700 VERSES (MP3 @ 64kbps):`);
    console.log(`     1 language:  ~${Math.round((avgSize * 700 * 0.15) / (1024 * 1024))} MB`);
    console.log(`     3 languages: ~${Math.round((avgSize * 700 * 3 * 0.15) / (1024 * 1024))} MB`);
  }

  console.log(`\n  🎧 Listen: open ${OUTPUT_DIR}/`);
}

main().catch(console.error);
