/**
 * Chapter art under assets/images/contextual/chapters/*.png was saved as JPEG bytes
 * with a .png extension. Android AAPT2 rejects those. Re-encode to real PNG (RGB8).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '../assets/images/contextual/chapters');

const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.png'));
for (const name of files) {
  const fp = path.join(dir, name);
  const buf = await sharp(fp).png({ compressionLevel: 9 }).toBuffer();
  await fs.writeFile(fp, buf);
  console.log('OK', name);
}
