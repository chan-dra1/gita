/**
 * POST /api/tts
 *
 * Text-to-speech proxy for Google Cloud TTS. Returns { audioContent } base64.
 * Heavily rate limited because audio synthesis is the most expensive upstream
 * call in the app.
 *
 * Request:  { text: string, voice?: string, languageCode?: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnv } from './_lib/env';
import { AppError, assertMethod } from './_lib/errors';
import { withHandler } from './_lib/cors';
import { requireUser } from './_lib/auth';
import { enforce, clientIp } from './_lib/rateLimit';
import { logger } from './_lib/logger';

interface Body {
  text: string;
  voice?: string;
  languageCode?: string;
}

function validate(raw: unknown): Body {
  if (!raw || typeof raw !== 'object') throw new AppError('BAD_REQUEST', 'Body required.');
  const b = raw as Partial<Body>;
  if (typeof b.text !== 'string' || b.text.trim().length === 0) {
    throw new AppError('BAD_REQUEST', '`text` is required.');
  }
  if (b.text.length > 1500) {
    throw new AppError('BAD_REQUEST', 'Text is too long (max 1500 chars).');
  }
  if (b.voice && !/^[A-Za-z\-]{1,40}$/.test(b.voice)) {
    throw new AppError('BAD_REQUEST', 'Invalid voice name.');
  }
  if (b.languageCode && !/^[a-z]{2}-[A-Z]{2}$/.test(b.languageCode)) {
    throw new AppError('BAD_REQUEST', 'Invalid language code.');
  }
  return b as Body;
}

async function handler(req: VercelRequest, res: VercelResponse, ctx: { requestId: string }) {
  assertMethod(req, ['POST']);
  const user = await requireUser(req);
  await enforce({ key: `tts:u:${user.uid}`, limit: 30, windowSec: 60 });
  await enforce({ key: `tts:ip:${clientIp(req.headers)}`, limit: 60, windowSec: 60 });

  const body = validate(req.body);
  const voice = body.voice || 'en-IN-Wavenet-D';
  const languageCode = body.languageCode || 'en-IN';

  let upstream: Response;
  try {
    upstream = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(getEnv().TTS_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: body.text },
          voice: { languageCode, name: voice },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
        }),
      }
    );
  } catch {
    throw new AppError('UPSTREAM_ERROR', 'Audio service is temporarily unavailable.');
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    logger.warn('tts.upstream.bad_status', {
      requestId: ctx.requestId,
      status: upstream.status,
      bodyPreview: errText.slice(0, 200),
    });
    if (upstream.status === 429) {
      throw new AppError('RATE_LIMITED', 'Audio service is busy. Please try again shortly.');
    }
    throw new AppError('UPSTREAM_ERROR', 'Audio service is temporarily unavailable.');
  }

  const data = (await upstream.json().catch(() => null)) as { audioContent?: string } | null;
  if (!data?.audioContent) {
    throw new AppError('UPSTREAM_ERROR', 'No audio returned. Please try again.');
  }

  logger.info('tts.success', {
    requestId: ctx.requestId,
    uid: user.uid,
    textLen: body.text.length,
    voice,
  });
  res.status(200).json({ ok: true, audioContent: data.audioContent, requestId: ctx.requestId });
}

export default withHandler('/api/tts', handler);
