# Dashboard Indikator Strategis — Implementation Notes

## Route

- Public dashboard: `/dashboard-indikator`
- Root `/` redirects to the dashboard

## Verified source (Phase 1 — do not replace)

- Google Spreadsheet *Indikator Strategis Lombok Tengah*
- Authoritative sheet: **Rekap** (`gid=1403889517`)
- Runtime file: `src/data/indicators.json`
- Audit: `docs/DATA_AUDIT.md`

## Architecture

```
UI (pages/components)
  ↓
indicatorService.ts
  ↓
IndicatorProvider (mock | bps)
  ↓
indicators.json  OR  future BPS WebAPI
```

### Key modules

| Module | Role |
|--------|------|
| `src/services/indicatorService.ts` | Filters, periods, featured KPIs, trends, export entry |
| `src/services/export/exportIndicators.ts` | Real Excel download via `xlsx` |
| `src/data/providers/*` | Swappable data providers |
| `src/config/featuredIndicators.ts` | Featured KPI IDs (not values) |
| `src/config/env.ts` | `VITE_DATA_PROVIDER`, `VITE_BPS_API_BASE_URL` |
| `src/utils/format.ts` | Indonesian display formatting |
| `src/utils/trend.ts` | Change / poin persentase logic |
| `src/utils/periods.ts` | Annual + special periods (`Maret 2025`, etc.) |

## Current data mode

`VITE_DATA_PROVIDER=mock` (default) loads the Phase 1 verified JSON.

No fabricated statistical values are used in the UI.

## BPS API integration seam

1. Implement `bpsIndicatorProvider` against the official contract from [BPS WebAPI](https://webapi.bps.go.id/developer/login).
2. Set environment variables (see `.env.example`):
   - `VITE_BPS_API_BASE_URL`
   - `VITE_DATA_PROVIDER=bps`
3. Keep secrets/tokens on a backend — never in the frontend bundle.
4. Dashboard components should not need changes if the provider honors `IndicatorProvider`.

## Excel export

- Button: **Unduh Excel**
- Respects active category / search filters
- If a specific period is selected, only that period is exported
- Column `Nilai` keeps raw numeric precision; null stays empty

## Known data limitations (from Phase 1)

- `lastUpdatedFromSource = null` — UI must not invent update dates
- 8 indicators have no numeric values in any period
- 1 Google vs Excel conflict (Jumlah Penduduk 2020) — Google value used
- Cross-sheet conflicts with `update maret 2025` are **not** merged

## Future module compatibility

The indicator model supports future `/pemutakhiran-data` (admin/operator) by keeping metadata + period values separate from UI presentation. Not implemented in Phase 2.

## Scripts

```bash
npm run dev        # development server
npm run build      # typecheck + production build
npm run typecheck  # tsc --noEmit
npm run extract:data  # re-extract from Google/Excel sources
```
