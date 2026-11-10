/**
 * Presentasi hasil Capstone Project (Tugas 3) dan skrip presentasinya.
 *
 * Panduan Capstone Project meminta presentasi 10–15 menit, 8–12 slide, berisi
 * identifikasi masalah, spesifikasi, desain, implementasi, pengujian, rincian
 * kontribusi anggota, serta trade-off dan kendala; semua anggota berbicara
 * bergantian. Naskah setiap slide ditulis sekali (SLIDES) lalu dipakai untuk
 * catatan pembicara di .pptx sekaligus untuk PDF skrip.
 *
 * Keluaran (docs/laporan-capstone/):
 *   Tugas 3 Presentasi Hasil Capstone BPS Lombok Tengah.pptx
 *   Tugas 3 Skrip Presentasi Capstone BPS Lombok Tengah.pdf
 *
 * Penggunaan: node scripts/generate-capstone-presentation.mjs
 */
import { Document, Packer } from "docx";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import PptxGenJS from "pptxgenjs";
import {
  centered,
  documentStyles,
  h2,
  numberingConfig,
  p,
  pageMargins,
  pageNumberFooter,
  plain,
  spacer,
  table,
} from "./lib/capstone-academic.mjs";
import { GROUP_NAME, TEST_RESULTS, TITLE_SHORT, YEAR, lecturer, memberList } from "./lib/capstone-config.mjs";

const require = createRequire(import.meta.url);
const JSZip = require("jszip");

const OUT_DIR = resolve("docs/laporan-capstone");
const PPTX_OUT = resolve(OUT_DIR, "Tugas 3 Presentasi Hasil Capstone BPS Lombok Tengah.pptx");
const SCRIPT_DOCX = resolve(OUT_DIR, "Tugas 3 Skrip Presentasi Capstone BPS Lombok Tengah.docx");

/* ================================================================= theme */

const THEME = {
  name: "Dashboard Indikator BPS",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1A1F1C",
    lt1: "FFFFFF",
    dk2: "0B4A32", // hijau institusional, sama dengan aplikasi
    lt2: "F1F4F2",
    accent1: "0B4A32",
    accent2: "22A38C", // membaik (teal), lolos uji buta warna terhadap accent3
    accent3: "DC7536", // memburuk (oranye)
    accent4: "5FD3A8",
    accent5: "6F8079", // netral
    accent6: "B0883A",
    hlink: "0B4A32",
    folHlink: "22A38C",
  },
};
const HEX = THEME.colors;

/* ============================================================ data, aset */

const members = memberList();
const [ketua, anggota2, anggota3, anggota4] = members;

const dataset = JSON.parse(readFileSync(resolve("src/data/indicators.json"), "utf8"));
const indicators = dataset.indicators ?? dataset;
const povertySeries = indicators
  .find((i) => i.id === "sosial__persentase-penduduk-miskin-p0")
  .values.filter((v) => v.value !== null);

function imageData(path) {
  const buf = readFileSync(resolve(path));
  const mime = buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : "image/png";
  return `${mime};base64,${buf.toString("base64")}`;
}

/* ================================================================ naskah */

/**
 * Satu entri per slide: judul, pembicara, durasi (detik), dan naskah.
 * Total durasi dijaga dalam rentang 10–15 menit sesuai panduan.
 */
