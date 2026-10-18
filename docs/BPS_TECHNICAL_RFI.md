# Permintaan Informasi Teknis (RFI)
## Integrasi Produksi — Dashboard & Pemutakhiran Indikator Strategis
### BPS Kabupaten Lombok Tengah

| | |
|---|---|
| **Versi dokumen** | 1.0 |
| **Status** | Siap dikirim ke pihak teknis BPS |
| **Referensi internal** | `docs/PRODUCTION_INTEGRATION.md` (Phase 4A) |
| **Tujuan** | Memperoleh kontrak teknis resmi agar aplikasi dapat dihubungkan ke lingkungan BPS |

---

## 1. Pendahuluan

Dokumen ini diajukan kepada tim teknis / pemangku kepentingan BPS Kabupaten Lombok Tengah terkait rencana integrasi aplikasi web **pengelolaan dan publikasi indikator strategis**.

Aplikasi memiliki dua sisi utama:

### Sisi publik (tanpa login)
- Dashboard statistik bersifat **hanya baca**
- Menampilkan data yang sudah **dipublikasikan**
- Mendukung pencarian, filter, grafik tren, dan unduhan Excel

### Sisi internal (pengguna BPS)
- **Operator** memperbarui nilai indikator, menyimpan sebagai *draft* (usulan), lalu mengajukan review
- **Administrator** meninjau usulan, menolak (dengan alasan) atau menyetujui
- Data yang disetujui menjadi data **terpublikasi** di dashboard publik
- Jejak perubahan (*audit*) dicatat untuk pertanggungjawaban

**Status saat ini:** prototipe antarmuka dan alur kerja pengembangan (Draft → Review → Publish) sudah diimplementasikan di sisi frontend. Integrasi produksi **belum** dilakukan karena kontrak autentikasi dan API resmi BPS belum tersedia.

Jawaban atas pertanyaan dalam dokumen ini akan menentukan apa yang harus diimplementasikan oleh pengembang agar aplikasi terhubung ke backend resmi BPS.

---

## 2. Pernyataan penting (disclaimer)

> **Dokumen ini bukan permintaan untuk mengubah sistem BPS yang sudah ada. Dokumen ini bertujuan mengidentifikasi mekanisme integrasi resmi yang dapat digunakan oleh aplikasi.**

Selain itu:
- Tidak diasumsikan bahwa API produksi BPS sudah tersedia untuk aplikasi ini
- Dokumen ini **tidak** meminta kata sandi, kunci API produksi, atau kredensial rahasia
- Dokumen ini **tidak** meminta akses langsung ke database produksi
- Diutamakan akses **staging / uji coba** terlebih dahulu, baru kemudian produksi

Jika suatu kemampuan **tidak tersedia**, cukup jawab: **“Tidak tersedia.”**

---

## 3. Ringkasan temuan teknis (dari audit internal)

| Status | Isi |
|--------|-----|
| **Sudah siap di frontend** | Lapisan autentikasi (siap diganti), lapisan manajemen data (siap diganti), peran UI Admin/Operator, matriks izin, alur Draft → Menunggu Review → Ditolak / Dipublikasikan, dataset dasar terverifikasi (58 indikator) |
| **Belum tersedia dari BPS** | Kontrak autentikasi produksi, API manajemen data internal, pemetaan peran resmi, arsitektur publikasi, penyimpanan permanen multi-pengguna, penyimpanan audit, lingkungan staging |
| **Belum dapat dipastikan** | Apakah BPS WebAPI publik relevan/cukup untuk inventaris indikator strategis Kabupaten Lombok Tengah pada aplikasi ini |

---

## A. Autentikasi (login pengguna internal)

Mohon konfirmasi mekanisme resmi agar staf BPS dapat masuk ke ruang kerja aplikasi.

