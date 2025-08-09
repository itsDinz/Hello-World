import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

let db;

export function getDb() {
  if (!db) {
    db = new Database(process.env.SQLITE_FILE || 'findx.db');
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('provider','consumer')) NOT NULL,
      phone TEXT,
      bio TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price_cents INTEGER NOT NULL,
      unit TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius_km REAL NOT NULL DEFAULT 30,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY(provider_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      offer_id TEXT NOT NULL,
      consumer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      scheduled_at TEXT,
      note TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(offer_id) REFERENCES offers(id),
      FOREIGN KEY(consumer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(booking_id) REFERENCES bookings(id),
      FOREIGN KEY(sender_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_offers_provider ON offers(provider_id);
    CREATE INDEX IF NOT EXISTS idx_offers_lat_lon ON offers(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_bookings_offer ON bookings(offer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_consumer ON bookings(consumer_id);
    CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
  `);
}

export function generateId() {
  return randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}