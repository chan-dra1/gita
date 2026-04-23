/**
 * "Ask the Scholar" client.
 *
 * Previously this file called api.anthropic.com directly from the device with
 * a user-supplied key. That exposed the key in transit and put the cost/risk
 * on the user. It now goes through `/api/scholar` which:
 *   - Uses the server-side Claude key (never shipped to the client).
 *   - Requires a valid Firebase ID token.
 *   - Rate limits per user and per IP.
 *   - Returns safe JSON errors.
 *
 * The old throw codes are preserved (`MISSING_API_KEY`, `INVALID_API_KEY`) so
 * upstream UI doesn't have to change immediately; we also expose the new
 * richer ApiError for screens that want to do better.
 */

import { api, ApiError } from './apiClient';
import { log } from './logger';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askScholar(
  messages: ChatMessage[],
  contextSloka?: { chapter: number; verse: number; sanskrit: string; english: string },
  _systemOverride?: string // kept for backwards compat; server prompt is canonical
): Promise<string> {
  try {
    const res = await api.post<{ ok: boolean; reply: string; requestId: string }>(
      '/api/scholar',
      { messages, contextSloka }
    );
    log.action('scholar.asked', {
      turnCount: messages.length,
      hasContext: !!contextSloka,
      requestId: res.requestId,
    });
    return res.reply;
  } catch (err) {
    if (err instanceof ApiError) {
      log.error('scholar.failed', { code: err.code, status: err.status, requestId: err.requestId });
      // Map to legacy throw codes so existing UI branches still work.
      if (err.code === 'UNAUTHORIZED') throw new Error('MISSING_API_KEY');
      if (err.code === 'FORBIDDEN') throw new Error('INVALID_API_KEY');
      throw err; // ApiError instances carry a user-safe message + retryable flag
    }
    log.error('scholar.failed.unknown', { msg: (err as Error)?.message });
    throw err;
  }
}
