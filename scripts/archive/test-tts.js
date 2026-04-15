const https = require('https');

async function testTTS() {
  const apiKey = process.env.EXPO_PUBLIC_TTS_API_KEY;
  if (!apiKey) {
    console.error('No TTS API key');
    return;
  }
  
  const data = JSON.stringify({
    input: { text: 'Hello world' },
    voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
    audioConfig: { audioEncoding: 'MP3' }
  });

  const options = {
    hostname: 'texttospeech.googleapis.com',
    path: `/v1/text:synthesize?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('TTS success!');
      } else {
        console.error('TTS failure:', res.statusCode, body);
      }
    });
  });

  req.on('error', (e) => {
    console.error('TTS request error:', e);
  });

  req.write(data);
  req.end();
}

testTTS();
