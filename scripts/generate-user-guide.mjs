/**
 * Generate Modul Panduan Penggunaan (.docx) for BPS Lombok Tengah.
 * Based on actual application behavior — not invented features.
 *
 * Usage: node scripts/generate-user-guide.mjs
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(
  "docs/MODUL_PANDUAN_PENGGUNAAN_BPS_LOMBOK_TENGAH.docx"
);
const ASSETS = resolve("docs/guide-assets");
const HERO = resolve("public/landing/hero-lombok.png");
const APP_VERSION = "1.0.0";
const DOC_DATE = "20 September 2026";

const GREEN = "0A5638";
const INK = "14201A";
const MUTED = "5A6B62";
const LINE = "C9D5CD";
const SOFT = "E2F0E8";
const WARN_BG = "FFF6E0";
const DANGER_BG = "FDE8E6";

const thin = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: LINE,
};
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
};
const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
};

function p(text, opts = {}) {
  const {
    bold = false,
    size = 22,
    color = INK,
    align = AlignmentType.LEFT,
    spaceAfter = 120,
    spaceBefore = 0,
    italics = false,
  } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, before: spaceBefore, line: 276 },
    children: [
      new TextRun({
        text,
        bold,
        italics,
        size,
        color,
        font: "Calibri",
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32,
        color: GREEN,
        font: "Calibri",
      }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26,
        color: GREEN,
        font: "Calibri",
      }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        color: INK,
        font: "Calibri",
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, size: 22, color: INK, font: "Calibri" })],
  });
}

function step(n, text) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    children: [
      new TextRun({
        text: `${n}. `,
        bold: true,
        size: 22,
        color: GREEN,
        font: "Calibri",
      }),
      new TextRun({ text, size: 22, color: INK, font: "Calibri" }),
    ],
  });
}

function callout(title, body, tone = "info") {
  const bg = tone === "warn" ? WARN_BG : tone === "danger" ? DANGER_BG : SOFT;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: bg },
            margins: {
              top: 80,
              bottom: 80,
              left: 120,
              right: 120,
            },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 20,
                    color: GREEN,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: body,
                    size: 20,
                    color: INK,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function cell(text, opts = {}) {
  const {
    bold = false,
    fill = "FFFFFF",
    width = 2500,
    align = AlignmentType.LEFT,
  } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold,
            size: 18,
            color: INK,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

function simpleTable(headers, rows) {
  const colW = Math.floor(9360 / headers.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h) =>
          cell(h, { bold: true, fill: SOFT, width: colW })
        ),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c) => cell(String(c), { width: colW })),
          })
      ),
    ],
  });
}

function caption(text) {
  return p(text, {
    italics: true,
    size: 18,
    color: MUTED,
    align: AlignmentType.CENTER,
    spaceAfter: 200,
    spaceBefore: 60,
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function loadImg(name, width = 540, height = 320) {
  const path = resolve(ASSETS, name);
  if (!existsSync(path)) return null;
  const data = readFileSync(path);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [
      new ImageRun({
        type: "png",
        data,
        transformation: { width, height },
        altText: { title: name, description: name, name },
      }),
    ],
  });
}

function maybeImg(name, width = 540, height = 320) {
  const node = loadImg(name, width, height);
  return node ? [node] : [];
}

function spacer(after = 200) {
  return new Paragraph({ spacing: { after }, children: [] });
}

async function build() {
  const children = [];

  // ========== COVER ==========
  if (existsSync(HERO)) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new ImageRun({
            type: "png",
            data: readFileSync(HERO),
            transformation: { width: 520, height: 220 },
            altText: {
              title: "Lombok",
              description: "Visual Lombok Tengah",
              name: "hero",
            },
          }),
        ],
      })
    );
  }

  children.push(
    p("BADAN PUSAT STATISTIK", {
      bold: true,
      size: 20,
      color: GREEN,
      align: AlignmentType.CENTER,
      spaceAfter: 40,
    }),
    p("KABUPATEN LOMBOK TENGAH", {
      bold: true,
      size: 20,
      color: GREEN,
      align: AlignmentType.CENTER,
      spaceAfter: 280,
    }),
    p("MODUL PANDUAN PENGGUNAAN", {
      bold: true,
      size: 36,
      color: INK,
      align: AlignmentType.CENTER,
      spaceAfter: 80,
    }),
    p("DASHBOARD INDIKATOR STRATEGIS", {
      bold: true,
      size: 32,
      color: GREEN,
      align: AlignmentType.CENTER,
      spaceAfter: 160,
    }),
    p(
      "Panduan Penggunaan Sistem untuk Pengguna Publik, Operator, dan Administrator",
      {
        size: 22,
        color: MUTED,
        align: AlignmentType.CENTER,
        spaceAfter: 280,
      }
    ),
    p(`Versi Dokumen 1.0  ·  Aplikasi v${APP_VERSION}`, {
      size: 20,
      color: MUTED,
      align: AlignmentType.CENTER,
      spaceAfter: 40,
    }),
    p(DOC_DATE, {
      size: 20,
      color: MUTED,
      align: AlignmentType.CENTER,
      spaceAfter: 40,
    }),
    p("Status: Panduan Penggunaan Resmi (berdasarkan implementasi aktual)", {
      size: 18,
      color: MUTED,
      align: AlignmentType.CENTER,
      spaceAfter: 200,
    }),
    pageBreak()
  );

  // ========== INFO DOKUMEN ==========
  children.push(
    h1("Informasi Dokumen"),
    spacer(80),
    simpleTable(
      ["Informasi", "Keterangan"],
      [
        ["Nama Aplikasi", "Dashboard Indikator Strategis"],
        ["Instansi", "BPS Kabupaten Lombok Tengah"],
        ["Versi Aplikasi", APP_VERSION],
        ["Jenis Dokumen", "Modul Panduan Penggunaan / User Guide"],
        ["Target Pengguna", "Publik, Operator, Administrator"],
        ["Status", "Panduan Penggunaan"],
        ["Tanggal", DOC_DATE],
        ["Dasar Penulisan", "Implementasi aktual repositori aplikasi"],
      ]
    ),
    spacer(200),
    callout(
      "Catatan penting",
      "Dokumen ini menjelaskan fitur yang benar-benar tersedia pada aplikasi. Fitur yang belum tersedia (misalnya manajemen pengguna penuh, SSO BPS, atau modul Pengaturan) disebutkan secara eksplisit."
    ),
    pageBreak()
  );

  // ========== KATA PENGANTAR ==========
  children.push(
    h1("Kata Pengantar"),
    p(
      "Modul ini disusun sebagai panduan praktis penggunaan Dashboard Indikator Strategis BPS Kabupaten Lombok Tengah. Tujuannya agar pengguna dapat memahami cara mengakses dashboard publik, masuk ke ruang kerja, melakukan pemutakhiran data, meninjau pengajuan, serta memublikasikan data secara benar."
    ),
    p(
      "Panduan ini dapat digunakan untuk presentasi kepada pihak BPS, pelatihan Operator dan Administrator, demonstrasi aplikasi, serta onboarding pengguna baru."
    ),
    p(
      "Seluruh langkah dalam modul ini disusun berdasarkan perilaku aplikasi yang sudah diimplementasikan dan teruji."
    ),
    pageBreak()
  );

  // ========== DAFTAR ISI (manual outline; Word TOC field is limited in docx lib) ==========
  children.push(
    h1("Daftar Isi"),
    p("1. Pendahuluan", { spaceAfter: 60 }),
    p("2. Mengenal Aplikasi", { spaceAfter: 60 }),
    p("3. Peran dan Hak Akses Pengguna", { spaceAfter: 60 }),
    p("4. Alur Kerja Sistem", { spaceAfter: 60 }),
    p("5. Panduan Pengguna Publik", { spaceAfter: 60 }),
    p("6. Panduan Operator", { spaceAfter: 60 }),
    p("7. Panduan Administrator", { spaceAfter: 60 }),
    p("8. Pemutakhiran Data", { spaceAfter: 60 }),
    p("9. Review dan Publikasi", { spaceAfter: 60 }),
    p("10. Riwayat dan Audit", { spaceAfter: 60 }),
    p("11. Skenario Demonstrasi", { spaceAfter: 60 }),
    p("12. Penanganan Masalah", { spaceAfter: 60 }),
    p("13. FAQ", { spaceAfter: 60 }),
    p("14. Ringkasan Penggunaan", { spaceAfter: 60 }),
    p("15. Penutup", { spaceAfter: 60 }),
    pageBreak()
  );

  // ========== BAB 1 ==========
  children.push(
    h1("1. Pendahuluan"),
    h2("1.1 Latar Belakang"),
    p(
      "BPS Kabupaten Lombok Tengah membutuhkan platform untuk menampilkan indikator strategis kepada publik sekaligus menyediakan ruang kerja internal agar petugas dapat memutakhirkan data secara terkendali. Aplikasi ini menggabungkan dashboard publik dengan alur kerja Draft → Review → Publish sehingga perubahan data tidak langsung tampil ke publik sebelum disetujui."
    ),
    h2("1.2 Tujuan"),
    bullet("Menyajikan indikator strategis secara jelas dan mudah diakses publik."),
    bullet("Menyediakan pemutakhiran data terpusat bagi petugas BPS."),
    bullet("Menerapkan workflow review sebelum data dipublikasikan."),
    bullet("Menjamin hanya data berstatus Dipublikasikan yang terlihat publik."),
    bullet("Mencatat jejak perubahan penting melalui audit."),
    h2("1.3 Ruang Lingkup"),
    p("Modul ini mencakup:"),
    bullet("Penggunaan dashboard dan halaman publik."),
    bullet("Login ke ruang kerja internal."),
    bullet("Pemutakhiran data oleh Operator/Admin."),
    bullet("Review, penolakan, dan publikasi oleh Administrator."),
    bullet("Pemeriksaan riwayat/audit."),
    p(
      "Modul ini tidak membahas instalasi teknis server, konfigurasi database produksi, atau integrasi SSO BPS."
    ),
    h2("1.4 Target Pengguna"),
    simpleTable(
      ["Pengguna", "Kebutuhan utama"],
      [
        ["Publik", "Melihat, mencari, memfilter, dan mengekspor data published"],
        ["Operator", "Membuat draft pemutakhiran dan mengajukan review"],
        ["Administrator", "Meninjau, menolak, menyetujui, dan memublikasikan data"],
      ]
    ),
    pageBreak()
  );

  // ========== BAB 2 ==========
  children.push(
    h1("2. Mengenal Aplikasi"),
    p(
      "Aplikasi terdiri dari dua area utama: sisi publik (tanpa login) dan ruang kerja staf (wajib login)."
    ),
    h2("2.1 Gambaran Umum"),
    p("Aplikasi terbagi menjadi dua sisi:", { spaceAfter: 80 }),
    p("PUBLIK — melihat dashboard, filter, grafik, detail, dan export tanpa login.", {
      spaceAfter: 60,
    }),
    p("STAFF — masuk melalui login, lalu bekerja sebagai Operator atau Admin.", {
      spaceAfter: 60,
    }),
    p("Operator: memperbarui data (draft) dan mengajukan review.", { spaceAfter: 60 }),
    p(
      "Admin: meninjau pengajuan, menolak, serta menyetujui & memublikasikan data.",
      { spaceAfter: 160 }
    ),
    h2("2.2 Menu Navigasi Publik"),
    bullet("Beranda (/)"),
    bullet("Dashboard (/dashboard-indikator)"),
    bullet("Data Strategis (/data-strategis)"),
    bullet("Publikasi (/publikasi)"),
    bullet("Akses Ruang Kerja → menuju halaman login (atau workspace jika sudah masuk)"),
    h2("2.3 Menu Ruang Kerja (Staf)"),
    bullet("Ringkasan"),
    bullet("Pemutakhiran Data"),
    bullet("Indikator"),
    bullet("Pengajuan Saya (Operator)"),
    bullet("Review / Persetujuan (Admin)"),
    bullet("Riwayat (Admin)"),
    bullet("Pengguna — Fitur ini belum tersedia pada versi aplikasi saat ini (halaman placeholder)."),
    bullet("Pengaturan — Fitur ini belum tersedia pada versi aplikasi saat ini (halaman placeholder)."),
    loadImg("01-beranda.png", 520, 300),
    caption("Gambar 1. Halaman Beranda publik"),
    pageBreak()
  );

  // ========== BAB 3 ==========
  children.push(
    h1("3. Peran dan Hak Akses Pengguna"),
    h2("3.1 Matriks Hak Akses"),
    simpleTable(
      ["Kemampuan", "Publik", "Operator", "Admin"],
      [
        ["Lihat data published", "Ya", "Ya", "Ya"],
        ["Login ruang kerja", "Tidak", "Ya", "Ya"],
        ["Buat / ubah draft", "Tidak", "Ya", "Ya"],
        ["Ajukan review", "Tidak", "Ya", "Ya"],
        ["Review / Tolak / Setujui & Publish", "Tidak", "Tidak", "Ya"],
        ["Lihat riwayat audit", "Tidak", "Tidak", "Ya"],
        ["Kelola pengguna (penuh)", "Tidak", "Tidak", "Belum tersedia"],
      ]
    ),
    spacer(160),
    callout(
      "Keamanan",
      "Pembatasan hak akses ditegakkan di server. Menu yang disembunyikan di layar bukan satu-satunya pengaman. Jika Operator membuka URL Admin secara langsung, sistem menampilkan “Akses ditolak”."
    ),
    h2("3.2 Akun Demo (Pengembangan / Staging)"),
    callout(
      "Hanya untuk development / staging",
      "Jangan menggunakan akun berikut di lingkungan produksi.",
      "warn"
    ),
    spacer(100),
    simpleTable(
      ["Peran", "Username", "Kata sandi"],
      [
        ["Administrator", "admin", "dev-admin-only"],
        ["Operator", "operator", "dev-operator-only"],
      ]
    ),
    pageBreak()
  );

  // ========== BAB 4 ==========
  children.push(
    h1("4. Alur Kerja Sistem"),
    h2("4.1 Status Data"),
    simpleTable(
      ["Status", "Label di layar", "Arti"],
      [
        ["DRAFT", "Draft", "Masih disunting; belum diajukan"],
        ["PENDING_REVIEW", "Menunggu review", "Menunggu keputusan Admin"],
        ["REJECTED", "Ditolak", "Ditolak Admin; bisa diperbaiki lalu diajukan ulang"],
        ["PUBLISHED", "Dipublikasikan", "Sudah tampil di dashboard publik"],
      ]
    ),
    h2("4.2 Alur Utama"),
    p("Alur utama:", { spaceAfter: 60 }),
    p("DRAFT → Menunggu review → Dipublikasikan", { bold: true, spaceAfter: 80 }),
    p("Jika ditolak:", { spaceAfter: 60 }),
    p(
      "Menunggu review → Ditolak → (edit) → Draft → Menunggu review → …",
      { bold: true, spaceAfter: 160 }
    ),
    h2("4.3 Isolasi Publik"),
    p(
      "Selama status masih Draft, Menunggu review, atau Ditolak, nilai di dashboard publik tidak berubah. Publik baru melihat nilai baru setelah Admin memilih Setujui & Publish."
    ),
    callout(
      "Contoh",
      "Nilai published Jumlah Penduduk 2020 = 1.029,03. Operator mengubah usulan menjadi 1.030,20. Sebelum publish, publik tetap melihat 1.029,03. Setelah Admin publish, publik melihat 1.030,20."
    ),
    pageBreak()
  );

  // ========== BAB 5 ==========
  children.push(
    h1("5. Panduan Pengguna Publik"),
    h2("5.1 Membuka Dashboard"),
    step(1, "Buka alamat aplikasi (contoh lokal: http://localhost:5173)."),
    step(2, "Pilih menu Dashboard atau buka /dashboard-indikator."),
    step(3, "Tidak perlu login."),
    loadImg("02-dashboard.png", 520, 300),
    caption("Gambar 2. Dashboard Indikator Strategis"),
    h2("5.2 Filter, Pencarian, dan Eksplorasi"),
    step(1, "Gunakan filter Kategori dan Periode sesuai kebutuhan."),
    step(2, "Ketik nama indikator pada kotak pencarian."),
    step(3, "Lihat kartu KPI, grafik tren, dan tabel explorer."),
    step(4, "Klik Detail untuk membuka laci informasi indikator."),
    loadImg("03-detail-drawer.png", 480, 280),
    caption("Gambar 3. Detail indikator"),
    h2("5.3 Mengekspor Data"),
    step(1, "Pastikan filter yang diinginkan sudah aktif."),
    step(2, "Klik Unduh Excel."),
    step(3, "File .xlsx akan diunduh sesuai filter aktif."),
    h2("5.4 Batasan Pengguna Publik"),
    bullet("Tidak dapat mengubah data."),
    bullet("Tidak dapat mengajukan, menyetujui, atau memublikasikan data."),
    bullet("Hanya melihat data yang sudah Dipublikasikan."),
    pageBreak()
  );

  // ========== BAB 6 ==========
  children.push(
    h1("6. Panduan Operator"),
    h2("6.1 Masuk ke Ruang Kerja"),
    step(1, "Dari situs publik, klik Akses Ruang Kerja."),
    step(2, "Pada halaman login, masukkan username dan kata sandi Operator."),
    step(3, "Klik Masuk."),
    step(4, "Sistem mengarahkan ke /workspace."),
    loadImg("04-login.png", 520, 300),
    caption("Gambar 4. Halaman login ruang kerja"),
    loadImg("05-workspace-operator.png", 520, 280),
    caption("Gambar 5. Ringkasan ruang kerja Operator"),
    h2("6.2 Menu yang Tersedia untuk Operator"),
    bullet("Ringkasan"),
    bullet("Pemutakhiran Data"),
    bullet("Indikator"),
    bullet("Pengajuan Saya"),
    h2("6.3 Yang Tidak Boleh Dilakukan Operator"),
    bullet("Membuka Review / Persetujuan."),
    bullet("Menyetujui atau memublikasikan data."),
    bullet("Melihat Riwayat audit."),
    bullet("Mengelola pengguna."),
    callout(
      "Jika dipaksa membuka URL Admin",
      "Sistem menampilkan halaman “Akses ditolak”. Ini perilaku yang benar.",
      "warn"
    ),
    h2("6.4 Keluar"),
    step(1, "Klik tombol Keluar di kanan atas."),
    step(2, "Jika ada perubahan yang belum disimpan, konfirmasi keluar/tinggalkan halaman."),
    pageBreak()
  );

  // ========== BAB 7 ==========
  children.push(
    h1("7. Panduan Administrator"),
    h2("7.1 Masuk sebagai Admin"),
    step(1, "Buka Akses Ruang Kerja / halaman login."),
    step(2, "Masukkan username admin dan kata sandi Admin."),
    step(3, "Setelah berhasil, buka menu sesuai tugas (Pemutakhiran, Review, Riwayat)."),
    loadImg("08-workspace-admin.png", 520, 280),
    caption("Gambar 6. Ruang kerja Administrator"),
    h2("7.2 Tanggung Jawab Admin"),
    bullet("Meninjau pengajuan Operator."),
    bullet("Menolak dengan alasan yang jelas bila data belum layak."),
    bullet("Menyetujui dan memublikasikan data yang sudah benar."),
    bullet("Memantau riwayat/audit bila diperlukan."),
    bullet("Dapat juga membuat draft dan mengajukan review (sama seperti Operator)."),
    h2("7.3 Modul Belum Tersedia"),
    callout(
      "Pengguna & Pengaturan",
      "Menu Pengguna dan Pengaturan saat ini menampilkan halaman placeholder. Fitur administrasi akun penuh belum tersedia pada versi aplikasi saat ini.",
      "warn"
    ),
    pageBreak()
  );

  // ========== BAB 8 ==========
  children.push(
    h1("8. Pemutakhiran Data"),
    h2("8.1 Membuka Form Pemutakhiran"),
    step(1, "Login sebagai Operator atau Admin."),
    step(2, "Pilih menu Pemutakhiran Data."),
    step(3, "Cari dan pilih indikator."),
    step(4, "Pilih periode yang akan diubah."),
    loadImg("06-pemutakhiran.png", 520, 320),
    caption("Gambar 7. Form Pemutakhiran Data"),
    h2("8.2 Mengisi Usulan"),
    step(1, "Perhatikan Nilai Saat Ini (publik / terbit) di sisi kanan."),
    step(2, "Isi Nilai Usulan. Kosongkan bila nilai memang kosong (bukan nol)."),
    step(3, "Isi Sumber Data."),
    step(4, "Isi Catatan Pemutakhiran (wajib jika nilai berubah)."),
    step(5, "Klik Simpan Draft."),
    callout(
      "Tips",
      "Gunakan format angka Indonesia bila diperlukan (contoh: 1.033,77). Jangan mengubah nilai kosong menjadi 0 kecuali memang data resmi menyatakan nol."
    ),
    h2("8.3 Mengajukan Review"),
    step(1, "Pastikan draft sudah tersimpan."),
    step(2, "Klik Ajukan untuk Review."),
    step(3, "Konfirmasi Kirim pengajuan."),
    step(4, "Status berubah menjadi Menunggu review."),
    p(
      "Setelah diajukan, form terkunci hingga Admin memutuskan (setujui atau tolak)."
    ),
    h2("8.4 Melihat Pengajuan Saya"),
    step(1, "Buka menu Pengajuan Saya."),
    step(2, "Saring status bila perlu (Draft, Menunggu review, Ditolak, Dipublikasikan)."),
    step(3, "Gunakan Edit / Ajukan Review / Hapus Draft sesuai status yang diizinkan."),
    loadImg("07-pengajuan.png", 520, 280),
    caption("Gambar 8. Pengajuan Saya"),
    pageBreak()
  );

  // ========== BAB 9 ==========
  children.push(
    h1("9. Review dan Publikasi"),
    h2("9.1 Membuka Antrian Review"),
    step(1, "Login sebagai Admin."),
    step(2, "Buka menu Review / Persetujuan."),
    step(3, "Pilih pengajuan dari daftar kiri."),
    step(4, "Bandingkan nilai sebelumnya dan nilai usulan."),
    loadImg("09-review.png", 520, 320),
    caption("Gambar 9. Pusat Review / Persetujuan"),
    h2("9.2 Menolak Pengajuan"),
    step(1, "Isi Alasan penolakan (wajib)."),
    step(2, "Klik Tolak."),
    step(3, "Konfirmasi Tolak pengajuan."),
    callout(
      "Validasi",
      "Jika alasan kosong, sistem menolak aksi dan menampilkan pesan validasi. Operator kemudian dapat memperbaiki data dan mengajukan ulang.",
      "warn"
    ),
    h2("9.3 Menyetujui dan Memublikasikan"),
    step(1, "Pastikan usulan sudah benar."),
    step(2, "Klik Setujui & Publish."),
    step(3, "Konfirmasi pada dialog."),
    step(4, "Status menjadi Dipublikasikan dan nilai baru tampil di dashboard publik."),
    p(
      "Pada versi aplikasi saat ini, Setujui & Publish dilakukan dalam satu langkah: nilai usulan diterapkan ke data published sekaligus."
    ),
    pageBreak()
  );

  // ========== BAB 10 ==========
  children.push(
    h1("10. Riwayat dan Audit"),
    h2("10.1 Siapa yang Dapat Mengakses"),
    p("Hanya Administrator yang dapat membuka menu Riwayat."),
    h2("10.2 Informasi yang Tercatat"),
    p("Sistem mencatat tindakan penting, antara lain:"),
    bullet("Login dan logout"),
    bullet("Pembuatan/perubahan draft"),
    bullet("Pengajuan review"),
    bullet("Penolakan"),
    bullet("Persetujuan / publikasi"),
    loadImg("10-riwayat.png", 520, 300),
    caption("Gambar 10. Riwayat / Audit"),
    callout(
      "Catatan",
      "Riwayat bersifat append-only pada aplikasi ini. Tidak tersedia tombol hapus riwayat dari antarmuka pengguna."
    ),
    pageBreak()
  );

  // ========== BAB 11 ==========
  children.push(
    h1("11. Skenario Demonstrasi"),
    h2("Demo A — Publik"),
    step(1, "Buka dashboard tanpa login."),
    step(2, "Tunjukkan filter, grafik, detail, dan unduh Excel."),
    h2("Demo B — Operator Draft & Submit"),
    step(1, "Login sebagai operator."),
    step(2, "Pemutakhiran Data → simpan draft → ajukan review."),
    step(3, "Logout."),
    h2("Demo C — Isolasi Publik"),
    step(1, "Buka dashboard publik."),
    step(2, "Tunjukkan nilai lama masih tampil."),
    h2("Demo D — Admin Publish"),
    step(1, "Login admin → Review → Setujui & Publish."),
    step(2, "Refresh dashboard publik → nilai baru tampil."),
    h2("Demo E — Tolak & Ajukan Ulang"),
    step(1, "Operator submit usulan."),
    step(2, "Admin tolak dengan alasan."),
    step(3, "Operator perbaiki → ajukan ulang → Admin publish."),
    pageBreak()
  );

  // ========== BAB 12 ==========
  children.push(
    h1("12. Penanganan Masalah"),
    simpleTable(
      ["Gejala", "Penyebab umum", "Yang dilakukan"],
      [
        [
          "Tidak bisa login",
          "Username/sandi salah atau sesi bermasalah",
          "Periksa kredensial; coba lagi; pastikan Caps Lock mati",
        ],
        [
          "Akses ditolak",
          "Peran tidak memiliki izin modul",
          "Gunakan akun yang sesuai (Operator/Admin)",
        ],
        [
          "Draft tidak tersimpan",
          "Validasi belum lengkap",
          "Isi sumber & catatan jika nilai berubah",
        ],
        [
          "Tidak bisa ajukan",
          "Status bukan Draft/Ditolak",
          "Periksa status workflow",
        ],
        [
          "Publik belum berubah",
          "Belum di-publish Admin",
          "Tunggu Setujui & Publish, lalu refresh",
        ],
        [
          "Tombol Tolak gagal",
          "Alasan kosong",
          "Isi alasan penolakan",
        ],
        [
          "Data tidak muncul",
          "API/backend tidak berjalan (lingkungan lokal)",
          "Pastikan layanan API aktif; hubungi admin teknis",
        ],
      ]
    ),
    pageBreak()
  );

  // ========== BAB 13 ==========
  children.push(
    h1("13. FAQ"),
    h3("Apakah publik harus login?"),
    p("Tidak. Dashboard publik dapat diakses tanpa login."),
    h3("Mengapa perubahan Operator belum muncul di dashboard?"),
    p(
      "Karena data masih dalam workflow internal. Publik hanya melihat data Dipublikasikan."
    ),
    h3("Apakah Admin bisa membuat draft?"),
    p("Ya. Admin juga dapat memakai Pemutakhiran Data dan mengajukan review."),
    h3("Apakah Setujui dan Publish terpisah?"),
    p(
      "Pada versi saat ini, tombol Setujui & Publish menggabungkan keduanya dalam satu aksi."
    ),
    h3("Bisakah Operator menyetujui data?"),
    p("Tidak. Sistem menolak dengan akses ditolak / 403."),
    h3("Apakah ada manajemen pengguna lengkap?"),
    p(
      "Fitur ini belum tersedia pada versi aplikasi saat ini. Menu Pengguna masih placeholder."
    ),
    h3("Apakah SSO BPS sudah terintegrasi?"),
    p(
      "Belum. Aplikasi saat ini memakai autentikasi internal untuk local/staging. Integrasi SSO menunggu spesifikasi BPS."
    ),
    pageBreak()
  );

  // ========== BAB 14 ==========
  children.push(
    h1("14. Ringkasan Penggunaan"),
    simpleTable(
      ["Tugas", "Siapa", "Langkah singkat"],
      [
        ["Melihat data", "Publik", "Buka Dashboard → filter/cari/unduh"],
        ["Update nilai", "Operator/Admin", "Pemutakhiran → Draft → Ajukan"],
        ["Tolak usulan", "Admin", "Review → isi alasan → Tolak"],
        ["Publish", "Admin", "Review → Setujui & Publish"],
        ["Cek jejak", "Admin", "Menu Riwayat"],
      ]
    ),
    spacer(160),
    callout(
      "Prinsip utama",
      "Draft tidak otomatis menjadi data publik. Hanya setelah Admin memublikasikan, dashboard publik berubah."
    ),
    pageBreak()
  );

  // ========== BAB 15 ==========
  children.push(
    h1("15. Penutup"),
    p(
      "Modul ini diharapkan membantu seluruh pengguna memahami cara kerja Dashboard Indikator Strategis BPS Kabupaten Lombok Tengah secara praktis dan aman."
    ),
    p(
      "Untuk pertanyaan teknis integrasi (hosting, SSO, database produksi), merujuk pada dokumen serah-terima teknis: docs/BPS_HANDOVER.md dan docs/BPS_INTEGRATION_CHECKLIST.md."
    ),
    spacer(240),
    p("BPS Kabupaten Lombok Tengah", {
      bold: true,
      align: AlignmentType.CENTER,
      spaceAfter: 40,
    }),
    p("Dashboard Indikator Strategis", {
      align: AlignmentType.CENTER,
      color: MUTED,
      spaceAfter: 40,
    }),
    p(`Dokumen Versi 1.0 — ${DOC_DATE}`, {
      align: AlignmentType.CENTER,
      color: MUTED,
      size: 18,
    })
  );

  const doc = new Document({
    creator: "Dashboard Indikator Strategis — BPS Lombok Tengah",
    title:
      "Modul Panduan Penggunaan — Dashboard Indikator Strategis BPS Kabupaten Lombok Tengah",
    description:
      "Panduan penggunaan untuk Publik, Operator, dan Administrator",
    styles: {
      default: {
        document: {
          styles: [
            {
              id: "Normal",
              run: { font: "Calibri", size: 22, color: INK },
            },
          ],
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.15) },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.85),
              bottom: convertInchesToTwip(0.85),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Modul Panduan Penggunaan  ·  Dashboard Indikator Strategis  ·  BPS Lombok Tengah",
                    size: 16,
                    color: MUTED,
                    font: "Calibri",
                  }),
                ],
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE },
                },
                spacing: { after: 120 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: LINE },
                },
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: "Halaman ",
                    size: 16,
                    color: MUTED,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: MUTED,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: "  |  Dokumen resmi penggunaan aplikasi  |  Jangan sebarkan akun demo ke produksi",
                    size: 16,
                    color: MUTED,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children: children.filter(Boolean),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(OUT, buffer);
  console.log("Wrote", OUT);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
