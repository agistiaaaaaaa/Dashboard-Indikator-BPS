# Data Audit — Indikator Strategis Lombok Tengah

Generated: 2026-09-12T12:17:39.706Z

## Access status

| Source | Status |
|--------|--------|
| Google Spreadsheet | **ACCESSIBLE** |
| Local Excel `Indikator Strategis Lombok Tengah.xlsx` | **FOUND** (Downloads → `_source_local_excel.xlsx`) |

**Primary source used:** Google Spreadsheet CSV export of sheet **Rekap** (`gid=1403889517`)  
**Local fallback used:** No

URL: https://docs.google.com/spreadsheets/d/1VSnGyxhs4toTqY_hdiKt29m_Ke6R3wRmrFa7P4UAAwI/edit?gid=1403889517#gid=1403889517

## Sheets discovered

- **Total sheets:** 7
- **Names:** `update maret 2025`, `Rekap`, `webpst`, `Sosial`, `Produksi`, `Distribusi`, `Neraca`
- **Local sheets:** identical set (7)

| Sheet | Role | Non-empty rows (xlsx) |
|-------|------|------------------------|
| `update maret 2025` | Supplementary latest thematic blocks (hidden) | 128 |
| `Rekap` | **PRIMARY strategic inventory** | 66 |
| `webpst` | Dashboard highlight KPIs (special periods) | 5 |
| `Sosial` | Domain detail | 52 |
| `Produksi` | Domain detail | 9 |
| `Distribusi` | Domain detail | 15 |
| `Neraca` | Empty | 0 |

## Primary sheet structure (Rekap)

- Columns: Kategori | INDIKATOR | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025
- Periods: 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025
- Notes preserved:
  - Row 74: Keterangan :
  - Row 75: Hasil Proyeksi Penduduk Interim 2020-2023 (pertengahan tahun/Juni) / Interim Population Projection Results 2020-2023 (mid year/June)
- Orphan value rows (excluded from inventory):
  - Row 60: 19.243.330,35 | 21.250.624,69 | 22.604.874,57
  - Row 61: 12.464.402,38 | 13.183.341,59 | 13.624.025,49
  - Row 63: 1.069.583,00 | 1.089.736,00 | 1.109.800,00
  - Row 65: 17991,43 | 19500,71 | 20368,42 | 867,71
  - Row 66: 11653,52 | 12097,74 | 12276,11

## Indicator inventory (Rekap / Google CSV)

- **Total indicators:** 58
- **Per category:**
  - Sosial: 51
  - Ekonomi: 7
- **Earliest period:** 2014
- **Latest period:** 2025
- **Present value cells:** 458
- **Missing / null cells:** 238
- **Empty indicators (all periods null):** 8
  - [Sosial] 40% Penduduk Penghasilan rendah
  - [Sosial] 40% Penduduk Penghasilan sedang
  - [Sosial] 20% Penduduk Penghasilan tinggi
  - [Sosial] Persentase rumah tangga dengan sumber penerangan listrik
  - [Ekonomi] PDRB ADHB per Kapita
  - [Ekonomi] Inflasi (y o y)
  - [Ekonomi] Inflasi (m o m)
  - [Ekonomi] Inflasi (tahun kalender)
- **Duplicate category+name:** none

## Highlights (webpst) — special periods preserved

- Pertumbuhan Ekonomi: 4.87 % (2025) tren=nak
- Tingkat Kemiskinan: 10.68 % (Maret 2025) tren=turun
- Tingkat Pengangguran Terbuka: 3.36 % (Agustus 2025) tren=naik
- Jumlah Penduduk: 1,129.78 ribu jiwa (2025) tren=naik

## Reconciliation

### Google CSV (Rekap) vs Local Excel (Rekap)

- Matched (no value conflicts): 57
- Only in Google: 0
- Only in Local: 0
- Conflicts: 1
- **Sosial / Jumlah Penduduk (ribu Jiwa)**
  - 2020: google="1.029,03" local="1,029.02" → prefer_google

### Google CSV vs Google XLSX formatted export (same Rekap)

- Conflicts: 1
- **Sosial / Jumlah Penduduk (ribu Jiwa)**
  - 2020: google="1.029,03" local="1,029.02" → prefer_google

> Note: XLSX `raw` numbers for some early *Jumlah Penduduk* cells appear as integers (e.g. `912879`) while Google CSV shows `912.879` (ribu jiwa). **CSV is preferred** to preserve the ribu-jiwa scale implied by the indicator label.

### Cross-sheet conflicts (Rekap vs update maret 2025 / webpst)

