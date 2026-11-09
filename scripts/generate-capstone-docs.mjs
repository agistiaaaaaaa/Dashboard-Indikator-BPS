/**
 * Membangkitkan dokumen Capstone Project sesuai Panduan Capstone Project
 * STMIK Lombok (Edisi I, 2026):
 *   - Tugas 1: Proposal           (Bab III–V dikosongkan)
 *   - Tugas 2: Laporan Kemajuan   (Bab IV–V dikosongkan)
 *   - Tugas 3: Laporan Akhir      (lengkap)
 *
 * Identitas kelompok, tanggal, dan tautan diatur di scripts/lib/capstone-config.mjs.
 * Keluaran disimpan di docs/laporan-capstone/. Setelah ditulis, Daftar Isi,
 * Daftar Tabel, dan Daftar Gambar diperbarui melalui Microsoft Word
 * (scripts/update-docx-fields.ps1), yang juga mengekspor salinan PDF siap kirim.
 *
 * Penggunaan:
 *   node scripts/generate-capstone-docs.mjs            # ketiganya
 *   node scripts/generate-capstone-docs.mjs proposal   # proposal | kemajuan | akhir
 *
 * CAPSTONE_OUT_DIR mengalihkan keluaran ke folder lain (default: docs/laporan-capstone/).
 */
import { Document, NumberFormat, Packer, SectionType } from "docx";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import {
  bulletList,
  centered,
  chapter,
  cover,
  documentStyles,
  emptyFooter,
  emptyHeader,
  figure,
  flowRow,
  formTable,
  frontTitle,
  h2,
  h3,
  listOfCaptions,
  numberedList,
  numberingConfig,
  p,
  pageMargins,
  pageNumberFooter,
  plain,
  signatureGrid,
  spacer,
  table,
  tableOfContents,
} from "./lib/capstone-academic.mjs";
import {
  TEST_RESULTS,
  TITLE_SHORT,
  YEAR,
  lecturer,
  link,
  memberList,
  place,
  signDate,
} from "./lib/capstone-config.mjs";

const DOCS = {
  proposal: {
    type: "Proposal Capstone Project",
    task: "Tugas 1",
    file: "docs/laporan-capstone/01_Proposal_Capstone_BPS_Lombok_Tengah.docx",
  },
  kemajuan: {
    type: "Laporan Kemajuan Capstone Project",
    task: "Tugas 2",
    file: "docs/laporan-capstone/02_Laporan_Kemajuan_Capstone_BPS_Lombok_Tengah.docx",
  },
  akhir: {
    type: "Laporan Akhir Capstone Project",
    task: "Tugas 3",
    file: "docs/laporan-capstone/03_Laporan_Akhir_Capstone_BPS_Lombok_Tengah.docx",
  },
};

const ASSET = (name) => resolve("docs/guide-assets", name);
const FIGURE = (name) => resolve("docs/figures", name);
const SCREEN = { pixelWidth: 1440, pixelHeight: 900 };
const DIAGRAM = { pixelWidth: 1280, pixelHeight: 720, type: "jpg" };

const api = TEST_RESULTS.api;
const browser = TEST_RESULTS.browser;

/* ================================================================ front */

function kataPengantar(kind) {
  const purpose = {
    proposal:
      "Proposal ini disusun sebagai Tugas 1 mata kuliah Capstone Project untuk menguraikan latar belakang, tujuan, ruang lingkup, rencana kegiatan, dan landasan pustaka proyek.",
    kemajuan:
      "Laporan Kemajuan ini disusun sebagai Tugas 2 mata kuliah Capstone Project untuk melaporkan metodologi, perancangan, implementasi, dan pengujian yang telah dikerjakan.",
    akhir:
      "Laporan Akhir ini disusun sebagai Tugas 3 mata kuliah Capstone Project dan merangkum seluruh proses proyek, mulai dari analisis kebutuhan hingga hasil pengujian dan rekomendasi pengembangan.",
  }[kind];

  return [
    frontTitle("KATA PENGANTAR"),
    p(
      `Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas rahmat dan karunia-Nya sehingga dokumen berjudul “${TITLE_SHORT}” dapat diselesaikan. ${purpose}`
    ),
    p(
      "Proyek ini berangkat dari kebutuhan nyata: indikator strategis daerah perlu tersaji secara terbuka bagi masyarakat, sementara setiap perubahan angka harus melalui pemeriksaan sebelum dipublikasikan. Melalui proyek ini kami berupaya menerapkan pengetahuan analisis, perancangan, implementasi, dan pengujian sistem informasi yang telah diperoleh selama perkuliahan."
    ),
    p(
      `Kami mengucapkan terima kasih kepada ${lecturer()} selaku dosen pengampu mata kuliah Capstone Project atas arahan dan bimbingannya, kepada Badan Pusat Statistik Kabupaten Lombok Tengah sebagai sumber data indikator strategis, serta kepada semua pihak yang telah membantu.`
    ),
    p(
      "Kami menyadari dokumen ini masih memiliki kekurangan. Kritik dan saran yang membangun sangat kami harapkan untuk penyempurnaan pada tahap berikutnya."
    ),
    spacer(240),
    plain(`${place()}, ${signDate(kind)}`, { align: "right", after: 0 }),
    plain("Tim Penyusun", { align: "right" }),
  ];
}

function frontMatter(kind, { tables, figures }) {
  return [
    ...kataPengantar(kind),
    ...tableOfContents(),
    ...(tables ? listOfCaptions("DAFTAR TABEL", "Tabel") : []),
    ...(figures ? listOfCaptions("DAFTAR GAMBAR", "Gambar") : []),
  ];
}

/* ================================================================ BAB I */

