import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import offerRoutes from './routes/offers.js';
import bookingRoutes from './routes/bookings.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'findx-server' });
});

async function start() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database ready. Mounting routes...');

    app.use('/api/auth', authRoutes);
    app.use('/api/offers', offerRoutes);
    app.use('/api/bookings', bookingRoutes);

    app.use((err, _req, res, _next) => {
      console.error('Unhandled error:', err);
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    });

    app.listen(PORT, () => {
      console.log(`findx server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();