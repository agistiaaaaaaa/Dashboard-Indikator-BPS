# BPS HANDOVER

## Dashboard Indikator Strategis Lombok Tengah

Dokumen ini adalah paket serah-terima teknis aplikasi **Dashboard Indikator Strategis** untuk BPS Kabupaten Lombok Tengah. Isi dokumen disusun berdasarkan **implementasi aktual** di repositori, bukan asumsi.

**Status inti aplikasi:** CORE APPLICATION COMPLETE — siap diintegrasikan ke infrastruktur BPS.

---

## 1. Ringkasan Sistem

Aplikasi full-stack untuk menampilkan dan memutakhirkan indikator strategis Kabupaten Lombok Tengah.

| Lapisan | Teknologi aktual |
|---------|------------------|
| Frontend | React 19, Vite, TypeScript, React Router, Recharts |
| Backend | Node.js, Express 5, TypeScript |
| ORM | Prisma 6 |
| Database (dev/staging lokal) | SQLite (`DATABASE_URL=file:./dev.db`) |
| Autentikasi | bcryptjs + JWT di cookie HttpOnly `bps_loteng_session` |
| Otorisasi | Middleware `requireAuth` / `requireRole` di backend |

Dua kelompok pengguna:

- **PUBLIC** — tanpa login, hanya data **PUBLISHED**
- **STAFF** — login wajib (`OPERATOR` atau `ADMIN`)

---

## 2. Tujuan Aplikasi

1. Menyediakan dashboard publik indikator strategis yang dapat difilter, dicari, digrafikkan, dan diekspor.
2. Menyediakan ruang kerja internal agar petugas BPS dapat memutakhirkan nilai indikator melalui alur **Draft → Review → Publish**.
3. Memastikan perubahan draft **tidak** langsung terlihat publik sebelum disetujui/dipublikasikan.
4. Menyediakan audit trail perubahan penting.
5. Menyerahkan aplikasi yang siap diintegrasikan; **tanpa** mengarang SSO/API/hosting produksi BPS.

---

## 3. Ruang Lingkup

### Termasuk (sudah diimplementasikan)

- Frontend publik + ruang kerja
- Backend REST API
- Skema database + seed dari baseline
- Autentikasi & otorisasi lokal/staging
- CRUD indikator (admin) & observasi (admin)
- Workflow pengajuan (`DataChange`)
- Audit log
- Uji data, smoke API, browser QA
- Dokumentasi teknis

### Tidak termasuk (menunggu pihak BPS)

- SSO BPS
- WebAPI produksi BPS untuk CRUD internal
- Hosting / domain / HTTPS produksi BPS
- Database produksi BPS
- Integrasi navbar resmi situs BPS (hanya disiapkan entry point)

---

## 4. Arsitektur Sistem

```
PUBLIC                         STAFF
  |                              |
  v                              v
React/Vite (publik)        /login → JWT cookie
  |                         bps_loteng_session
  v                              |
API Client (credentials)         v
  |                         Protected routes + API
  +------------+---------------+
               |
               v
         Express API (/api/*)
               |
               v
            Prisma
               |
               v
     Database (Observation = published;
               DataChange = workflow)
```

**Provider seam** (batas integrasi ke sistem BPS nanti):

| Seam | Adapter lokal | Pengganti masa depan |
|------|---------------|----------------------|
| Auth | `localApiAuthProvider` | `BpsAuthProvider` |
| Indikator | `apiIndicatorProvider` + cache | `BpsIndicatorProvider` |
| Data management | `localApiDataManagementProvider` | `BpsDataManagementProvider` |

Baseline seed:

```
src/data/indicators.json  →  npm run db:seed  →  Database
```

Browser **tidak** menulis ke `indicators.json`.

Detail: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 5. Public User

Tidak perlu login.

Rute publik:

| Path | Fungsi |
|------|--------|
| `/` | Beranda |
| `/dashboard-indikator` | Dashboard utama (filter, chart, tabel, export) |
| `/data-strategis` | Katalog + detail |
| `/publikasi` | Publikasi |
| Navigasi **Akses Ruang Kerja** | Ke `/login` (atau `/workspace` jika sudah login) |