function bab1(kind) {
  const scheduleNote =
    kind === "proposal"
      ? "Kegiatan direncanakan berlangsung selama satu semester (16 pertemuan) mengikuti alur perkuliahan Capstone Project."
      : "Jadwal berikut mengikuti alur perkuliahan Capstone Project selama satu semester (16 pertemuan).";

  return [
    chapter("I", "PENDAHULUAN"),
    h2("1.1 Latar Belakang"),
    p(
      "Indikator strategis seperti jumlah penduduk, persentase penduduk miskin, tingkat pengangguran terbuka, indeks pembangunan manusia, dan laju pertumbuhan ekonomi merupakan dasar bagi pemerintah daerah dalam menyusun perencanaan dan mengevaluasi hasil pembangunan. Undang-Undang Nomor 16 Tahun 1997 tentang Statistik menempatkan Badan Pusat Statistik (BPS) sebagai penyelenggara statistik dasar, sedangkan Peraturan Presiden Nomor 39 Tahun 2019 tentang Satu Data Indonesia menegaskan bahwa data pemerintah harus akurat, mutakhir, terpadu, dan mudah diakses."
    ),
    p(
      "BPS Kabupaten Lombok Tengah mengelola 58 indikator strategis (51 indikator sosial dan 7 indikator ekonomi) dengan rentang periode 2014–2025. Dalam bentuk rekap tabel, data tersebut sulit ditelusuri oleh masyarakat umum: tren antarperiode tidak langsung terlihat, pencarian indikator tertentu memerlukan waktu, dan data tidak dapat diunduh sesuai kebutuhan pengguna."
    ),
    p(
      "Di sisi internal, pemutakhiran angka memiliki risiko tersendiri. Apabila perubahan langsung diterapkan pada data yang dilihat publik tanpa pemeriksaan, kesalahan input dapat langsung tersebar. Tanpa jejak audit, sulit pula menelusuri siapa yang mengubah nilai, kapan perubahan dilakukan, dan apa alasan sebuah usulan disetujui atau ditolak."
    ),
    p(
      `Berdasarkan permasalahan tersebut, proyek “${TITLE_SHORT}” mengembangkan sistem informasi berbasis web yang terdiri atas dua bagian. Bagian publik menyajikan indikator strategis lengkap dengan filter, grafik tren, rincian indikator, dan ekspor data tanpa perlu masuk akun. Bagian ruang kerja internal menyediakan alur pemutakhiran terkontrol: Operator menyusun usulan perubahan, kemudian Administrator meninjau, menolak, atau menyetujui dan memublikasikannya. Selama usulan belum disetujui, angka pada halaman publik tidak berubah.`
    ),
    p(
      "Sesuai Panduan Capstone Project STMIK Lombok, proyek ini tidak bertujuan menghasilkan kebaruan (*novelty*) penelitian, melainkan menunjukkan kemampuan menyelesaikan masalah nyata melalui siklus rekayasa sistem informasi yang lengkap: analisis, perancangan, implementasi, dan pengujian."
    ),

    h2("1.2 Tujuan"),
    p("Tujuan proyek ini adalah sebagai berikut."),
    ...numberedList([
      "Membangun *dashboard* indikator strategis yang dapat diakses publik tanpa login, dilengkapi filter, pencarian, grafik tren, rincian indikator, dan ekspor data ke Excel.",
      "Menyediakan ruang kerja bagi Operator untuk menyusun dan mengajukan usulan pemutakhiran nilai indikator.",
      "Menerapkan pembagian hak akses berbasis peran (*Role-Based Access Control*) untuk Publik, Operator, dan Administrator yang ditegakkan di sisi server.",
      "Menerapkan alur persetujuan Draft, Menunggu Review, dan Dipublikasikan, termasuk jalur penolakan dengan alasan tertulis.",
      "Menjamin bahwa halaman publik hanya menampilkan data yang telah disetujui dan dipublikasikan.",
      "Mencatat aktivitas penting dalam jejak audit (*audit trail*) untuk mendukung akuntabilitas.",
    ]),

    h2("1.3 Ruang Lingkup"),
    p("Ruang lingkup proyek dibatasi sebagai berikut."),
    ...bulletList([
      "Data yang dikelola adalah 58 indikator strategis BPS Kabupaten Lombok Tengah periode tahunan 2014–2025 yang bersumber dari rekap indikator strategis.",
      "Pengguna sistem terdiri atas tiga peran: Publik (tanpa login), Operator, dan Administrator.",
      "Fitur publik meliputi Beranda, Dashboard Indikator, Data Strategis, dan Publikasi.",
      "Fitur internal meliputi pemutakhiran data, pengajuan review, penolakan, persetujuan dan publikasi, inventaris indikator, serta riwayat audit.",
      "Autentikasi menggunakan akun lokal (nama pengguna dan kata sandi). Integrasi *Single Sign-On* BPS, WebAPI resmi BPS, dan *hosting* produksi berada di luar ruang lingkup proyek.",
      "Modul manajemen pengguna dan pengaturan sistem disiapkan sebagai menu, namun fungsinya belum dikembangkan.",
    ]),

    h2("1.4 Jadwal Kegiatan"),
    p(scheduleNote),
    ...table(
      "Jadwal kegiatan Capstone Project",
      ["No", "Kegiatan", "Minggu", "Luaran"],
      [
        ["1", "Perkenalan, pembentukan kelompok, dan penentuan topik", "1–2", "Topik dan pembagian peran"],
        ["2", "Analisis kebutuhan dan audit dataset indikator", "2–4", "Daftar kebutuhan dan baseline data"],
        ["3", "Penyusunan dan presentasi proposal", "5–6", "Proposal (Tugas 1)"],
        ["4", "Perancangan arsitektur, basis data, alur kerja, dan antarmuka", "5–7", "Diagram alir, ERD, rancangan UI"],
        ["5", "Implementasi dashboard publik", "7–8", "Halaman publik"],
        ["6", "Implementasi autentikasi, hak akses, dan alur persetujuan", "8–10", "Ruang kerja internal"],
        ["7", "Penyusunan dan presentasi laporan kemajuan", "10–11", "Laporan Kemajuan (Tugas 2)"],
        ["8", "Implementasi audit trail dan pengujian sistem", "11–13", "Hasil uji otomatis"],
        ["9", "Penyempurnaan antarmuka dan dokumentasi", "13–14", "Panduan penggunaan"],
        ["10", "Laporan akhir, video, poster, dan presentasi", "15–16", "Luaran Tugas 3"],
      ],
      [0.6, 5, 1.3, 3.4]
    ),
  ];
}

/* ================================================================ BAB II */

