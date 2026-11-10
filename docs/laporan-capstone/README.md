# Laporan Capstone Project

Dokumen siap kirim sesuai Panduan Capstone Project STMIK Lombok (Edisi I, 2026).
Setiap dokumen tersedia dalam format Word (.docx) dan PDF.

| Berkas | Dokumen | Bobot nilai |
|---|---|---|
| `Tugas 1 Proposal Capstone BPS Lombok Tengah` | Proposal | 20% |
| `Tugas 2 Laporan Kemajuan Capstone BPS Lombok Tengah` | Laporan Kemajuan | 30% |
| `Tugas 3 Laporan Akhir Capstone BPS Lombok Tengah` | Laporan Akhir | 50% |
| `Tugas 3 Presentasi Hasil Capstone BPS Lombok Tengah.pptx` | Presentasi hasil (12 slide, ±14 menit, catatan pembicara terisi) | Luaran Tugas 3 |
| `Tugas 3 Skrip Presentasi Capstone BPS Lombok Tengah.pdf` | Naskah per slide, pembagian pembicara, antisipasi tanya jawab | Pendamping presentasi |
| `Panduan Penggunaan Dashboard BPS Lombok Tengah` | Panduan lengkap untuk Publik, Operator, dan Administrator | Lampiran |

## Sebelum dikirim

1. Isi identitas kelompok, dosen pengampu, tempat, tanggal, dan tautan luaran di
   `scripts/lib/capstone-config.mjs`.
2. Tutup dokumen di Word, lalu jalankan `npm run capstone:laporan`. Ketiga berkas
   .docx dan .pdf di folder ini dibuat ulang dengan Daftar Isi yang mutakhir.
3. Lengkapi secara manual: kolom peran dan kontribusi anggota (Laporan Akhir,
   Tabel 8) serta isi Berita Acara Kerja Kelompok setiap pertemuan.

Presentasi dan skrip: `npm run capstone:pptx`. Panduan penggunaan: `npm run guide:docx`.

Membuat satu dokumen saja: `npm run capstone:proposal`, `npm run capstone:kemajuan`,
atau `npm run capstone:report`.