Kemampuan: lihat KPI, filter kategori/periode, pencarian, grafik, tabel, drawer detail, unduh Excel.

Tidak dapat: edit, hapus, submit, approve, publish.

---

## 6. Operator

Login: `/login` → `/workspace`

| Modul | Path |
|-------|------|
| Ringkasan | `/workspace` |
| Pemutakhiran Data | `/workspace/pemutakhiran` |
| Indikator | `/workspace/indikator` |
| Pengajuan Saya | `/workspace/pengajuan` |

Dapat: buat/ubah draft, ajukan review, hapus draft milik sendiri, lihat pengajuan sendiri.

Tidak dapat: review, approve, reject, publish, audit, kelola pengguna (backend mengembalikan **403**; URL langsung menampilkan *Akses ditolak*).

---

## 7. Administrator

Semua kemampuan Operator pada pemutakhiran, ditambah:

| Modul | Path |
|-------|------|
| Review / Persetujuan | `/workspace/review` |
| Riwayat (audit) | `/workspace/riwayat` |
| Pengguna | `/workspace/pengguna` (UI placeholder — kontrak manajemen user BPS belum ada) |
| Pengaturan | `/workspace/pengaturan` (UI placeholder) |

Pada implementasi saat ini, **Setujui & Publish** di UI Review menerapkan nilai usulan ke `Observation` dan menandai pengajuan `PUBLISHED` dalam satu langkah.

---

## 8. Authentication

| Endpoint | Keterangan |
|----------|------------|
| `POST /api/auth/login` | Verifikasi username + password (bcrypt) → Set-Cookie JWT |
| `POST /api/auth/logout` | Hapus cookie; catat audit LOGOUT |
| `GET /api/auth/me` | User sesi saat ini |

- Cookie: `bps_loteng_session` (HttpOnly, SameSite=lax, `secure` jika `NODE_ENV=production`)
- JWT expiry: **8 jam**
- Password **tidak** dikembalikan ke klien
- Frontend guards = UX; keamanan di backend

Detail: [AUTH.md](./AUTH.md)

---

## 9. Authorization

| Capability | Public | Operator | Admin |
|------------|:------:|:--------:|:-----:|
| Lihat data published | YES | YES | YES |
| Login | — | YES | YES |
| Create/update draft | NO | YES | YES |
| Submit for review | NO | YES | YES |
| Review / Approve / Reject / Publish | NO | NO | YES |
| Audit logs | NO | NO | YES |
| Manage users (API penuh) | NO | NO | UI placeholder saja |
| Manage settings | NO | NO | UI placeholder saja |

**Batas keamanan = backend.** Frontend `RequireAuth` / `RequirePermission` hanya UX.

---

## 10. CRUD Data

### Indikator (metadata)

| Operasi | Method | Path | Role |
|---------|--------|------|------|
| List | GET | `/api/indicators` | Publik (opsional auth) |
| Detail | GET | `/api/indicators/:id` | Publik |
| Create | POST | `/api/indicators` | ADMIN |
| Update | PUT | `/api/indicators/:id` | ADMIN |
| Delete | DELETE | `/api/indicators/:id` | ADMIN |

### Observasi published

| Operasi | Method | Path | Role |
|---------|--------|------|------|
| List by indicator | GET | `/api/indicators/:id/observations` | Publik |
| Create | POST | `/api/indicators/:id/observations` | ADMIN |
| Update | PUT | `/api/observations/:id` | ADMIN |
| Delete | DELETE | `/api/observations/:id` | ADMIN |

Pemutakhiran rutin **disarankan lewat workflow** (`/api/submissions/...`), bukan overwrite langsung, agar ada review.

Detail: [API.md](./API.md), [DATA_MANAGEMENT.md](./DATA_MANAGEMENT.md)

---

## 11. Workflow

```
DRAFT → PENDING_REVIEW → PUBLISHED
                ↘
              REJECTED → (edit) → DRAFT → PENDING_REVIEW → …
```

- Operator/Admin: draft → submit
- Admin: reject (wajib alasan) atau approve (= publish ke `Observation`)
- Publik hanya membaca `Observation`

