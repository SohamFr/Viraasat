import './env.js';
import express from 'express';
import cors from 'cors';
import { geminiRouter } from './routes/gemini.js';
import { wikimediaRouter } from './routes/wikimedia.js';
import { monumentsRouter } from './routes/monuments.js';

// ── Validate required environment variables ────────────────────
const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'GEMINI_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ──────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  })
);
app.use(express.json({ limit: '15mb' })); // Support base64 image payloads

// ── Routes ─────────────────────────────────────────────────────
app.use('/api', geminiRouter);
app.use('/api/wiki', wikimediaRouter);
app.use('/api/monuments', monumentsRouter);

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Ghoom API server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`📱 Frontend camera testing requires HTTPS. Access the app via https://<YOUR_LOCAL_IP>:5173 on your mobile device.`);
  console.log(`[Wikimedia Service] Initialized with OAuth & User-Agent policy`);
});
