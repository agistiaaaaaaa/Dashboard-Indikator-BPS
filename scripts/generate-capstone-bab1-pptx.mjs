/**
 * PowerPoint khusus BAB I — PENDAHULUAN
 * Capstone: Dashboard Indikator Strategis BPS Lombok Tengah
 *
 * Usage: node scripts/generate-capstone-bab1-pptx.mjs
 */
import PptxGenJS from "pptxgenjs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve("docs/CAPSTONE_BAB1_PENDAHULUAN.pptx");
const ASSETS = resolve("docs/guide-assets");

const GREEN = "0A5638";
const GREEN_DARK = "063D28";
const INK = "1C2421";
const MUTED = "5A6B62";
const WARM = "F7FAF8";
const WHITE = "FFFFFF";
const SOFT = "E2F0E8";
const LINE = "D5E0D9";
const FONT = "Calibri";
const TOTAL = 8;

function img(name) {
  const p = resolve(ASSETS, name);
  return existsSync(p) ? p : null;
}

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
pptx.layout = "WIDE";
pptx.author = "Capstone Project BPS Lombok Tengah";
pptx.title = "BAB I Pendahuluan — Dashboard Indikator Strategis";
pptx.subject = "Capstone Project STMIK Lombok 2026";

function canvas(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: WARM },
  });
}

function chrome(slide, sectionLabel, page) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.06,
    fill: { color: GREEN },
  });
  slide.addText("BAB I  ·  PENDAHULUAN  ·  CAPSTONE PROJECT", {
    x: 0.45,
    y: 0.18,
    w: 7.0,
    h: 0.22,
    fontSize: 9,
    color: MUTED,
    fontFace: FONT,
    bold: true,
  });
  slide.addText(sectionLabel, {
    x: 7.3,
    y: 0.18,
    w: 2.25,
    h: 0.22,
    fontSize: 9,
    color: GREEN,
    fontFace: FONT,
    bold: true,
    align: "right",
  });
  slide.addText(
    `Dashboard Indikator Strategis  ·  ${String(page).padStart(2, "0")} / ${String(TOTAL).padStart(2, "0")}`,
    {
      x: 0.45,
      y: 5.28,
      w: 9.1,
      h: 0.22,
      fontSize: 9,
      color: MUTED,
      fontFace: FONT,
    }
  );
}

function title(slide, text) {
  slide.addText(text, {
    x: 0.45,
    y: 0.45,
    w: 9.1,
    h: 0.45,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: FONT,
  });
}

// ===== 01 COVER =====
{
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: GREEN_DARK },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.18,
    h: "100%",
    fill: { color: GREEN },
  });
  const dash = img("02-dashboard.png");
  if (dash) {
    s.addImage({ path: dash, x: 5.5, y: 1.35, w: 4.0, h: 2.25 });
    s.addShape(pptx.ShapeType.rect, {
      x: 5.5,
      y: 1.35,
      w: 4.0,
      h: 2.25,
      fill: { type: "none" },
      line: { color: "2A6B4E", width: 1 },
    });
  }
  s.addText("CAPSTONE PROJECT", {
    x: 0.55,
    y: 1.0,
    w: 4.6,
    h: 0.28,
    fontSize: 12,
    color: "A8C9B8",
    fontFace: FONT,
    bold: true,
  });
  s.addText("BAB I", {
    x: 0.55,
    y: 1.5,
    w: 4.6,
    h: 0.4,
    fontSize: 18,
    color: "D7EBE1",
    fontFace: FONT,
    bold: true,
  });
  s.addText("PENDAHULUAN", {
    x: 0.55,
    y: 1.95,
    w: 4.8,
    h: 0.7,
    fontSize: 36,
    bold: true,
    color: WHITE,
    fontFace: FONT,
  });
  s.addText(
    "Dashboard Indikator Strategis\nBPS Kabupaten Lombok Tengah",
    {
      x: 0.55,
      y: 2.85,
      w: 4.8,
      h: 0.7,
      fontSize: 15,
      color: "D7EBE1",
      fontFace: FONT,
    }
  );
  s.addText("[NAMA MAHASISWA]  ·  NIM [NIM]\nSTMIK Lombok — Teknik Informatika — 2026", {
    x: 0.55,
    y: 4.2,
    w: 8.5,
    h: 0.6,
    fontSize: 13,
    color: "B7D4C6",
    fontFace: FONT,
  });
  s.addNotes(
    "Pada bagian ini saya akan memaparkan Bab I Pendahuluan. Fokusnya: latar belakang masalah, tujuan proyek, ruang lingkup, dan jadwal kegiatan Capstone Dashboard Indikator Strategis BPS Lombok Tengah."
  );
}

