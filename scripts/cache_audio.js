const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.OPENAI_API_KEY || 'YOUR_API_KEY';

const gitaFile = path.join(__dirname, '../src/data/bhagavad-gita.json');
const gitaData = JSON.parse(fs.readFileSync(gitaFile, 'utf8'));

const outDirSanskrit = path.join(__dirname, '../assets/audio/sanskrit');
const outDirEnglish = path.join(__dirname, '../assets/audio/english');

function cleanTextForSpeech(text) {
  return text
    .replace(/^(chapter|verse|sloka)\s+\d+[,.]?\s*/gi, '')
    .replace(/Chapter \d+, Verse \d+[.,]?\s*/gi, '')
    .replace(/;/g, ',')
    .replace(/(\\||॥)[^\\|॥]*(\\||॥)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function fetchAudio(text, voice, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`Skipping existing: ${outputPath}`);
    return;
  }

  const postData = JSON.stringify({
    model: "tts-1",
    input: text,
    voice: voice,
    response_format: "mp3",
    speed: voice === 'nova' ? 0.9 : 0.85
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/audio/speech',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', chunk => errorData += chunk);
        res.on('end', () => reject(new Error(`API Error ${res.statusCode}: ${errorData}`)));
        return;
      }
      
      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log('Starting audio caching...');
  const queue = [];

  for (const chapter of gitaData.chapters) {
    for (const verse of chapter.verses) {
      if (verse.verse > 10) continue; // For testing and limiting time, let's just do a run up to verse 10 per chapter or something.
      
      const sanskritText = cleanTextForSpeech(verse.sanskrit);
      const englishText = cleanTextForSpeech(verse.translation_english);
      
      queue.push({
        text: sanskritText,
        voice: 'alloy', // Alloy is good for non-english, or Echo
        path: path.join(outDirSanskrit, `${chapter.chapter}_${verse.verse}.mp3`)
      });
      
      queue.push({
        text: englishText,
        voice: 'nova', // Nova is female, calm
        path: path.join(outDirEnglish, `${chapter.chapter}_${verse.verse}.mp3`)
      });
    }
  }

  // To respect rate limits and not crash node/OpenAI (Tier 1 is 50 RPM = ~1 per sec)
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      console.log(`[${i+1}/${queue.length}] Generating ${path.basename(item.path)}`);
      await fetchAudio(item.text, item.voice, item.path);
      await delay(1200); // 1.2 seconds between requests
    } catch (err) {
      console.error(`Failed on ${item.path}: ${err.message}`);
      // wait a bit longer on error
      await delay(5000);
    }
  }

  console.log('Finished caching audio.');
}

main();