**Isolasi publik:** draft/pending/rejected **tidak** mengubah nilai dashboard sampai publish.

Contoh: 1029.03 → usulan 1030.20 → sebelum publish publik tetap 1029.03; setelah publish publik 1030.20.

Detail: [WORKFLOW.md](./WORKFLOW.md)

---

## 12. Audit Trail

Model: `AuditLog`

Contoh aksi: LOGIN, LOGOUT, CREATE_DRAFT, UPDATE_DRAFT, SUBMIT_FOR_REVIEW, REJECT, APPROVE, PUBLISH, DELETE_DRAFT, CREATE/UPDATE/DELETE indikator/observasi.

Endpoint: `GET /api/audit-logs` (ADMIN saja).

---

## 13. Database

Model Prisma aktual: `User`, `Indicator`, `Observation`, `DataChange`, `AuditLog` + enum `Role`, `ChangeStatus`.

SQLite adalah default **development/staging lokal**, bukan persyaratan produksi BPS. PostgreSQL dapat digunakan dengan mengubah `provider` di `schema.prisma` dan `DATABASE_URL` (perlu dikonfirmasi BPS).

---

## 14. API

Base (dev): `http://localhost:4000`

Kelompok: Health, Auth, Indicators, Observations, Submissions/Workflow, Audit.

Jumlah endpoint operasional utama: **~20** (lihat tabel di [API.md](./API.md)).

Cookie kredensial wajib untuk mutasi; CORS dari `CORS_ORIGIN` (bukan `*`).

---

## 15. Frontend

- Build: `npm run build` → `dist/`
- Env: `VITE_API_BASE_URL`, `VITE_DATA_PROVIDER=api`, `VITE_AUTH_PROVIDER=api`
- Entry staf di navigasi publik: **Akses Ruang Kerja**
- Mode mock offline opsional (`VITE_*=mock`) — bukan mode serah-terima utama

---

## 16. Environment

### Frontend (`.env` / `.env.example`)

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `VITE_API_BASE_URL` | Base URL API | `http://localhost:4000` | Yes (api mode) |
| `VITE_DATA_PROVIDER` | `api` / `mock` / `bps` | `api` | Yes |
| `VITE_AUTH_PROVIDER` | `api` / `mock` | `api` | Yes |
| `VITE_BPS_API_BASE_URL` | Cadangan WebAPI resmi | (placeholder) | No — belum diimplementasi |
| `VITE_DATA_MGMT_PROVIDER` | Override data-mgmt | `session` hanya offline | No |

### Backend (`server/.env` / `server/.env.example`)

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `DATABASE_URL` | Prisma datasource | `file:./dev.db` | Yes |
| `AUTH_SECRET` | JWT signing (≥16 chars) | placeholder panjang | Yes |
| `PORT` | Port API | `4000` | No (default 4000) |
| `CORS_ORIGIN` | Origin frontend | `http://localhost:5173` | Yes (prod/staging) |
| `NODE_ENV` | `development` / `production` | `development` | Recommended |

**Jangan** commit secret produksi.

---

## 17. Development Setup

```bash
# 1–2. Dependencies
npm install
npm --prefix server install

# 3. Environment
# Salin .env.example → .env dan server/.env.example → server/.env

# 4–7. Database (Windows PowerShell jika TLS proxy bermasalah:)
# $env:NODE_OPTIONS='--use-system-ca'
npm run db:generate
npm run db:push
npm run db:seed

# 8–9. Jalankan
npm run dev:api    # http://localhost:4000
npm run dev        # http://localhost:5173

# 10. Verifikasi
# Buka /dashboard-indikator (tanpa login)
# Buka Akses Ruang Kerja → /login
```

---

## 18. Seed Data

- Sumber: `src/data/indicators.json` (baseline immutable untuk seed)
- Command: `npm run db:seed` (idempotent upsert)
- Mempertahankan null dan label periode khusus
- SHA256 baseline: `577FB7132364ED822A88C9E3B50ECE97B13CC0E8030EB0F190F6C96648517F3B`
- Cek: 58 indikator, 51 Sosial, 7 Ekonomi, Jumlah Penduduk 2020 = **1029.03**