const SLIDES = [
  {
    title: "Pembukaan",
    speaker: ketua,
    seconds: 45,
    script: [
      `Assalamualaikum warahmatullahi wabarakatuh. Yang kami hormati ${lecturer()}, dan rekan-rekan sekalian.`,
      `Kami dari ${GROUP_NAME} akan mempresentasikan hasil Capstone Project berjudul “${TITLE_SHORT}”. Saya ${ketua.name} selaku ketua kelompok, bersama ${anggota2.name}, ${anggota3.name}, dan ${anggota4.name}.`,
      "Presentasi ini berlangsung sekitar empat belas menit, dimulai dari masalah yang kami angkat, perancangan dan implementasi sistem, hasil pengujian, hingga kesimpulan.",
    ],
  },
  {
    title: "Latar Belakang dan Masalah",
    speaker: ketua,
    seconds: 75,
    script: [
      "BPS Kabupaten Lombok Tengah mengelola 58 indikator strategis, terdiri atas 51 indikator sosial dan 7 indikator ekonomi, untuk periode 2014 sampai 2025. Indikator ini menjadi dasar perencanaan pembangunan daerah.",
      "Kami mengidentifikasi tiga masalah. Pertama, data tersaji dalam bentuk rekap tabel sehingga tren sulit dibaca dan data sulit diunduh oleh masyarakat. Kedua, pemutakhiran angka tanpa tahap pemeriksaan berisiko langsung menyebarkan kesalahan ke publik. Ketiga, tanpa jejak audit, tidak dapat ditelusuri siapa mengubah apa dan kapan.",
      "Ketiga masalah inilah yang menjadi dasar perancangan sistem kami.",
    ],
  },
  {
    title: "Tujuan Proyek",
    speaker: anggota2,
    seconds: 60,
    script: [
      `Terima kasih. Saya ${anggota2.name} akan menjelaskan tujuan dan metodologi.`,
      "Proyek ini memiliki enam tujuan: membangun dashboard publik tanpa login; menyediakan ruang kerja Operator untuk mengusulkan pemutakhiran; menerapkan hak akses berbasis peran yang diperiksa di server; menerapkan alur persetujuan dari Draft, Menunggu Review, hingga Dipublikasikan; menjamin publik hanya melihat data yang telah disetujui; dan mencatat setiap aktivitas penting pada jejak audit.",
      "Integrasi SSO BPS, WebAPI resmi, dan hosting produksi berada di luar ruang lingkup proyek.",
    ],
  },
  {
    title: "Metodologi dan Analisis Kebutuhan",
    speaker: anggota2,
    seconds: 75,
    script: [
      "Data dikumpulkan melalui studi dokumen atas rekap indikator BPS, analisis proses bisnis pemutakhiran, dan studi pustaka.",
      "Pengembangan menggunakan model iteratif-inkremental. Setiap iterasi melalui analisis, perancangan, implementasi, dan pengujian. Iterasi pertama menghasilkan dashboard publik, iterasi kedua ruang kerja dan autentikasi, dan iterasi ketiga alur persetujuan, jejak audit, serta penyempurnaan antarmuka.",
      "Dari analisis kebutuhan, kami menetapkan tiga aktor. Publik membaca dan mengunduh data. Operator menyusun usulan perubahan. Administrator meninjau, menolak dengan alasan, atau menyetujui dan memublikasikan.",
    ],
  },
  {
    title: "Perancangan Sistem",
    speaker: anggota2,
    seconds: 90,
    script: [
      "Sistem dibangun dengan arsitektur tiga lapis: antarmuka React, layanan API Express, dan basis data yang diakses melalui Prisma.",
      "Keputusan rancangan terpenting terlihat pada ERD di sebelah kanan. Nilai resmi yang tampil ke publik disimpan pada entitas Observation, sedangkan usulan perubahan disimpan terpisah pada entitas DataChange. Karena terpisah, usulan yang belum disetujui secara teknis tidak mungkin mengubah tampilan publik.",
      "Setiap usulan melewati status Draft, Menunggu Review, lalu Dipublikasikan. Bila ditolak, Operator memperbaiki dan mengajukan ulang.",
    ],
  },
  {
    title: "Implementasi: Dashboard Publik",
    speaker: anggota3,
    seconds: 75,
    script: [
      `Terima kasih. Saya ${anggota3.name} akan memaparkan hasil implementasi.`,
      "Ini adalah dashboard publik. Di bagian atas tersedia filter kategori, periode, dan pencarian, serta tombol unduh Excel sesuai filter. Enam indikator utama menampilkan nilai terbaru, perubahan dibanding tahun sebelumnya, dan grafik ringkas.",
      "Masyarakat dapat membuka panel rincian untuk melihat definisi, satuan, sumber, dan seluruh nilai historis tanpa berpindah halaman. Nilai yang kosong pada data sumber tetap ditampilkan kosong, tidak diisi nol.",
    ],
  },
  {
    title: "Membaca Arah Perubahan dengan Benar",
    speaker: anggota3,
    seconds: 75,
    script: [
      "Salah satu fitur yang kami rancang secara khusus adalah penandaan perubahan berdasarkan makna indikator.",
      "Grafik ini menunjukkan persentase penduduk miskin Lombok Tengah yang turun dari 16,26 persen pada 2015 menjadi 10,68 persen pada 2025. Pada banyak dashboard, angka turun selalu diberi warna merah. Padahal untuk kemiskinan dan pengangguran, penurunan adalah perbaikan.",
      "Karena itu sistem kami memberi warna teal untuk membaik dan oranye untuk memburuk. Pasangan warna ini juga kami uji agar tetap dapat dibedakan oleh penyandang buta warna.",
    ],
  },
  {
    title: "Implementasi: Ruang Kerja dan Persetujuan",
    speaker: anggota3,
    seconds: 90,
    script: [
      "Di ruang kerja internal, Operator membuka formulir pemutakhiran. Nilai resmi saat ini ditampilkan di samping isian nilai usulan, sumber data, dan catatan, sehingga perbandingan jelas sejak awal.",
      "Usulan kemudian masuk ke Pusat Review Administrator, seperti gambar sebelah kanan. Administrator membandingkan nilai lama dan nilai usulan, membaca sumbernya, lalu menolak dengan alasan wajib atau memilih Setujui dan Publish.",
      "Persetujuan langsung memperbarui data publik dan tercatat di riwayat audit beserta pelaku, waktu, nilai lama, dan nilai baru.",
    ],
  },
  {
    title: "Hasil Pengujian",
    speaker: anggota4,
    seconds: 75,
    script: [
      `Terima kasih. Saya ${anggota4.name} akan menyampaikan hasil pengujian serta kendala.`,
      `Kami menjalankan lima jenis pengujian. Uji API otomatis lulus ${TEST_RESULTS.api.passed} dari ${TEST_RESULTS.api.total} kasus, mencakup login, hak akses tiap peran, alur persetujuan, dan isolasi data publik. Uji peramban menyeluruh lulus ${TEST_RESULTS.browser.passed} dari ${TEST_RESULTS.browser.total} skenario, termasuk tampilan pada layar 360 hingga 1440 piksel.`,
      "Uji integritas data memastikan 58 indikator dengan 51 sosial dan 7 ekonomi sesuai baseline, ditambah pemeriksaan tipe dan build produksi yang seluruhnya lulus. Salah satu skenario penting: ketika Operator memanggil API persetujuan secara langsung, server menolaknya dengan kode 403.",
    ],
  },
  {
    title: "Keputusan Rancangan, Kendala, dan Pengembangan",
    speaker: anggota4,
    seconds: 75,
    script: [
      "Beberapa keputusan diambil dengan sadar. Kami memakai autentikasi lokal karena spesifikasi SSO BPS belum tersedia, dan SQLite untuk pengembangan dengan rekomendasi PostgreSQL di produksi. Akses data dibuat melalui lapisan penyedia agar kelak dapat diganti dengan WebAPI BPS tanpa mengubah antarmuka.",
      "Kendala yang kami temukan adalah tujuh nilai pada data sumber yang format tampilannya tidak sesuai angka sebenarnya, misalnya 912.879 untuk nilai 912,879 ribu jiwa. Sistem kini memvalidasi format tersebut sebelum ditampilkan.",
      "Untuk pengembangan lanjutan, kami merekomendasikan integrasi SSO dan WebAPI BPS, modul manajemen pengguna, serta notifikasi pengajuan.",
    ],
  },
  {
    title: "Kontribusi Anggota",
    speaker: ketua,
    seconds: 45,
    script: [
      "Berikut pembagian peran dan kontribusi setiap anggota kelompok selama pengerjaan Capstone Project.",
      `Sebagai ketua, saya mengoordinasikan kegiatan kelompok, menganalisis kebutuhan, merancang, mengimplementasikan, dan menguji aplikasi, serta menyusun laporan Tugas 1 sampai Tugas 3. ${anggota2.name}, ${anggota3.name}, dan ${anggota4.name} berkontribusi sesuai peran yang tercantum pada slide.`,
    ],
  },
  {
    title: "Kesimpulan",
    speaker: ketua,
    seconds: 75,
    script: [
      "Sebagai kesimpulan, Dashboard Indikator Strategis BPS Kabupaten Lombok Tengah berhasil dibangun dan menjawab ketiga masalah di awal: indikator kini dapat ditelusuri dan diunduh publik, setiap perubahan angka melewati persetujuan Administrator, dan seluruh aktivitas tercatat pada jejak audit.",
      `Seluruh skenario pengujian lulus. Sistem siap menjadi dasar integrasi dengan infrastruktur resmi BPS.`,
      "Demikian presentasi dari kami. Terima kasih atas perhatiannya. Kami persilakan Bapak dan rekan-rekan untuk bertanya. Wassalamualaikum warahmatullahi wabarakatuh.",
    ],
  },
];

