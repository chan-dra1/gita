/**
 * Gemini Voice TTS — Same natural AI voices as Echo
 *
 * Uses the Gemini API with native audio output to generate
 * natural-sounding speech. Supports multiple voices and languages.
 *
 * Voices available (same as Echo):
 *   Aoede (Female - Calm), Kore (Female - Energetic),
 *   Fenrir (Male - Deep), Puck (Male - Playful), etc.
 */

import { GoogleGenAI, Modality } from '@google/genai';

// ─── Voice Options (same as Echo) ────────────────────────────────

export interface GeminiVoice {
  id: string;
  name: string;
  gender: 'female' | 'male';
}

export const GEMINI_VOICES: GeminiVoice[] = [
  { id: 'Aoede', name: 'Aoede (Calm)', gender: 'female' },
  { id: 'Kore', name: 'Kore (Bright)', gender: 'female' },
  { id: 'Leda', name: 'Leda (Warm)', gender: 'female' },
  { id: 'Thalia', name: 'Thalia (Soft)', gender: 'female' },
  { id: 'Fenrir', name: 'Fenrir (Deep)', gender: 'male' },
  { id: 'Zephyr', name: 'Zephyr (Calm)', gender: 'male' },
  { id: 'Puck', name: 'Puck (Playful)', gender: 'male' },
  { id: 'Charon', name: 'Charon (Deep)', gender: 'male' },
  { id: 'Orpheus', name: 'Orpheus (Confident)', gender: 'male' },
  { id: 'Pegasus', name: 'Pegasus (Focused)', gender: 'male' },
];

// ─── Language definitions ────────────────────────────────────────

export interface VoiceLanguage {
  code: string;
  label: string;
  flag: string;
  prompt: string; // Instructions for language-specific reading
}

export const VOICE_LANGUAGES: VoiceLanguage[] = [
  {
    code: 'sanskrit',
    label: 'Sanskrit',
    flag: '🕉️',
    prompt: 'Read this ancient Sanskrit verse with proper pronunciation, reverence, and a meditative pace. Pronounce each word clearly.',
  },
  {
    code: 'english',
    label: 'English',
    flag: '🇺🇸',
    prompt: 'Read the translation in English clearly and calmly, as if you are a wise teacher sharing ancient wisdom.',
  },
  {
    code: 'hindi',
    label: 'Hindi',
    flag: '🇮🇳',
    prompt: 'इस श्लोक को हिंदी में पढ़ें, स्पष्ट उच्चारण और श्रद्धा के साथ।',
  },
  {
    code: 'spanish',
    label: 'Spanish',
    flag: '🇪🇸',
    prompt: 'Lee esta traducción en español de manera clara y serena, como un maestro espiritual.',
  },
  {
    code: 'french',
    label: 'French',
    flag: '🇫🇷',
    prompt: 'Lisez cette traduction en français de manière claire et sereine.',
  },
  {
    code: 'german',
    label: 'German',
    flag: '🇩🇪',
    prompt: 'Lesen Sie diese Übersetzung auf Deutsch klar und ruhig vor.',
  },
  {
    code: 'japanese',
    label: 'Japanese',
    flag: '🇯🇵',
    prompt: 'この翻訳を日本語で、穏やかに読み上げてください。',
  },
  {
    code: 'chinese',
    label: 'Chinese',
    flag: '🇨🇳',
    prompt: '请用中文清晰平和地朗读这段翻译。',
  },
  {
    code: 'portuguese',
    label: 'Portuguese',
    flag: '🇧🇷',
    prompt: 'Leia esta tradução em português de forma clara e serena.',
  },
  {
    code: 'russian',
    label: 'Russian',
    flag: '🇷🇺',
    prompt: 'Прочитайте этот перевод на русском языке спокойно и четко.',
  },
  {
    code: 'telugu',
    label: 'Telugu',
    flag: '🇮🇳',
    prompt: 'ఈ అనువాదాన్ని తెలుగులో స్పష్టంగా చదవండి.',
  },
  {
    code: 'tamil',
    label: 'Tamil',
    flag: '🇮🇳',
    prompt: 'இந்த மொழிபெயர்ப்பை தமிழில் தெளிவாக படியுங்கள்.',
  },
  {
    code: 'bengali',
    label: 'Bengali',
    flag: '🇮🇳',
    prompt: 'এই অনুবাদটি বাংলায় স্পষ্টভাবে পড়ুন।',
  },
  {
    code: 'arabic',
    label: 'Arabic',
    flag: '🇸🇦',
    prompt: 'اقرأ هذه الترجمة باللغة العربية بوضوح وهدوء.',
  },
];

