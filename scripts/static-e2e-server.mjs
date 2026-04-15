/**
 * Minimal static server for Playwright (no os.networkInterfaces — works in restricted sandboxes).
 * Serves `dist/` with SPA fallback to index.html.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
};

function sendIndex(res) {
  const idx = path.join(root, 'index.html');
  fs.readFile(idx, (err, buf) => {
    if (err) {
      res.writeHead(500);
      res.end('Missing dist/index.html — run npm run build first.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buf);
  });
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
    const candidate = path.resolve(root, rel);
    if (!candidate.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.stat(candidate, (err, st) => {
      if (!err && st.isFile()) {
        const ext = path.extname(candidate);
        const type = mime[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type });
        fs.createReadStream(candidate).pipe(res);
        return;
      }
      sendIndex(res);
    });
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`E2E static server http://127.0.0.1:${port}`);
  });
