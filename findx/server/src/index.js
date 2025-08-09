import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import offerRoutes from './routes/offers.js';
import bookingRoutes from './routes/bookings.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'findx-server' });
});

// Initialize DB and mount routes
initDatabase();

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