// ─── Audio Context & Playback ────────────────────────────────────

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let isCurrentlyPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }
  return audioContext;
}

/**
 * Decode raw PCM int16 audio data (from Gemini) into an AudioBuffer.
 */
function decodePcmAudio(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

/**
 * Convert base64 string to ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Main TTS Function ──────────────────────────────────────────

/**
 * Generate and play speech using Gemini's native audio voices.
 * Uses the same model and voices as the Echo app.
 *
 * @param params.text        - The text to read aloud
 * @param params.language    - Language object from VOICE_LANGUAGES
 * @param params.voice       - Voice to use (default: Aoede)
 * @param params.apiKey      - Gemini API key
 * @param params.onStart     - Called when audio starts playing
 * @param params.onEnd       - Called when audio finishes
 * @param params.onError     - Called on error
 */
export async function speakWithGemini(params: {
  text: string;
  language: VoiceLanguage;
  voice?: GeminiVoice;
  apiKey: string;
  sloka?: { sanskrit: string; transliteration: string; translation_english: string };
  chapter?: number;
  verse?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}): Promise<void> {
  const {
    text,
    language,
    voice = GEMINI_VOICES[0], // Aoede by default
    apiKey,
    sloka,
    chapter,
    verse,
    onStart,
    onEnd,
    onError,
  } = params;

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    onError?.('Please configure your Gemini API key in config.ts');
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build a rich prompt for the verse reading
    let readingPrompt: string;

    if (sloka && chapter && verse) {
      if (language.code === 'sanskrit') {
        readingPrompt = `You are a sacred text reciter. ${language.prompt}

Bhagavad Gita, Chapter ${chapter}, Verse ${verse}:

${sloka.sanskrit}

Transliteration: ${sloka.transliteration}

Read the Sanskrit verse above with divine reverence. After reading the verse, briefly pause, then say the transliteration slowly and clearly.`;
      } else if (language.code === 'english') {
        readingPrompt = `You are a wise Gita scholar. ${language.prompt}

Bhagavad Gita, Chapter ${chapter}, Verse ${verse}.

Translation: ${sloka.translation_english}

Read this translation aloud. Speak with warmth and wisdom, as if explaining to a sincere student.`;
      } else {
        readingPrompt = `${language.prompt}

Bhagavad Gita, Chapter ${chapter}, Verse ${verse}.

English translation: ${sloka.translation_english}

Translate and read this verse in ${language.label}. Maintain the spiritual essence and speak with reverence.`;
      }
    } else {
      readingPrompt = `${language.prompt}\n\n${text}`;
    }

    // Use Gemini with native audio output (same model as Echo)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ role: 'user', parts: [{ text: readingPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice.id },
          },
        },
      },
    });

    // Extract audio data from response
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!audioData?.data) {
      onError?.('No audio data received from Gemini');
      return;
    }

    // Decode and play
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const audioBytes = base64ToArrayBuffer(audioData.data);
    const mimeType = audioData.mimeType || 'audio/pcm;rate=24000';

    let audioBuffer: AudioBuffer;

    if (mimeType.includes('pcm')) {
      // Raw PCM data (same as Echo)
      audioBuffer = decodePcmAudio(new Uint8Array(audioBytes), ctx, 24000);
    } else {
      // Encoded audio (MP3, WAV, etc.)
      audioBuffer = await ctx.decodeAudioData(audioBytes);
    }

    // Stop any current playback
    stopGeminiSpeech();

    // Play the audio
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    source.onended = () => {
      isCurrentlyPlaying = false;
      currentSource = null;
      onEnd?.();
    };

    currentSource = source;
    isCurrentlyPlaying = true;
    source.start(0);
    onStart?.();
  } catch (err: any) {
    isCurrentlyPlaying = false;
    currentSource = null;
    console.error('Gemini TTS error:', err);
    onError?.(err.message || 'Failed to generate audio');
  }
}

/**
 * Stop any currently playing Gemini speech.
 */
export function stopGeminiSpeech(): void {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // Already stopped
    }
    currentSource = null;
  }
  isCurrentlyPlaying = false;
}

/**
 * Check if Gemini speech is currently playing.
 */
export function isGeminiSpeaking(): boolean {
  return isCurrentlyPlaying;
}
