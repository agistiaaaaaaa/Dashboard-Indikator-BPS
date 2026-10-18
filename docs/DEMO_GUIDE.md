# Demo Guide — End-to-End Scenarios

Prasyarat: API + frontend berjalan, DB sudah di-seed (`npm run db:seed`).

Akun demo (**DEVELOPMENT / STAGING ONLY**):

| Username | Password | Role |
|----------|----------|------|
| `admin` | `dev-admin-only` | ADMIN |
| `operator` | `dev-operator-only` | OPERATOR |

Jangan gunakan akun ini di produksi.

---

## DEMO 1 — Public

1. Buka `http://localhost:5173/` atau `/dashboard-indikator` **tanpa login**
2. Pastikan menu: Beranda, Dashboard, Data Strategis, Publikasi, **Akses Ruang Kerja**
3. Filter kategori/periode, cari indikator, buka grafik & tabel, unduh Excel
4. Konfirmasi **Jumlah Penduduk** periode **2020** = **1029.03** (tampilan: `1.029,03`)

**PASS** jika dashboard publik berfungsi tanpa autentikasi.

---

## DEMO 2 — Operator

1. Klik **Akses Ruang Kerja** → `/login`
2. Login `operator` / `dev-operator-only`
3. Buka **Pemutakhiran Data**
4. Pilih indikator & periode → ubah nilai → **Simpan Draft**
5. Refresh: pastikan draft masih ada
6. **Ajukan untuk Review** → status **Menunggu review**
7. Logout

**PASS** jika draft tersimpan di database (bukan hanya sesi browser).

---

## DEMO 3 — Public sebelum approve

1. Buka kembali dashboard publik
2. Nilai published harus tetap nilai **lama**

**PASS** jika draft/pending tidak bocor ke publik.

---

## DEMO 4 — Admin approve / publish

1. Login `admin` / `dev-admin-only`
2. Buka **Review / Persetujuan**
3. Bandingkan nilai saat ini vs usulan
4. **Setujui & Publish**

**PASS** jika status menjadi **Dipublikasikan** dan audit tercatat.

---

## DEMO 5 — Public setelah publish

1. Refresh `/dashboard-indikator`
2. Nilai baru harus muncul

**PASS** jika publik = observasi published terbaru.

---

## DEMO 6 — Reject

1. Operator submit usulan baru
2. Admin klik **Tolak** tanpa alasan → harus gagal / pesan validasi
3. Isi alasan → **Tolak pengajuan**
4. Publik tetap nilai lama

**PASS** jika alasan wajib dan isolasi publik terjaga.

---

## DEMO 7 — Resubmit → Publish

1. Operator buka item ditolak → edit → simpan draft → ajukan ulang
2. Admin **Setujui & Publish**
3. Publik melihat nilai baru

**PASS** jika alur REJECTED → DRAFT → PENDING_REVIEW → PUBLISHED berjalan.

---

## DEMO 8 — Otorisasi

Sebagai Operator, buka langsung:

- `/workspace/review`
- `/workspace/pengguna`
- `/workspace/riwayat`

Harus **Akses ditolak**. Percobaan approve/publish via API → **403**.

---

## Automated

```bash
npm run dev:api
npm run test           # 44/44 API smoke

npm run dev            # terminal terpisah
npm run test:browser   # 64/64 browser QA (butuh Chrome)
```

Lihat juga: [BPS_HANDOVER.md](./BPS_HANDOVER.md)