function bab2() {
  return [
    chapter("II", "TINJAUAN PUSTAKA"),
    h2("2.1 Sistem Informasi"),
    p(
      "Laudon dan Laudon (2020) mendefinisikan sistem informasi sebagai sekumpulan komponen yang saling berhubungan untuk mengumpulkan, memproses, menyimpan, dan mendistribusikan informasi guna mendukung pengambilan keputusan dan pengendalian dalam organisasi. Komponen tersebut mencakup manusia, prosedur, data, perangkat keras, dan perangkat lunak. Dalam proyek ini, sistem informasi berperan ganda: mendiseminasikan indikator strategis kepada publik sekaligus mengendalikan prosedur pemutakhiran data di internal organisasi."
    ),
    h2("2.2 Indikator Strategis dan Data Statistik Resmi"),
    p(
      "Indikator strategis adalah ukuran ringkas yang menggambarkan kondisi sosial dan ekonomi suatu wilayah, misalnya kependudukan, kemiskinan, ketenagakerjaan, pendidikan, kesehatan, dan pertumbuhan ekonomi. Berdasarkan Undang-Undang Nomor 16 Tahun 1997, statistik dasar diselenggarakan oleh BPS dan hasilnya wajib diumumkan kepada masyarakat. Prinsip Satu Data Indonesia (Peraturan Presiden Nomor 39 Tahun 2019) menambahkan tuntutan agar data memiliki standar, metadata, dan sumber yang jelas. Karena itu, sistem yang dikembangkan menampilkan sumber dan satuan setiap indikator serta tidak mengisi nilai kosong dengan angka nol atau estimasi."
    ),
    p(
      "Arah perubahan sebuah indikator perlu dibaca sesuai maknanya. Penurunan persentase penduduk miskin atau tingkat pengangguran merupakan perbaikan, sedangkan penurunan indeks pembangunan manusia merupakan kemunduran. Sistem ini menandai setiap perubahan sebagai membaik atau memburuk berdasarkan sifat indikator tersebut, bukan semata-mata berdasarkan naik atau turunnya angka."
    ),
    h2("2.3 Dashboard dan Visualisasi Data"),
    p(
      "Few (2006) menjelaskan *dashboard* sebagai tampilan visual atas informasi terpenting yang diperlukan untuk mencapai satu atau beberapa tujuan, disusun dalam satu layar agar dapat dipantau sekilas. Tufte (2001) menekankan bahwa grafik yang baik memaksimalkan porsi tinta yang benar-benar mewakili data dan menghindari elemen dekoratif yang tidak membawa informasi. Prinsip tersebut diterapkan melalui kartu indikator utama yang ringkas, grafik garis untuk tren antarperiode, grafik batang untuk perubahan tahunan, serta tabel sebagai alternatif bagi pengguna yang membutuhkan angka persis."
    ),
    h2("2.4 Role-Based Access Control"),
    p(
      "*Role-Based Access Control* (RBAC) adalah model pengendalian akses yang memberikan izin kepada peran, bukan langsung kepada individu; pengguna memperoleh izin melalui peran yang dimilikinya (Ferraiolo & Kuhn, 1992; Sandhu et al., 1996). Model ini memudahkan penerapan prinsip hak akses minimum dan pemisahan tugas. Pada sistem ini, Operator dapat menyusun dan mengajukan usulan tetapi tidak dapat menyetujuinya, sedangkan persetujuan dan publikasi hanya dapat dilakukan oleh Administrator. Pemeriksaan hak akses dilakukan di server untuk setiap permintaan, sehingga menyembunyikan menu di antarmuka bukan satu-satunya pengaman."
    ),
    h2("2.5 Alur Persetujuan dan Jejak Audit"),
    p(
      "Alur persetujuan (*approval workflow*) memisahkan data usulan dari data resmi sehingga perubahan baru berlaku setelah diperiksa oleh pihak yang berwenang. Pendekatan ini sejalan dengan prinsip pemisahan tugas pada RBAC. Kent dan Souppaya (2006) menyatakan bahwa catatan log yang lengkap dan terlindungi diperlukan untuk menelusuri aktivitas, menyelidiki insiden, dan memenuhi kewajiban akuntabilitas. Oleh karena itu, setiap login, pembuatan usulan, pengajuan, penolakan, dan publikasi dicatat bersama pelaku, waktu, nilai lama, dan nilai baru."
    ),
    h2("2.6 Arsitektur REST dan Keamanan Aplikasi Web"),
    p(
      "*Representational State Transfer* (REST) adalah gaya arsitektur untuk sistem terdistribusi yang memodelkan data sebagai sumber daya yang diakses melalui antarmuka seragam berbasis HTTP (Fielding, 2000). Sistem ini memisahkan aplikasi antarmuka berbasis React dari layanan API berbasis Express yang mengakses basis data melalui Prisma ORM. Sesi pengguna disimpan sebagai JSON Web Token (Jones et al., 2015) dalam *cookie* HttpOnly agar tidak dapat dibaca oleh skrip di peramban, sedangkan kata sandi disimpan dalam bentuk *hash* bcrypt. Langkah ini menjawab risiko kegagalan kontrol akses dan autentikasi yang termasuk dalam daftar OWASP Top 10 (OWASP Foundation, 2021)."
    ),
    h2("2.7 Model Pengembangan Iteratif"),
    p(
      "Sommerville (2016) menjelaskan bahwa pengembangan inkremental menghasilkan sistem melalui serangkaian versi, di mana setiap versi menambahkan fungsionalitas dan dievaluasi sebelum versi berikutnya dibuat. Pressman dan Maxim (2020) menekankan pentingnya pengujian di setiap tahap agar kesalahan ditemukan sedini mungkin. Model ini sesuai untuk Capstone Project yang memiliki tenggat per tugas, karena setiap tahap (proposal, kemajuan, dan laporan akhir) dapat menghasilkan bagian sistem yang sudah dapat diperiksa."
    ),
    h2("2.8 Sistem Sejenis dan Posisi Proyek"),
    p(
      "Sebagai pembanding, Tabel 2 merangkum karakteristik dua jenis sistem yang umum digunakan untuk menyajikan data statistik, yaitu portal diseminasi statistik dan perangkat *business intelligence* umum, dibandingkan dengan sistem yang dikembangkan dalam proyek ini."
    ),
    ...table(
      "Perbandingan sistem sejenis",
      ["Aspek", "Portal diseminasi statistik", "Perangkat BI umum", "Sistem yang dikembangkan"],
      [
        ["Fokus utama", "Publikasi tabel, berita resmi, dan dokumen", "Analisis data internal", "Indikator strategis daerah untuk publik"],
        ["Penelusuran tren", "Per tabel atau publikasi", "Fleksibel, perlu dirancang analis", "Grafik tren dan perubahan tahunan per indikator"],
        ["Pemutakhiran data", "Proses internal tidak terlihat publik", "Bergantung sumber data", "Alur Draft, Review, Publikasi dengan alasan penolakan"],
        ["Hak akses", "Publik baca", "Lisensi per pengguna", "Publik, Operator, Administrator"],
        ["Jejak audit", "Tidak terlihat publik", "Bervariasi", "Tercatat untuk setiap perubahan"],
      ],
      [2, 3, 3, 3.4]
    ),
  ];
}

/* =============================================================== BAB III */

