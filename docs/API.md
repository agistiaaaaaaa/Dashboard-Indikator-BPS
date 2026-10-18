# API Reference — Backend aktual

Base URL (dev): `http://localhost:4000`

Mutasi memerlukan cookie sesi `bps_loteng_session` (HttpOnly) kecuali dinyatakan publik.
`Content-Type: application/json` untuk body JSON.
CORS: origin dari `CORS_ORIGIN` + `credentials: true`.

## Ringkasan endpoint

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/health` | Public | — | Health check |
| POST | `/api/auth/login` | Public | — | Login; Set-Cookie JWT |
| POST | `/api/auth/logout` | Required | any staff | Logout; clear cookie |
| GET | `/api/auth/me` | Required | any staff | Current user |
| GET | `/api/indicators` | Optional | — | Dataset published |
| GET | `/api/indicators/:id` | Optional | — | Satu indikator |
| POST | `/api/indicators` | Required | ADMIN | Buat indikator |
| PUT | `/api/indicators/:id` | Required | ADMIN | Ubah indikator |
| DELETE | `/api/indicators/:id` | Required | ADMIN | Hapus indikator |
| GET | `/api/indicators/:id/observations` | Optional | — | Observasi published |
| POST | `/api/indicators/:id/observations` | Required | ADMIN | Tambah observasi |
| PUT | `/api/observations/:id` | Required | ADMIN | Ubah observasi |
| DELETE | `/api/observations/:id` | Required | ADMIN | Hapus observasi |
| GET | `/api/submissions` | Required | ADMIN, OPERATOR | Daftar pengajuan (Operator: milik sendiri) |
| GET | `/api/submissions/:id` | Required | ADMIN, OPERATOR | Detail pengajuan |
| POST | `/api/submissions/drafts` | Required | ADMIN, OPERATOR | Buat/ubah DRAFT |
| POST | `/api/submissions/:id/submit` | Required | ADMIN, OPERATOR | → PENDING_REVIEW |
| POST | `/api/submissions/:id/reject` | Required | ADMIN | → REJECTED (wajib reason) |
| POST | `/api/submissions/:id/approve` | Required | ADMIN | Terapkan ke Observation + PUBLISHED |
| POST | `/api/submissions/:id/publish` | Required | ADMIN | Alias publish jika masih pending |
| DELETE | `/api/submissions/:id` | Required | ADMIN, OPERATOR | Hapus DRAFT saja |
| GET | `/api/audit-logs` | Required | ADMIN | Audit trail |

**Total: 22 route handlers** pada router di atas (termasuk health).

## Auth

### POST `/api/auth/login`

Request:

```json
{ "username": "admin", "password": "…" }
```

Response `200`:

```json
{ "user": { "id": "…", "username": "admin", "name": "…", "role": "ADMIN" } }
```

+ Set-Cookie `bps_loteng_session`.

| Status | Meaning |
|--------|---------|
| 401 | Kredensial tidak valid |
| 422 | Body tidak valid |

### GET `/api/auth/me`

`200` + `{ user }` atau `401` jika sesi tidak valid/kadaluarsa (JWT 8 jam).

## Submissions — draft body

```json
{
  "indicatorId": "…",
  "period": "2020",
  "proposedValue": 1031.55,
  "proposedDisplay": null,
  "sourceNote": "…",
  "changeNote": "…",
  "changeId": null
}
```

- `proposedValue` boleh `null`
- Jika nilai berubah dari published: `changeNote` dan `sourceNote` wajib (422 jika kosong)
- Periode harus sudah ada pada observasi indikator

## Error shape

```json
{ "error": "FORBIDDEN", "message": "Anda tidak memiliki izin untuk melakukan tindakan ini." }
```

| Status | Meaning |
|--------|---------|
| 401 | Unauthorized / sesi berakhir |
| 403 | Forbidden (role) |
| 404 | Not found |
| 409 | Conflict |
| 422 | Validation |
| 500 | Server (tanpa stack ke klien) |

## Catatan publik

`GET /api/indicators` mengembalikan baris `Observation` (published). Draft/pending/rejected hanya di `DataChange` / submissions.