1. Apakah sudah tersedia sistem autentikasi resmi untuk pengguna internal aplikasi?
2. Apakah menggunakan: username/password, SSO, OAuth/OIDC, JWT, session/cookie, atau mekanisme lain?
3. Apa endpoint/protokol **login**?
4. Apa endpoint/protokol **logout**?
5. Bagaimana sesi atau token diberikan kepada aplikasi?
6. Berapa lama masa berlaku sesi/token?
7. Apakah ada *refresh token* / perpanjangan sesi?
8. Bagaimana penanganan sesi kedaluwarsa?
9. Apakah pengguna memiliki *role* / *claim* (hak akses) dalam respons autentikasi?
10. Field identitas apa yang tersedia (misalnya: id, nama, username/email, unit kerja)?
11. Bagaimana pemetaan pengguna menjadi peran aplikasi:
    - **ADMIN** (atau nama resmi setara)
    - **OPERATOR** (atau nama resmi setara)
12. Apakah ada mekanisme reset kata sandi?
13. Apakah ada MFA (autentikasi dua faktor)?
14. Apakah ada pembatasan IP / jaringan?

**Catatan:** Mohon **jangan** mengirim kata sandi atau kredensial produksi dalam jawaban RFI ini.

---

## B. API data / manajemen indikator

Mohon konfirmasi apakah BPS memiliki API (atau layanan setara) untuk operasi berikut.  
Untuk setiap operasi, sebutkan bila memungkinkan: **tersedia?** · endpoint · metode HTTP · autentikasi · otorisasi · format permintaan · format respons · format error · batas pemakaian (*rate limit*) · lingkungan (staging/produksi).

| No | Operasi | Tersedia? (Ya / Tidak / Rencana) |
|----|---------|----------------------------------|
| B1 | Membaca daftar indikator | |
| B2 | Membaca nilai indikator per periode | |
| B3 | Membuat draft perubahan | |
| B4 | Mengubah draft | |
| B5 | Menghapus draft | |
| B6 | Mengajukan draft untuk review | |
| B7 | Melihat antrian review | |
| B8 | Menolak pengajuan (dengan alasan) | |
| B9 | Menyetujui pengajuan | |
| B10 | Mempublikasikan data | |
| B11 | Membaca riwayat pengajuan | |
| B12 | Membaca jejak audit | |

Jika operasi tidak ada, jawab **“Tidak tersedia.”** Hal itu tetap berguna agar frontend tidak menduga-duga kemampuan backend.

---

## C. BPS WebAPI (statistik publik) vs API internal

Perlu dibedakan dua jenis layanan:

| Jenis | Fungsi tipikal |
|-------|----------------|
| **WebAPI statistik publik** | Membaca data statistik yang sudah dipublikasikan |
| **API manajemen data internal** | Login staf, draft, review, approve/tolak, publish, audit |

Pertanyaan:

1. Apakah BPS WebAPI yang tersedia dapat digunakan untuk **membaca** data indikator strategis Kabupaten Lombok Tengah?
2. Apakah inventaris **58 indikator** pada prototipe dapat dipetakan ke WebAPI tersebut?
3. Bagaimana *identifier* indikator ditentukan (kode variabel, id internal, dll.)?
4. Bagaimana periode ditentukan (tahun, triwulan, label khusus)?
5. Apakah periode khusus seperti **Maret 2025** dan **Agustus 2025** dapat direpresentasikan tanpa diubah menjadi hanya “2025”?
6. Apakah WebAPI bersifat **hanya baca**?
7. Apakah WebAPI menyediakan **tulis / ubah** data?
8. Jika tidak, API atau sistem internal apa yang digunakan untuk **pemutakhiran** data?

---

## D. Sumber data (source of truth)

1. Apa sumber kebenaran resmi (*source of truth*) untuk indikator strategis Kabupaten Lombok Tengah?
2. Basis data / sistem apa yang digunakan?
3. Apakah data sudah tersedia di basis data resmi?
4. Apakah aplikasi baru harus membaca sistem/basis data yang sudah ada?
5. Apakah diperlukan ETL / impor data?
6. Apakah sistem BPS yang ada tetap menjadi sumber otoritatif?

