import express from 'express';
import { z } from 'zod';
import { getDb, generateId, nowIso } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const OfferCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().optional(),
  price_cents: z.number().int().nonnegative(),
  unit: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_km: z.number().positive().max(100).default(30),
});

const OfferUpdateSchema = OfferCreateSchema.partial();

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post('/', requireAuth, requireRole('provider'), (req, res) => {
  const parse = OfferCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const db = getDb();
  const offer = {
    id: generateId(),
    provider_id: req.user.id,
    ...parse.data,
    is_active: 1,
    created_at: nowIso(),
  };
  db.prepare(
    `INSERT INTO offers (id, provider_id, title, description, category, price_cents, unit, latitude, longitude, radius_km, is_active, created_at)
     VALUES (@id, @provider_id, @title, @description, @category, @price_cents, @unit, @latitude, @longitude, @radius_km, @is_active, @created_at)`
  ).run(offer);
  res.json({ offer });
});

router.get('/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm) : 30;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return res.status(400).json({ error: 'lat and lon are required' });

  const db = getDb();
  // Bounding box approx
  const latDelta = (radiusKm / 111);
  const lonDelta = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180)));
  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;
  const minLon = lon - lonDelta;
  const maxLon = lon + lonDelta;

  const rows = db.prepare(
    `SELECT * FROM offers WHERE is_active = 1 AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?`
  ).all(minLat, maxLat, minLon, maxLon);

  const offers = rows
    .map((o) => ({
      ...o,
      distance_km: haversineKm(lat, lon, o.latitude, o.longitude),
    }))
    .filter((o) => o.distance_km <= Math.min(radiusKm, o.radius_km))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 200);

  res.json({ offers });
});

router.get('/mine', requireAuth, requireRole('provider'), (req, res) => {
  const db = getDb();
  const offers = db.prepare('SELECT * FROM offers WHERE provider_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ offers });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  res.json({ offer });
});

router.patch('/:id', requireAuth, requireRole('provider'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Offer not found' });
  if (existing.provider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const parse = OfferUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const updates = parse.data;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.json({ offer: existing });

  const setClause = fields.map((f) => `${f} = @${f}`).join(', ');
  const stmt = db.prepare(`UPDATE offers SET ${setClause} WHERE id = @id`);
  stmt.run({ id: req.params.id, ...updates });

  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  res.json({ offer });
});

router.delete('/:id', requireAuth, requireRole('provider'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Offer not found' });
  if (existing.provider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM offers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;