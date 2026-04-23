/**
 * Firebase Admin initialization + ID token verification.
 *
 * Routes that need a logged-in user call `requireUser(req)`. It:
 *  - Pulls the Bearer token from `Authorization`
 *  - Verifies it with firebase-admin (checks signature + expiry)
 *  - Returns the decoded user
 *
 * Anything malformed or unverifiable throws AppError('UNAUTHORIZED'), which
 * our error handler turns into a 401 with a safe message.
 */

import type { VercelRequest } from '@vercel/node';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { env } from './env';
import { AppError } from './errors';

let app: App | undefined;

function getApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }
  app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
  return app;
}

export interface AuthUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

export async function requireUser(req: VercelRequest): Promise<AuthUser> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Missing bearer token.');
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) throw new AppError('UNAUTHORIZED', 'Missing bearer token.');

  let decoded: DecodedIdToken;
  try {
    decoded = await getAuth(getApp()).verifyIdToken(token, /* checkRevoked */ false);
  } catch {
    // Never leak the admin SDK's error message.
    throw new AppError('UNAUTHORIZED', 'Your session is invalid. Please sign in again.');
  }
  return {
    uid: decoded.uid,
    email: decoded.email,
    emailVerified: decoded.email_verified === true,
  };
}
