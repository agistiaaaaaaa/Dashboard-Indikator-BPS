/**
 * Polished LAPORAN AKHIR CAPSTONE (.docx)
 * Premium Institutional Technology Report — facts unchanged.
 * Usage: node scripts/generate-capstone-report.mjs
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
  TableOfContents,
  TextRun,
  VerticalAlign,
  WidthType,
  convertInchesToTwip,
} from "docx";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(
  process.env.CAPSTONE_DOCX_OUT ||
    "docs/LAPORAN_AKHIR_CAPSTONE_BPS_LOMBOK_TENGAH.docx"
);
const ASSETS = resolve("docs/guide-assets");
const FIGURES = resolve("docs/figures");
const HERO = resolve("public/landing/hero-lombok.png");
const DASH = resolve("docs/guide-assets/02-dashboard.png");

const APP_VERSION = "1.0.0";
const DOC_YEAR = "2026";
const DOC_DATE = "21 September 2026";
const SHA256 =
  "577FB7132364ED822A88C9E3B50ECE97B13CC0E8030EB0F190F6C96648517F3B";

/* Color system — max 5 */
const GREEN = "0A5638";
const CHARCOAL = "1C2421";
const MUTED = "5A6B62";
const WARM = "F7FAF8";
const SOFT = "E2F0E8";
const LINE = "D5E0D9";
const WHITE = "FFFFFF";
const WARN = "F8F1E3";

const FONT_BODY = "Calibri";
const FONT_HEAD = "Georgia";

const hair = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const none = { style: BorderStyle.NONE, size: 0, color: WHITE };
const borders = { top: hair, bottom: hair, left: hair, right: hair };
const noBorders = { top: none, bottom: none, left: none, right: none };
const frameBorder = {
  style: BorderStyle.SINGLE,
  size: 8,
  color: LINE,
};
const frameBorders = {
  top: frameBorder,
  bottom: frameBorder,
  left: frameBorder,
  right: frameBorder,
};

let figNo = 0;
let tabNo = 0;
const figList = [];
const tabList = [];

function tr(text, o = {}) {
  return new TextRun({
    text,
    bold: o.bold,
    italics: o.italics,
    size: o.size ?? 22,
    color: o.color ?? CHARCOAL,
    font: o.font ?? FONT_BODY,
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.BOTH,
    spacing: {
      after: opts.spaceAfter ?? 140,
      before: opts.spaceBefore ?? 0,
      line: opts.line ?? 276,
    },
    keepNext: opts.keepNext,
    keepLines: opts.keepLines,
    indent: opts.indent,
    children: [
      tr(text, {
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 22,
        color: opts.color,
        font: opts.font,
      }),
    ],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [] });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    keepNext: true,
    children: [
      tr(text, { bold: true, size: 24, color: GREEN, font: FONT_HEAD }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    keepNext: true,
    children: [
      tr(text, { bold: true, size: 22, color: CHARCOAL, font: FONT_HEAD }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 70, line: 276 },
    children: [tr(text, { size: 22 })],
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 70, line: 276 },
    children: [tr(text, { size: 22 })],
  });
}

function cell(text, opts = {}) {
  const w = opts.width ?? 2340;
  return new TableCell({
    borders: opts.noBorder ? noBorders : borders,
    width: { size: w, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { after: 36, before: 36 },
        children: [
          tr(String(text), {
            bold: opts.bold,
            size: opts.fontSize ?? 18,
            color: opts.color ?? CHARCOAL,
            font: opts.font ?? FONT_BODY,
          }),
        ],
      }),
    ],
  });
}

function simpleTable(headers, rows, caption) {
  tabNo += 1;
  const label = `Tabel ${tabNo}. ${caption}`;
  tabList.push({ n: tabNo, caption });
  const colW = Math.floor(9360 / headers.length);
  return [
    new Paragraph({
      spacing: { before: 160, after: 80 },
      keepNext: true,
      alignment: AlignmentType.CENTER,
      children: [tr(label, { bold: true, size: 18, color: MUTED })],
    }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: headers.map(() => colW),
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map((h) =>
            cell(h, {
              bold: true,
              fill: GREEN,
              color: WHITE,
              width: colW,
              align: AlignmentType.CENTER,
              fontSize: 18,
            })
          ),
        }),
        ...rows.map(
          (r, i) =>
            new TableRow({
              children: r.map((c) =>
                cell(c, {
                  width: colW,
                  fill: i % 2 === 1 ? WARM : WHITE,
                  fontSize: 18,
                })
              ),
            })
        ),
      ],
    }),
    spacer(160),
  ];
}

function metricCards(items) {
  const n = items.length;
  const colW = Math.floor(9360 / n);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: items.map(() => colW),
    rows: [
      new TableRow({
        children: items.map((it) =>
          new TableCell({
            borders,
            width: { size: colW, type: WidthType.DXA },
            shading: { fill: it.fill ?? SOFT },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 40 },
                children: [
                  tr(it.value, {
                    bold: true,
                    size: 36,
                    color: GREEN,
                    font: FONT_HEAD,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [tr(it.label, { size: 16, color: MUTED, bold: true })],
              }),
            ],
          })
        ),
      }),
    ],
  });
}

function callout(kind, body) {
  const fill = kind === "PENTING" || kind === "PERHATIAN" ? WARN : SOFT;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [120, 9240],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 120, type: WidthType.DXA },
            shading: { fill: GREEN },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 9240, type: WidthType.DXA },
            shading: { fill },
            children: [
              new Paragraph({
                spacing: { before: 80, after: 40 },
                indent: { left: 120 },
                children: [tr(kind, { bold: true, size: 16, color: GREEN })],
              }),
              new Paragraph({
                spacing: { after: 80 },
                indent: { left: 120, right: 120 },
                children: [tr(body, { size: 18 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function loadImg(path, width, height) {
  if (!existsSync(path)) return null;
  return new ImageRun({
    type: "png",
    data: readFileSync(path),
    transformation: { width, height },
    altText: { title: path, description: path, name: path },
  });
}

function figure(file, caption, explanation, width = 460, height = 260, base = ASSETS) {
  figNo += 1;
  const label = `Gambar ${figNo}. ${caption}`;
  figList.push({ n: figNo, caption });
  const path = resolve(base, file);
  const img = loadImg(path, width, height);
  const nodes = [];

  if (img) {
    nodes.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: frameBorders,
                width: { size: 9360, type: WidthType.DXA },
                shading: { fill: WHITE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 80, after: 80 },
                    children: [img],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    nodes.push(
      p(`[Gambar tidak tersedia: ${file}]`, {
        italics: true,
        align: AlignmentType.CENTER,
        color: MUTED,
      })
    );
  }

  nodes.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: explanation ? 60 : 160 },
      keepLines: true,
      children: [tr(label, { bold: true, size: 18, color: MUTED })],
    })
  );

  if (explanation) {
    nodes.push(
      p(explanation, {
        size: 20,
        italics: true,
        color: MUTED,
        spaceAfter: 200,
        align: AlignmentType.BOTH,
      })
    );
  }

  return nodes;
}

function flowBox(label, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width ?? 2200, type: WidthType.DXA },
    shading: { fill: opts.fill ?? SOFT },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
        children: [
          tr(label, {
            bold: true,
            size: 18,
            color: opts.color ?? GREEN,
            font: FONT_HEAD,
          }),
        ],
      }),
    ],
  });
}

