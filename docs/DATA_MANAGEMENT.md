# Data Management Architecture

## Model bisnis

| Audiens | Akses |
|---------|--------|
| **Public** | Read-only published di dashboard |
| **Operator** | Draft + submit |
| **Admin** | + review / approve / reject / publish + audit |

## Alur produksi yang diimplementasikan

```
Operator/Admin → Draft → Submit → Admin Review → Approve(=Publish) → Public Dashboard
```

Status: `DRAFT` | `PENDING_REVIEW` | `PUBLISHED` | `REJECTED`

## Sumber kebenaran

| Lapisan | Peran |
|---------|--------|
| `src/data/indicators.json` | Baseline seed (immutable runtime) |
| Database `Observation` | Nilai published (publik) |
| Database `DataChange` | Workflow internal |

Browser **tidak** menulis JSON baseline.

## Seam full-stack

```
UI → dataManagementService → localApiDataManagementProvider → Express → DB
```

Fallback offline: `developmentStoreProvider` hanya jika `VITE_DATA_MGMT_PROVIDER=session` — **bukan** mode serah-terima.

Setelah publish, frontend memanggil `hydrateIndicatorCache()` agar dashboard sinkron.

## Validasi

- Angka atau kosong (null); tidak memaksa 0
- Periode harus ada pada indikator
- Sumber + catatan wajib jika nilai berubah
- Reject wajib alasan
- `PENDING_REVIEW` terkunci dari edit

Detail API: [API.md](./API.md) · Workflow: [WORKFLOW.md](./WORKFLOW.md) · Handover: [BPS_HANDOVER.md](./BPS_HANDOVER.md)