const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const notesFor = (slide) => `Pembicara: ${slide.speaker.name} (${formatDuration(slide.seconds)})\n\n${slide.script.join("\n\n")}`;

/* ============================================================== builder */

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE"; // 13,333 × 7,5 inci
pres.author = GROUP_NAME;
pres.company = "STMIK Lombok";
pres.title = `Presentasi Hasil Capstone Project: ${TITLE_SHORT}`;
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const W = 13.333;
const MARGIN = 0.6;
const FOOTER = `${GROUP_NAME} · Capstone Project STMIK Lombok ${YEAR}`;

pres.defineSlideMaster({
  title: "JUDUL",
  background: { color: HEX.dk2 },
  objects: [
    { image: { x: 6.2, y: 0, w: W - 6.2, h: 7.5, data: imageData("public/landing/hero-lombok.png"), sizing: { type: "cover", w: W - 6.2, h: 7.5 } } },
    {
      placeholder: {
        options: { name: "title", type: "title", x: MARGIN, y: 1.9, w: 5.4, h: 2.2, fontFace: THEME.headFontFace, fontSize: 34, bold: true, color: C.background1, valign: "top", align: "left", margin: 0 },
        text: "",
      },
    },
    {
      placeholder: {
        options: { name: "body", type: "body", x: MARGIN, y: 4.3, w: 5.3, h: 2.5, fontSize: 14, color: C.background1, valign: "top", align: "left", margin: 0 },
        text: "",
      },
    },
  ],
});

pres.defineSlideMaster({
  title: "KONTEN",
  background: { color: HEX.lt1 },
  objects: [
    { text: { text: FOOTER, options: { x: MARGIN, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent5, margin: 0 } } },
    {
      placeholder: {
        options: { name: "title", type: "title", x: MARGIN, y: 0.4, w: W - 2 * MARGIN, h: 0.8, fontFace: THEME.headFontFace, fontSize: 30, bold: true, color: C.text2, valign: "middle", align: "left", margin: 0 },
        text: "",
      },
    },
  ],
  slideNumber: { x: W - MARGIN - 0.6, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: HEX.accent5, align: "right" },
});

pres.defineSlideMaster({
  title: "PENUTUP",
  background: { color: HEX.dk2 },
  objects: [
    { text: { text: FOOTER, options: { x: MARGIN, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent4, margin: 0 } } },
    {
      placeholder: {
        options: { name: "title", type: "title", x: MARGIN, y: 0.4, w: W - 2 * MARGIN, h: 0.8, fontFace: THEME.headFontFace, fontSize: 30, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 },
        text: "",
      },
    },
  ],
  slideNumber: { x: W - MARGIN - 0.6, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: HEX.accent4, align: "right" },
});

for (const title of ["Pembukaan", "Masalah", "Rancangan", "Implementasi", "Hasil", "Penutup"]) {
  pres.addSection({ title });
}

function newSlide(section, master, spec) {
  const slide = pres.addSlide({ masterName: master, sectionTitle: section });
  slide.addText(spec.title, { placeholder: "title" });
  slide.addNotes(notesFor(spec));
  return slide;
}

/* -------------------------------------------------------------- motifs */

/** Kartu bertepi bulat dengan latar lembut; motif utama seluruh slide. */
function card(slide, x, y, w, h, name, fill = C.background2) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: name });
}

