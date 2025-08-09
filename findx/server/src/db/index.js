import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

let db

export function getDb() {
  if (!db) {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const file = process.env.LOWDB_FILE || path.join(__dirname, '../../db.json')
    const adapter = new JSONFile(file)
    db = new Low(adapter, { users: [], offers: [], bookings: [], messages: [] })
  }
  return db
}

export async function initDatabase() {
  const database = getDb()
  await database.read()
  database.data ||= { users: [], offers: [], bookings: [], messages: [] }
  await database.write()
}

export function generateId() {
  return randomUUID()
}

export function nowIso() {
  return new Date().toISOString()
}