User seed (DEVELOPMENT ONLY): lihat §32.

---

## 19. Testing

| Command | Fungsi | Hasil terverifikasi |
|---------|--------|---------------------|
| `npm run test:data` | Integritas baseline JSON | PASS |
| `npm run test` | Smoke API full-stack | **44/44 PASS** |
| `npm run test:browser` | Browser QA (Chrome) | **64/64 PASS** |
| `npm run typecheck` | TS frontend | PASS |
| `npm run typecheck:api` | TS backend | PASS |
| `npm run build` | Build frontend | PASS |
| `npm run build:api` | Build backend | PASS |

Prasyarat `test` / `test:browser`: API berjalan; browser QA juga memerlukan Vite.

---

## 20. Browser QA

Skenario tercakup: publik, login, operator, admin, reject, resubmit, publish, isolasi publik, responsive (1440→360), otorisasi, console/network.

Command: `npm run test:browser` → **64/64 PASS**.

Panduan manual: [DEMO_GUIDE.md](./DEMO_GUIDE.md)

---

## 21. Deployment

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md).

Pola generik:

```
Browser → Reverse Proxy (HTTPS) → Frontend static + Backend Node → Database
```

| Lingkungan | Status |
|------------|--------|
| Local | Didukung penuh |
| Staging | Didukung (konfigurasi env) |
| Production BPS | **Belum ditentukan** — perlu dikonfirmasi BPS |

---

## 22. Integrasi dengan Website BPS

Aplikasi publik dapat ditautkan dari situs BPS (navbar / menu).

Contoh opsi (bukan keputusan final):

- Path: `https://domain-bps/.../dashboard-indikator`
- Subdomain: `https://dashboard-....`

**Deployment target ditentukan oleh pihak BPS.**

---

## 23. Integrasi Navbar

Di aplikasi ini:

- Publik: menu Beranda, Dashboard, Data Strategis, Publikasi
- Staf: **Akses Ruang Kerja** → `/login` (atau `/workspace` jika sudah login)

BPS dapat menambahkan tautan “Dashboard Indikator” ke navbar situs resmi mereka yang mengarah ke URL publik aplikasi.

---

## 24. Integrasi Authentication / SSO

**BPS SSO belum diintegrasikan** karena spesifikasi/kontrak BPS belum tersedia.

Aplikasi memakai autentikasi internal yang sudah berfungsi untuk local/staging.

Jika BPS menghendaki SSO, yang perlu disediakan (tanpa memasukkan credential di dokumen ini):

- protokol (OIDC/SAML/dll.)
- identity provider
- client ID / redirect URI
- pemetaan role ADMIN/OPERATOR
- perilaku logout & sesi
- lingkungan staging

Kemudian ganti adapter `BpsAuthProvider` tanpa membongkar UI.

---

## 25. Integrasi API

Bedakan:

1. **API internal aplikasi ini** (`/api/*`) — sudah dipakai untuk auth, CRUD, workflow.
2. **WebAPI publik BPS** — untuk konsumsi data publik resmi; **bukan** diasumsikan mampu CRUD internal.
3. **API manajemen data internal BPS** — hanya jika kontrak tersedia.

Integrasi WebAPI BPS hanya dilakukan setelah spesifikasi dikonfirmasi.

---

## 26. Security Considerations

### Sudah diimplementasikan

- Hash password (bcrypt)
- Cookie HttpOnly + SameSite
- Otorisasi server-side
- Validasi input (Zod)
- CORS allowlist
- Pesan error aman (tanpa stack ke klien)
- Secret tidak di frontend

### Tanggung jawab produksi BPS

- HTTPS
- Rotasi `AUTH_SECRET`
- Backup database
- Logging/monitoring
- Hardening infrastruktur
- Review keamanan kelembagaan

---

## 27. Data Integrity

- Baseline JSON tidak diubah oleh aplikasi runtime
- Seed idempotent
- Null tetap null
- Periode khusus tidak dinormalisasi menjadi tahun biasa
- Uji: `npm run test:data`

---

