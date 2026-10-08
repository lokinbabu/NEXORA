import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import connectDB from './config/db.js';
import createApp from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5000;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  const dist = path.resolve(__dirname, '..', 'client', 'dist');
  if (!fs.existsSync(dist)) {
    console.warn('⚠ client/dist not found — run "npm run build" in /client to serve the frontend.');
  }
}

connectDB()
  .then(() => {
    const app = createApp({
      serveClient: isProd,
      clientDist: path.resolve(__dirname, '..', 'client', 'dist'),
    });
    app.listen(PORT, () => {
      console.log(`✔ NEXORA API listening on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
    });
  })
  .catch(() => process.exit(1));