/** Lingkaran bernomor: penanda urutan pada kartu. */
function badge(slide, label, x, y, color = C.accent1, size = 0.5) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: size, h: size, fill: { color }, line: { color, width: 0 }, objectName: `badge-${label}` });
  slide.addText(String(label), { x, y, w: size, h: size, align: "center", valign: "middle", fontSize: 16, bold: true, color: C.background1, margin: 0, isTextBox: true });
}

function text(slide, value, opts) {
  slide.addText(value, { margin: 0, valign: "top", color: C.text1, fontSize: 15, isTextBox: true, ...opts });
}

/** Gambar dalam bingkai kartu dengan rasio asli. */
function framedImage(slide, path, x, y, w, ratio, name) {
  const h = w / ratio;
  card(slide, x - 0.08, y - 0.08, w + 0.16, h + 0.16, `${name}-frame`, "E3E8E5");
  slide.addImage({ data: imageData(path), x, y, w, h, altText: name, objectName: name });
  return h;
}

function caption(slide, value, x, y, w) {
  text(slide, value, { x, y, w, h: 0.35, fontSize: 11, color: C.accent5, italic: true });
}

/* ================================================================ slides */

// 1. Pembukaan
{
  const s = SLIDES[0];
  const slide = pres.addSlide({ masterName: "JUDUL", sectionTitle: "Pembukaan" });
  slide.addText(TITLE_SHORT, { placeholder: "title" });
  slide.addText(
    [
      { text: "Presentasi Hasil Capstone Project", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: GROUP_NAME, options: { fontSize: 15, color: C.accent4, breakLine: true } },
      ...members.map((m, i) => ({ text: m.name, options: { fontSize: 14, breakLine: i < members.length - 1 } })),
    ],
    { placeholder: "body", paraSpaceAfter: 4 }
  );
  slide.addText("Program Studi Teknik Informatika · STMIK Lombok · " + YEAR, {
    x: MARGIN, y: 6.85, w: 5.4, h: 0.35, fontSize: 11, color: C.accent4, margin: 0, isTextBox: true,
  });
  slide.addNotes(notesFor(s));
}

// 2. Latar belakang dan masalah
{
  const slide = newSlide("Masalah", "KONTEN", SLIDES[1]);
  const problems = [
    ["Sulit ditelusuri", "58 indikator dalam rekap tabel: tren tidak terlihat, data sulit diunduh."],
    ["Berisiko salah publikasi", "Pemutakhiran tanpa pemeriksaan langsung menyebarkan kesalahan input."],
    ["Tidak terlacak", "Tanpa jejak audit, tidak diketahui siapa mengubah apa dan kapan."],
  ];
  problems.forEach(([head, body], i) => {
    const y = 1.55 + i * 1.75;
    card(slide, MARGIN, y, 7.4, 1.5, `masalah-${i + 1}`);
    badge(slide, i + 1, MARGIN + 0.3, y + 0.5, C.accent3);
    text(slide, head, { x: MARGIN + 1.05, y: y + 0.25, w: 6.1, h: 0.4, fontSize: 18, bold: true, color: C.text2 });
    text(slide, body, { x: MARGIN + 1.05, y: y + 0.7, w: 6.1, h: 0.65, fontSize: 15 });
  });
  card(slide, 8.5, 1.55, 4.23, 5.0, "statistik-data", C.text2);
  text(slide, "58", { x: 8.9, y: 1.95, w: 3.5, h: 1.3, fontSize: 72, bold: true, color: C.background1, fontFace: THEME.headFontFace });
  text(slide, "indikator strategis", { x: 8.9, y: 3.25, w: 3.5, h: 0.4, fontSize: 18, color: C.background1 });
  text(slide, [
    { text: "51 sosial · 7 ekonomi", options: { breakLine: true } },
    { text: "Periode 2014–2025", options: { breakLine: true } },
    { text: "BPS Kabupaten Lombok Tengah" },
  ], { x: 8.9, y: 4.25, w: 3.5, h: 1.5, fontSize: 15, color: C.accent4, paraSpaceAfter: 6 });
}

// 3. Tujuan
{
  const slide = newSlide("Masalah", "KONTEN", SLIDES[2]);
  const goals = [
    ["Dashboard publik", "Filter, tren, rincian, dan unduh Excel tanpa login"],
    ["Ruang kerja Operator", "Menyusun dan mengajukan usulan pemutakhiran"],
    ["Hak akses berbasis peran", "Publik, Operator, Administrator; diperiksa di server"],
    ["Alur persetujuan", "Draft, Menunggu Review, Dipublikasikan, atau Ditolak"],
    ["Isolasi data publik", "Publik hanya melihat data yang telah disetujui"],
    ["Jejak audit", "Setiap aktivitas penting tercatat dan dapat ditelusuri"],
  ];
  const colW = (W - 2 * MARGIN - 0.6) / 3;
  goals.forEach(([head, body], i) => {
    const x = MARGIN + (i % 3) * (colW + 0.3);
    const y = 1.55 + Math.floor(i / 3) * 2.45;
    card(slide, x, y, colW, 2.15, `tujuan-${i + 1}`);
    badge(slide, i + 1, x + 0.3, y + 0.3);
    text(slide, head, { x: x + 0.3, y: y + 0.95, w: colW - 0.6, h: 0.4, fontSize: 18, bold: true, color: C.text2 });
    text(slide, body, { x: x + 0.3, y: y + 1.38, w: colW - 0.6, h: 0.65, fontSize: 14 });
  });
}

