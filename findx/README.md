# find(x)

A local services marketplace to connect providers and consumers within a ~30 km radius.

- Client: React (Vite) + React Router + Axios
- Server: Node.js (Express) + SQLite (better-sqlite3) + JWT auth

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

## Quick start (local dev)
Open two terminals.

Terminal A — API server:
```
cd server
cp .env.example .env
npm install
npm run dev
```
API will run at `http://localhost:4000`. Health check:
```
curl http://localhost:4000/api/health
```

Terminal B — Web client:
```
cd client
npm install
npm run dev
```
Vite will run at `http://localhost:5173` and proxy `/api` to the server.

## Environment variables (server)
See `server/.env.example`:
- `PORT` (default 4000)
- `JWT_SECRET` (change in non-dev)
- `CORS_ORIGIN` (default `http://localhost:5173`)
- `SQLITE_FILE` (default `findx.db` in server dir)

## What’s included
- Auth: register/login (`/api/auth/*`)
- Offers: create/list/nearby search (`/api/offers/*`)
- Bookings: create/list/status (`/api/bookings/*`)
- Messages: simple per-booking chat (`/api/bookings/:id/messages`)

## Basic flow to test
1) Register a provider at `http://localhost:5173/register` (choose role "Provider").
2) Go to Dashboard → Create an offer (use your geolocation or input lat/lon).
3) Logout, register a consumer.
4) Go to "Find services" → it will use your location to list nearby offers.
5) Click an offer → Request booking.
6) As provider, review bookings in Dashboard and update status.

## Useful API samples
- Health: `GET /api/health`
- Register: `POST /api/auth/register` `{ email, password, name, role }`
- Login: `POST /api/auth/login` `{ email, password }`
- Nearby offers: `GET /api/offers/nearby?lat=..&lon=..&radiusKm=30`

Use `Authorization: Bearer <token>` for authenticated endpoints.

## Notes
- Dev client proxies `/api` to `http://localhost:4000` (see `client/vite.config.js`).
- SQLite DB file is stored in `server/findx.db` (configurable via `SQLITE_FILE`).
- For a fresh DB, stop the server and delete the file.

## Production ideas (not included here)
- Docker Compose for API + frontend + volume for SQLite
- Switch to Postgres and add geospatial index if needed
- Add notifications and real-time messaging