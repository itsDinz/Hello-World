import express from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getDb, generateId, nowIso } from '../db/index.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['provider', 'consumer']),
});

router.post('/register', async (req, res) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password, name, role } = parse.data;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const password_hash = await bcrypt.hash(password, 10);
  const user = {
    id: generateId(),
    email,
    password_hash,
    name,
    role,
    phone: null,
    bio: null,
    avatar_url: null,
    created_at: nowIso(),
  };

  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, role, phone, bio, avatar_url, created_at)
     VALUES (@id, @email, @password_hash, @name, @role, @phone, @bio, @avatar_url, @created_at)`
  ).run(user);

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email, name, role } });
});

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/login', async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password } = parse.data;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;