// 4. Metodologi dan analisis kebutuhan
{
  const slide = newSlide("Rancangan", "KONTEN", SLIDES[3]);
  const steps = ["Analisis", "Perancangan", "Implementasi", "Pengujian"];
  const stepW = 2.6;
  steps.forEach((label, i) => {
    const x = MARGIN + i * (stepW + 0.5);
    card(slide, x, 1.55, stepW, 1.1, `tahap-${i + 1}`, C.text2);
    text(slide, label, { x, y: 1.55, w: stepW, h: 1.1, align: "center", valign: "middle", fontSize: 18, bold: true, color: C.background1 });
    if (i < steps.length - 1) {
      slide.addShape(pres.ShapeType.rightArrow, { x: x + stepW + 0.1, y: 1.92, w: 0.3, h: 0.36, fill: { color: C.accent5 }, line: { color: C.accent5, width: 0 }, objectName: `panah-${i + 1}` });
    }
  });
  text(slide, "Model iteratif-inkremental, tiga iterasi: dashboard publik → ruang kerja dan autentikasi → alur persetujuan, audit, dan penyempurnaan.", {
    x: MARGIN, y: 2.85, w: W - 2 * MARGIN, h: 0.5, fontSize: 15, color: C.accent5, italic: true,
  });
  const actors = [
    ["Publik", "Membaca indikator yang telah dipublikasikan, melihat tren dan rincian, mengunduh data"],
    ["Operator", "Menyusun usulan nilai baru, mengajukan untuk ditinjau, memantau status pengajuan"],
    ["Administrator", "Meninjau, menolak dengan alasan, menyetujui dan memublikasikan, melihat riwayat audit"],
  ];
  const actorW = (W - 2 * MARGIN - 0.6) / 3;
  actors.forEach(([head, body], i) => {
    const x = MARGIN + i * (actorW + 0.3);
    card(slide, x, 3.65, actorW, 2.9, `aktor-${head}`);
    text(slide, "AKTOR", { x: x + 0.3, y: 3.95, w: actorW - 0.6, h: 0.3, fontSize: 11, bold: true, color: C.accent2, charSpacing: 2 });
    text(slide, head, { x: x + 0.3, y: 4.3, w: actorW - 0.6, h: 0.5, fontSize: 22, bold: true, color: C.text2, fontFace: THEME.headFontFace });
    text(slide, body, { x: x + 0.3, y: 4.95, w: actorW - 0.6, h: 1.4, fontSize: 15 });
  });
}

// 5. Perancangan sistem
{
  const slide = newSlide("Rancangan", "KONTEN", SLIDES[4]);
  const imgW = 5.9;
  const h1 = framedImage(slide, "docs/figures/flowchart-sistem.png", MARGIN + 0.08, 1.55, imgW, 1280 / 720, "diagram-alir");
  caption(slide, "Diagram alir sistem", MARGIN, 1.55 + h1 + 0.15, imgW);
  framedImage(slide, "docs/figures/erd-sistem.png", W - MARGIN - imgW - 0.08, 1.55, imgW, 1280 / 720, "erd");
  caption(slide, "ERD: Observation (data resmi) terpisah dari DataChange (usulan)", W - MARGIN - imgW, 1.55 + h1 + 0.15, imgW);
  const flow = ["DRAFT", "MENUNGGU REVIEW", "DIPUBLIKASIKAN"];
  const boxW = 2.6;
  const startX = (W - (flow.length * boxW + (flow.length - 1) * 0.6)) / 2;
  flow.forEach((label, i) => {
    const x = startX + i * (boxW + 0.6);
    const fill = i === flow.length - 1 ? C.accent2 : C.text2;
    card(slide, x, 5.6, boxW, 0.75, `status-${i + 1}`, fill);
    text(slide, label, { x, y: 5.6, w: boxW, h: 0.75, align: "center", valign: "middle", fontSize: 15, bold: true, color: C.background1 });
    if (i < flow.length - 1) {
      slide.addShape(pres.ShapeType.rightArrow, { x: x + boxW + 0.15, y: 5.8, w: 0.3, h: 0.35, fill: { color: C.accent5 }, line: { color: C.accent5, width: 0 }, objectName: `alur-${i + 1}` });
    }
  });
  text(slide, "Ditolak → diperbaiki Operator → diajukan ulang", { x: MARGIN, y: 6.45, w: W - 2 * MARGIN, h: 0.35, align: "center", fontSize: 13, color: C.accent3, italic: true });
}

