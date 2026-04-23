/**
 * Minimal CORS + handler wrapper.
 *
 * `withHandler` wraps a route so every path gets:
 *   - A stable requestId echoed back to the client
 *   - CORS headers (tight: only our web origin + Expo native has no Origin)
 *   - Uniform error serialization (toSafeJson)
 *   - Guaranteed 500 on thrown errors instead of a Vercel stack-trace HTML page
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { newRequestId, logger } from './logger';
import { toSafeJson } from './errors';

const ALLOWED_ORIGINS = [
  'https://gita-rouge-tau.vercel.app',
  'http://localhost:8081', // expo web dev
  'http://localhost:19006',
  'http://localhost:3000',
];

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  // Native Expo requests have no Origin header — allow.
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
}

export type RouteHandler = (
  req: VercelRequest,
  res: VercelResponse,
  ctx: { requestId: string }
) => Promise<unknown>;

export function withHandler(route: string, handler: RouteHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const requestId = newRequestId();
    res.setHeader('X-Request-Id', requestId);
    applyCors(req, res);
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    const startedAt = Date.now();
    logger.info('api.request', {
      requestId,
      route,
      method: req.method,
      // Never log body; log only presence and a size hint.
      hasBody: !!req.body,
    });

    try {
      await handler(req, res, { requestId });
      logger.info('api.response', {
        requestId,
        route,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      toSafeJson(res, err, requestId);
      logger.info('api.response', {
        requestId,
        route,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        errored: true,
      });
    }
  };
}
