/**
 * Local shim for @vercel/node types.
 *
 * When dependencies are installed (either by `npm install` locally or by the
 * Vercel builder at deploy time), the real `@vercel/node` package takes
 * precedence and this file is a no-op. Before install — e.g. during an
 * offline type-check in CI — these declarations keep the editor + tsc happy.
 *
 * The real types are richer; we expose only what our routes actually use.
 */

declare module '@vercel/node' {
  import type { IncomingMessage, ServerResponse } from 'http';

  export interface VercelRequest extends IncomingMessage {
    query: Partial<Record<string, string | string[]>>;
    cookies: Partial<Record<string, string>>;
    body: any;
  }

  export interface VercelResponse extends ServerResponse {
    status(statusCode: number): VercelResponse;
    json(body: any): VercelResponse;
    send(body: any): VercelResponse;
    redirect(statusOrUrl: number | string, url?: string): VercelResponse;
  }

  export type VercelApiHandler = (
    req: VercelRequest,
    res: VercelResponse
  ) => void | Promise<void>;
}