// 6. Dashboard publik
{
  const slide = newSlide("Implementasi", "KONTEN", SLIDES[5]);
  const imgW = 7.6;
  const h = framedImage(slide, "docs/guide-assets/02-dashboard.png", MARGIN + 0.08, 1.55, imgW, 1440 / 900, "dashboard-publik");
  caption(slide, "Dashboard Indikator Strategis", MARGIN, 1.55 + h + 0.15, imgW);
  const features = [
    ["Filter dan pencarian", "Kategori, periode, kata kunci; unduh Excel sesuai filter"],
    ["Indikator utama", "Nilai terbaru, perubahan, dan grafik ringkas"],
    ["Panel rincian", "Definisi, satuan, sumber, dan nilai historis"],
  ];
  features.forEach(([head, body], i) => {
    const y = 1.55 + i * 1.62;
    card(slide, 8.65, y, 4.08, 1.42, `fitur-${i + 1}`);
    badge(slide, i + 1, 8.9, y + 0.25, C.accent2, 0.45);
    text(slide, head, { x: 9.5, y: y + 0.22, w: 3.05, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
    text(slide, body, { x: 9.5, y: y + 0.65, w: 3.05, h: 0.65, fontSize: 14 });
  });
}

// 7. Membaca arah perubahan (grafik asli PowerPoint)
{
  const slide = newSlide("Implementasi", "KONTEN", SLIDES[6]);
  card(slide, MARGIN, 1.5, 8.3, 5.2, "grafik-kartu", C.background1);
  slide.addChart(
    pres.ChartType.line,
    [{ name: "Persentase penduduk miskin (%)", labels: povertySeries.map((v) => v.period), values: povertySeries.map((v) => v.value) }],
    {
      x: MARGIN + 0.1, y: 1.55, w: 8.1, h: 5.1,
      showTitle: true, title: "Persentase penduduk miskin (P0), Lombok Tengah", titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: "+mn-lt",
      chartColors: [HEX.accent2], lineSize: 2, lineDataSymbol: "circle", lineDataSymbolSize: 7,
      showLegend: false, showValue: false,
      valAxisMinVal: 8, valAxisMaxVal: 18, valAxisMajorUnit: 2,
      valAxisLabelColor: HEX.accent5, catAxisLabelColor: HEX.accent5, valAxisLabelFontSize: 11, catAxisLabelFontSize: 11,
      valAxisLabelFontFace: "+mn-lt", catAxisLabelFontFace: "+mn-lt",
      valGridLine: { color: "E3E8E5", size: 0.75 }, catGridLine: { style: "none" },
      valAxisLineShow: false,
      objectName: "grafik-kemiskinan",
    }
  );
  card(slide, 9.2, 1.5, 3.53, 2.45, "angka-kemiskinan", C.text2);
  text(slide, "16,26% → 10,68%", { x: 9.45, y: 1.75, w: 3.1, h: 0.6, fontSize: 24, bold: true, color: C.background1, fontFace: THEME.headFontFace });
  text(slide, "Turun 5,58 poin persentase dalam 10 tahun", { x: 9.45, y: 2.45, w: 3.1, h: 0.7, fontSize: 14, color: C.accent4 });
  const legend = [
    [C.accent2, "Membaik", "mis. kemiskinan turun"],
    [C.accent3, "Memburuk", "mis. pengangguran naik"],
    [C.accent5, "Netral", "mis. jumlah penduduk"],
  ];
  legend.forEach(([color, head, body], i) => {
    const y = 4.2 + i * 0.85;
    slide.addShape(pres.ShapeType.roundRect, { x: 9.2, y: y + 0.08, w: 0.42, h: 0.42, rectRadius: 0.08, fill: { color }, line: { color, width: 0 }, objectName: `legenda-${head}` });
    text(slide, head, { x: 9.8, y, w: 2.9, h: 0.35, fontSize: 16, bold: true, color: C.text2 });
    text(slide, body, { x: 9.8, y: y + 0.36, w: 2.9, h: 0.35, fontSize: 13, color: C.accent5 });
  });
}

// 8. Ruang kerja dan persetujuan
{
  const slide = newSlide("Implementasi", "KONTEN", SLIDES[7]);
  const imgW = 5.9;
  const h = framedImage(slide, "docs/guide-assets/06-pemutakhiran.png", MARGIN + 0.08, 1.55, imgW, 1440 / 900, "formulir-pemutakhiran");
  framedImage(slide, "docs/guide-assets/09-review.png", W - MARGIN - imgW - 0.08, 1.55, imgW, 1440 / 900, "pusat-review");
  badge(slide, 1, MARGIN, 1.55 + h + 0.3, C.accent1, 0.45);
  text(slide, [
    { text: "Operator ", options: { bold: true, color: C.text2 } },
    { text: "mengisi nilai usulan di samping nilai resmi, lalu mengajukan review" },
  ], { x: MARGIN + 0.6, y: 1.55 + h + 0.3, w: imgW - 0.6, h: 0.8, fontSize: 15 });
  badge(slide, 2, W - MARGIN - imgW, 1.55 + h + 0.3, C.accent2, 0.45);
  text(slide, [
    { text: "Administrator ", options: { bold: true, color: C.text2 } },
    { text: "membandingkan, lalu menolak dengan alasan atau Setujui & Publish" },
  ], { x: W - MARGIN - imgW + 0.6, y: 1.55 + h + 0.3, w: imgW - 0.6, h: 0.8, fontSize: 15 });
}

// 9. Hasil pengujian
{
  const slide = newSlide("Hasil", "KONTEN", SLIDES[8]);
  const stats = [
    [`${TEST_RESULTS.api.passed}/${TEST_RESULTS.api.total}`, "uji API otomatis lulus"],
    [`${TEST_RESULTS.browser.passed}/${TEST_RESULTS.browser.total}`, "uji peramban lulus"],
    ["17", "skenario uji utama lulus"],
    ["58", "indikator sesuai baseline (51 sosial, 7 ekonomi)"],
  ];
  const statW = (W - 2 * MARGIN - 0.9) / 4;
  stats.forEach(([value, label], i) => {
    const x = MARGIN + i * (statW + 0.3);
    card(slide, x, 1.55, statW, 2.1, `statistik-uji-${i + 1}`, i === 0 ? C.text2 : C.background2);
    text(slide, value, { x: x + 0.3, y: 1.8, w: statW - 0.6, h: 1.0, fontSize: 44, bold: true, color: i === 0 ? C.background1 : C.text2, fontFace: THEME.headFontFace });
    text(slide, label, { x: x + 0.3, y: 2.85, w: statW - 0.6, h: 0.6, fontSize: 15, color: i === 0 ? C.accent4 : C.text1 });
  });
  const checks = [
    "Login, logout, dan sesi berakhir dengan benar",
    "Operator tidak dapat membuka halaman review; API persetujuan ditolak HTTP 403",
    "Draft dan pengajuan tidak mengubah data publik sampai disetujui",
    "Penolakan tanpa alasan ditolak validasi; pengajuan ulang kembali ke review",
    "Tampilan tanpa guliran horizontal pada lebar 360–1440 piksel",
  ];
  card(slide, MARGIN, 3.95, W - 2 * MARGIN, 2.75, "daftar-uji");
  text(slide, "Skenario kunci yang diuji", { x: MARGIN + 0.35, y: 4.15, w: 6, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
  text(slide, checks.map((c, i) => ({ text: c, options: { bullet: true, breakLine: i < checks.length - 1 } })), {
    x: MARGIN + 0.35, y: 4.6, w: W - 2 * MARGIN - 0.7, h: 2.0, fontSize: 15, paraSpaceAfter: 4,
  });
}

// 10. Keputusan rancangan, kendala, pengembangan
{
  const slide = newSlide("Hasil", "KONTEN", SLIDES[9]);
  const colW = (W - 2 * MARGIN - 0.6) / 3;
  const cols = [
    ["Keputusan rancangan", C.text2, [
      "Autentikasi lokal; SSO BPS belum tersedia",
      "SQLite saat pengembangan, PostgreSQL untuk produksi",
      "Lapisan penyedia data agar siap diganti WebAPI BPS",
    ]],
    ["Kendala", C.accent3, [
      "7 nilai sumber salah format tampilan, mis. “912.879” untuk 912,879",
      "Kini divalidasi sebelum ditampilkan",
      "Spesifikasi infrastruktur BPS belum tersedia",
    ]],
    ["Pengembangan lanjutan", C.accent2, [
      "Integrasi SSO dan WebAPI resmi BPS",
      "Modul manajemen pengguna dan pengaturan",
      "Notifikasi pengajuan dan hasil review",
    ]],
  ];
  cols.forEach(([head, color, items], i) => {
    const x = MARGIN + i * (colW + 0.3);
    card(slide, x, 1.55, colW, 3.85, `kolom-${i + 1}`);
    slide.addShape(pres.ShapeType.ellipse, { x: x + 0.3, y: 1.85, w: 0.32, h: 0.32, fill: { color }, line: { color, width: 0 }, objectName: `penanda-${i + 1}` });
    text(slide, head, { x: x + 0.8, y: 1.8, w: colW - 1.1, h: 0.45, fontSize: 18, bold: true, color: C.text2 });
    text(slide, items.map((item, k) => ({ text: item, options: { bullet: true, breakLine: k < items.length - 1 } })), {
      x: x + 0.3, y: 2.55, w: colW - 0.6, h: 2.7, fontSize: 15, paraSpaceAfter: 10,
    });
  });
  card(slide, MARGIN, 5.65, W - 2 * MARGIN, 1.05, "batas-lingkup", C.text2);
  text(slide, [
    { text: "Di luar ruang lingkup proyek: ", options: { bold: true } },
    { text: "SSO BPS, WebAPI resmi BPS, hosting produksi, serta modul manajemen pengguna dan pengaturan." },
  ], { x: MARGIN + 0.35, y: 5.65, w: W - 2 * MARGIN - 0.7, h: 1.05, valign: "middle", fontSize: 15, color: C.background1 });
}

// 11. Kontribusi anggota
{
  const slide = newSlide("Penutup", "KONTEN", SLIDES[10]);
  const cardW = (W - 2 * MARGIN - 0.3) / 2;
  members.forEach((m, i) => {
    const x = MARGIN + (i % 2) * (cardW + 0.3);
    const y = 1.55 + Math.floor(i / 2) * 2.6;
    const isLead = i === 0;
    card(slide, x, y, cardW, 2.35, `anggota-${i + 1}`, isLead ? C.text2 : C.background2);
    text(slide, m.name, { x: x + 0.35, y: y + 0.25, w: cardW - 0.7, h: 0.45, fontSize: 19, bold: true, color: isLead ? C.background1 : C.text2 });
    text(slide, `${m.nim} · ${m.role}`, { x: x + 0.35, y: y + 0.72, w: cardW - 0.7, h: 0.35, fontSize: 13, color: isLead ? C.accent4 : C.accent5 });
    text(slide, m.contribution, { x: x + 0.35, y: y + 1.12, w: cardW - 0.7, h: 1.1, fontSize: 13, color: isLead ? C.background1 : C.text1 });
  });
}

// 12. Kesimpulan dan penutup
{
  const slide = newSlide("Penutup", "PENUTUP", SLIDES[11]);
  const points = [
    "Indikator strategis dapat ditelusuri dan diunduh publik tanpa login",
    "Setiap perubahan angka melewati persetujuan Administrator",
    "Seluruh aktivitas penting tercatat pada jejak audit",
    "Seluruh skenario pengujian lulus; siap diintegrasikan dengan infrastruktur BPS",
  ];
  points.forEach((point, i) => {
    const y = 1.6 + i * 0.95;
    badge(slide, i + 1, MARGIN, y, C.accent2, 0.5);
    text(slide, point, { x: MARGIN + 0.75, y: y + 0.07, w: 7.2, h: 0.5, fontSize: 17, color: C.background1 });
  });
  text(slide, "Terima kasih", { x: 8.9, y: 2.2, w: 3.8, h: 1.0, fontSize: 40, bold: true, color: C.background1, fontFace: THEME.headFontFace, align: "right" });
  text(slide, "Sesi tanya jawab", { x: 8.9, y: 3.2, w: 3.8, h: 0.5, fontSize: 20, color: C.accent4, align: "right" });
}

/* ============================================================ tema pptx */

/** Menulis palet THEME ke ppt/theme/theme1.xml (pptxgenjs memakai palet Office bawaan). */
async function applyThemeColors(file) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  const path = "ppt/theme/theme1.xml";
  let xml = await zip.file(path).async("string");
  for (const [key, hex] of Object.entries(HEX)) {
    xml = xml.replace(new RegExp(`(<a:${key}>)[\\s\\S]*?(</a:${key}>)`), `$1<a:srgbClr val="${hex}"/>$2`);
  }
  xml = xml.replace(/<a:clrScheme name="[^"]*">/, `<a:clrScheme name="${THEME.name}">`);
  zip.file(path, xml);
  writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

/* ========================================================== skrip (PDF) */

function buildScriptDocument() {
  const total = SLIDES.reduce((sum, s) => sum + s.seconds, 0);
  const bySpeaker = members.map((m) => {
    const owned = SLIDES.map((s, i) => [s, i + 1]).filter(([s]) => s.speaker === m);
    return [m.name, owned.map(([, n]) => n).join(", "), formatDuration(owned.reduce((sum, [s]) => sum + s.seconds, 0))];
  });

  const children = [
    centered("SKRIP PRESENTASI HASIL CAPSTONE PROJECT", { bold: true, size: 28, after: 120 }),
    centered(TITLE_SHORT.toUpperCase(), { bold: true, after: 120 }),
    centered(`${GROUP_NAME} · Program Studi Teknik Informatika STMIK Lombok · ${YEAR}`, { after: 360 }),
    p(
      `Skrip ini mendampingi berkas presentasi hasil (Tugas 3). Sesuai Panduan Capstone Project, presentasi berlangsung 10–15 menit dan seluruh anggota berbicara bergantian. Total durasi naskah adalah ${formatDuration(total)} menit untuk ${SLIDES.length} slide; sisa waktu digunakan untuk sesi tanya jawab. Naskah yang sama tersimpan sebagai catatan pembicara (speaker notes) pada setiap slide.`
    ),
    ...table("Pembagian pembicara", ["Pembicara", "Slide", "Durasi"], bySpeaker, [5, 3, 2]),
    ...SLIDES.flatMap((s, i) => [
      h2(`Slide ${i + 1}. ${s.title}`),
      plain(`Pembicara: ${s.speaker.name}   ·   Durasi: ${formatDuration(s.seconds)}`, { italics: true, after: 120, keepNext: true }),
      ...s.script.map((line) => p(line)),
    ]),
    h2("Persiapan Sesi Tanya Jawab"),
    ...table(
      "Antisipasi pertanyaan penguji",
      ["Pertanyaan", "Poin jawaban"],
      [
        ["Mengapa tidak langsung memakai SSO BPS?", "Spesifikasi SSO belum tersedia; autentikasi lokal dipakai agar sistem dapat diuji. Lapisan autentikasi dipisah sehingga dapat diganti."],
        ["Bagaimana menjamin data publik tidak berubah sebelum disetujui?", "Data resmi (Observation) dan usulan (DataChange) disimpan terpisah; hanya aksi Setujui & Publish oleh Administrator yang memindahkan nilai."],
        ["Apa yang terjadi jika Operator memanggil API persetujuan langsung?", "Server memeriksa peran pada setiap permintaan dan menolak dengan HTTP 403; sudah diuji otomatis."],
        ["Mengapa warna perubahan tidak merah-hijau?", "Warna mengikuti makna (membaik/memburuk) dan pasangan teal-oranye lolos uji buta warna, sedangkan merah-hijau tidak."],
        ["Bagaimana jika data sumber salah?", "Format tampilan divalidasi terhadap angka tersimpan; tujuh ketidaksesuaian sudah ditemukan dan ditangani."],
        ["Apa langkah menuju produksi?", "Integrasi SSO dan WebAPI BPS, PostgreSQL, HTTPS, pencadangan, dan pemantauan bersama tim infrastruktur BPS."],
      ],
      [4, 6]
    ),
    spacer(120),
  ];

  return new Document({
    creator: GROUP_NAME,
    title: `Skrip Presentasi: ${TITLE_SHORT}`,
    styles: documentStyles,
    numbering: numberingConfig,
    sections: [{ properties: { page: { margin: pageMargins() } }, footers: { default: pageNumberFooter() }, children }],
  });
}

/* ================================================================= main */

async function main() {
  await pres.writeFile({ fileName: PPTX_OUT });
  await applyThemeColors(PPTX_OUT);
  console.log("Ditulis:", PPTX_OUT);

  writeFileSync(SCRIPT_DOCX, await Packer.toBuffer(buildScriptDocument()));
  try {
    execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", resolve("scripts/update-docx-fields.ps1"), SCRIPT_DOCX], { stdio: "inherit" });
    unlinkSync(SCRIPT_DOCX); // yang diserahkan hanya PDF skrip
    console.log("Ditulis:", SCRIPT_DOCX.replace(/\.docx$/, ".pdf"));
  } catch {
    console.log("Word tidak tersedia: skrip disimpan sebagai .docx; simpan sebagai PDF secara manual.", existsSync(SCRIPT_DOCX) ? SCRIPT_DOCX : "");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
