/**
 * POST /api/scholar
 *
 * Proxies the "Ask the Scholar" conversation to Claude. The API key lives
 * only on the server. Authenticated + per-user rate limited.
 *
 * Request body:
 *   {
 *     messages: [{ role: 'user' | 'assistant', content: string }, ...],
 *     contextSloka?: { chapter, verse, sanskrit, english }
 *   }
 *
 * Response (success):
 *   { ok: true, reply: string, requestId }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { env } from './_lib/env';
import { AppError, assertMethod } from './_lib/errors';
import { withHandler } from './_lib/cors';
import { requireUser } from './_lib/auth';
import { enforce, clientIp } from './_lib/rateLimit';
import { logger } from './_lib/logger';

const SYSTEM_PROMPT = `You are a deeply knowledgeable, respectful, and wise scholar of the Bhagavad Gita and Vedic philosophy.
Your sole purpose is to explain and discuss the Bhagavad Gita, Lord Krishna, Arjuna, dharma, karma, and Hindu spiritual concepts.

Rules:
1. You MUST ONLY answer questions related to the Bhagavad Gita, Lord Krishna, Vedic texts, and Hindu philosophy.
2. If the user asks about ANYTHING else, politely decline and guide them back to the Gita.
3. Keep your answers concise, profound, and easy to understand.
4. When relevant, quote or reference specific chapter and verse numbers.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Body {
  messages: Message[];
  contextSloka?: {
    chapter: number;
    verse: number;
    sanskrit: string;
    english: string;
  };
}

function validateBody(raw: unknown): Body {
  if (!raw || typeof raw !== 'object') {
    throw new AppError('BAD_REQUEST', 'Request body is required.');
  }
  const body = raw as Partial<Body>;
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new AppError('BAD_REQUEST', '`messages` must be a non-empty array.');
  }
  if (body.messages.length > 40) {
    throw new AppError('BAD_REQUEST', 'Conversation is too long. Start a new one.');
  }
  for (const m of body.messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) {
      throw new AppError('BAD_REQUEST', 'Invalid role in messages.');
    }
    if (typeof m.content !== 'string' || m.content.length === 0) {
      throw new AppError('BAD_REQUEST', 'Message content must be a non-empty string.');
    }
    if (m.content.length > 4000) {
      throw new AppError('BAD_REQUEST', 'A message is too long (max 4000 characters).');
    }
  }
  return body as Body;
}

async function handler(req: VercelRequest, res: VercelResponse, ctx: { requestId: string }) {
  assertMethod(req, ['POST']);
  const user = await requireUser(req);

  // Per-user primary + per-IP secondary to cap abuse on shared accounts.
  await enforce({ key: `scholar:u:${user.uid}`, limit: 20, windowSec: 60 });
  await enforce({ key: `scholar:ip:${clientIp(req.headers)}`, limit: 40, windowSec: 60 });

  const body = validateBody(req.body);

  let system = SYSTEM_PROMPT;
  if (body.contextSloka) {
    const c = body.contextSloka;
    system += `\n\nContext for this conversation:\nThe user is currently reading Chapter ${c.chapter}, Verse ${c.verse}:\nSanskrit: ${c.sanskrit}\nMeaning: ${c.english}`;
  }

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 600,
        system,
        messages: body.messages,
      }),
    });
  } catch (e) {
    logger.error('scholar.upstream.fetch_failed', { requestId: ctx.requestId });
    throw new AppError('UPSTREAM_ERROR', 'The scholar is temporarily unavailable. Please try again.');
  }

  if (!upstream.ok) {
    const status = upstream.status;
    const errBody = await upstream.text().catch(() => '');
    logger.warn('scholar.upstream.bad_status', {
      requestId: ctx.requestId,
      status,
      // Never forward the upstream body verbatim.
      bodyPreview: errBody.slice(0, 200),
    });
    if (status === 429) {
      throw new AppError(
        'RATE_LIMITED',
        'The scholar is receiving many questions right now. Please try again in a moment.'
      );
    }
    throw new AppError('UPSTREAM_ERROR', 'The scholar is temporarily unavailable. Please try again.');
  }

  const data = (await upstream.json().catch(() => null)) as
    | { content?: Array<{ type: string; text: string }> }
    | null;

  const reply = data?.content?.find((c) => c.type === 'text')?.text;
  if (!reply) {
    logger.error('scholar.upstream.no_text', { requestId: ctx.requestId });
    throw new AppError('UPSTREAM_ERROR', 'No reply from the scholar. Please try again.');
  }

  logger.info('scholar.success', {
    requestId: ctx.requestId,
    uid: user.uid,
    replyLen: reply.length,
    turnCount: body.messages.length,
  });
  res.status(200).json({ ok: true, reply, requestId: ctx.requestId });
}

export default withHandler('/api/scholar', handler);