Mohon juga konfirmasi ketersediaan field:
- metadata indikator (nama, kategori, satuan, sumber)
- nilai observasi
- periode
- catatan / keterangan
- penanganan nilai kosong (*null* / belum tersedia)

---

## E. Alur kerja pemutakhiran

Prototipe saat ini mengikuti alur:

```
DRAFT → PENDING_REVIEW → PUBLISHED

PENDING_REVIEW → REJECTED → (revisi) → DRAFT → …
```

Mohon konfirmasi apakah BPS menyetujui alur tersebut, atau berikan alur resmi yang harus diikuti.

1. Apakah Operator boleh mengubah data publik secara langsung?
2. Apakah semua perubahan wajib melalui persetujuan Admin?
3. Siapa yang berwenang menyetujui?
4. Apakah Admin boleh mengedit data?
5. Apakah persetujuan otomatis berarti data langsung terpublikasi?
6. Apakah **publish** terpisah dari **approve**?
7. Apakah pengajuan yang ditolak dapat diedit dan diajukan ulang?
8. Apakah ada tingkat persetujuan lain (lebih dari satu jenjang)?

---

## F. Peran pengguna

Prototipe memakai dua peran UI: **ADMIN** dan **OPERATOR**.  
Nama peran resmi BPS mungkin berbeda — mohon sebutkan nama resmi.

Untuk setiap peran resmi, mohon centang kemampuan yang berlaku:

| Kemampuan | Peran 1: ……… | Peran 2: ……… | Peran lain: ……… |
|-----------|--------------|--------------|-----------------|
| Melihat data internal | | | |
| Membuat usulan/draft | | | |
| Mengedit draft | | | |
| Mengajukan review | | | |
| Meninjau pengajuan | | | |
| Menyetujui | | | |
| Menolak | | | |
| Mempublikasikan | | | |
| Melihat riwayat/audit | | | |
| Mengelola pengguna | | | |
| Mengelola pengaturan | | | |

---

## G. Publikasi ke dashboard publik

1. Bagaimana data yang sudah disetujui menjadi data publik?
2. Apakah approval otomatis publish?
3. Apakah ada *snapshot* / versi data?
4. Apakah dashboard publik membaca basis data yang sama dengan ruang kerja internal?
5. Apakah ada tabel/view khusus data terpublikasi?
6. Apakah ada *cache*?
7. Berapa lama hingga perubahan terlihat di publik setelah disetujui?
8. Apakah diperlukan *rollback*?
9. Apakah diperlukan riwayat versi publik?

---

## H. Audit / jejak perubahan

Apakah BPS mensyaratkan pencatatan:

- siapa melakukan perubahan
- kapan
- indikator & periode
- nilai sebelum & sesudah
- alasan perubahan
- reviewer
- waktu persetujuan / penolakan
- alasan penolakan
- waktu publikasi

Pertanyaan tambahan:

1. Berapa lama audit disimpan?
2. Siapa yang boleh melihat audit?
3. Apakah audit dapat dihapus?
4. Apakah audit harus bersifat tidak dapat diubah (*immutable*)?
5. Apakah sistem audit BPS yang sudah ada dapat dipakai ulang?

---

## I. Lingkungan staging / uji coba

Diutamakan **staging terlebih dahulu**, baru produksi.

Mohon informasi (jika tersedia):
- URL dasar API staging
- cara autentikasi staging
- basis data staging (bila relevan)
- akun uji (bukan akun produksi) untuk tiap peran
- dokumentasi API
- OpenAPI / Swagger
- koleksi Postman
- contoh respons API

**Mohon jangan mengirim kredensial produksi.**

---

## J. Keamanan

Mohon konfirmasi kebijakan yang berlaku bagi aplikasi ini:
- HTTPS
- CORS (domain yang diizinkan)
- CSRF (jika memakai cookie)
- aturan token/sesi
- pembatasan IP / VPN / jaringan internal
- batas frekuensi permintaan (*rate limit*)
- persyaratan audit & logging
- retensi data
- cadangan (*backup*) & pemulihan bencana

