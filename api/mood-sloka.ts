/**
 * POST /api/mood-sloka
 *
 * Takes a user's mood text and returns a Gita chapter/verse recommendation
 * via Gemini. The client resolves the verse text locally from its offline
 * JSON, so we never have to ship scripture content over the wire.
 *
 * Request:  { mood: string }
 * Response: { ok: true, chapter: number, verse: number, requestId }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { env } from './_lib/env';
import { AppError, assertMethod } from './_lib/errors';
import { withHandler } from './_lib/cors';
import { requireUser } from './_lib/auth';
import { enforce, clientIp } from './_lib/rateLimit';
import { logger } from './_lib/logger';

const SYSTEM_PROMPT = `You are a Bhagavad Gita scholar. Given the user's mood, reply with a single strict JSON object:
{"chapter": <1-18>, "verse": <number>}
No prose, no markdown, no code fences. Choose the verse that most directly addresses the user's emotional need.`;

function validateMood(raw: unknown): string {
  if (!raw || typeof raw !== 'object') {
    throw new AppError('BAD_REQUEST', 'Request body is required.');
  }
  const mood = (raw as { mood?: unknown }).mood;
  if (typeof mood !== 'string' || mood.trim().length === 0) {
    throw new AppError('BAD_REQUEST', '`mood` must be a non-empty string.');
  }
  if (mood.length > 500) {
    throw new AppError('BAD_REQUEST', 'Please describe your mood more briefly (max 500 chars).');
  }
  return mood.trim();
}

function parseGeminiJson(text: string): { chapter: number; verse: number } {
  // Gemini sometimes wraps in ```json fences despite instructions. Strip them.
  const cleaned = text
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError('UPSTREAM_ERROR', 'The guide returned an unreadable answer. Please try again.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new AppError('UPSTREAM_ERROR', 'The guide returned an invalid answer. Please try again.');
  }
  const { chapter, verse } = parsed as { chapter?: unknown; verse?: unknown };
  if (
    typeof chapter !== 'number' ||
    typeof verse !== 'number' ||
    chapter < 1 ||
    chapter > 18 ||
    verse < 1 ||
    verse > 200
  ) {
    throw new AppError('UPSTREAM_ERROR', 'The guide returned an invalid verse. Please try again.');
  }
  return { chapter, verse };
}

async function handler(req: VercelRequest, res: VercelResponse, ctx: { requestId: string }) {
  assertMethod(req, ['POST']);
  const user = await requireUser(req);
  await enforce({ key: `mood:u:${user.uid}`, limit: 15, windowSec: 60 });
  await enforce({ key: `mood:ip:${clientIp(req.headers)}`, limit: 30, windowSec: 60 });

  const mood = validateMood(req.body);

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` +
    `?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: mood }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 50, responseMimeType: 'application/json' },
      }),
    });
  } catch {
    logger.error('mood.upstream.fetch_failed', { requestId: ctx.requestId });
    throw new AppError('UPSTREAM_ERROR', 'Recommendation service is temporarily unavailable.');
  }

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => '');
    logger.warn('mood.upstream.bad_status', {
      requestId: ctx.requestId,
      status: upstream.status,
      bodyPreview: body.slice(0, 200),
    });
    if (upstream.status === 429) {
      throw new AppError('RATE_LIMITED', 'Too many recommendations. Please wait a moment.');
    }
    throw new AppError('UPSTREAM_ERROR', 'Recommendation service is temporarily unavailable.');
  }

  const data = (await upstream.json().catch(() => null)) as
    | { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    | null;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new AppError('UPSTREAM_ERROR', 'No recommendation returned. Please try again.');
  }
  const result = parseGeminiJson(text);

  logger.info('mood.success', {
    requestId: ctx.requestId,
    uid: user.uid,
    chapter: result.chapter,
    verse: result.verse,
  });
  res.status(200).json({ ok: true, ...result, requestId: ctx.requestId });
}

export default withHandler('/api/mood-sloka', handler);
