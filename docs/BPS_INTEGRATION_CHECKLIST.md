# BPS Integration Checklist

Checklist serah-terima dan integrasi untuk **Dashboard Indikator Strategis Lombok Tengah**.

Legenda status:

| Label | Arti |
|-------|------|
| **IMPLEMENTED** | Sudah ada di repositori dan terverifikasi |
| **PENDING BPS** | Memerlukan keputusan / aset dari pihak BPS |
| **NOT REQUIRED** | Tidak wajib untuk go-live inti (opsional) |
| **PLACEHOLDER** | UI/izin ada, implementasi penuh menunggu kontrak |

---

## APPLICATION

| Item | Status |
|------|--------|
| Frontend publik (dashboard, filter, chart, export) | IMPLEMENTED |
| Frontend workspace (Operator / Admin) | IMPLEMENTED |
| Entry navigasi **Akses Ruang Kerja** → `/login` | IMPLEMENTED |
| Backend Express + TypeScript | IMPLEMENTED |
| Database schema (Prisma) | IMPLEMENTED |
| Seed dari `src/data/indicators.json` | IMPLEMENTED |
| Authentication (bcrypt + JWT HttpOnly cookie) | IMPLEMENTED |
| Authorization server-side (`requireAuth` / `requireRole`) | IMPLEMENTED |
| CRUD indikator / observasi (Admin) | IMPLEMENTED |
| Workflow Draft → Review → Publish | IMPLEMENTED |
| Isolasi publik (hanya PUBLISHED) | IMPLEMENTED |
| Audit trail | IMPLEMENTED |
| Modul Pengguna (manajemen akun penuh) | PLACEHOLDER |
| Modul Pengaturan | PLACEHOLDER |

---

## QA

| Item | Status | Catatan |
|------|--------|---------|
| `npm run test` (API smoke) | IMPLEMENTED | 44/44 PASS |
| `npm run test:browser` | IMPLEMENTED | 64/64 PASS |
| `npm run test:data` | IMPLEMENTED | PASS |
| `npm run typecheck` | IMPLEMENTED | PASS |
| `npm run typecheck:api` | IMPLEMENTED | PASS |
| `npm run build` | IMPLEMENTED | PASS |
| `npm run build:api` | IMPLEMENTED | PASS |
| Baseline SHA256 `577FB713…17F3B` | IMPLEMENTED | Terverifikasi |

---

## DOCUMENTATION

| Item | Status |
|------|--------|
| `docs/BPS_HANDOVER.md` | IMPLEMENTED |
| `docs/BPS_INTEGRATION_CHECKLIST.md` | IMPLEMENTED |
| `docs/API.md` | IMPLEMENTED |
| `docs/ARCHITECTURE.md` | IMPLEMENTED |
| `docs/AUTH.md` | IMPLEMENTED |
| `docs/DATA_MANAGEMENT.md` | IMPLEMENTED |
| `docs/WORKFLOW.md` | IMPLEMENTED |
| `docs/DEPLOYMENT.md` | IMPLEMENTED |
| `docs/DEMO_GUIDE.md` | IMPLEMENTED |
| `docs/BPS_TECHNICAL_RFI.md` | IMPLEMENTED (pertanyaan ke BPS) |
| `docs/PRODUCTION_INTEGRATION.md` | IMPLEMENTED (batas integrasi) |

---

## BPS INTEGRATION (produksi)

| Item | Status |
|------|--------|
| Menentukan hosting / runtime | PENDING BPS |
| Menentukan domain / subdomain / path | PENDING BPS |
| HTTPS + reverse proxy | PENDING BPS |
| Database produksi | PENDING BPS |
| Tautan navbar situs BPS ke dashboard publik | PENDING BPS |
| SSO BPS | PENDING BPS (jika diperlukan) |
| Kontrak API internal / WebAPI untuk manajemen data | PENDING BPS (jika diperlukan) |
| Backup policy | PENDING BPS |
| Logging / monitoring | PENDING BPS |
| Security review & go-live approval | PENDING BPS |
| Credential produksi | PENDING BPS — **jangan** pakai akun demo |

---

## OPTIONAL / NOT REQUIRED UNTUK CORE GO-LIVE

| Item | Status |
|------|--------|
| Integrasi WebAPI publik BPS sebagai sumber baca | NOT REQUIRED sampai dikonfirmasi |
| Microservices / Redis / antrean | NOT REQUIRED |
| GraphQL / WebSocket | NOT REQUIRED |

---

## RINGKASAN

| Area | Kesimpulan |
|------|------------|
| Aplikasi + QA + dokumentasi teknis | **Siap diserahkan** |
| Integrasi infrastruktur & identitas BPS | **Menunggu BPS** |

**FINAL STATUS APLIKASI:** READY FOR BPS HANDOVER / INTEGRATION