---

## K. Penempatan aplikasi (deployment)

1. Di mana aplikasi sebaiknya dijalankan?
2. VPS, infrastruktur BPS, cloud, atau server existing?
3. Apakah memakai kontainer?
4. Apakah ada *reverse proxy*?
5. Domain / subdomain yang direncanakan?
6. Sertifikat SSL?
7. CI/CD?
8. Monitoring?
9. Backup aplikasi?

Tidak diasumsikan penyedia infrastruktur tertentu.

---

## L. Migrasi data baseline prototipe

Dataset pengembangan saat ini (terverifikasi, tidak diubah sembarangan):

| Ringkasan | Nilai |
|-----------|-------|
| Jumlah indikator | 58 |
| Sosial | 51 |
| Ekonomi | 7 |
| Rentang periode | 2014–2025 |
| Periode khusus | misalnya Maret 2025, Agustus 2025 |

Pertanyaan:

1. Apakah dataset ini hanya data prototipe?
2. Apakah perlu diimpor ke sistem produksi?
3. Apa dataset otoritatif produksi?
4. Pemetaan / pembersihan data apa yang diperlukan?
5. Identifier resmi apa untuk tiap indikator?
6. Bagaimana merepresentasikan nilai kosong / belum tersedia (harus tetap kosong, bukan nol)?

---

## 4. Artefak teknis yang dimohon (jika ada)

- Dokumentasi API
- OpenAPI / Swagger
- Koleksi Postman
- Dokumentasi autentikasi
- Dokumentasi peran & izin
- Kamus data / katalog indikator
- Contoh respons API
- URL staging
- Akun staging per peran
- Persyaratan jaringan / VPN
- Persyaratan deployment & keamanan

---

## 5. Template jawaban singkat (dapat diisi BPS)

```
AUTH:
Status: [Tersedia / Tidak tersedia / Sedang direncanakan]
Dokumentasi:
Kontak teknis:

DATA API (manajemen internal):
Status:
Dokumentasi:
Kontak teknis:

WEBAPI (statistik publik):
Status: [Dapat dipakai untuk inventaris ini? Ya/Tidak/Belum pasti]
Dokumentasi:
Hanya baca? [Ya/Tidak]

ROLES:
Status:
Daftar peran resmi:
Pemetaan ke Admin/Operator:

WORKFLOW:
Status: [Disetujui seperti prototipe / Perlu disesuaikan]
Alur resmi:

PUBLISHING:
Status:
Model (approval=publish / terpisah / view khusus / dll.):

AUDIT:
Status:
Retensi:

STAGING:
Tersedia: [Ya/Tidak]
URL:
Cara akses:

DEPLOYMENT:
Lingkungan target:
Persyaratan:
```

---

## 6. Setelah jawaban BPS diterima

Urutan kerja yang disarankan:

1. Meninjau jawaban BPS  
2. Mengunci kontrak autentikasi  
3. Mengunci kontrak API data  
4. Mengunci pemetaan peran  
5. Mengunci model publikasi  
6. Mengunci model audit  
7. Memperoleh akses staging  
8. Mengimplementasikan penyambung autentikasi resmi (`BpsAuthProvider`)  
9. Mengimplementasikan penyambung manajemen data resmi (`BpsDataManagementProvider`)  
10. Uji integrasi di staging  
11. Review keamanan  
12. Deployment produksi  

---

## 7. Kontak tindak lanjut (isi oleh pengirim)

| | |
|---|---|
| Nama pengirim | |
| Peran / institusi | |
| Email / telepon | |
| Tanggal pengiriman | |
| Target tanggapan (opsional) | |

Terima kasih atas kerja sama BPS Kabupaten Lombok Tengah. Jawaban atas RFI ini akan menjadi dasar integrasi resmi tanpa mengubah sistem BPS di luar mekanisme yang disetujui.
