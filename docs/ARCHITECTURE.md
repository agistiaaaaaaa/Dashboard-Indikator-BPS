# Architecture — Dashboard Indikator Strategis Lombok Tengah

## Overview

Aplikasi full-stack BPS Kabupaten Lombok Tengah:

- Dashboard publik read-only (`/dashboard-indikator`)
- Ruang kerja staf: Draft → Review → Publish (`/workspace/*`)
- Backend lokal/staging: Express + Prisma (SQLite default)

BPS SSO / WebAPI produksi **belum** diimplementasikan. Layer provider dapat diganti nanti.

Dokumen utama serah-terima: [BPS_HANDOVER.md](./BPS_HANDOVER.md)

## Stack (aktual)

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript, React Router, Recharts, SheetJS (xlsx) |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Database | SQLite default; Postgres opsional via Prisma |
| Auth | JWT HttpOnly cookie `bps_loteng_session` (8 jam), bcryptjs |
| ORM | Prisma 6 |

## Diagram

```
PUBLIC                              STAFF
  |                                   |
  v                                   v
React/Vite                         /login
  |                                   |
  v                                   v
api.ts (credentials: include)     JWT cookie
  |                                   |
  +----------------+------------------+
                   |
                   v
            Express /api/*
                   |
                   v
                 Prisma
                   |
        +----------+-----------+
        |                      |
   Observation            DataChange
   (published)            (workflow)
```

## Data flow

```
src/data/indicators.json   (baseline seed only — jangan di-CRUD dari browser)
        ↓ npm run db:seed
     Database
        ↓
     Express API
        ↓
     Providers frontend
        ├── cachedApiIndicatorProvider
        ├── localApiAuthProvider
        └── localApiDataManagementProvider
```

## Provider seams (batas integrasi BPS)

| Seam | Lokal | Masa depan |
|------|-------|------------|
| Auth | `localApiAuthProvider` | `BpsAuthProvider` |
| Indicators | `apiIndicatorProvider` | `BpsIndicatorProvider` |
| Data management | `localApiDataManagementProvider` | `BpsDataManagementProvider` |

Env: `VITE_AUTH_PROVIDER`, `VITE_DATA_PROVIDER`, `VITE_API_BASE_URL`.

## Routes

| Path | Audience |
|------|----------|
| `/`, `/dashboard-indikator`, `/data-strategis`, `/publikasi` | Public |
| Nav **Akses Ruang Kerja** | → `/login` atau `/workspace` |
| `/login` | Staff |
| `/workspace`, `/pemutakhiran`, `/indikator`, `/pengajuan` | Operator + Admin |
| `/workspace/review`, `/riwayat` | Admin |
| `/workspace/pengguna`, `/pengaturan` | Admin (UI placeholder) |

## Security baseline

- Password di-hash; tidak dikirim balik ke klien
- Cookie HttpOnly, SameSite=lax
- CORS allowlist (`CORS_ORIGIN`)
- Otorisasi di API (401/403)
- Guard frontend = UX saja

## Related

[API.md](./API.md) · [AUTH.md](./AUTH.md) · [DATA_MANAGEMENT.md](./DATA_MANAGEMENT.md) · [WORKFLOW.md](./WORKFLOW.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [DEMO_GUIDE.md](./DEMO_GUIDE.md) · [BPS_INTEGRATION_CHECKLIST.md](./BPS_INTEGRATION_CHECKLIST.md)
