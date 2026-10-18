# Deployment — Local / Staging / Production Boundary

Dokumen ini mendeskripsikan deployment yang **dapat dilakukan sekarang** (local/staging) dan batas yang **masih menunggu BPS** untuk produksi.

## Arsitektur generik

```
Browser
  → Reverse Proxy (HTTPS di produksi)
    → Frontend (static Vite build: dist/)
    → Backend (Node: server/dist atau tsx dev)
      → Database (SQLite lokal / Postgres jika dikonfigurasi)
```

**Target deployment produksi ditentukan oleh pihak BPS** (path di situs utama, subdomain, atau hosting terpisah).

---

## Prasyarat

- Node.js 20+ (diuji hingga Node 25)
- npm
- Akses jaringan untuk unduhan engine Prisma (jika perlu: `$env:NODE_OPTIONS='--use-system-ca'`)

---

## Environment

### Frontend (root `.env`)

| Variable | Purpose | Placeholder |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | URL API | `http://localhost:4000` |
| `VITE_DATA_PROVIDER` | Mode data | `api` |
| `VITE_AUTH_PROVIDER` | Mode auth | `api` |

### Backend (`server/.env`)

| Variable | Purpose | Placeholder |
|----------|---------|-------------|
| `DATABASE_URL` | Prisma DB | `file:./dev.db` |
| `AUTH_SECRET` | JWT (≥16 karakter) | `replace-with-long-random-secret` |
| `PORT` | Port listen | `4000` |
| `CORS_ORIGIN` | Origin frontend | `http://localhost:5173` |
| `NODE_ENV` | Mode | `development` / `production` |

Salin dari `.env.example` dan `server/.env.example`. **Jangan commit secret produksi.**

---

## Setup dari nol

```bash
npm install
npm --prefix server install

npm run db:generate
npm run db:push
npm run db:seed

npm run dev:api    # API
npm run dev        # Frontend
```

Produksi-like build:

```bash
npm run build
npm run build:api
# serve dist/ (static) + node server/dist/index.js
```

### PostgreSQL (opsional)

1. Ubah `provider` di `server/prisma/schema.prisma` menjadi `postgresql`
2. Set `DATABASE_URL` ke connection string
3. `npm run db:push` (atau migrate) + `npm run db:seed`

SQLite **bukan** persyaratan produksi BPS.

---

## Lingkungan

| Lingkungan | Dukungan |
|------------|----------|
| **LOCAL** | Penuh — perintah di atas |
| **STAGING** | Penuh — sesuaikan env, CORS, HTTPS jika ada |
| **PRODUCTION BPS** | **Belum disediakan** — hosting, domain, DB, HTTPS, secret, SSO perlu dikonfirmasi BPS |

### Prasyarat produksi (PENDING BPS)

- Hosting / runtime Node (atau target setara)
- Domain / subdomain / path
- HTTPS
- Database produksi + backup
- `AUTH_SECRET` kuat + rotasi
- `CORS_ORIGIN` tepat
- Reverse proxy / process manager
- Logging & monitoring
- Persetujuan keamanan

---

## CORS

`CORS_ORIGIN` harus cocok dengan origin frontend. Jangan `*` dengan cookie kredensial.

---

## Akun demo (DEVELOPMENT ONLY)

| Username | Password | Role |
|----------|----------|------|
| admin | `dev-admin-only` | ADMIN |
| operator | `dev-operator-only` | OPERATOR |

---

## Uji setelah deploy staging

```bash
npm run test:data
npm run test
npm run test:browser   # jika Chrome tersedia di mesin uji
npm run typecheck && npm run typecheck:api
```

---

## Integrasi situs BPS

- Tautkan navbar resmi ke URL publik dashboard
- Staf memakai **Akses Ruang Kerja** / `/login` di aplikasi ini (atau SSO nanti)
- Lihat [BPS_HANDOVER.md](./BPS_HANDOVER.md) §22–25 dan [BPS_INTEGRATION_CHECKLIST.md](./BPS_INTEGRATION_CHECKLIST.md)