function bab3(kind) {
  const isFinal = kind === "akhir";
  return [
    chapter("III", "METODOLOGI"),
    h2("3.1 Metode Penelitian"),
    p("Data dan informasi yang diperlukan dikumpulkan melalui tiga cara berikut."),
    ...numberedList([
      "Studi dokumen: menelaah rekap indikator strategis BPS Kabupaten Lombok Tengah untuk mengetahui jumlah indikator, kategori, satuan, periode, dan nilai yang kosong.",
      "Analisis proses: memetakan siapa yang membaca data, siapa yang memutakhirkan, dan siapa yang berwenang memublikasikan, sehingga diperoleh kebutuhan peran dan alur persetujuan.",
      "Studi pustaka: mempelajari konsep sistem informasi, visualisasi data, RBAC, jejak audit, dan keamanan aplikasi web sebagaimana diuraikan pada Bab II.",
    ]),
    p(
      "Pengembangan sistem menggunakan model iteratif-inkremental (Sommerville, 2016). Setiap iterasi terdiri atas analisis, perancangan, implementasi, dan pengujian, lalu hasilnya dievaluasi sebelum iterasi berikutnya. Iterasi pertama menghasilkan dashboard publik, iterasi kedua menghasilkan autentikasi dan ruang kerja, dan iterasi ketiga menghasilkan alur persetujuan, jejak audit, serta penyempurnaan antarmuka."
    ),

    h2("3.2 Proses Analisis"),
    p("Analisis kebutuhan menghasilkan tiga aktor dengan kebutuhan yang berbeda, seperti pada Tabel 3."),
    ...table(
      "Kebutuhan per aktor",
      ["Aktor", "Kebutuhan utama"],
      [
        ["Publik", "Melihat indikator yang telah dipublikasikan, menyaring, melihat tren dan rincian, serta mengunduh data"],
        ["Operator", "Menyusun usulan nilai baru, mengajukan untuk ditinjau, memantau status pengajuan sendiri"],
        ["Administrator", "Meninjau usulan, menolak dengan alasan, menyetujui dan memublikasikan, melihat riwayat audit"],
      ],
      [2, 7]
    ),
    p("Dari kebutuhan tersebut dirumuskan kebutuhan fungsional dan nonfungsional pada Tabel 4."),
    ...table(
      "Kebutuhan fungsional dan nonfungsional",
      ["Kode", "Kebutuhan", "Jenis"],
      [
        ["F-01", "Publik dapat menyaring indikator berdasarkan kategori, periode, dan kata kunci", "Fungsional"],
        ["F-02", "Publik dapat melihat grafik tren, perubahan tahunan, dan rincian indikator", "Fungsional"],
        ["F-03", "Publik dapat mengunduh data sesuai filter dalam format Excel", "Fungsional"],
        ["F-04", "Operator dan Administrator dapat login dan logout", "Fungsional"],
        ["F-05", "Operator dapat menyimpan usulan sebagai Draft dan mengajukannya untuk review", "Fungsional"],
        ["F-06", "Administrator dapat menolak usulan dengan alasan wajib", "Fungsional"],
        ["F-07", "Administrator dapat menyetujui dan memublikasikan usulan", "Fungsional"],
        ["F-08", "Administrator dapat melihat riwayat audit", "Fungsional"],
        ["NF-01", "Halaman publik hanya menampilkan data berstatus dipublikasikan", "Nonfungsional"],
        ["NF-02", "Hak akses diperiksa di server untuk setiap permintaan", "Nonfungsional"],
        ["NF-03", "Nilai kosong tidak diubah menjadi nol atau estimasi", "Nonfungsional"],
        ["NF-04", "Antarmuka dapat digunakan pada layar 360 hingga 1440 piksel", "Nonfungsional"],
      ],
      [1.2, 6.5, 2]
    ),

    h2("3.3 Proses Perancangan"),
    h3("3.3.1 Arsitektur dan Alur Sistem"),
    p(
      "Sistem dibangun dengan arsitektur tiga lapis: antarmuka web (React dan Vite), layanan API (Express), dan basis data yang diakses melalui Prisma ORM. Gambar 1 menunjukkan alur sistem dari area publik, autentikasi, ruang kerja internal, hingga publikasi data."
    ),
    ...figure(FIGURE("flowchart-sistem.png"), "Diagram alir sistem", DIAGRAM),
    h3("3.3.2 Perancangan Basis Data"),
    p(
      "Gambar 2 menunjukkan relasi antarentitas. Nilai resmi yang tampil di halaman publik disimpan pada entitas Observation, sedangkan usulan perubahan disimpan terpisah pada entitas DataChange. Pemisahan ini menjadi dasar teknis bahwa usulan yang belum disetujui tidak dapat mengubah tampilan publik."
    ),
    ...figure(FIGURE("erd-sistem.png"), "Entity Relationship Diagram", DIAGRAM),
    h3("3.3.3 Alur Persetujuan Data"),
    p("Setiap usulan perubahan melewati status berikut.", { keepNext: true }),
    ...flowRow(["DRAFT", "MENUNGGU REVIEW", "DIPUBLIKASIKAN"]),
    p("Apabila ditolak, Operator memperbaiki usulan lalu mengajukannya kembali.", { keepNext: true }),
    ...flowRow(["MENUNGGU REVIEW", "DITOLAK", "DIPERBAIKI", "DIAJUKAN ULANG"]),
    h3("3.3.4 Perancangan Antarmuka"),
    p(
      "Antarmuka dirancang mengikuti prinsip visualisasi data pada Bab II. Halaman publik menggunakan tipografi sans-serif yang mudah dibaca, angka besar untuk nilai terbaru, serta warna perubahan yang berarti membaik atau memburuk. Pasangan warna grafik dipilih dan diuji agar tetap dapat dibedakan oleh penyandang buta warna. Ruang kerja internal menggunakan tata letak aplikasi dengan menu samping dan menampilkan status setiap usulan secara eksplisit."
    ),

    h2("3.4 Implementasi"),
    ...table(
      "Teknologi yang digunakan",
      ["Lapisan", "Teknologi"],
      [
        ["Antarmuka", "React 19, TypeScript, Vite, React Router, Recharts, SheetJS"],
        ["Layanan API", "Node.js, Express 5, TypeScript, Zod (validasi masukan)"],
        ["Basis data", "Prisma ORM; SQLite untuk pengembangan, PostgreSQL untuk produksi"],
        ["Keamanan", "bcrypt untuk kata sandi, JSON Web Token dalam cookie HttpOnly (8 jam)"],
        ["Pengujian", "Skrip uji API otomatis, Playwright untuk uji peramban, pemeriksa integritas data"],
      ],
      [2, 7]
    ),
    ...(isFinal ? implementationDetail() : implementationProgress()),

    h2("3.5 Pengujian dan Evaluasi"),
    p("Pengujian dilakukan pada lima jenis berikut."),
    ...numberedList([
      "Uji integritas data: memastikan 58 indikator, 51 sosial, 7 ekonomi, dan nilai kunci sesuai baseline.",
      "Uji API otomatis: menguji login, hak akses tiap peran, alur Draft hingga publikasi, penolakan, dan isolasi data publik.",
      "Uji peramban menyeluruh (*end-to-end*): menjalankan skenario pengguna pada peramban, termasuk tampilan responsif dan pemeriksaan galat konsol.",
      "Pemeriksaan tipe (*typecheck*) TypeScript untuk antarmuka dan API.",
      "Uji *build* produksi untuk antarmuka dan API.",
    ]),
    ...(isFinal
      ? [p("Hasil pengujian disajikan pada Bab IV.")]
      : [
          p(`Hasil pengujian yang dijalankan pada ${TEST_RESULTS.ranOn} dirangkum pada Tabel 7.`),
          ...testSummaryTable(),
          p(
            "Hasil ini menunjukkan bahwa fungsi inti sudah berjalan sesuai kebutuhan pada lingkungan pengembangan. Sisa pekerjaan hingga Laporan Akhir adalah penyempurnaan antarmuka, dokumentasi, serta penyusunan luaran video, poster, dan presentasi."
          ),
        ]),
  ];
}

