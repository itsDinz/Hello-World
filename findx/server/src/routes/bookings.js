import express from 'express';
import { z } from 'zod';
import { getDb, generateId, nowIso } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const CreateBookingSchema = z.object({
  offer_id: z.string().uuid().or(z.string().min(10)),
  scheduled_at: z.string().optional(),
  note: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post('/', requireAuth, (req, res) => {
  const parse = CreateBookingSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const db = getDb();

  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(parse.data.offer_id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  if (req.user.role !== 'consumer') return res.status(403).json({ error: 'Only consumers can create bookings' });

  const booking = {
    id: generateId(),
    offer_id: offer.id,
    consumer_id: req.user.id,
    status: 'requested',
    scheduled_at: parse.data.scheduled_at || null,
    note: parse.data.note || null,
    address: parse.data.address || null,
    latitude: parse.data.latitude ?? null,
    longitude: parse.data.longitude ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  db.prepare(
    `INSERT INTO bookings (id, offer_id, consumer_id, status, scheduled_at, note, address, latitude, longitude, created_at, updated_at)
     VALUES (@id, @offer_id, @consumer_id, @status, @scheduled_at, @note, @address, @latitude, @longitude, @created_at, @updated_at)`
  ).run(booking);

  res.json({ booking });
});

router.get('/mine', requireAuth, (req, res) => {
  const db = getDb();
  if (req.user.role === 'consumer') {
    const bookings = db.prepare(
      `SELECT b.*, o.title, o.provider_id FROM bookings b JOIN offers o ON b.offer_id = o.id WHERE consumer_id = ? ORDER BY b.created_at DESC`
    ).all(req.user.id);
    return res.json({ bookings });
  }
  // provider
  const bookings = db.prepare(
    `SELECT b.*, o.title, o.provider_id FROM bookings b JOIN offers o ON b.offer_id = o.id WHERE o.provider_id = ? ORDER BY b.created_at DESC`
  ).all(req.user.id);
  res.json({ bookings });
});

const StatusSchema = z.object({ status: z.enum(['requested','accepted','rejected','completed','cancelled']) });

router.patch('/:id/status', requireAuth, (req, res) => {
  const parse = StatusSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(booking.offer_id);
  const isProvider = req.user.role === 'provider' && offer.provider_id === req.user.id;
  const isConsumer = req.user.role === 'consumer' && booking.consumer_id === req.user.id;

  // Simple permission rules
  if (!isProvider && !isConsumer) return res.status(403).json({ error: 'Forbidden' });

  // Allowed transitions (simplified)
  const { status } = parse.data;
  const allowedByRole = {
    provider: ['accepted', 'rejected', 'completed', 'cancelled'],
    consumer: ['cancelled'],
  };
  const allowed = (isProvider ? allowedByRole.provider : allowedByRole.consumer);
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Status not allowed' });

  db.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso(), booking.id);
  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);
  res.json({ booking: updated });
});

router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(booking.offer_id);
  const isProvider = req.user.role === 'provider' && offer.provider_id === req.user.id;
  const isConsumer = req.user.role === 'consumer' && booking.consumer_id === req.user.id;
  if (!isProvider && !isConsumer) return res.status(403).json({ error: 'Forbidden' });
  res.json({ booking });
});

// Messages under a booking
const MessageSchema = z.object({ content: z.string().min(1) });

router.get('/:id/messages', requireAuth, (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(booking.offer_id);
  const isProvider = req.user.role === 'provider' && offer.provider_id === req.user.id;
  const isConsumer = req.user.role === 'consumer' && booking.consumer_id === req.user.id;
  if (!isProvider && !isConsumer) return res.status(403).json({ error: 'Forbidden' });

  const messages = db.prepare('SELECT * FROM messages WHERE booking_id = ? ORDER BY created_at ASC').all(booking.id);
  res.json({ messages });
});

router.post('/:id/messages', requireAuth, (req, res) => {
  const parse = MessageSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(booking.offer_id);
  const isProvider = req.user.role === 'provider' && offer.provider_id === req.user.id;
  const isConsumer = req.user.role === 'consumer' && booking.consumer_id === req.user.id;
  if (!isProvider && !isConsumer) return res.status(403).json({ error: 'Forbidden' });

  const message = {
    id: generateId(),
    booking_id: booking.id,
    sender_id: req.user.id,
    content: parse.data.content,
    created_at: nowIso(),
  };
  db.prepare(
    `INSERT INTO messages (id, booking_id, sender_id, content, created_at)
     VALUES (@id, @booking_id, @sender_id, @content, @created_at)`
  ).run(message);

  res.json({ message });
});

export default router;