- Count: 10
- **Kepadatan Penduduk (Jiwa/km2)** @ 2020: Rekap={"value":885,"display":"885"} vs other={"value":869,"display":"869","block":"Indikator Kependudukan Kabupaten Lombok Tengah 2021-2024"} → prefer_rekap_as_linked_primary_gid
- **Kepadatan Penduduk (Jiwa/km2)** @ 2021: Rekap={"value":898,"display":"898"} vs other={"value":868,"display":"868","block":"Indikator Kependudukan Kabupaten Lombok Tengah 2021-2024"} → prefer_rekap_as_linked_primary_gid
- **Garis Kemiskinan (Rupiah)** @ 2024: Rekap={"value":549400,"display":"549.400"} vs other={"value":594400,"display":"594,400","block":"Jumlah Penduduk Miskin dan Garis Kemiskinan 2018-2024"} → prefer_rekap_as_linked_primary_gid
- **Indeks Pembangunan Gender (IPG)** @ 2020: Rekap={"value":87.17,"display":"87,17"} vs other={"value":87.31,"display":"87.31","block":"Indeks Pembangunan Gender Kabupaten Lombok Tengah 2018-2023"} → prefer_rekap_as_linked_primary_gid
- **Indeks Pembangunan Gender (IPG)** @ 2021: Rekap={"value":87.19,"display":"87,19"} vs other={"value":87.35,"display":"87.35","block":"Indeks Pembangunan Gender Kabupaten Lombok Tengah 2018-2023"} → prefer_rekap_as_linked_primary_gid
- **Indeks Pembangunan Gender (IPG)** @ 2022: Rekap={"value":88.33,"display":"88,33"} vs other={"value":88.36,"display":"88.36","block":"Indeks Pembangunan Gender Kabupaten Lombok Tengah 2018-2023"} → prefer_rekap_as_linked_primary_gid
- **Indeks Pembangunan Gender (IPG)** @ 2023: Rekap={"value":88.72,"display":"88,72"} vs other={"value":88.78,"display":"88.78","block":"Indeks Pembangunan Gender Kabupaten Lombok Tengah 2018-2023"} → prefer_rekap_as_linked_primary_gid
- **IPM** @ 2020: Rekap={"value":66.43,"display":"66,43"} vs other={"value":68.32,"display":"68.32","block":"Indeks Pembangunan Gender Kabupaten Lombok Tengah 2018-2023"} → prefer_rekap_as_linked_primary_gid
- **IPM** @ 2021: Rekap={"value":66.72,"display":"66,72"} vs other={"value":68.7,"display":"68.70","block":"Indeks Pembangunan Gender Kabupaten Lombok Tengah 2018-2023"} → prefer_rekap_as_linked_primary_gid
- **IPM** @ 2022: Rekap={"value":67.57,"display":"67,57"} vs other={"value":69.57,"display":"69.57","block":"Indeks Pembangunan Gender Kabupaten Lombok Tengah 2018-2023"} → prefer_rekap_as_linked_primary_gid

## Assumptions (explicit)

1. Linked `gid=1403889517` maps to sheet **Rekap** (header `Kategori, INDIKATOR, 2014…2025`) — treated as official strategic inventory.
2. Units taken only from parenthetical text in names (or explicit satuan column in webpst); otherwise `null`.
3. Empty cells → `null` / `unavailable`; "Tidak ada survei" → `not_surveyed`; never coerced to 0.
4. Original `display` strings preserved alongside parsed numbers.
5. `lastUpdatedFromSource` is `null` (no authoritative timestamp in sheet).
6. Trailing unnamed columns after years stored only in raw extract extras — not treated as periods.
7. On Google vs Local conflict → Google CSV value used in `indicators.json`.
8. `update maret 2025`, `Sosial`, `Produksi`, `Distribusi` stored as supplementary — **not silently merged** into Rekap series.
9. Special periods in webpst (`Maret 2025`, `Agustus 2025`) preserved as-is.
10. Period markers like `2023*` / `2024**` in update sheet preserved in period labels where extracted.
11. No fabricated demo statistics.
12. Number parsing is unit-aware (e.g. `912.879` as ribu jiwa decimal; `386.676` as Rupiah thousands). Display strings remain authoritative for UI.
13. **Source anomaly (not corrected):** `Garis Kemiskinan` 2016=`357,34` and 2017=`369,65` in Rekap are inconsistent with surrounding Rupiah scale (2015=`335,286`, 2018=`386.676`). Values kept as published; flagged here.
14. **Cross-sheet IPM/IPG/GK differences** between Rekap and `update maret 2025` are documented above and **not merged**. Dashboard primary series uses Rekap; supplementary blocks remain available for review (possible methodology revision / backcast on IPM).

## Outputs

- `src/data/indicators.json` — normalized runtime dataset
- `src/data/indicators.ts` — types + data exports
- `src/services/indicatorService.ts` — Indicator Service seam for React
- `src/data/inspection-raw.json` — full verification dump
- `docs/DATA_AUDIT.md` — this report
- `npm run extract:data` — re-run extraction from source workbooks