## 28. Known Limitations

- SSO BPS belum terintegrasi
- WebAPI produksi BPS belum terintegrasi
- Hosting/domain/HTTPS produksi belum ditentukan
- Database produksi BPS belum ditentukan
- Modul Pengguna/Pengaturan masih placeholder UI
- SQLite default hanya untuk local/staging

Bukan limitation: inti publik + ruang kerja + workflow + audit sudah lengkap dan teruji.

---

## 29. BPS Responsibilities

Perlu dikonfirmasi oleh BPS:

- [ ] Hosting & runtime
- [ ] Domain / subdomain / path
- [ ] HTTPS & reverse proxy
- [ ] Database produksi
- [ ] Cara tautan navbar situs BPS
- [ ] Apakah SSO diperlukan (+ kontrak)
- [ ] Apakah API internal BPS diperlukan (+ kontrak)
- [ ] Kebijakan backup & monitoring
- [ ] Persetujuan keamanan & go-live

---

## 30. Developer Responsibilities (sudah diserahkan)

- Frontend publik & workspace
- Backend Express + Prisma
- Skema DB + seed baseline
- Auth + authorization
- CRUD + workflow + audit
- Suite uji (data, API, browser)
- Dokumentasi handover & teknis
- Entry point **Akses Ruang Kerja**

---

## 31. Handover Checklist

Ringkas — detail di [BPS_INTEGRATION_CHECKLIST.md](./BPS_INTEGRATION_CHECKLIST.md).

| Area | Status |
|------|--------|
| Aplikasi core | IMPLEMENTED |
| QA otomatis | IMPLEMENTED (44/44, 64/64) |
| Integrasi produksi BPS | PENDING BPS |

---

## 32. Demo Accounts

**DEVELOPMENT / STAGING ONLY — jangan dipakai di produksi.**

| Username | Password | Role |
|----------|----------|------|
| `admin` | `dev-admin-only` | ADMIN |
| `operator` | `dev-operator-only` | OPERATOR |

Dibuat oleh `npm run db:seed` (password di-hash bcrypt).

---

## 33. Troubleshooting

| Gejala | Periksa |
|--------|---------|
| API tidak jalan | `npm run dev:api`, `PORT`, `server/.env` |
| Frontend tidak dapat API | `VITE_API_BASE_URL`, CORS_ORIGIN harus sama dengan origin Vite |
| 401 | Sesi habis / belum login → login ulang |
| 403 | Role tidak berwenang (mis. Operator approve) |
| Prisma generate gagal (TLS) | `$env:NODE_OPTIONS='--use-system-ca'` |
| Seed gagal | Pastikan `indicators.json` ada; hitungan 58 |
| DB kosong / aneh | `npm run db:reset` (hapus data lokal) |
| Browser QA gagal | API + Vite harus running; Chrome terpasang |
| Build gagal | `npm run typecheck` / `typecheck:api` untuk detail |

---

## 34. Final Acceptance Status

| Pemeriksaan | Hasil |
|-------------|-------|
| Public tanpa login | PASS |
| Login Admin / Operator | PASS |
| Workflow + isolasi publik | PASS |
| Authorization backend | PASS |
| Audit | PASS |
| `test` 44/44 | PASS |
| `test:browser` 64/64 | PASS |
| Build + typecheck | PASS |
| Data integrity + SHA256 baseline | PASS |
| `indicators.json` tidak diubah runtime | PASS |

### FINAL STATUS

**READY FOR BPS HANDOVER / INTEGRATION**

---

## Dokumen terkait

- [BPS_INTEGRATION_CHECKLIST.md](./BPS_INTEGRATION_CHECKLIST.md)
- [DEMO_GUIDE.md](./DEMO_GUIDE.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [API.md](./API.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AUTH.md](./AUTH.md)
- [DATA_MANAGEMENT.md](./DATA_MANAGEMENT.md)
- [WORKFLOW.md](./WORKFLOW.md)
- [BPS_TECHNICAL_RFI.md](./BPS_TECHNICAL_RFI.md)
- [PRODUCTION_INTEGRATION.md](./PRODUCTION_INTEGRATION.md)