function implementationProgress() {
  return [
    p("Kemajuan implementasi hingga laporan ini disusun ditunjukkan pada Tabel 6."),
    ...table(
      "Kemajuan implementasi",
      ["Komponen", "Status"],
      [
        ["Dashboard publik (filter, grafik, rincian, ekspor Excel)", "Selesai"],
        ["Autentikasi dan sesi pengguna", "Selesai"],
        ["Hak akses Operator dan Administrator di server", "Selesai"],
        ["Alur Draft, review, penolakan, dan publikasi", "Selesai"],
        ["Isolasi data publik hingga usulan dipublikasikan", "Selesai"],
        ["Jejak audit", "Selesai"],
        ["Penyempurnaan antarmuka dan dokumentasi pengguna", "Berjalan"],
        ["Modul manajemen pengguna dan pengaturan", "Di luar ruang lingkup"],
        ["Integrasi SSO, WebAPI, dan hosting BPS", "Di luar ruang lingkup"],
      ],
      [7, 2.5]
    ),
  ];
}

function implementationDetail() {
  return [
    h3("3.4.1 Halaman Publik"),
    p(
      "Halaman publik terdiri atas Beranda, Dashboard Indikator, Data Strategis, dan Publikasi. Dashboard menampilkan enam indikator utama, panel analisis tren dengan pilihan rentang 5 tahun, 10 tahun, atau seluruh periode, grafik perubahan antarperiode, ringkasan kategori, tabel eksplorasi indikator, panel rincian, serta tombol unduh Excel sesuai filter yang dipilih."
    ),
    h3("3.4.2 Ruang Kerja Operator"),
    p(
      "Setelah login, Operator mengakses menu Ringkasan, Pemutakhiran Data, Indikator, dan Pengajuan Saya. Formulir pemutakhiran menampilkan nilai resmi saat ini di samping isian nilai usulan, sumber data, dan catatan. Operator dapat menyimpan Draft atau mengajukannya untuk review, tetapi tidak dapat menyetujui atau memublikasikan; permintaan semacam itu ditolak server dengan kode HTTP 403."
    ),
    h3("3.4.3 Ruang Kerja Administrator"),
    p(
      "Administrator memiliki seluruh kemampuan Operator ditambah menu Review/Persetujuan dan Riwayat. Pada halaman review, Administrator membandingkan nilai saat ini dengan nilai usulan, kemudian menolak dengan alasan tertulis atau memilih Setujui & Publish. Persetujuan memindahkan nilai usulan ke data resmi dalam satu langkah dan mencatatnya pada jejak audit."
    ),
  ];
}

function testSummaryTable() {
  return table(
    "Ringkasan hasil pengujian",
    ["Jenis pengujian", "Perintah", "Hasil"],
    [
      ["Integritas data", "npm run test:data", "Lulus"],
      ["API otomatis", "npm run test", `${api.passed} dari ${api.total} lulus`],
      ["Peramban end-to-end", "npm run test:browser", `${browser.passed} dari ${browser.total} lulus`],
      ["Pemeriksaan tipe", "npm run typecheck dan typecheck:api", "Lulus"],
      ["Build produksi", "npm run build dan build:api", "Lulus"],
    ],
    [3, 4, 2.5]
  );
}

/* ================================================================ BAB IV */

