# Data Management Workflow

## Status implementasi

Workflow **tersimpan di database** melalui Express API (`DataChange` + update `Observation` saat publish).

SSO/API produksi BPS masih menunggu kontrak; provider tetap dapat diganti.

## State machine

```
DRAFT → PENDING_REVIEW → PUBLISHED
                ↘
              REJECTED → (edit) → DRAFT → PENDING_REVIEW → …
```

## Peran

| Role | Kemampuan |
|------|-----------|
| Public | Baca published |
| Operator | Draft, submit, hapus draft sendiri, lihat pengajuan sendiri |
| Admin | + reject (wajib reason), approve/publish, audit |

Operator memanggil approve/publish/audit → **403**.

## Isolasi publik

| Status internal | Terlihat publik? |
|-----------------|------------------|
| DRAFT | Tidak |
| PENDING_REVIEW | Tidak |
| REJECTED | Tidak |
| PUBLISHED | Ya (nilai di `Observation`) |

Contoh: published 1029.03; usulan 1030.20 → sebelum publish publik tetap 1029.03.

## UI

- Pemutakhiran: Simpan Draft / Ajukan untuk Review
- Review Admin: Tolak / Setujui & Publish (satu langkah menerapkan ke Observation)
- Dirty navigation: `UnsavedChangesProvider`

## Audit

Aksi workflow dicatat di `AuditLog` (SUBMIT, REJECT, APPROVE, PUBLISH, dll.).

Lihat: [DATA_MANAGEMENT.md](./DATA_MANAGEMENT.md) · [API.md](./API.md) · [DEMO_GUIDE.md](./DEMO_GUIDE.md)
