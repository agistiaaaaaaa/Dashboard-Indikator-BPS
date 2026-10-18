/**
 * Polished Capstone PowerPoint — consulting / institutional style.
 * Facts unchanged. Usage: node scripts/generate-capstone-presentation.mjs
 */
import PptxGenJS from "pptxgenjs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(
  process.env.CAPSTONE_PPTX_OUT ||
    "docs/CAPSTONE_PRESENTATION_BPS_LOMBOK_TENGAH.pptx"
);
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

function img(name) {
  const p = resolve(ASSETS, name);
  return existsSync(p) ? p : null;
}

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
pptx.layout = "WIDE";
pptx.author = "Capstone Project BPS Lombok Tengah";
pptx.title = "Dashboard Indikator Strategis — Capstone Presentation";
pptx.subject = "STMIK Lombok 2026";

function canvas(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: WARM },
  });
}

function chrome(slide, sectionLabel, page, total = 12) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.06,
    fill: { color: GREEN },
  });
  slide.addText("CAPSTONE PROJECT  ·  DASHBOARD INDIKATOR STRATEGIS", {
    x: 0.45,
    y: 0.18,
    w: 7.2,
    h: 0.22,
    fontSize: 9,
    color: MUTED,
    fontFace: FONT,
    bold: true,
  });
  slide.addText(sectionLabel, {
    x: 7.6,
    y: 0.18,
    w: 1.95,
    h: 0.22,
    fontSize: 9,
    color: GREEN,
    fontFace: FONT,
    bold: true,
    align: "right",
  });
  slide.addText(`BPS Lombok Tengah  ·  ${String(page).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: 0.45,
    y: 5.28,
    w: 9.1,
    h: 0.22,
    fontSize: 9,
    color: MUTED,
    fontFace: FONT,
  });
}

function title(slide, text, y = 0.45) {
  slide.addText(text, {
    x: 0.45,
    y,
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
    s.addImage({
      path: dash,
      x: 5.4,
      y: 1.1,
      w: 4.2,
      h: 2.35,
    });
    s.addShape(pptx.ShapeType.rect, {
      x: 5.4,
      y: 1.1,
      w: 4.2,
      h: 2.35,
      fill: { type: "none" },
      line: { color: "2A6B4E", width: 1 },
    });
  }
  s.addText("CAPSTONE PROJECT", {
    x: 0.55,
    y: 0.9,
    w: 4.6,
    h: 0.3,
    fontSize: 12,
    color: "A8C9B8",
    fontFace: FONT,
    bold: true,
  });
  s.addText("DASHBOARD\nINDIKATOR\nSTRATEGIS", {
    x: 0.55,
    y: 1.35,
    w: 4.8,
    h: 2.1,
    fontSize: 34,
    bold: true,
    color: WHITE,
    fontFace: FONT,
    margin: 0,
  });
  s.addText("BPS KABUPATEN LOMBOK TENGAH", {
    x: 0.55,
    y: 3.6,
    w: 4.8,
    h: 0.35,
    fontSize: 14,
    color: "D7EBE1",
    fontFace: FONT,
  });
  s.addText(
    "[NAMA MAHASISWA]  ·  NIM [NIM]\nTeknik Informatika  ·  STMIK Lombok  ·  2026",
    {
      x: 0.55,
      y: 4.35,
      w: 8.5,
      h: 0.6,
      fontSize: 13,
      color: "B7D4C6",
      fontFace: FONT,
    }
  );
  s.addNotes(
    "Selamat pagi Bapak/Ibu penguji. Saya [NAMA], NIM [NIM]. Saya akan mempresentasikan Capstone Project Dashboard Indikator Strategis untuk BPS Kabupaten Lombok Tengah. Presentasi ini sekitar dua belas sampai empat belas menit, mencakup masalah, desain, implementasi, pengujian, dan arah integrasi."
  );
}

// ===== 02 PROBLEM =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "02  /  MASALAH", 2);
  title(s, "The Problem");
  const items = [
    {
      n: "01",
      t: "Akses indikator",
      d: "Publik membutuhkan cara mudah melihat, memfilter, dan mengekspor indikator strategis.",
    },
    {
      n: "02",
      t: "Pemutakhiran data",
      d: "Perubahan nilai harus dapat diusulkan secara terstruktur tanpa langsung mengubah data publik.",
    },
    {
      n: "03",
      t: "Review & publication",
      d: "Diperlukan peninjauan, penolakan, publikasi, serta jejak audit sebelum data resmi berubah.",
    },
  ];
  items.forEach((it, i) => {
    const y = 1.15 + i * 1.2;
    s.addText(it.n, {
      x: 0.5,
      y,
      w: 0.9,
      h: 0.45,
      fontSize: 22,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
    s.addText(it.t, {
      x: 1.5,
      y,
      w: 7.8,
      h: 0.35,
      fontSize: 18,
      bold: true,
      color: INK,
      fontFace: FONT,
    });
    s.addText(it.d, {
      x: 1.5,
      y: y + 0.4,
      w: 7.8,
      h: 0.45,
      fontSize: 14,
      color: MUTED,
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Pada bagian ini saya menjelaskan tiga masalah inti. Pertama, akses publik terhadap indikator. Kedua, bagaimana data diusulkan tanpa langsung tampil. Ketiga, kebutuhan review, publikasi, dan audit agar perubahan terkendali."
  );
}

// ===== 03 SOLUTION =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "03  /  SOLUSI", 3);
  title(s, "Solution Overview");
  const boxes = [
    { t: "PROBLEM", d: "Akses + kontrol data" },
    { t: "PLATFORM", d: "Dashboard full-stack" },
    { t: "USERS", d: "Publik · Operator · Admin" },
  ];
  boxes.forEach((b, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.2,
      w: 2.95,
      h: 1.5,
      fill: { color: i === 1 ? GREEN : WHITE },
      rectRadius: 0.08,
      line: { color: LINE, width: 1 },
    });
    s.addText(b.t, {
      x,
      y: 1.45,
      w: 2.95,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: i === 1 ? WHITE : GREEN,
      align: "center",
      fontFace: FONT,
    });
    s.addText(b.d, {
      x: x + 0.15,
      y: 1.95,
      w: 2.65,
      h: 0.45,
      fontSize: 13,
      color: i === 1 ? "D7EBE1" : MUTED,
      align: "center",
      fontFace: FONT,
    });
  });
  const values = [
    { t: "ACCESS", d: "Dashboard publik" },
    { t: "CONTROL", d: "Workflow review" },
    { t: "TRACEABILITY", d: "Audit trail" },
  ];
  values.forEach((v, i) => {
    const x = 0.5 + i * 3.15;
    s.addText(v.t, {
      x,
      y: 3.2,
      w: 2.95,
      h: 0.35,
      fontSize: 16,
      bold: true,
      color: GREEN,
      align: "center",
      fontFace: FONT,
    });
    s.addText(v.d, {
      x,
      y: 3.55,
      w: 2.95,
      h: 0.3,
      fontSize: 13,
      color: MUTED,
      align: "center",
      fontFace: FONT,
    });
  });
  s.addText("Scope lanjutan BPS: SSO · WebAPI · hosting produksi — belum termasuk.", {
    x: 0.5,
    y: 4.35,
    w: 9,
    h: 0.35,
    fontSize: 12,
    color: MUTED,
    fontFace: FONT,
  });
  s.addNotes(
    "Solusinya adalah platform digital yang memisahkan akses publik dari ruang kerja internal. Tiga nilai utamanya: akses data, kontrol melalui workflow, dan ketertelusuran melalui audit. Integrasi SSO dan infrastruktur produksi BPS merupakan tahap berikutnya."
  );
}

// ===== 04 NEEDS =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "04  /  ANALISIS", 4);
  title(s, "Analisis Kebutuhan");
  const actors = [
    { role: "PUBLIK", need: "READ\nPublished data\nFilter · Export", fill: WHITE },
    { role: "OPERATOR", need: "UPDATE\nDraft & Submit\nOwn submissions", fill: SOFT },
    { role: "ADMIN", need: "REVIEW\nReject / Publish\nAudit trail", fill: GREEN },
  ];
  actors.forEach((a, i) => {
    const x = 0.55 + i * 3.1;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.25,
      w: 2.9,
      h: 3.2,
      fill: { color: a.fill },
      rectRadius: 0.1,
      line: { color: LINE, width: 1 },
    });
    s.addText(a.role, {
      x,
      y: 1.55,
      w: 2.9,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: a.fill === GREEN ? WHITE : GREEN,
      align: "center",
      fontFace: FONT,
    });
    s.addText(a.need, {
      x: x + 0.2,
      y: 2.3,
      w: 2.5,
      h: 1.6,
      fontSize: 15,
      color: a.fill === GREEN ? "E8F2EC" : INK,
      align: "center",
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Pada proyek ini kami memisahkan pengguna menjadi tiga peran. Publik hanya membaca data published. Operator menyusun usulan. Admin memutuskan publikasi dan memantau audit. Pembatasan ditegakkan di server."
  );
}

// ===== 05 ARCHITECTURE =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "05  /  DESAIN", 5);
  title(s, "System Architecture");
  const layers = [
    "React / Vite  ·  Frontend",
    "API Client  ·  JWT Cookie",
    "Express API  ·  Auth  ·  RBAC",
    "Prisma ORM",
    "Database  ·  Observation + DataChange",
  ];
  layers.forEach((label, i) => {
    const y = 1.15 + i * 0.68;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 1.6,
      y,
      w: 6.8,
      h: 0.55,
      fill: { color: i === layers.length - 1 ? GREEN : WHITE },
      rectRadius: 0.06,
      line: { color: LINE, width: 1 },
    });
    s.addText(label, {
      x: 1.6,
      y: y + 0.1,
      w: 6.8,
      h: 0.35,
      fontSize: 15,
      bold: true,
      color: i === layers.length - 1 ? WHITE : INK,
      align: "center",
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Arsitektur memisahkan frontend React dari backend Express. Autentikasi memakai JWT pada cookie HttpOnly. Data published disimpan di Observation, sementara usulan perubahan ada di DataChange."
  );
}

// ===== 06 UI/UX =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "06  /  UI UX", 6);
  title(s, "Desain & UI/UX");
  const shots = [
    ["02-dashboard.png", "Dashboard"],
    ["03-detail-drawer.png", "Detail"],
    ["04-login.png", "Login"],
  ];
  shots.forEach((pair, i) => {
    const x = 0.45 + i * 3.15;
    const p = img(pair[0]);
    if (p) {
      s.addImage({ path: p, x, y: 1.1, w: 3.0, h: 1.7 });
      s.addShape(pptx.ShapeType.rect, {
        x,
        y: 1.1,
        w: 3.0,
        h: 1.7,
        fill: { type: "none" },
        line: { color: LINE, width: 1 },
      });
    }
    s.addText(pair[1], {
      x,
      y: 2.9,
      w: 3.0,
      h: 0.28,
      fontSize: 12,
      color: MUTED,
      align: "center",
      fontFace: FONT,
    });
  });
  ["CLARITY", "CONSISTENCY", "RESPONSIVENESS"].forEach((lab, i) => {
    const x = 0.45 + i * 3.15;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 3.45,
      w: 3.0,
      h: 0.85,
      fill: { color: WHITE },
      rectRadius: 0.08,
      line: { color: LINE, width: 1 },
    });
    s.addText(lab, {
      x,
      y: 3.7,
      w: 3.0,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: GREEN,
      align: "center",
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Pendekatan desain menekankan kejelasan, konsistensi identitas BPS, dan responsivitas. Publik fokus pada keterbacaan data; ruang kerja fokus pada status workflow yang eksplisit."
  );
}

// ===== 07 IMPLEMENTATION =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "07  /  IMPLEMENTASI", 7);
  title(s, "Implementasi");
  const items = [
    ["Public Dashboard", "KPI · chart · explorer · export"],
    ["Authentication", "bcrypt + JWT cookie 8 jam"],
    ["Draft / CRUD", "DataChange sebelum publish"],
    ["Review Workflow", "Reject & Approve/Publish"],
    ["Authorization", "requireAuth / requireRole"],
    ["Audit Trail", "AuditLog untuk Admin"],
  ];
  items.forEach((it, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.45 + col * 3.15;
    const y = 1.2 + row * 1.55;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 3.0,
      h: 1.35,
      fill: { color: WHITE },
      rectRadius: 0.08,
      line: { color: LINE, width: 1 },
    });
    s.addText(it[0], {
      x: x + 0.2,
      y: y + 0.3,
      w: 2.6,
      h: 0.35,
      fontSize: 15,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
    s.addText(it[1], {
      x: x + 0.2,
      y: y + 0.7,
      w: 2.6,
      h: 0.35,
      fontSize: 13,
      color: MUTED,
      fontFace: FONT,
    });
  });
  s.addNotes(
    "Modul yang diimplementasikan mencakup dashboard publik, autentikasi, draft, workflow review, otorisasi server-side, dan audit. Stack aktual: React, Express, Prisma, dan SQLite untuk pengembangan."
  );
}

// ===== 08 WORKFLOW =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "08  /  WORKFLOW", 8);
  title(s, "Workflow Data");
  const steps = [
    { t: "DRAFT", fill: WHITE },
    { t: "PENDING\nREVIEW", fill: SOFT },
    { t: "PUBLISHED", fill: GREEN },
  ];
  steps.forEach((st, i) => {
    const x = 0.7 + i * 3.1;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.35,
      w: 2.6,
      h: 1.35,
      fill: { color: st.fill },
      rectRadius: 0.1,
      line: { color: GREEN, width: 1.5 },
    });
    s.addText(st.t, {
      x,
      y: 1.65,
      w: 2.6,
      h: 0.8,
      fontSize: 18,
      bold: true,
      color: st.fill === GREEN ? WHITE : GREEN,
      align: "center",
      valign: "middle",
      fontFace: FONT,
    });
    if (i < 2) {
      s.addText("→", {
        x: x + 2.55,
        y: 1.75,
        w: 0.5,
        h: 0.5,
        fontSize: 24,
        color: GREEN,
        align: "center",
        fontFace: FONT,
      });
    }
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 3.15,
    w: 8.6,
    h: 1.35,
    fill: { color: WHITE },
    rectRadius: 0.08,
    line: { color: LINE, width: 1 },
  });
  s.addText(
    "REJECTED PATH\nPENDING REVIEW  →  REJECTED  →  EDIT  →  RESUBMIT\nDraft / Pending / Rejected tidak mengubah dashboard publik.",
    {
      x: 1.0,
      y: 3.35,
      w: 8.1,
      h: 1.0,
      fontSize: 14,
      color: INK,
      fontFace: FONT,
    }
  );
  s.addNotes(
    "Inti keamanan data ada di sini. Selama belum Published, publik tetap melihat nilai lama. Jika ditolak, Operator dapat memperbaiki dan mengajukan ulang. Contoh: penduduk 2020 tetap 1029,03 sampai Admin memublikasikan usulan baru."
  );
}

// ===== 09 TESTING =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "09  /  PENGUJIAN", 9);
  title(s, "Pengujian");
  const cards = [
    { v: "44 / 44", l: "AUTOMATED TESTS" },
    { v: "64 / 64", l: "BROWSER QA" },
    { v: "PASS", l: "DATA · BUILD · TYPES" },
  ];
  cards.forEach((c, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.25,
      w: 3.0,
      h: 2.0,
      fill: { color: i === 2 ? WHITE : GREEN },
      rectRadius: 0.1,
      line: { color: LINE, width: 1 },
    });
    s.addText(c.v, {
      x,
      y: 1.7,
      w: 3.0,
      h: 0.7,
      fontSize: 28,
      bold: true,
      color: i === 2 ? GREEN : WHITE,
      align: "center",
      fontFace: FONT,
    });
    s.addText(c.l, {
      x: x + 0.15,
      y: 2.55,
      w: 2.7,
      h: 0.4,
      fontSize: 12,
      color: i === 2 ? MUTED : "D7EBE1",
      align: "center",
      fontFace: FONT,
    });
  });
  s.addText(
    "Functional  ·  Authorization  ·  Workflow  ·  Data Integrity  ·  Responsive",
    {
      x: 0.5,
      y: 3.7,
      w: 9,
      h: 0.4,
      fontSize: 14,
      color: INK,
      align: "center",
      fontFace: FONT,
    }
  );
  s.addText(
    "Seluruh skenario yang dijalankan pada tahap validasi berstatus PASS.",
    {
      x: 0.5,
      y: 4.25,
      w: 9,
      h: 0.35,
      fontSize: 13,
      color: MUTED,
      align: "center",
      fontFace: FONT,
    }
  );
  s.addNotes(
    "Pengujian otomatis empat puluh empat dari empat puluh empat skenario API lulus. Browser QA enam puluh empat dari enam puluh empat lulus, mencakup publik, login, operator, admin, reject, publish, isolasi publik, dan responsive."
  );
}

// ===== 10 RESULT =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "10  /  HASIL", 10);
  title(s, "Hasil & Demonstrasi");
  const left = img("06-pemutakhiran.png");
  const right = img("02-dashboard.png");
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 1.1,
    w: 4.4,
    h: 0.4,
    fill: { color: SOFT },
    rectRadius: 0.04,
  });
  s.addText("BEFORE  ·  Draft / Pending", {
    x: 0.4,
    y: 1.15,
    w: 4.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: GREEN,
    align: "center",
    fontFace: FONT,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 5.2,
    y: 1.1,
    w: 4.4,
    h: 0.4,
    fill: { color: GREEN },
    rectRadius: 0.04,
  });
  s.addText("AFTER  ·  Published", {
    x: 5.2,
    y: 1.15,
    w: 4.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: WHITE,
    align: "center",
    fontFace: FONT,
  });
  if (left) {
    s.addImage({ path: left, x: 0.4, y: 1.65, w: 4.4, h: 2.5 });
    s.addShape(pptx.ShapeType.rect, {
      x: 0.4,
      y: 1.65,
      w: 4.4,
      h: 2.5,
      fill: { type: "none" },
      line: { color: LINE, width: 1 },
    });
  }
  if (right) {
    s.addImage({ path: right, x: 5.2, y: 1.65, w: 4.4, h: 2.5 });
    s.addShape(pptx.ShapeType.rect, {
      x: 5.2,
      y: 1.65,
      w: 4.4,
      h: 2.5,
      fill: { type: "none" },
      line: { color: LINE, width: 1 },
    });
  }
  s.addText(
    "Draft tidak langsung tampil publik. Setelah Admin Setujui & Publish, Observation diperbarui.",
    {
      x: 0.45,
      y: 4.35,
      w: 9.1,
      h: 0.35,
      fontSize: 13,
      color: MUTED,
      fontFace: FONT,
    }
  );
  s.addNotes(
    "Ini demonstrasi kunci produk. Di kiri, Operator menyusun draft. Di kanan, dashboard publik. Nilai baru baru muncul setelah Admin memublikasikan. Itu bukti isolasi data berfungsi."
  );
}

// ===== 11 TRADE-OFF =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "11  /  KEPUTUSAN", 11);
  title(s, "Engineering Decisions");
  const rows = [
    ["Development Auth", "Production SSO"],
    ["SQLite (local)", "PostgreSQL (production)"],
    ["Local Provider", "BPS WebAPI"],
    ["Placeholder Users", "Full user management"],
  ];
  rows.forEach((r, i) => {
    const y = 1.2 + i * 0.7;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.5,
      y,
      w: 4.0,
      h: 0.55,
      fill: { color: WHITE },
      rectRadius: 0.06,
      line: { color: LINE, width: 1 },
    });
    s.addText(r[0], {
      x: 0.7,
      y: y + 0.12,
      w: 3.6,
      h: 0.3,
      fontSize: 14,
      color: INK,
      fontFace: FONT,
    });
    s.addText("→", {
      x: 4.6,
      y: y + 0.05,
      w: 0.7,
      h: 0.4,
      fontSize: 20,
      color: GREEN,
      align: "center",
      fontFace: FONT,
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x: 5.4,
      y,
      w: 4.1,
      h: 0.55,
      fill: { color: SOFT },
      rectRadius: 0.06,
    });
    s.addText(r[1], {
      x: 5.6,
      y: y + 0.12,
      w: 3.7,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: GREEN,
      fontFace: FONT,
    });
  });
  s.addText("Architecture designed for future BPS integration.", {
    x: 0.5,
    y: 4.25,
    w: 9,
    h: 0.35,
    fontSize: 13,
    italics: true,
    color: MUTED,
    fontFace: FONT,
  });
  s.addNotes(
    "Kami membingkai ini sebagai keputusan rekayasa, bukan kelemahan. Autentikasi dan database lokal dipilih agar pengembangan dan demo dapat berjalan sebelum kontrak infrastruktur BPS. Provider seam sudah disiapkan untuk integrasi selanjutnya."
  );
}

// ===== 12 CONCLUSION =====
{
  const s = pptx.addSlide();
  canvas(s);
  chrome(s, "12  /  PENUTUP", 12);
  title(s, "Kesimpulan & Rekomendasi");
  const outcomes = [
    { t: "BUILT", d: "Dashboard + workspace" },
    { t: "TESTED", d: "44/44 · 64/64 PASS" },
    { t: "READY", d: "For BPS integration" },
  ];
  outcomes.forEach((o, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.2,
      w: 3.0,
      h: 1.5,
      fill: { color: i === 2 ? GREEN : WHITE },
      rectRadius: 0.1,
      line: { color: LINE, width: 1 },
    });
    s.addText(o.t, {
      x,
      y: 1.5,
      w: 3.0,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: i === 2 ? WHITE : GREEN,
      align: "center",
      fontFace: FONT,
    });
    s.addText(o.d, {
      x: x + 0.15,
      y: 2.1,
      w: 2.7,
      h: 0.35,
      fontSize: 13,
      color: i === 2 ? "D7EBE1" : MUTED,
      align: "center",
      fontFace: FONT,
    });
  });
  s.addText(
    "Lanjutan: SSO BPS  ·  WebAPI  ·  PostgreSQL  ·  hosting  ·  hardening  ·  modul pengguna",
    {
      x: 0.5,
      y: 3.15,
      w: 9,
      h: 0.4,
      fontSize: 13,
      color: INK,
      align: "center",
      fontFace: FONT,
    }
  );
  s.addText("Terima kasih", {
    x: 0.5,
    y: 3.9,
    w: 9,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: GREEN,
    align: "center",
    fontFace: FONT,
  });
  s.addText("Siap menerima pertanyaan.", {
    x: 0.5,
    y: 4.4,
    w: 9,
    h: 0.3,
    fontSize: 13,
    color: MUTED,
    align: "center",
    fontFace: FONT,
  });
  s.addNotes(
    "Kesimpulan singkat: sistem dibangun, diuji, dan siap untuk integrasi BPS sesuai ruang lingkup yang ditetapkan. Rekomendasi utama adalah SSO, WebAPI, dan infrastruktur produksi. Terima kasih; saya siap menerima pertanyaan."
  );
}

await pptx.writeFile({ fileName: OUT });
console.log("Wrote", OUT);
console.log("Slides: 12");