function arrowCell(width = 600) {
  return new TableCell({
    borders: noBorders,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [tr("→", { bold: true, size: 28, color: GREEN })],
      }),
    ],
  });
}

function chapterDivider(num, roman, title, subtitle) {
  return [
    pageBreak(),
    spacer(1200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [tr(num, { bold: true, size: 72, color: GREEN, font: FONT_HEAD })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 60 },
      children: [
        tr(`BAB ${roman}`, {
          bold: true,
          size: 22,
          color: MUTED,
          font: FONT_BODY,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 200 },
      children: [
        tr(title, { bold: true, size: 36, color: CHARCOAL, font: FONT_HEAD }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: GREEN, space: 12 },
      },
      children: [],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 200 },
      children: [tr(subtitle, { size: 22, color: MUTED, italics: true })],
    }),
    pageBreak(),
  ];
}

function tocLine(label, indent = 0) {
  return new Paragraph({
    spacing: { after: 60, line: 276 },
    indent: { left: indent },
    children: [tr(label, { size: 22, color: CHARCOAL })],
  });
}

async function build() {
  const children = [];

  // ========== COVER ==========
  children.push(
    spacer(200),
    p("SEKOLAH TINGGI MANAJEMEN INFORMATIKA DAN KOMPUTER", {
      align: AlignmentType.CENTER,
      size: 16,
      color: MUTED,
      bold: true,
      spaceAfter: 40,
    }),
    p("STMIK LOMBOK  ·  PROGRAM STUDI TEKNIK INFORMATIKA", {
      align: AlignmentType.CENTER,
      size: 16,
      color: MUTED,
      spaceAfter: 280,
    })
  );

  // thin accent
  children.push(
    new Table({
      width: { size: 2400, type: WidthType.DXA },
      columnWidths: [2400],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 2400, type: WidthType.DXA },
              shading: { fill: GREEN },
              children: [new Paragraph({ spacing: { after: 0 }, children: [] })],
            }),
          ],
        }),
      ],
    }),
    spacer(280)
  );

  children.push(
    p("LAPORAN AKHIR", {
      align: AlignmentType.CENTER,
      size: 28,
      bold: true,
      color: MUTED,
      spaceAfter: 40,
      font: FONT_BODY,
    }),
    p("CAPSTONE PROJECT", {
      align: AlignmentType.CENTER,
      size: 28,
      bold: true,
      color: MUTED,
      spaceAfter: 360,
      font: FONT_BODY,
    }),
    p("DASHBOARD", {
      align: AlignmentType.CENTER,
      size: 44,
      bold: true,
      color: CHARCOAL,
      spaceAfter: 20,
      font: FONT_HEAD,
    }),
    p("INDIKATOR STRATEGIS", {
      align: AlignmentType.CENTER,
      size: 44,
      bold: true,
      color: GREEN,
      spaceAfter: 160,
      font: FONT_HEAD,
    }),
    p("BPS KABUPATEN LOMBOK TENGAH", {
      align: AlignmentType.CENTER,
      size: 24,
      bold: true,
      color: CHARCOAL,
      spaceAfter: 280,
    })
  );

  if (existsSync(DASH)) {
    const dashImg = loadImg(DASH, 420, 236);
    if (dashImg) {
      children.push(
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: frameBorders,
                  width: { size: 9360, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 60, after: 60 },
                      children: [dashImg],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        spacer(280)
      );
    }
  } else if (existsSync(HERO)) {
    const hero = loadImg(HERO, 420, 180);
    if (hero) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          children: [hero],
        })
      );
    }
  }

  children.push(
    p("Disusun oleh", {
      align: AlignmentType.CENTER,
      size: 18,
      color: MUTED,
      spaceAfter: 40,
    }),
    p("[NAMA MAHASISWA]", {
      align: AlignmentType.CENTER,
      size: 24,
      bold: true,
      spaceAfter: 20,
    }),
    p("NIM  [NIM]", {
      align: AlignmentType.CENTER,
      size: 20,
      color: MUTED,
      spaceAfter: 160,
    }),
    p("Dosen Pembimbing", {
      align: AlignmentType.CENTER,
      size: 18,
      color: MUTED,
      spaceAfter: 40,
    }),
    p("[NAMA DOSEN PEMBIMBING]", {
      align: AlignmentType.CENTER,
      size: 22,
      bold: true,
      spaceAfter: 280,
    }),
    p(DOC_YEAR, {
      align: AlignmentType.CENTER,
      size: 28,
      bold: true,
      color: GREEN,
      font: FONT_HEAD,
      spaceAfter: 40,
    }),
    pageBreak()
  );

  // ========== METADATA ==========
  children.push(
    h2("Informasi Dokumen"),
    ...simpleTable(
      ["Informasi", "Keterangan"],
      [
        ["Judul Proyek", "Dashboard Indikator Strategis BPS Kabupaten Lombok Tengah"],
        ["Jenis Dokumen", "Laporan Akhir Capstone Project"],
        ["Versi Aplikasi", APP_VERSION],
        ["Institusi", "STMIK Lombok — Teknik Informatika"],
        ["Mitra Domain", "BPS Kabupaten Lombok Tengah"],
        ["Tanggal", DOC_DATE],
        ["Status", "Berdasarkan implementasi aktual repositori"],
      ],
      "Informasi dokumen"
    ),
    callout(
      "CATATAN",
      "Identitas mahasiswa, NIM, dan dosen pembimbing belum tersedia di repositori. Lengkapi placeholder sebelum pengumpulan final."
    ),
    pageBreak()
  );

  // ========== PERNYATAAN ==========
  children.push(
    h2("Surat Pernyataan"),
    p(
      "Saya yang bertanda tangan di bawah ini menyatakan bahwa Laporan Akhir Capstone Project ini merupakan hasil karya sendiri, disusun berdasarkan implementasi sistem yang dikembangkan, serta tidak mengandung plagiarisme. Segala kutipan dan referensi telah disebutkan sesuai kaidah akademik."
    ),
    spacer(160),
    p("Nama\t: [NAMA MAHASISWA]", { align: AlignmentType.LEFT, spaceAfter: 60 }),
    p("NIM\t: [NIM]", { align: AlignmentType.LEFT, spaceAfter: 200 }),
    p(`Lombok Tengah, ${DOC_DATE}`, { align: AlignmentType.LEFT }),
    spacer(360),
    p("_________________________", { align: AlignmentType.LEFT, spaceAfter: 40 }),
    p("[NAMA MAHASISWA]", { align: AlignmentType.LEFT }),
    pageBreak()
  );

  // ========== KATA PENGANTAR ==========
  children.push(
    h2("Kata Pengantar"),
    p(
      "Puji syukur penulis panjatkan kepada Tuhan Yang Maha Esa atas terselesaikannya Laporan Akhir Capstone Project berjudul Dashboard Indikator Strategis Badan Pusat Statistik Kabupaten Lombok Tengah. Laporan ini disusun sebagai bagian dari pemenuhan mata kuliah Capstone Project Program Studi Teknik Informatika STMIK Lombok tahun 2026."
    ),
    p(
      "Capstone Project ini berfokus pada rekayasa sistem informasi untuk menyelesaikan masalah nyata: penyajian indikator strategis kepada publik sekaligus menyediakan mekanisme pemutakhiran data internal yang terkontrol melalui alur Draft → Review → Publish. Pendekatan yang digunakan adalah analisis kebutuhan, perancangan, implementasi, pengujian, dan evaluasi."
    ),
    p(
      "Penulis menyadari laporan ini masih dapat disempurnakan. Kritik dan saran dari dosen pembimbing serta penguji sangat diharapkan."
    ),
    spacer(160),
    p(`Lombok Tengah, ${DOC_DATE}`, { align: AlignmentType.RIGHT }),
    p("Penulis", { align: AlignmentType.RIGHT }),
    pageBreak()
  );

  // ========== EXECUTIVE SUMMARY ==========
  children.push(
    h2("Ringkasan Eksekutif"),
    p(
      "Ringkasan ini disusun agar pembaca dapat memahami inti proyek dalam waktu singkat sebelum menelaah bab-bab lengkap.",
      { italics: true, color: MUTED, size: 20 }
    ),
    spacer(80),
    metricCards([
      { value: "58", label: "INDIKATOR" },
      { value: "3", label: "PERAN PENGGUNA" },
      { value: "44/44", label: "API TESTS" },
      { value: "64/64", label: "BROWSER QA" },
    ]),
    spacer(200),
    h3("Masalah"),
    p(
      "Indikator strategis perlu diakses publik secara mudah, sementara pemutakhiran data internal harus melalui peninjauan agar nilai usulan tidak langsung mengubah data yang dipublikasikan."
    ),
    h3("Solusi"),
    p(
      "Platform full-stack Dashboard Indikator Strategis: antarmuka publik (filter, tren, detail, export) dan ruang kerja internal dengan workflow Draft → Pending Review → Published, dilengkapi otorisasi berbasis peran serta audit trail."
    ),
    h3("Pengguna"),
    p("Publik (tanpa login), Operator (draft & submit), Administrator (review, publish, audit)."),
    h3("Hasil & Status"),
    p(
      "Sistem diimplementasikan dan divalidasi (data integrity, API smoke 44/44, browser QA 64/64, typecheck, build). Status: CORE APPLICATION COMPLETE — siap integrasi infrastruktur BPS. SSO, WebAPI produksi, dan hosting BPS belum termasuk."
    ),
    pageBreak()
  );

  // ========== TOC ==========
  children.push(
    h2("Daftar Isi"),
    p(
      "Setelah membuka dokumen di Microsoft Word, perbarui daftar isi otomatis: References → Update Table.",
      { italics: true, size: 18, color: MUTED, spaceAfter: 160 }
    ),
    new TableOfContents("Daftar Isi", {
      hyperlink: true,
      stylesWithLevels: [
        { styleName: "Heading 1", level: 0 },
        { styleName: "Heading 2", level: 1 },
        { styleName: "Heading 3", level: 2 },
      ],
    }),
    spacer(200),
    tocLine("BAB I   PENDAHULUAN"),
    tocLine("1.1 Latar Belakang", 200),
    tocLine("1.2 Tujuan", 200),
    tocLine("1.3 Ruang Lingkup", 200),
    tocLine("1.4 Jadwal Kegiatan", 200),
    tocLine("BAB II  TINJAUAN PUSTAKA"),
    tocLine("BAB III METODOLOGI"),
    tocLine("BAB IV  HASIL DAN PEMBAHASAN"),
    tocLine("BAB V   KESIMPULAN DAN REKOMENDASI"),
    tocLine("BAB VI  LAMPIRAN"),
    tocLine("DAFTAR PUSTAKA"),
    pageBreak(),
    h2("Daftar Gambar"),
    p(
      "Daftar nomor gambar mengikuti urutan caption di dalam dokumen. Perbarui otomatis di Word bila diperlukan.",
      { italics: true, size: 18, color: MUTED }
    ),
    pageBreak(),
    h2("Daftar Tabel"),
    p(
      "Daftar nomor tabel mengikuti urutan caption di dalam dokumen. Perbarui otomatis di Word bila diperlukan.",
      { italics: true, size: 18, color: MUTED }
    )
  );

  // ========== BAB I ==========
  children.push(
    ...chapterDivider(
      "01",
      "I",
      "PENDAHULUAN",
      "Memahami konteks masalah, tujuan, ruang lingkup, dan kebutuhan sistem."
    ),
    h2("1.1 Latar Belakang"),
    p(
      "Indikator strategis merupakan salah satu instrumen penting bagi pemerintah daerah dan masyarakat untuk memahami kondisi sosial-ekonomi secara ringkas dan terukur. Badan Pusat Statistik (BPS) Kabupaten Lombok Tengah memiliki peran dalam menyediakan data yang akurat, relevan, dan dapat diakses. Dalam konteks digital, kebutuhan tersebut tidak hanya mencakup penyajian data kepada publik, tetapi juga pengelolaan pemutakhiran data secara internal yang aman, terlacak, dan tidak menimbulkan inkonsistensi antara nilai usulan dengan nilai yang telah dipublikasikan."
    ),
    p(
      "Proyek Capstone ini dirancang untuk menjawab kebutuhan tersebut melalui pembangunan aplikasi Dashboard Indikator Strategis. Sistem menyediakan antarmuka publik agar masyarakat dapat melihat indikator, memfilter kategori dan periode, menelaah tren, membuka detail indikator, serta mengekspor data. Di sisi internal, sistem menyediakan ruang kerja bagi Operator untuk menyusun usulan perubahan data dalam status Draft, lalu mengajukannya untuk ditinjau. Administrator memiliki kewenangan menolak atau menyetujui sekaligus memublikasikan perubahan. Selama status masih Draft, Menunggu Review, atau Ditolak, nilai pada dashboard publik tidak berubah."
    ),
    p(
      "Fokus Capstone Project menurut panduan STMIK Lombok adalah menyelesaikan masalah nyata melalui rekayasa sistem — mengintegrasikan analisis, desain, implementasi, pengujian, dan komunikasi hasil — bukan menghasilkan novelty penelitian murni."
    ),
    h2("1.2 Tujuan"),
    p("Tujuan proyek ini adalah:"),
    numbered("membangun dashboard indikator strategis yang dapat diakses publik tanpa login;"),
    numbered("menyediakan mekanisme pemutakhiran data oleh Operator melalui penyimpanan Draft;"),
    numbered(
      "menerapkan pemisahan peran (Role-Based Access Control) antara Publik, Operator, dan Administrator;"
    ),
    numbered(
      "menerapkan workflow review: Draft → Pending Review → Published, termasuk jalur penolakan;"
    ),
    numbered("memastikan hanya data berstatus Published yang tampil pada antarmuka publik;"),
    numbered("menyediakan audit trail atas aktivitas penting sistem;"),
    numbered(
      "menghasilkan fondasi aplikasi yang siap diintegrasikan ke infrastruktur BPS (SSO, WebAPI, hosting) pada tahap lanjutan."
    ),
    h2("1.3 Ruang Lingkup"),
    h3("1.3.1 Termasuk (telah diimplementasikan)"),
    bullet("Dashboard publik: KPI, filter, pencarian, grafik tren, explorer, detail, export Excel."),
    bullet("Halaman publik pendukung: Beranda, Data Strategis, Publikasi."),
    bullet("Autentikasi lokal/staging (username–password, JWT HttpOnly cookie)."),
    bullet("Ruang kerja Operator dan Administrator."),
    bullet("Pemutakhiran observasi (DataChange), pengajuan review, reject, approve & publish."),
    bullet("Audit log aktivitas penting."),
    bullet("Baseline seed dari src/data/indicators.json (58 indikator)."),
    bullet("Pengujian: data integrity, smoke API, browser QA, typecheck, build."),
    h3("1.3.2 Tidak termasuk / menunggu integrasi BPS"),
    bullet("SSO BPS produksi."),
    bullet("WebAPI produksi BPS untuk CRUD internal."),
    bullet("Hosting, domain, HTTPS, dan database produksi yang dikelola BPS."),
    bullet("Integrasi penuh navbar resmi situs BPS (entry point disiapkan)."),
    bullet("Modul Pengguna dan Pengaturan penuh — saat ini hanya halaman placeholder di UI."),
    h2("1.4 Jadwal Kegiatan"),
    p(
      "Jadwal berikut disusun berdasarkan tahapan aktivitas proyek aktual. Tanggal kalender spesifik disesuaikan dengan log kegiatan mahasiswa:"
    ),
    ...simpleTable(
      ["No", "Kegiatan", "Keterangan Waktu"],
      [
        ["1", "Analisis kebutuhan & audit dataset", "[Tanggal disesuaikan]"],
        ["2", "Perancangan arsitektur, UI/UX, workflow", "[Tanggal disesuaikan]"],
        ["3", "Implementasi dashboard publik", "[Tanggal disesuaikan]"],
        ["4", "Implementasi autentikasi & otorisasi", "[Tanggal disesuaikan]"],
        ["5", "Implementasi workspace & CRUD/workflow", "[Tanggal disesuaikan]"],
        ["6", "Implementasi audit trail", "[Tanggal disesuaikan]"],
        ["7", "Integrasi full-stack & seed data", "[Tanggal disesuaikan]"],
        ["8", "Pengujian (API, browser QA, data)", "[Tanggal disesuaikan]"],
        ["9", "UI/UX polishing & dokumentasi handover", "[Tanggal disesuaikan]"],
        ["10", "Penyusunan laporan & presentasi Capstone", DOC_DATE],
      ],
      "Jadwal kegiatan Capstone Project"
    )
  );

  // ========== BAB II ==========
  children.push(
    ...chapterDivider(
      "02",
      "II",
      "TINJAUAN PUSTAKA",
      "Landasan konsep yang mendukung perancangan dan implementasi sistem."
    ),
    h2("2.1 Sistem Informasi"),
    p(
      "Sistem informasi adalah kombinasi manusia, prosedur, data, dan teknologi yang digunakan untuk mengumpulkan, menyimpan, memproses, dan mendistribusikan informasi guna mendukung pengambilan keputusan. Dalam konteks proyek ini, sistem informasi dibangun untuk menyajikan indikator strategis dan mengelola siklus pemutakhirannya."
    ),
    h2("2.2 Dashboard dan Visualisasi Data"),
    p(
      "Dashboard adalah antarmuka yang merangkum informasi kunci secara visual agar pengguna dapat memahami kondisi secara cepat. Visualisasi seperti kartu KPI, grafik tren, dan tabel explorer membantu publik menafsirkan indikator tanpa harus membaca dataset mentah. Proyek ini menggunakan pustaka Recharts pada frontend React."
    ),
    h2("2.3 Indikator Strategis"),
    p(
      "Indikator strategis adalah ukuran ringkas yang merepresentasikan kondisi sosial atau ekonomi yang relevan bagi perencanaan dan evaluasi. Dataset proyek mencakup 58 indikator (51 Sosial dan 7 Ekonomi) dengan periode 2014–2025, di-seed dari baseline resmi proyek."
    ),
    spacer(80),
    metricCards([
      { value: "58", label: "TOTAL INDIKATOR" },
      { value: "51", label: "SOSIAL" },
      { value: "7", label: "EKONOMI" },
      { value: "2014–2025", label: "PERIODE" },
    ]),
    spacer(200),
    h2("2.4 Role-Based Access Control (RBAC)"),
    p(
      "RBAC membatasi kemampuan pengguna berdasarkan peran. Pada sistem ini, Publik hanya membaca data Published; Operator dapat membuat Draft dan mengajukan review; Administrator dapat meninjau, menolak, menyetujui/memublikasikan, serta melihat audit. Pembatasan ditegakkan di server, bukan hanya pada tampilan menu."
    ),
    h2("2.5 Workflow Publikasi Data"),
    p(
      "Workflow publikasi memastikan perubahan data melewati tahap peninjauan sebelum menjadi data resmi yang dilihat publik. Model status Draft → Pending Review → Published (dengan jalur Rejected) mengurangi risiko kesalahan publikasi dan menjaga jejak perubahan."
    ),
    h2("2.6 REST API, React, Express, dan Prisma"),
    p(
      "Arsitektur aplikasi memisahkan frontend React/Vite dari backend Express. Komunikasi dilakukan melalui REST API. Prisma ORM digunakan untuk akses basis data (SQLite pada pengembangan; PostgreSQL didukung sebagai opsi produksi). Autentikasi menggunakan bcrypt untuk hash kata sandi dan JWT yang disimpan pada cookie HttpOnly."
    ),
    h2("2.7 Audit Trail"),
    p(
      "Audit trail mencatat siapa melakukan apa dan kapan. Pada sistem ini, aksi seperti login, draft, submit, reject, approve/publish dicatat pada model AuditLog untuk mendukung akuntabilitas internal."
    )
  );

  // ========== BAB III ==========
  children.push(
    ...chapterDivider(
      "03",
      "III",
      "METODOLOGI",
      "Proses analisis, perancangan, implementasi, dan evaluasi sistem."
    ),
    h2("3.1 Metode Penelitian"),
    p(
      "Pendekatan yang digunakan adalah pengembangan solusi berorientasi produk (solution engineering) dengan siklus iteratif: analisis kebutuhan → perancangan → implementasi → pengujian → evaluasi → penyempurnaan. Pendekatan ini dipilih karena karakteristik Capstone Project menekankan penyelesaian masalah nyata dan bukti sistem berfungsi, bukan pengujian hipotesis statistik atau novelty teoritis."
    ),
    p(
      "Tidak diklaim penggunaan kerangka formal tertentu (misalnya Scrum penuh) apabila tidak terdokumentasikan secara eksplisit sebagai proses tim. Yang dilaporkan adalah proses aktual yang tercermin pada repositori, dokumentasi teknis, dan artefak pengujian."
    ),
    h2("3.2 Proses Analisis"),
    p(
      "Analisis dilakukan dengan mengidentifikasi aktor, kebutuhan fungsional, kebutuhan data, kebutuhan keamanan, serta batasan integrasi BPS. Dataset baseline diaudit untuk memastikan konsistensi jumlah indikator dan nilai kunci."
    ),
    ...simpleTable(
      ["Aktor", "Kebutuhan utama"],
      [
        ["Publik", "Melihat indikator Published, filter, tren, detail, export"],
        ["Operator", "Memutakhirkan nilai (Draft), mengajukan review, melihat pengajuan sendiri"],
        ["Administrator", "Review, tolak (wajib alasan), setujui & publish, lihat audit"],
        ["Sistem", "Isolasi publik, otorisasi server-side, jejak audit, integritas data"],
      ],
      "Ringkasan kebutuhan per aktor"
    ),
    p("Visualisasi peran dalam sistem:", { bold: true, spaceAfter: 100 }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3120, 3120, 3120],
      rows: [
        new TableRow({
          children: [
            flowBox("PUBLIK\nREAD Published", { width: 3120, fill: WARM }),
            flowBox("OPERATOR\nUPDATE · SUBMIT", { width: 3120 }),
            flowBox("ADMIN\nREVIEW · PUBLISH", {
              width: 3120,
              fill: GREEN,
              color: WHITE,
            }),
          ],
        }),
      ],
    }),
    spacer(200),
    h2("3.3 Proses Perancangan"),
    h3("3.3.1 Arsitektur Sistem"),
    p(
      "Arsitektur aktual: React/Vite (frontend) → API Client → Express API → Prisma → Database. Data Published disimpan sebagai Observation; usulan perubahan sebagai DataChange."
    ),
    new Table({
      width: { size: 7000, type: WidthType.DXA },
      columnWidths: [7000],
      rows: ["PUBLIC / STAFF UI", "React / Vite Frontend", "Express API · Auth · RBAC", "Prisma ORM", "Database (Observation + DataChange)"].map(
        (label, i) =>
          new TableRow({
            children: [
              flowBox(label, {
                width: 7000,
                fill: i === 4 ? GREEN : i % 2 === 0 ? SOFT : WARM,
                color: i === 4 ? WHITE : GREEN,
              }),
            ],
          })
      ),
    }),
    spacer(120),
    ...figure(
      "flowchart-sistem.png",
      "Flowchart sistem (Publik, Autentikasi, Workspace, Alur Publikasi)",
      "Diagram merangkum empat lapis alur resmi: area publik, autentikasi, ruang kerja internal, dan publikasi data.",
      480,
      340,
      FIGURES
    ),
    h3("3.3.2 Model Data (ERD)"),
    p(
      "Entitas utama: User, Indicator, Observation, DataChange, AuditLog, dengan enum Role dan ChangeStatus."
    ),
    ...figure(
      "erd-sistem.png",
      "Entity Relationship Diagram sistem",
      "ERD menggambarkan relasi antara pengguna, indikator, observasi published, usulan perubahan, dan audit log.",
      480,
      320,
      FIGURES
    ),
    h3("3.3.3 Workflow Data"),
    p("Alur utama publikasi:", { spaceAfter: 100 }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2600, 600, 2960, 600, 2600],
      rows: [
        new TableRow({
          children: [
            flowBox("DRAFT", { width: 2600 }),
            arrowCell(),
            flowBox("PENDING REVIEW", { width: 2960 }),
            arrowCell(),
            flowBox("PUBLISHED", { width: 2600, fill: GREEN, color: WHITE }),
          ],
        }),
      ],
    }),
    spacer(120),
    p("Jalur penolakan:", { spaceAfter: 100 }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2200, 500, 2200, 500, 1800, 500, 2160],
      rows: [
        new TableRow({
          children: [
            flowBox("PENDING", { width: 2200 }),
            arrowCell(500),
            flowBox("REJECTED", { width: 2200, fill: WARN }),
            arrowCell(500),
            flowBox("EDIT", { width: 1800 }),
            arrowCell(500),
            flowBox("RESUBMIT", { width: 2160 }),
          ],
        }),
      ],
    }),
    spacer(160),
    callout(
      "PENTING",
      "Draft, Pending Review, dan Rejected tidak mengubah nilai pada dashboard publik. Publik hanya melihat data Published."
    ),
    spacer(160),
    h3("3.3.4 Perancangan UI/UX"),
    p(
      "Antarmuka dirancang dengan identitas institusional (hijau BPS), tipografi yang jelas, dan dukungan responsif. Publik menekankan keterbacaan data; ruang kerja menekankan kejelasan status draft/review dan pencegahan navigasi dengan perubahan belum tersimpan."
    ),
    h2("3.4 Implementasi"),
    h3("3.4.1 Stack Teknologi Aktual"),
    ...simpleTable(
      ["Lapisan", "Teknologi"],
      [
        ["Frontend", "React 19, Vite, TypeScript, React Router, Recharts, SheetJS (xlsx)"],
        ["Backend", "Node.js, Express 5, TypeScript, Zod"],
        ["ORM / DB", "Prisma 6; SQLite (dev/staging); PostgreSQL opsional"],
        ["Auth", "bcryptjs + JWT cookie HttpOnly bps_loteng_session (8 jam)"],
      ],
      "Stack teknologi implementasi"
    ),
    h3("3.4.2 Implementasi Publik"),
    p(
      "Rute publik meliputi Beranda (/), Dashboard Indikator (/dashboard-indikator), Data Strategis, dan Publikasi. Dashboard menampilkan KPI, filter kategori/periode, pencarian, grafik, tabel explorer, drawer detail, dan unduh Excel. Tidak diperlukan login."
    ),
    h3("3.4.3 Implementasi Operator"),
    p(
      "Setelah login, Operator mengakses Ringkasan, Pemutakhiran Data, Indikator, dan Pengajuan Saya. Operator dapat menyimpan Draft dan Ajukan untuk Review, tetapi tidak dapat approve/publish/audit (ditolak 403 di server; UI menampilkan Akses ditolak)."
    ),
    h3("3.4.4 Implementasi Administrator"),
    p(
      "Administrator memiliki seluruh kemampuan pemutakhiran Operator ditambah Review/Persetujuan dan Riwayat. Persetujuan dilakukan melalui aksi Setujui & Publish yang menerapkan nilai usulan ke Observation (data publik) dalam satu langkah sesuai implementasi aktual."
    ),
    h3("3.4.5 Baseline Data"),
    p(
      `Dataset di-seed dari src/data/indicators.json. SHA256 baseline: ${SHA256}. Terdapat 58 indikator (51 Sosial, 7 Ekonomi), periode 2014–2025. Contoh nilai kunci: Jumlah Penduduk 2020 = 1029.03. Browser tidak menulis langsung ke file JSON; perubahan runtime melalui API/database.`
    ),
    h2("3.5 Pengujian dan Evaluasi"),
    p(
      "Pengujian mencakup integrity data, smoke API otomatis, browser QA end-to-end, typecheck, dan build. Evaluasi menekankan kebenaran fungsional workflow, isolasi publik, otorisasi peran, konsistensi dataset, dan perilaku responsif."
    ),
    bullet("Functional: login, draft, submit, reject, resubmit, approve/publish, export."),
    bullet("Authorization: publik vs operator vs admin; URL terlarang."),
    bullet("Data integrity: jumlah indikator, kategori, nilai kunci, hash baseline."),
    bullet("Browser QA: alur UI, session, responsive breakpoints, console/network."),
    bullet("Build/typecheck: frontend dan API.")
  );

  // ========== BAB IV ==========
  children.push(
    ...chapterDivider(
      "04",
      "IV",
      "HASIL DAN PEMBAHASAN",
      "Bukti implementasi, hasil pengujian, analisis, trade-off, dan implikasi."
    ),
    h2("4.1 Hasil Implementasi dan Pengujian"),
    h3("4.1.1 Hasil Implementasi Antarmuka"),
    p(
      "Berikut cuplikan antarmuka aktual aplikasi yang digunakan sebagai bukti implementasi."
    ),
    ...figure(
      "01-beranda.png",
      "Halaman Beranda publik",
      "Beranda memperkenalkan konteks layanan dan jalur navigasi menuju dashboard serta akses ruang kerja."
    ),
    ...figure(
      "02-dashboard.png",
      "Dashboard Indikator Strategis",
      "Halaman ini menampilkan ringkasan indikator strategis berdasarkan kategori dan periode, dilengkapi grafik tren dan explorer data."
    ),
    ...figure(
      "03-detail-drawer.png",
      "Detail indikator (drawer)",
      "Drawer detail menyediakan informasi indikator terpilih tanpa meninggalkan konteks dashboard."
    ),
    ...figure(
      "04-login.png",
      "Halaman login ruang kerja",
      "Autentikasi staf menggunakan kredensial lokal/staging sebelum masuk ke workspace."
    ),
    ...figure(
      "05-workspace-operator.png",
      "Ringkasan workspace Operator",
      "Operator memperoleh ringkasan aktivitas dan akses modul pemutakhiran serta pengajuan."
    ),
    ...figure(
      "06-pemutakhiran.png",
      "Form Pemutakhiran Data",
      "Form membandingkan nilai published saat ini dengan nilai usulan sebelum disimpan sebagai Draft."
    ),
    ...figure(
      "07-pengajuan.png",
      "Daftar Pengajuan Saya",
      "Operator memantau status Draft, Menunggu review, Ditolak, atau Dipublikasikan."
    ),
    ...figure(
      "08-workspace-admin.png",
      "Ringkasan workspace Administrator",
      "Administrator memiliki akses tambahan ke review dan riwayat audit."
    ),
    ...figure(
      "09-review.png",
      "Pusat Review / Persetujuan Admin",
      "Admin membandingkan nilai sebelumnya dan usulan, lalu menolak atau menyetujui & memublikasikan."
    ),
    ...figure(
      "10-riwayat.png",
      "Riwayat / Audit trail",
      "Jejak aktivitas penting tersedia bagi Administrator untuk penelusuran akuntabilitas."
    ),
    h3("4.1.2 Isolasi Publik: Sebelum dan Setelah Publish"),
    p(
      "Perilaku kritis sistem digambarkan sebagai berikut. Sebelum publish, perubahan internal tidak terlihat publik; setelah Admin memilih Setujui & Publish, Observation diperbarui."
    ),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4500, 360, 4500],
      rows: [
        new TableRow({
          children: [
            flowBox("SEBELUM PUBLISH\nStatus: PENDING REVIEW\nPublik: nilai lama", {
              width: 4500,
              fill: WARN,
            }),
            arrowCell(360),
            flowBox("SETELAH PUBLISH\nStatus: PUBLISHED\nPublik: nilai baru", {
              width: 4500,
              fill: GREEN,
              color: WHITE,
            }),
          ],
        }),
      ],
    }),
    spacer(160),
    callout(
      "CONTOH",
      "Nilai published Jumlah Penduduk 2020 = 1029.03. Operator mengubah usulan menjadi 1030.20. Sebelum publish, publik tetap melihat 1029.03."
    ),
    spacer(160),
    h3("4.1.3 Hasil Pengujian"),
    metricCards([
      { value: "44/44", label: "AUTOMATED API", fill: SOFT },
      { value: "64/64", label: "BROWSER QA", fill: SOFT },
      { value: "PASS", label: "DATA INTEGRITY", fill: SOFT },
      { value: "PASS", label: "BUILD / TYPES", fill: SOFT },
    ]),
    spacer(160),
    p(
      "Seluruh skenario pengujian yang dijalankan pada tahap validasi menghasilkan status PASS."
    ),
    ...simpleTable(
      ["Jenis Pengujian", "Perintah", "Hasil"],
      [
        ["Data integrity", "npm run test:data", "PASS"],
        ["API smoke", "npm run test", "44/44 PASS"],
        ["Browser QA", "npm run test:browser", "64/64 PASS"],
        ["Typecheck FE", "npm run typecheck", "PASS"],
        ["Typecheck API", "npm run typecheck:api", "PASS"],
        ["Build FE", "npm run build", "PASS"],
        ["Build API", "npm run build:api", "PASS"],
      ],
      "Ringkasan hasil pengujian"
    ),
    h3("4.1.4 Test Case Utama"),
    ...simpleTable(
      ["ID", "Skenario", "Expected", "Actual", "Status"],
      [
        ["TC-01", "Publik buka dashboard tanpa login", "Data Published tampil", "Sesuai", "PASS"],
        ["TC-02", "Filter/cari indikator", "Hasil tersaring", "Sesuai", "PASS"],
        ["TC-03", "Export Excel", "File .xlsx terunduh", "Sesuai", "PASS"],
        ["TC-04", "Login Operator valid", "Masuk /workspace", "Sesuai", "PASS"],
        ["TC-05", "Login Admin valid", "Masuk /workspace", "Sesuai", "PASS"],
        ["TC-06", "Login salah", "Gagal + pesan", "Sesuai", "PASS"],
        ["TC-07", "Operator simpan Draft", "Status Draft", "Sesuai", "PASS"],
        ["TC-08", "Draft tidak ubah publik", "Nilai publik lama", "Sesuai", "PASS"],
        ["TC-09", "Operator ajukan review", "PENDING_REVIEW", "Sesuai", "PASS"],
        ["TC-10", "Form terkunci saat pending", "Tidak editable", "Sesuai", "PASS"],
        ["TC-11", "Admin tolak tanpa alasan", "Ditolak validasi", "Sesuai", "PASS"],
        ["TC-12", "Admin tolak + alasan", "REJECTED", "Sesuai", "PASS"],
        ["TC-13", "Operator edit & resubmit", "Kembali PENDING_REVIEW", "Sesuai", "PASS"],
        ["TC-14", "Admin Setujui & Publish", "PUBLISHED + Observation update", "Sesuai", "PASS"],
        ["TC-15", "Publik lihat nilai baru", "Nilai terbit tampil", "Sesuai", "PASS"],
        ["TC-16", "Operator buka /workspace/review", "Akses ditolak", "Sesuai", "PASS"],
        ["TC-17", "Operator API approve", "HTTP 403", "Sesuai", "PASS"],
        ["TC-18", "Admin buka Riwayat", "Log tampil", "Sesuai", "PASS"],
        ["TC-19", "Integrity 58/51/7", "Sesuai baseline", "Sesuai", "PASS"],
        ["TC-20", "Penduduk 2020 = 1029.03", "Nilai cocok", "Sesuai", "PASS"],
        ["TC-21", "Responsive 360–1440", "Layout usable", "Sesuai", "PASS"],
        ["TC-22", "Logout session", "Kembali perlu login", "Sesuai", "PASS"],
      ],
      "Test case penting Capstone"
    ),
    h2("4.2 Temuan, Analisis Hasil, dan Implikasi"),
    h3("4.2.1 Analisis Hasil"),
    p(
      "Hasil pengujian menunjukkan bahwa pemisahan antara data usulan (DataChange) dan data publik (Observation) efektif menjaga isolasi publik. Perubahan Operator tidak langsung mengubah dashboard sebelum Administrator melakukan Setujui & Publish. Otorisasi server-side terbukti menjadi batas keamanan utama: menyembunyikan menu saja tidak cukup, karena pemanggilan API oleh peran yang tidak berwenang ditolak."
    ),
    p(
      "Dari sisi kegunaan, dashboard publik memungkinkan eksplorasi indikator tanpa hambatan autentikasi, sementara ruang kerja menyediakan status yang eksplisit (Draft, Menunggu review, Ditolak, Dipublikasikan). Audit trail mendukung penelusuran aktivitas, meskipun fitur administrasi pengguna penuh belum tersedia."
    ),
    h3("4.2.2 Trade-off dan Kendala"),
    p("Beberapa trade-off yang disadari secara eksplisit:"),
    numbered(
      "Autentikasi lokal vs SSO BPS: dipilih autentikasi lokal agar sistem dapat didemokan dan diuji sebelum kontrak SSO tersedia; dampaknya kredensial produksi harus diganti/dinonaktifkan saat integrasi."
    ),
    numbered(
      "SQLite vs PostgreSQL: SQLite mempermudah setup lokal; produksi sebaiknya PostgreSQL sesuai keputusan infrastruktur BPS."
    ),
    numbered(
      "Provider lokal vs WebAPI BPS: adapter lokal memungkinkan pengembangan mandiri; penggantian ke Bps*Provider menunggu spesifikasi API resmi."
    ),
    numbered(
      "Baseline JSON vs database runtime: JSON menjadi sumber seed yang dapat diaudit (hash); runtime mutation melalui DB agar publik tidak bergantung pada file statis di browser."
    ),
    numbered(
      "UI guard vs server authorization: keduanya diterapkan; server tetap menjadi sumber kebenaran keamanan."
    ),
    numbered(
      "Modul Pengguna/Pengaturan: ditampilkan sebagai placeholder agar arsitektur navigasi siap, tanpa mengklaim fitur administrasi akun penuh."
    ),
    h3("4.2.3 Kontribusi Anggota"),
    p(
      "Informasi keanggotaan kelompok tidak ditemukan di repositori. Jika proyek individu, kontribusi mencakup analisis, desain, implementasi full-stack, pengujian, dan dokumentasi. Jika kelompok, lengkapi tabel berikut sebelum pengumpulan:"
    ),
    ...simpleTable(
      ["Anggota", "NIM", "Peran", "Kontribusi"],
      [
        ["[NAMA]", "[NIM]", "[Peran]", "[Uraian kontribusi]"],
        ["[NAMA]", "[NIM]", "[Peran]", "[Uraian kontribusi]"],
      ],
      "Kontribusi anggota (placeholder)"
    ),
    h3("4.2.4 Implikasi"),
    bullet(
      "Bagi publik: berpotensi mempermudah akses dan eksplorasi indikator strategis secara mandiri."
    ),
    bullet(
      "Bagi Operator: dapat mendukung pemutakhiran terstruktur dengan jejak status yang jelas."
    ),
    bullet(
      "Bagi Administrator: dapat mendukung kontrol publikasi dan penelusuran audit sebelum data resmi berubah."
    ),
    bullet(
      "Bagi BPS: aplikasi dapat menjadi fondasi integrasi SSO, WebAPI, dan hosting produksi setelah keputusan infrastruktur tersedia."
    ),
    p(
      "Implikasi di atas bersifat potensial; pengukuran dampak organisasi formal belum menjadi bagian verifikasi proyek pada tahap ini."
    )
  );

  // ========== BAB V ==========
  children.push(
    ...chapterDivider(
      "05",
      "V",
      "KESIMPULAN DAN REKOMENDASI",
      "Ringkasan capaian tujuan proyek dan arah pengembangan lanjutan."
    ),
    h2("5.1 Kesimpulan"),
    p("Berdasarkan implementasi dan pengujian yang dilakukan, disimpulkan bahwa:"),
    numbered(
      "Sistem Dashboard Indikator Strategis berhasil dibangun sebagai aplikasi full-stack sesuai ruang lingkup yang ditetapkan."
    ),
    numbered(
      "Dashboard publik tersedia dengan filter, tren, detail, dan export untuk data Published."
    ),
    numbered(
      "Role-based access untuk Operator dan Administrator telah diimplementasikan dan ditegakkan di server."
    ),
    numbered(
      "Workflow Draft → Pending Review → Published (beserta Rejected) berfungsi dan menjaga isolasi publik."
    ),
    numbered("Audit trail aktivitas penting tersedia bagi Administrator."),
    numbered(
      "Pengujian otomatis dan browser QA pada tahap validasi menunjukkan status PASS pada skenario yang dijalankan."
    ),
    numbered(
      "Integrasi SSO, WebAPI produksi, dan hosting BPS belum termasuk dan menjadi tahap lanjutan."
    ),
    h2("5.2 Rekomendasi"),
    numbered("Integrasikan SSO BPS sesuai spesifikasi resmi."),
    numbered("Gantikan provider lokal dengan WebAPI produksi BPS bila tersedia."),
    numbered("Gunakan PostgreSQL (atau DB resmi BPS) pada lingkungan produksi."),
    numbered("Siapkan deployment, HTTPS, backup, dan monitoring bersama tim infrastruktur BPS."),
    numbered("Lanjutkan modul manajemen pengguna dan pengaturan yang saat ini masih placeholder."),
    numbered("Pertimbangkan notifikasi pengajuan/review untuk mempercepat siklus pemutakhiran."),
    numbered("Lakukan hardening keamanan produksi (rotasi rahasia, kebijakan kata sandi, audit akses).")
  );

  // ========== BAB VI (no full divider — lampiran) ==========
  children.push(
    pageBreak(),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [tr("BAB VI", { bold: true, size: 22, color: MUTED })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [tr("LAMPIRAN", { bold: true, size: 32, color: CHARCOAL, font: FONT_HEAD })],
    }),
    h2("Lampiran A — Surat Pernyataan"),
    p("Lihat halaman Surat Pernyataan pada bagian awal dokumen."),
    h2("Lampiran B — Berita Acara Kerja Kelompok"),
    p("[DIISI SAAT FINAL SUBMISSION — jika proyek kelompok]"),
    h2("Lampiran C — Arsitektur Sistem"),
    p("Merujuk diagram arsitektur Bab III serta docs/ARCHITECTURE.md dan docs/BPS_HANDOVER.md."),
    h2("Lampiran D — ERD"),
    p("Merujuk Gambar ERD pada Bab III dan docs/figures/erd-sistem.png."),
    h2("Lampiran E — Use Case / Aktor"),
    p("Aktor: Publik, Operator, Administrator — ringkasan pada Tabel kebutuhan Bab III."),
    h2("Lampiran F — Workflow"),
    p("State machine ChangeStatus: DRAFT, PENDING_REVIEW, REJECTED, PUBLISHED — docs/WORKFLOW.md."),
    h2("Lampiran G — Test Case"),
    p("Merujuk tabel test case Bab IV dan skrip npm run test / test:browser / test:data."),
    h2("Lampiran H — Dokumentasi Screenshot"),
    p("Screenshot aktual tersimpan pada docs/guide-assets/ (01–10)."),
    h2("Lampiran I — Link Repository"),
    p("[DIISI SAAT FINAL SUBMISSION]"),
    h2("Lampiran J — Link Video Demonstrasi"),
    p("[DIISI SAAT FINAL SUBMISSION]"),
    h2("Lampiran K — PowerPoint"),
    p("File: docs/CAPSTONE_PRESENTATION_BPS_LOMBOK_TENGAH.pptx"),
    h2("Lampiran L — Poster"),
    p("[DIISI SAAT FINAL SUBMISSION]"),
    pageBreak()
  );

  children.push(
    h2("Daftar Pustaka"),
    p(
      "BPS Kabupaten Lombok Tengah. Dokumentasi serah-terima teknis Dashboard Indikator Strategis (docs/BPS_HANDOVER.md). Repositori proyek, 2026.",
      { align: AlignmentType.LEFT }
    ),
    p("Meta Platforms, Inc. React Documentation. https://react.dev (diakses 2026).", {
      align: AlignmentType.LEFT,
    }),
    p(
      "OpenJS Foundation. Express — Node.js web application framework. https://expressjs.com (diakses 2026).",
      { align: AlignmentType.LEFT }
    ),
    p("Prisma Data, Inc. Prisma Documentation. https://www.prisma.io/docs (diakses 2026).", {
      align: AlignmentType.LEFT,
    }),
    p("IETF. JSON Web Token (JWT). RFC 7519. https://datatracker.ietf.org/doc/html/rfc7519", {
      align: AlignmentType.LEFT,
    }),
    p("Recharts. Recharts Documentation. https://recharts.org (diakses 2026).", {
      align: AlignmentType.LEFT,
    }),
    p("STMIK Lombok. Panduan Capstone Project — Mahasiswa. 2026.", {
      align: AlignmentType.LEFT,
    }),
    spacer(200),
    callout(
      "PERHATIAN",
      "Lengkapi placeholder: nama mahasiswa, NIM, dosen pembimbing, kontribusi anggota, tanggal kegiatan, link repository, video, dan poster."
    )
  );

  // Populate daftar gambar/tabel text was static; figures already captioned in body.

  const doc = new Document({
    creator: "[NAMA MAHASISWA]",
    title: "Laporan Akhir Capstone Project",
    subject: "Dashboard Indikator Strategis BPS Kabupaten Lombok Tengah",
    keywords:
      "Capstone Project, Dashboard, Indikator Strategis, BPS, Lombok Tengah, Data Management",
    description:
      "Laporan akademik Capstone Project STMIK Lombok 2026 — implementasi aktual",
    styles: {
      default: {
        document: {
          styles: [
            {
              id: "Normal",
              run: { font: FONT_BODY, size: 22, color: CHARCOAL },
              paragraph: { spacing: { line: 276, after: 140 } },
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
                  indent: {
                    left: convertInchesToTwip(0.28),
                    hanging: convertInchesToTwip(0.18),
                  },
                },
              },
            },
          ],
        },
        {
          reference: "numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.28),
                    hanging: convertInchesToTwip(0.18),
                  },
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
              top: convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(1.0),
              left: convertInchesToTwip(1.18),
              right: convertInchesToTwip(1.0),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { after: 60 },
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 4 },
                },
                children: [
                  tr("DASHBOARD INDIKATOR STRATEGIS", {
                    size: 14,
                    bold: true,
                    color: GREEN,
                  }),
                  tr("    ·    ", { size: 14, color: LINE }),
                  tr("CAPSTONE PROJECT  ·  BPS LOMBOK TENGAH", {
                    size: 14,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 6 },
                },
                spacing: { before: 60 },
                children: [
                  tr("Capstone Project — Dashboard Indikator Strategis", {
                    size: 14,
                    color: MUTED,
                  }),
                  tr("\t", { size: 14 }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 14,
                    color: CHARCOAL,
                    font: FONT_BODY,
                    bold: true,
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
  console.log("Figures:", figNo, "| Tables:", tabNo);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
