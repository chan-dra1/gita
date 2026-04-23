/**
 * Server env validation.
 *
 * Lazily reads `process.env` on first `getEnv()` call (per route handler), not at
 * module import. That avoids breaking Vercel’s build/bundling if something
 * transitively imports this file before env is guaranteed to exist.
 *
 * Never log the actual values; only log which keys are missing.
 */

export interface ServerEnv {
  GEMINI_API_KEY: string;
  CLAUDE_API_KEY: string;
  TTS_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  // Optional
  UPSTASH_REDIS_URL: string | undefined;
  UPSTASH_REDIS_TOKEN: string | undefined;
  NODE_ENV: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

const REQUIRED: (keyof ServerEnv)[] = [
  'GEMINI_API_KEY',
  'CLAUDE_API_KEY',
  'TTS_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

function readEnv(): ServerEnv {
  const missing: string[] = [];
  const read = (k: string): string => {
    const v = process.env[k];
    if (!v || v.trim() === '') {
      if (REQUIRED.includes(k as keyof ServerEnv)) missing.push(k);
      return '';
    }
    return v.trim();
  };

  const env: ServerEnv = {
    GEMINI_API_KEY: read('GEMINI_API_KEY'),
    CLAUDE_API_KEY: read('CLAUDE_API_KEY'),
    TTS_API_KEY: read('TTS_API_KEY'),
    FIREBASE_PROJECT_ID: read('FIREBASE_PROJECT_ID'),
    FIREBASE_CLIENT_EMAIL: read('FIREBASE_CLIENT_EMAIL'),
    // Vercel stores the private key with literal "\n". Fix newlines here.
    FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
    UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: (process.env.LOG_LEVEL as ServerEnv['LOG_LEVEL']) || 'info',
  };

  if (!env.FIREBASE_PRIVATE_KEY) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length > 0) {
    // Fail loud and early. No secrets in the message — only names.
    throw new Error(
      `[env] Missing required environment variables: ${missing.join(', ')}. ` +
        `Set them in the Vercel dashboard (Project → Settings → Environment Variables) before deploying.`
    );
  }

  return env;
}

let cached: ServerEnv | null = null;

/** Validated server env; throws if any required key is missing. */
export function getEnv(): ServerEnv {
  if (!cached) cached = readEnv();
  return cached;
}
