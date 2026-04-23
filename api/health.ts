/**
 * GET /api/health
 *
 * Liveness probe. Exists so monitoring and the client can verify the serverless
 * side is alive without invoking any upstream. Returns plain JSON with a
 * timestamp and the region Vercel is running in.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withHandler } from './_lib/cors';
import { assertMethod } from './_lib/errors';

async function handler(req: VercelRequest, res: VercelResponse, ctx: { requestId: string }) {
  assertMethod(req, ['GET']);
  res.status(200).json({
    ok: true,
    ts: new Date().toISOString(),
    region: process.env.VERCEL_REGION || 'local',
    requestId: ctx.requestId,
  });
}

export default withHandler('/api/health', handler);