function bab4() {
  const screens = [
    ["01-beranda.png", "Halaman Beranda", "Beranda memperkenalkan layanan dan menampilkan sorotan data, yaitu penurunan persentase penduduk miskin dari 16,26% pada 2015 menjadi 10,68% pada 2025."],
    ["02-dashboard.png", "Dashboard Indikator Strategis", "Dashboard menyajikan filter kategori, periode, dan pencarian di bagian atas, diikuti enam indikator utama dengan nilai terbaru, perubahan dibanding periode sebelumnya, dan grafik ringkas."],
    ["02c-chart.png", "Panel analisis tren", "Panel analisis tren menampilkan nilai terbaru, nilai tertinggi dan terendah, rata-rata perubahan per periode, grafik garis, serta grafik batang perubahan antarperiode yang diwarnai membaik atau memburuk.", { pixelWidth: 1200, pixelHeight: 836 }],
    ["03-detail-drawer.png", "Panel rincian indikator", "Panel rincian menampilkan nilai terbaru, grafik ringkas, definisi, satuan, sumber, dan seluruh nilai historis tanpa meninggalkan halaman dashboard."],
    ["04-login.png", "Halaman login ruang kerja", "Petugas masuk menggunakan akun lokal sebelum mengakses ruang kerja internal."],
    ["05-workspace-operator.png", "Ringkasan ruang kerja Operator", "Ringkasan menampilkan jumlah usulan per status dan pemberitahuan apabila ada usulan yang ditolak."],
    ["06-pemutakhiran.png", "Formulir pemutakhiran data", "Formulir menampilkan nilai resmi saat ini di samping isian nilai usulan, sumber data, dan catatan pemutakhiran."],
    ["07-pengajuan.png", "Daftar Pengajuan Saya", "Operator memantau status setiap usulan beserta perbandingan nilai saat ini dan nilai usulan."],
    ["09-review.png", "Pusat Review Administrator", "Administrator membandingkan nilai saat ini dan nilai usulan, membaca sumber dan catatan, lalu menolak dengan alasan atau menyetujui dan memublikasikan."],
    ["10-riwayat.png", "Riwayat audit", "Riwayat audit mencatat waktu, aksi, indikator, pelaku, nilai lama, nilai baru, dan status setiap aktivitas."],
  ];

  return [
    chapter("IV", "HASIL DAN PEMBAHASAN"),
    h2("4.1 Hasil Implementasi dan Pengujian"),
    h3("4.1.1 Hasil Implementasi Antarmuka"),
    p("Gambar 3 sampai Gambar 12 menunjukkan antarmuka sistem yang telah diimplementasikan."),
    ...screens.flatMap(([file, title, text, size]) => [
      ...figure(ASSET(file), title, size ?? SCREEN),
      p(text),
    ]),
    h3("4.1.2 Isolasi Data Publik"),
    p(
      "Perilaku terpenting sistem adalah bahwa usulan yang belum disetujui tidak mengubah tampilan publik. Sebagai contoh, nilai resmi Jumlah Penduduk 2020 adalah 1.029,03 ribu jiwa. Ketika Operator mengajukan usulan 1.030,20, halaman publik tetap menampilkan 1.029,03 selama usulan berstatus Draft, Menunggu Review, atau Ditolak. Nilai baru baru tampil setelah Administrator memilih Setujui & Publish."
    ),
    ...flowRow(["SEBELUM PUBLIKASI\nPublik melihat nilai lama", "SETELAH PUBLIKASI\nPublik melihat nilai baru"]),
    h3("4.1.3 Hasil Pengujian"),
    p(`Seluruh rangkaian pengujian dijalankan ulang pada ${TEST_RESULTS.ranOn} dengan hasil pada Tabel 6.`),
    ...testSummaryTable(),
    p("Tabel 7 memuat skenario uji utama beserta hasil yang diharapkan dan hasil aktual."),
    ...table(
      "Skenario uji utama",
      ["ID", "Skenario", "Hasil yang diharapkan", "Status"],
      [
        ["TC-01", "Publik membuka dashboard tanpa login", "Data dipublikasikan tampil", "Lulus"],
        ["TC-02", "Menyaring dan mencari indikator", "Hasil tersaring sesuai kriteria", "Lulus"],
        ["TC-03", "Mengunduh data Excel", "Berkas .xlsx terunduh sesuai filter", "Lulus"],
        ["TC-04", "Login Operator dan Administrator", "Masuk ke ruang kerja sesuai peran", "Lulus"],
        ["TC-05", "Login dengan kata sandi salah", "Ditolak dengan pesan umum", "Lulus"],
        ["TC-06", "Operator menyimpan Draft", "Status Draft, publik tidak berubah", "Lulus"],
        ["TC-07", "Operator mengajukan review", "Status Menunggu Review, formulir terkunci", "Lulus"],
        ["TC-08", "Administrator menolak tanpa alasan", "Ditolak oleh validasi", "Lulus"],
        ["TC-09", "Administrator menolak dengan alasan", "Status Ditolak, alasan tampil ke Operator", "Lulus"],
        ["TC-10", "Operator memperbaiki dan mengajukan ulang", "Kembali ke Menunggu Review", "Lulus"],
        ["TC-11", "Administrator menyetujui dan memublikasikan", "Nilai resmi diperbarui dan tampil publik", "Lulus"],
        ["TC-12", "Operator membuka halaman review", "Akses ditolak", "Lulus"],
        ["TC-13", "Operator memanggil API persetujuan", "HTTP 403", "Lulus"],
        ["TC-14", "Administrator membuka riwayat", "Aktivitas tercatat lengkap", "Lulus"],
        ["TC-15", "Integritas data 58/51/7 dan nilai kunci", "Sesuai baseline", "Lulus"],
        ["TC-16", "Tampilan pada lebar 360–1440 piksel", "Tidak ada guliran horizontal", "Lulus"],
        ["TC-17", "Logout", "Sesi berakhir, perlu login kembali", "Lulus"],
      ],
      [1.1, 4.2, 4, 1.2]
    ),

    h2("4.2 Pembahasan"),
    h3("4.2.1 Analisis Hasil"),
    p(
      "Pemisahan data usulan (DataChange) dari data resmi (Observation) terbukti menjaga isolasi data publik pada seluruh skenario uji. Pemeriksaan hak akses di server menjadi batas keamanan utama: walaupun Operator memanggil API persetujuan secara langsung, server tetap menolak permintaan tersebut. Dari sisi pengguna publik, panel analisis tren dan penandaan membaik atau memburuk membantu membaca arti perubahan tanpa harus memahami sifat setiap indikator."
    ),
    p(
      "Selama pengembangan ditemukan tujuh nilai pada data sumber yang format tampilannya tidak sesuai dengan angka sebenarnya, misalnya “912.879” untuk nilai 912,879 ribu jiwa, yang dalam notasi Indonesia terbaca seribu kali lebih besar. Sistem kini hanya memakai format tampilan dari sumber apabila cocok dengan angka yang tersimpan. Temuan ini menunjukkan pentingnya pemeriksaan kualitas data sebelum publikasi."
    ),
    h3("4.2.2 Keputusan Rancangan dan Kendala"),
    p("Beberapa keputusan rancangan diambil dengan mempertimbangkan kendala proyek."),
    ...numberedList([
      "Autentikasi lokal dipilih karena spesifikasi SSO BPS belum tersedia. Akun pengembangan harus diganti atau dinonaktifkan saat integrasi.",
      "SQLite dipakai pada pengembangan agar mudah dipasang; lingkungan produksi disarankan menggunakan PostgreSQL atau basis data resmi BPS.",
      "Akses data dibuat melalui lapisan penyedia (*provider*) sehingga sumber data lokal dapat diganti dengan WebAPI BPS tanpa mengubah antarmuka.",
      "Data awal diambil dari berkas baseline yang dapat diaudit, sedangkan perubahan setelahnya hanya melalui basis data dan alur persetujuan.",
      "Menu Pengguna dan Pengaturan ditampilkan agar struktur navigasi siap, namun fungsinya belum dikembangkan dan dinyatakan sebagai pekerjaan lanjutan.",
    ]),
    h3("4.2.3 Kontribusi Anggota"),
    p("Pembagian peran dan kontribusi setiap anggota kelompok ditunjukkan pada Tabel 8."),
    ...table(
      "Kontribusi anggota",
      ["Nama", "NIM", "Peran", "Kontribusi"],
      memberList().map((m, i) => [m.name, m.nim, `[Peran Anggota ${i + 1}]`, `[Uraian kontribusi Anggota ${i + 1}]`]),
      [2.6, 1.8, 1.8, 3.6]
    ),
    h3("4.2.4 Implikasi"),
    ...bulletList([
      "Bagi masyarakat: indikator strategis dapat ditelusuri dan diunduh secara mandiri tanpa harus membaca rekap tabel.",
      "Bagi Operator: pemutakhiran data memiliki prosedur yang jelas dan status yang dapat dipantau.",
      "Bagi Administrator: setiap angka yang dipublikasikan telah diperiksa dan jejaknya dapat ditelusuri.",
      "Bagi BPS Kabupaten Lombok Tengah: sistem dapat menjadi dasar integrasi dengan SSO, WebAPI, dan infrastruktur resmi BPS.",
    ]),
    p("Implikasi tersebut bersifat potensial karena pengukuran dampak pada organisasi belum termasuk dalam ruang lingkup proyek."),
  ];
}

/* ================================================================= BAB V */

function bab5() {
  return [
    chapter("V", "KESIMPULAN DAN REKOMENDASI"),
    h2("5.1 Kesimpulan"),
    p("Berdasarkan hasil implementasi dan pengujian, dapat disimpulkan sebagai berikut."),
    ...numberedList([
      "Dashboard Indikator Strategis BPS Kabupaten Lombok Tengah berhasil dibangun sebagai aplikasi web yang menyajikan 58 indikator strategis kepada publik tanpa login, lengkap dengan filter, grafik tren, rincian, dan ekspor Excel.",
      "Pembagian hak akses Publik, Operator, dan Administrator telah diterapkan dan ditegakkan di sisi server.",
      "Alur persetujuan Draft, Menunggu Review, Ditolak, dan Dipublikasikan berfungsi dan menjamin bahwa publik hanya melihat data yang telah disetujui.",
      "Seluruh aktivitas penting tercatat pada jejak audit yang dapat ditelusuri Administrator.",
      `Pengujian menunjukkan seluruh skenario lulus, yaitu ${api.passed} dari ${api.total} uji API dan ${browser.passed} dari ${browser.total} uji peramban, serta uji integritas data, pemeriksaan tipe, dan build produksi.`,
    ]),
    h2("5.2 Rekomendasi"),
    p("Untuk pengembangan dan penerapan selanjutnya, direkomendasikan hal-hal berikut."),
    ...numberedList([
      "Mengintegrasikan autentikasi dengan SSO BPS sesuai spesifikasi resmi.",
      "Mengganti sumber data lokal dengan WebAPI BPS apabila telah tersedia.",
      "Menggunakan PostgreSQL atau basis data resmi BPS pada lingkungan produksi, disertai HTTPS, pencadangan, dan pemantauan.",
      "Mengembangkan modul manajemen pengguna dan pengaturan sistem.",
      "Menambahkan notifikasi pengajuan dan hasil review untuk mempercepat siklus pemutakhiran.",
      "Menambahkan pemeriksaan otomatis format data sumber agar ketidaksesuaian seperti pada subbab 4.2.1 terdeteksi sebelum data diimpor.",
    ]),
  ];
}

