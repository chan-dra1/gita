/**
 * Typed error model + safe JSON serializer.
 *
 * The goal: a client never sees a stack trace, an internal path, or a library
 * error message. Every response from /api/* goes through `toSafeJson` so that
 * the shape is identical whether the error is expected or unexpected.
 */

import type { VercelResponse } from '@vercel/node';
import { logger } from './logger';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  INTERNAL_ERROR: 500,
};

/**
 * AppError — anything thrown through this is considered "expected" and its
 * message is safe to send to the client. Anything else is treated as unknown
 * and surfaced as a generic INTERNAL_ERROR.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly retryable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    opts: { details?: Record<string, unknown>; retryable?: boolean } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = opts.details;
    this.retryable = opts.retryable ?? code === 'UPSTREAM_ERROR';
  }
}

/** Convert anything thrown into a safe JSON response. */
export function toSafeJson(res: VercelResponse, err: unknown, requestId: string) {
  if (err instanceof AppError) {
    logger.warn('api.error.handled', {
      requestId,
      code: err.code,
      status: err.status,
      message: err.message,
    });
    return res.status(err.status).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        retryable: err.retryable,
        details: err.details,
        requestId,
      },
    });
  }

  // Unknown / unexpected: never leak the message or stack.
  logger.error('api.error.unhandled', {
    requestId,
    // logger sanitizes + truncates; raw err goes to server logs only.
    rawMessage: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  return res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side. Please try again.',
      retryable: true,
      requestId,
    },
  });
}

/** Convenience for route handlers. */
export function assertMethod(
  req: { method?: string },
  allowed: ReadonlyArray<string>
): void {
  if (!req.method || !allowed.includes(req.method)) {
    throw new AppError('METHOD_NOT_ALLOWED', `Method ${req.method ?? '?'} not allowed`);
  }
}
