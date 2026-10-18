# Diagram Sistem — BPS Dashboard Indikator

## File PNG

| File | Isi |
|------|-----|
| `flowchart-sistem.png` | Flowchart resmi 4 lapis (disetujui BPS): Publik → Auth → Workspace → Alur Publish |
| `erd-sistem.png` | ERD entitas auth, indikator, perubahan data, audit |

## Struktur flowchart (resmi)

1. **Public Area Read-Only** — Visitor → Website → Published Indicator Data
2. **Authentication** — Login → authService → Session ADMIN / OPERATOR
3. **Internal Workspace** — Operator (Pemutakhiran, Indikator, Pengajuan) | Admin (Review, Pengguna, Riwayat, Pengaturan)
4. **Alur Data & Publikasi** — DRAFT → PENDING_REVIEW → PUBLISHED / REJECTED → Dashboard publik

## Sumber Mermaid (editable)

| File | Keterangan |
|------|------------|
| `flowchart-sistem.mmd` | Source flowchart (struktur 4 lapis) |
| `erd-sistem.mmd` | Source ERD |

```bash
npx @mermaid-js/mermaid-cli -i docs/figures/flowchart-sistem.mmd -o docs/figures/flowchart-sistem.png -s 2
npx @mermaid-js/mermaid-cli -i docs/figures/erd-sistem.mmd -o docs/figures/erd-sistem.png -s 2
```

Catatan: menggambarkan arsitektur Phase 3A/3B. Persistensi produksi menunggu kontrak backend BPS.