/* ===================================================== kosong per panduan */

function emptyChapter(number, title, presentedIn) {
  return [chapter(number, title), centered(`(Bab ini disajikan pada ${presentedIn}.)`, { italics: true })];
}

/* ========================================================= DAFTAR PUSTAKA */

function bibliography() {
  const refs = [
    "Badan Pusat Statistik Kabupaten Lombok Tengah. (2025). *Rekap indikator strategis Kabupaten Lombok Tengah 2014–2025* [Data set]. BPS Kabupaten Lombok Tengah.",
    "Ferraiolo, D. F., & Kuhn, D. R. (1992). Role-based access controls. Dalam *Proceedings of the 15th National Computer Security Conference* (hlm. 554–563). NIST/NCSC.",
    "Few, S. (2006). *Information dashboard design: The effective visual communication of data*. O’Reilly Media.",
    "Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Disertasi doktoral]. University of California, Irvine.",
    "Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)* (RFC 7519). Internet Engineering Task Force. https://doi.org/10.17487/RFC7519",
    "Kent, K., & Souppaya, M. (2006). *Guide to computer security log management* (NIST Special Publication 800-92). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-92",
    "Laudon, K. C., & Laudon, J. P. (2020). *Management information systems: Managing the digital firm* (Edisi ke-16). Pearson.",
    "OWASP Foundation. (2021). *OWASP Top 10:2021*. https://owasp.org/Top10/",
    "Pressman, R. S., & Maxim, B. R. (2020). *Software engineering: A practitioner’s approach* (Edisi ke-9). McGraw-Hill Education.",
    "Republik Indonesia. (1997). *Undang-Undang Nomor 16 Tahun 1997 tentang Statistik*.",
    "Republik Indonesia. (2019). *Peraturan Presiden Nomor 39 Tahun 2019 tentang Satu Data Indonesia*.",
    "Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. https://doi.org/10.1109/2.485845",
    "Sommerville, I. (2016). *Software engineering* (Edisi ke-10). Pearson.",
    "STMIK Lombok. (2026). *Panduan Capstone Project untuk mahasiswa* (Edisi I). Program Studi Teknik Informatika STMIK Lombok.",
    "Tufte, E. R. (2001). *The visual display of quantitative information* (Edisi ke-2). Graphics Press.",
  ];
  return [
    chapter(null, "DAFTAR PUSTAKA"),
    ...refs.map((ref) =>
      p(ref, { indent: "hanging", align: "left", line: 264, after: 120 })
    ),
  ];
}

/* ============================================================== LAMPIRAN */

function suratPernyataan(kind) {
  const members = memberList();
  const sig = (m, i) => (m ? `Anggota ${i + 1}\n\n\n${m.name}\n${m.nim}` : "");
  return [
    h2("Lampiran A. Surat Pernyataan"),
    centered("SURAT PERNYATAAN", { bold: true, after: 200 }),
    plain("Kami yang bertanda tangan di bawah ini:"),
    ...members.map((m) => plain(`Nama : ${m.name}     NIM : ${m.nim}`, { after: 0, indent: false })),
    p(
      `Dengan ini menyatakan bahwa produk yang kami buat dan ajukan dalam Capstone Project dengan judul “${TITLE_SHORT}” adalah hasil orisinal yang dibuat oleh tim kami. Produk ini bukan merupakan plagiat dan tidak melanggar hak cipta pihak mana pun. Semua ide, desain, dan implementasi yang terdapat dalam produk ini sepenuhnya merupakan karya asli kami.`,
      { line: 300, before: 160 }
    ),
    p(
      "Demikian surat pernyataan ini kami buat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.",
      { line: 300, after: 200 }
    ),
    plain(`${place()}, ${signDate(kind)}`, { after: 0 }),
    plain("Hormat kami,", { after: 120 }),
    signatureGrid([
      [sig(members[0], 0), sig(members[1], 1), sig(members[2], 2)],
      [`\n${sig(members[3], 3)}`, `\n${sig(members[4], 4)}`, ""],
    ]),
  ];
}

function beritaAcara() {
  const members = memberList();
  const numbered = (n) => Array.from({ length: n }, (_, i) => `${i + 1}.`).join("\n");
  return [
    h2("Lampiran B. Berita Acara Kerja Kelompok", { newPage: true }),
    formTable(
      [
        [{ text: "Berita Acara Kerja Kelompok Capstone Project", span: 2, bold: true, align: "center" }],
        ["Judul", `: ${TITLE_SHORT}`],
        ["Hari dan Tanggal", ":"],
        ["Waktu", ":"],
        ["Lokasi Luring/Daring", ":"],
      ],
      [1, 3]
    ),
    spacer(160),
    formTable(
      [
        [
          { text: "Nama Anggota", bold: true, align: "center" },
          { text: "Anggota yang Hadir", bold: true, align: "center" },
          { text: "Anggota yang Tidak Hadir", bold: true, align: "center", span: 2 },
        ],
        [members.map((m, i) => `${i + 1}. ${m.name}`).join("\n"), numbered(5), { text: numbered(5), span: 2 }],
        [
          { text: "Aktivitas", bold: true, align: "center" },
          { text: "Luaran", bold: true, align: "center" },
          { text: "Nama Penanggung Jawab", bold: true, align: "center" },
          { text: "Catatan/Kendala yang Dihadapi", bold: true, align: "center" },
        ],
        ["1.", "", "", ""],
        ["2.", "", "", ""],
        ["3.", "", "", ""],
      ],
      [3.4, 2.2, 2, 2.4]
    ),
    spacer(160),
    formTable(
      [
        [{ text: "Tanda Tangan Anggota yang Hadir", span: 5, bold: true, align: "center" }],
        members.map((m) => ({ text: `\n\n\n\n${m.name}\n${m.nim}`, align: "center", valign: "bottom" })),
        [{ text: "Dokumentasi", span: 5, bold: true, align: "center" }],
        [{ text: "", span: 5 }],
      ],
      [1, 1, 1, 1, 1],
      { rowHeight: { 3: 1800 } }
    ),
  ];
}