// ===== 02 OUTLINE =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "01  /  OUTLINE", 2);
  title(s, "Struktur Bab I");
  const items = [
    { n: "1.1", t: "Latar Belakang", d: "Konteks masalah dan kebutuhan sistem" },
    { n: "1.2", t: "Tujuan", d: "Capaian yang ingin dicapai proyek" },
    { n: "1.3", t: "Ruang Lingkup", d: "Yang termasuk dan yang belum termasuk" },
    { n: "1.4", t: "Jadwal Kegiatan", d: "Tahapan pengerjaan Capstone" },
  ];
  items.forEach((it, i) => {
    const y = 1.15 + i * 0.9;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.5,
      y,
      w: 9.0,
      h: 0.75,
      fill: { color: WHITE },
      rectRadius: 0.08,
      line: { color: LINE, width: 1 },
    });
    s.addText(it.n, {
      x: 0.75,
      y: y + 0.18,
      w: 0.9,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
    s.addText(it.t, {
      x: 1.8,
      y: y + 0.1,
      w: 7.4,
      h: 0.3,
      fontSize: 16,
      bold: true,
      color: INK,
      fontFace: FONT,
    });
    s.addText(it.d, {
      x: 1.8,
      y: y + 0.4,
      w: 7.4,
      h: 0.25,
      fontSize: 13,
      color: MUTED,
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Bab I terdiri dari empat bagian. Saya mulai dari latar belakang, lalu tujuan, ruang lingkup, dan diakhiri jadwal kegiatan."
  );
}

// ===== 03 LATAR BELAKANG =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "1.1  /  LATAR BELAKANG", 3);
  title(s, "Latar Belakang");
  const points = [
    {
      t: "Akses publik",
      d: "Indikator strategis perlu disajikan agar mudah dilihat, difilter, ditelaah, dan diekspor.",
    },
    {
      t: "Pemutakhiran terkontrol",
      d: "Perubahan data internal tidak boleh langsung tampil ke publik tanpa peninjauan.",
    },
    {
      t: "Pemisahan peran",
      d: "Publik, Operator, dan Administrator memiliki kebutuhan serta batasan akses berbeda.",
    },
    {
      t: "Akuntabilitas",
      d: "Diperlukan jejak audit agar proses draft–review–publish dapat ditelusuri.",
    },
  ];
  points.forEach((pt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.45 + col * 4.7;
    const y = 1.15 + row * 1.7;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 4.45,
      h: 1.5,
      fill: { color: WHITE },
      rectRadius: 0.08,
      line: { color: LINE, width: 1 },
    });
    s.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: 0.1,
      h: 1.5,
      fill: { color: GREEN },
    });
    s.addText(pt.t, {
      x: x + 0.3,
      y: y + 0.3,
      w: 3.9,
      h: 0.35,
      fontSize: 16,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
    s.addText(pt.d, {
      x: x + 0.3,
      y: y + 0.7,
      w: 3.9,
      h: 0.6,
      fontSize: 13,
      color: INK,
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Latar belakang proyek ini adalah kebutuhan menyajikan indikator strategis kepada publik, sekaligus memastikan pemutakhiran data internal tetap terkendali. Perubahan harus melalui review sebelum dipublikasikan, dengan pemisahan peran dan jejak audit."
  );
}

// ===== 04 TUJUAN =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "1.2  /  TUJUAN", 4);
  title(s, "Tujuan Proyek");
  const goals = [
    "Membangun dashboard indikator strategis untuk publik",
    "Menyediakan mekanisme pemutakhiran data (Draft)",
    "Menerapkan RBAC: Publik · Operator · Admin",
    "Menerapkan workflow Draft → Review → Publish",
    "Memastikan hanya data Published yang tampil publik",
    "Menyediakan audit trail aktivitas penting",
    "Menyiapkan fondasi integrasi ke infrastruktur BPS",
  ];
  goals.forEach((g, i) => {
    const y = 1.05 + i * 0.5;
    s.addText(String(i + 1).padStart(2, "0"), {
      x: 0.5,
      y,
      w: 0.55,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
    s.addText(g, {
      x: 1.15,
      y,
      w: 8.3,
      h: 0.35,
      fontSize: 14,
      color: INK,
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Tujuan proyek diturunkan dari implementasi aktual. Intinya: dashboard publik, pemutakhiran terkontrol, pemisahan peran, workflow review, isolasi data publik, audit trail, dan fondasi integrasi BPS di tahap lanjutan."
  );
}

// ===== 05 RUANG LINGKUP IN =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "1.3  /  SCOPE", 5);
  title(s, "Ruang Lingkup — Termasuk");
  const items = [
    ["Dashboard publik", "KPI · filter · tren · detail · export"],
    ["Autentikasi lokal", "JWT HttpOnly cookie"],
    ["Workspace staf", "Operator & Administrator"],
    ["Workflow data", "Draft · Review · Publish"],
    ["Audit trail", "Jejak aktivitas penting"],
    ["Pengujian", "API · Browser QA · Integrity"],
  ];
  items.forEach((it, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.45 + col * 3.15;
    const y = 1.2 + row * 1.6;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 3.0,
      h: 1.4,
      fill: { color: WHITE },
      rectRadius: 0.08,
      line: { color: LINE, width: 1 },
    });
    s.addText(it[0], {
      x: x + 0.2,
      y: y + 0.35,
      w: 2.6,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
    s.addText(it[1], {
      x: x + 0.2,
      y: y + 0.75,
      w: 2.6,
      h: 0.35,
      fontSize: 12,
      color: MUTED,
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Yang sudah termasuk dalam proyek: dashboard publik, autentikasi lokal, workspace Operator dan Admin, workflow draft-review-publish, audit trail, serta rangkaian pengujian."
  );
}

// ===== 06 OUT OF SCOPE =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "1.3  /  OUT OF SCOPE", 6);
  title(s, "Ruang Lingkup — Belum Termasuk");
  const items = [
    { t: "SSO BPS", d: "Autentikasi produksi menunggu spesifikasi resmi" },
    { t: "WebAPI produksi BPS", d: "CRUD internal melalui API resmi belum diintegrasikan" },
    { t: "Hosting & DB produksi", d: "Infrastruktur produksi dikelola pihak BPS" },
    { t: "Navbar situs BPS", d: "Entry point disiapkan; integrasi penuh menunggu" },
    { t: "Modul Pengguna & Pengaturan", d: "Saat ini masih halaman placeholder" },
  ];
  items.forEach((it, i) => {
    const y = 1.1 + i * 0.7;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.5,
      y,
      w: 9.0,
      h: 0.58,
      fill: { color: i % 2 === 0 ? WHITE : SOFT },
      rectRadius: 0.06,
    });
    s.addText(it.t, {
      x: 0.75,
      y: y + 0.12,
      w: 3.2,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
    s.addText(it.d, {
      x: 4.1,
      y: y + 0.12,
      w: 5.2,
      h: 0.35,
      fontSize: 13,
      color: INK,
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Bagian ini penting agar ruang lingkup jelas. SSO, WebAPI produksi, hosting, navbar resmi BPS, serta modul pengguna dan pengaturan penuh belum termasuk dan menjadi integrasi lanjutan."
  );
}

// ===== 07 JADWAL =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "1.4  /  JADWAL", 7);
  title(s, "Jadwal Kegiatan");
  const steps = [
    "Analisis kebutuhan & audit dataset",
    "Perancangan arsitektur & UI/UX",
    "Implementasi dashboard publik",
    "Autentikasi & otorisasi",
    "Workspace, CRUD & workflow",
    "Audit trail & integrasi full-stack",
    "Pengujian & polishing",
    "Dokumentasi, laporan & presentasi",
  ];
  steps.forEach((st, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const x = 0.45 + col * 4.7;
    const y = 1.15 + row * 0.85;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 4.5,
      h: 0.7,
      fill: { color: WHITE },
      rectRadius: 0.06,
      line: { color: LINE, width: 1 },
    });
    s.addText(String(i + 1).padStart(2, "0"), {
      x: x + 0.15,
      y: y + 0.18,
      w: 0.55,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
    s.addText(st, {
      x: x + 0.8,
      y: y + 0.18,
      w: 3.5,
      h: 0.35,
      fontSize: 13,
      color: INK,
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Jadwal mengikuti tahapan aktual proyek: dari analisis dan desain, implementasi publik hingga workflow, pengujian, lalu dokumentasi dan presentasi Capstone. Tanggal rinci menyesuaikan log kegiatan mahasiswa."
  );
}

// ===== 08 RINGKAS =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "RINGKASAN", 8);
  title(s, "Ringkasan Bab I");
  const cards = [
    { t: "MASALAH", d: "Akses publik + pemutakhiran terkendali" },
    { t: "TUJUAN", d: "Dashboard, RBAC, workflow, audit" },
    { t: "SCOPE", d: "Core app selesai; integrasi BPS lanjut" },
  ];
  cards.forEach((c, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.35,
      w: 3.0,
      h: 2.0,
      fill: { color: i === 1 ? GREEN : WHITE },
      rectRadius: 0.1,
      line: { color: LINE, width: 1 },
    });
    s.addText(c.t, {
      x,
      y: 1.75,
      w: 3.0,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: i === 1 ? WHITE : GREEN,
      align: "center",
      fontFace: FONT,
    });
    s.addText(c.d, {
      x: x + 0.2,
      y: 2.35,
      w: 2.6,
      h: 0.6,
      fontSize: 13,
      color: i === 1 ? "D7EBE1" : MUTED,
      align: "center",
      fontFace: FONT,
    });
  });
  s.addText("Lanjut ke Bab II — Tinjauan Pustaka, atau demonstrasi sistem.", {
    x: 0.5,
    y: 3.8,
    w: 9,
    h: 0.4,
    fontSize: 14,
    color: MUTED,
    align: "center",
    fontFace: FONT,
  });
  s.addText("Terima kasih", {
    x: 0.5,
    y: 4.35,
    w: 9,
    h: 0.4,
    fontSize: 22,
    bold: true,
    color: GREEN,
    align: "center",
    fontFace: FONT,
  });
  s.addNotes(
    "Sebagai penutup Bab I: masalahnya jelas, tujuannya terukur, ruang lingkupnya tegas, dan jadwalnya mengikuti tahapan rekayasa sistem. Saya siap melanjutkan ke bab berikutnya atau menjawab pertanyaan."
  );
}

await pptx.writeFile({ fileName: OUT });
console.log("Wrote", OUT);
console.log("Slides:", TOTAL);