function endpointTable() {
  return table(
    "Daftar endpoint API",
    ["Metode", "Endpoint", "Akses", "Fungsi"],
    [
      ["POST", "/api/auth/login", "Publik", "Login dan membuat sesi"],
      ["POST", "/api/auth/logout", "Login", "Mengakhiri sesi"],
      ["GET", "/api/auth/me", "Login", "Data pengguna aktif"],
      ["GET", "/api/indicators", "Publik", "Daftar indikator dan nilai dipublikasikan"],
      ["GET", "/api/indicators/:id", "Publik", "Rincian satu indikator"],
      ["GET", "/api/submissions", "Login", "Daftar usulan (Operator: milik sendiri)"],
      ["POST", "/api/submissions/drafts", "Operator, Admin", "Membuat atau memperbarui Draft"],
      ["POST", "/api/submissions/:id/submit", "Operator, Admin", "Mengajukan Draft untuk review"],
      ["POST", "/api/submissions/:id/reject", "Admin", "Menolak usulan dengan alasan"],
      ["POST", "/api/submissions/:id/approve", "Admin", "Menyetujui dan memublikasikan usulan"],
      ["DELETE", "/api/submissions/:id", "Operator, Admin", "Menghapus Draft"],
      ["GET", "/api/audit-logs", "Admin", "Riwayat audit"],
    ],
    [1.2, 3.6, 2, 3.6]
  );
}

function lampiran(kind) {
  const parts = [chapter("VI", "LAMPIRAN"), ...suratPernyataan(kind), ...beritaAcara()];

  if (kind === "kemajuan") {
    parts.push(h2("Lampiran C. Daftar Endpoint API", { newPage: true }), ...endpointTable());
  }

  if (kind === "akhir") {
    parts.push(
      h2("Lampiran C. Tautan Luaran Capstone Project", { newPage: true }),
      ...table(
        "Tautan luaran Capstone Project",
        ["Luaran", "Tautan / Keterangan"],
        [
          ["Repository kode program", link("repository", "Repository")],
          ["Video demonstrasi (YouTube, 4–7 menit)", link("video", "Video")],
          ["Presentasi PowerPoint", link("presentation", "Presentasi")],
          ["Poster A4", link("poster", "Poster")],
          ["Surat keterangan penggunaan aplikasi", link("usageLetter", "Surat Keterangan")],
        ],
        [4, 6]
      ),
      h2("Lampiran D. Daftar Endpoint API", { newPage: true }),
      ...endpointTable(),
      h2("Lampiran E. Struktur Kode Program", { newPage: true }),
      ...table(
        "Struktur direktori utama kode program",
        ["Direktori", "Isi"],
        [
          ["src/pages", "Halaman publik (Beranda, Dashboard, Data Strategis, Publikasi, Login) dan ruang kerja"],
          ["src/components", "Komponen antarmuka: kartu indikator, panel tren, tabel eksplorasi, panel rincian"],
          ["src/auth", "Konteks sesi, daftar peran, dan pengaman rute berbasis peran"],
          ["src/data", "Baseline data indikator dan penyedia data (API atau lokal)"],
          ["src/utils", "Format angka Indonesia, perhitungan tren, dan statistik deret waktu"],
          ["server/src/routes", "Endpoint API: autentikasi, indikator, usulan, dan audit"],
          ["server/src/middleware", "Pemeriksaan sesi dan hak akses per peran"],
          ["server/prisma", "Skema basis data dan skrip pengisian data awal"],
          ["scripts", "Uji API, uji peramban, uji integritas data, dan pembangkit dokumen"],
        ],
        [2.6, 7]
      )
    );
  }
  return parts;
}

/* ================================================================ build */

function body(kind) {
  if (kind === "proposal") {
    return [
      ...bab1(kind),
      ...bab2(),
      ...emptyChapter("III", "METODOLOGI", "Laporan Kemajuan dan Laporan Akhir"),
      ...emptyChapter("IV", "HASIL DAN PEMBAHASAN", "Laporan Akhir"),
      ...emptyChapter("V", "KESIMPULAN DAN REKOMENDASI", "Laporan Akhir"),
      ...bibliography(),
      ...lampiran(kind),
    ];
  }
  if (kind === "kemajuan") {
    return [
      ...bab1(kind),
      ...bab2(),
      ...bab3(kind),
      ...emptyChapter("IV", "HASIL DAN PEMBAHASAN", "Laporan Akhir"),
      ...emptyChapter("V", "KESIMPULAN DAN REKOMENDASI", "Laporan Akhir"),
      ...bibliography(),
      ...lampiran(kind),
    ];
  }
  return [...bab1(kind), ...bab2(), ...bab3(kind), ...bab4(), ...bab5(), ...bibliography(), ...lampiran(kind)];
}

function buildDocument(kind) {
  const meta = DOCS[kind];
  const hasFigures = kind !== "proposal";
  const margin = pageMargins();

  return new Document({
    creator: "Capstone Project Teknik Informatika STMIK Lombok",
    title: `${meta.type}: ${TITLE_SHORT}`,
    description: `${meta.type} (${meta.task}) sesuai Panduan Capstone Project STMIK Lombok ${YEAR}`,
    styles: documentStyles,
    numbering: numberingConfig,
    sections: [
      {
        properties: { page: { margin } },
        headers: { default: emptyHeader() },
        footers: { default: emptyFooter() },
        children: cover(meta.type),
      },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { margin, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } },
        },
        headers: { default: emptyHeader() },
        footers: { default: pageNumberFooter() },
        children: frontMatter(kind, { tables: true, figures: hasFigures }),
      },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { margin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
        },
        headers: { default: emptyHeader() },
        footers: { default: pageNumberFooter() },
        children: body(kind),
      },
    ],
  });
}

/** Mengisi Daftar Isi/Tabel/Gambar lewat Word; dilewati bila Word tidak tersedia. */
function updateFieldsWithWord(paths) {
  if (process.platform !== "win32") return false;
  try {
    execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", resolve("scripts/update-docx-fields.ps1"), ...paths],
      { stdio: "inherit" }
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const arg = (process.argv[2] || "all").toLowerCase();
  const kinds = arg === "all" ? Object.keys(DOCS) : [arg];
  if (!kinds.every((k) => k in DOCS)) {
    throw new Error(`Jenis dokumen tidak dikenal: ${arg}. Gunakan proposal, kemajuan, akhir, atau all.`);
  }

  const written = [];
  for (const kind of kinds) {
    const outDir = process.env.CAPSTONE_OUT_DIR;
    const out = outDir ? resolve(outDir, basename(DOCS[kind].file)) : resolve(DOCS[kind].file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, await Packer.toBuffer(buildDocument(kind)));
    written.push(out);
    console.log(`Ditulis: ${DOCS[kind].type} → ${out}`);
  }

  if (!updateFieldsWithWord(written)) {
    console.log("Word tidak tersedia: buka dokumen di Word, tekan Ctrl+A lalu F9 untuk mengisi Daftar Isi, kemudian simpan sebagai PDF.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
