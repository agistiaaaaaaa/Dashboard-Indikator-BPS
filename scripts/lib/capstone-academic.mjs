/**
 * Format akademik bersama untuk dokumen Capstone STMIK Lombok (Tugas 1–3).
 *
 * Konvensi: A4, margin 4-3-3-3 cm, Times New Roman 12 pt, spasi 1,5, paragraf
 * rata kanan-kiri dengan indentasi baris pertama 1,25 cm. Judul bab rata
 * tengah. Tabel dan gambar diberi caption bernomor otomatis (field SEQ) agar
 * Daftar Tabel dan Daftar Gambar dapat dibangkitkan oleh Word.
 */
import {
  AlignmentType,
  BorderStyle,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  PageBreak,
  PageNumber,
  Paragraph,
  SequentialIdentifier,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  convertMillimetersToTwip,
} from "docx";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GROUP_NAME, TITLE_FULL, YEAR, memberList } from "./capstone-config.mjs";

export const FONT = "Times New Roman";
const BODY_SIZE = 24; // 12 pt
const SMALL_SIZE = 20; // 10 pt (isi tabel)
const LINE_15 = 360; // spasi 1,5

const MARGIN = {
  top: convertMillimetersToTwip(30),
  bottom: convertMillimetersToTwip(30),
  left: convertMillimetersToTwip(40),
  right: convertMillimetersToTwip(30),
};
const A4_WIDTH = 11906;
/** Lebar area teks; semua tabel dan gambar dibatasi lebar ini. */
export const TEXT_WIDTH = A4_WIDTH - MARGIN.left - MARGIN.right;

const STMIK_LOGO = resolve("docs/capstone-assets/stmik-logo.jpg");
const thin = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const BORDERS = { top: thin, bottom: thin, left: thin, right: thin };
const NO_BORDERS = { top: none, bottom: none, left: none, right: none };

/* ------------------------------------------------------------------ text */

export function run(text, o = {}) {
  return new TextRun({
    text,
    bold: o.bold,
    italics: o.italics,
    size: o.size ?? BODY_SIZE,
    font: FONT,
  });
}

/**
 * Run dari teks dengan penanda *miring* (untuk istilah asing, sesuai kaidah
 * penulisan ilmiah). Tanpa penanda, hasilnya satu run biasa.
 */
export function rich(text, o = {}) {
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("*") && part.endsWith("*")
        ? run(part.slice(1, -1), { ...o, italics: true })
        : run(part, o)
    );
}

/** Paragraf isi. Mendukung penanda *miring* lewat `rich`. */
export function p(text, o = {}) {
  return new Paragraph({
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: o.before ?? 0, after: o.after ?? 120, line: o.line ?? LINE_15 },
    indent:
      o.indent === false
        ? undefined
        : o.indent === "hanging"
          ? { left: convertMillimetersToTwip(12.5), hanging: convertMillimetersToTwip(12.5) }
          : { firstLine: convertMillimetersToTwip(12.5) },
    keepNext: o.keepNext,
    children: typeof text === "string" ? rich(text, o) : text,
  });
}

/** Paragraf tanpa indentasi (keterangan, label, baris tanda tangan). */
export const plain = (text, o = {}) => p(text, { indent: false, ...o });

export const centered = (text, o = {}) =>
  p(text, { indent: false, align: AlignmentType.CENTER, ...o });

export const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

export const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });

/* -------------------------------------------------------------- headings */

/** Judul bab: "BAB I" dan nama bab di baris terpisah, rata tengah. */
export function chapter(number, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { after: 360, line: LINE_15 },
    children: number
      ? [run(`BAB ${number}`, { bold: true }), new TextRun({ break: 1 }), run(title, { bold: true })]
      : [run(title, { bold: true })],
  });
}

export const h2 = (text, o = {}) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    pageBreakBefore: o.newPage,
    spacing: { before: 240, after: 120, line: LINE_15 },
    children: [run(text, { bold: true })],
  });

export const h3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    keepNext: true,
    spacing: { before: 180, after: 100, line: LINE_15 },
    children: [run(text, { bold: true, italics: false })],
  });

/** Judul halaman depan (Kata Pengantar, Daftar Isi, ...): tidak masuk Daftar Isi. */
export const frontTitle = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { after: 360 },
    children: [run(text, { bold: true })],
  });

/* ----------------------------------------------------------------- lists */

const LIST_INDENT = { left: convertMillimetersToTwip(10), hanging: convertMillimetersToTwip(6) };

export const numberingConfig = {
  config: [
    {
      reference: "bullet",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: LIST_INDENT } },
        },
      ],
    },
    {
      reference: "decimal",
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: LIST_INDENT } },
        },
      ],
    },
  ],
};

let listInstance = 0;

const listItem = (reference, instance) => (text) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    numbering: { reference, level: 0, instance },
    spacing: { after: 60, line: LINE_15 },
    children: typeof text === "string" ? rich(text) : text,
  });

/** Daftar bernomor; setiap pemanggilan memulai penomoran dari 1. */
export function numberedList(items) {
  const make = listItem("decimal", ++listInstance);
  return items.map(make);
}

export function bulletList(items) {
  const make = listItem("bullet", 0);
  return items.map(make);
}

/* --------------------------------------------------------------- captions */

function caption(label, text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120, line: 276 },
    keepNext: label === "Tabel",
    children: [
      run(`${label} `, { bold: true }),
      new SequentialIdentifier(label),
      run(`. ${text}`, { bold: false }),
    ],
  });
}

/* ----------------------------------------------------------------- tables */

function cellParagraph(text, o) {
  return new Paragraph({
    alignment: o.align ?? AlignmentType.LEFT,
    spacing: { after: 0, line: 252 },
    keepNext: o.keepNext,
    children: [run(String(text), { bold: o.bold, size: SMALL_SIZE })],
  });
}

function tableCell(text, width, o = {}) {
  return new TableCell({
    borders: o.borders ?? BORDERS,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: o.fill ? { fill: o.fill, type: "clear", color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(text)
      .split("\n")
      .map((line) => cellParagraph(line, o)),
  });
}

/** Membagi TEXT_WIDTH menurut bobot relatif; sisa pembulatan masuk kolom terakhir. */
function columnWidths(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => Math.floor((w / total) * TEXT_WIDTH));
  widths[widths.length - 1] += TEXT_WIDTH - widths.reduce((a, b) => a + b, 0);
  return widths;
}

/** Tabel pendek (≤ baris ini) dijaga tetap utuh dalam satu halaman. */
const KEEP_TOGETHER_ROWS = 8;

/**
 * Tabel akademik bergaris tipis dengan caption di atas.
 * `weights` mengatur proporsi kolom, mis. [1, 4, 2].
 */
export function table(captionText, headers, rows, weights = headers.map(() => 1)) {
  const widths = columnWidths(weights);
  const header = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      tableCell(h, widths[i], { bold: true, align: AlignmentType.CENTER, fill: "F2F2F2", keepNext: true })
    ),
  });
  const keepTogether = rows.length <= KEEP_TOGETHER_ROWS;
  const body = rows.map(
    (r, ri) =>
      new TableRow({
        cantSplit: true,
        children: r.map((c, i) =>
          tableCell(c, widths[i], { keepNext: keepTogether && ri < rows.length - 1 })
        ),
      })
  );
  return [
    caption("Tabel", captionText),
    new Table({ width: { size: TEXT_WIDTH, type: WidthType.DXA }, columnWidths: widths, rows: [header, ...body] }),
    spacer(160),
  ];
}

/** Baris alur status (kotak-kotak dengan panah di antaranya), tanpa caption. */
export function flowRow(labels) {
  const arrowW = 500;
  const boxW = Math.floor((TEXT_WIDTH - arrowW * (labels.length - 1)) / labels.length);
  const cells = labels.flatMap((label, i) => {
    const box = tableCell(label, boxW, { bold: true, align: AlignmentType.CENTER });
    if (i === labels.length - 1) return [box];
    return [box, tableCell("→", arrowW, { borders: NO_BORDERS, align: AlignmentType.CENTER, bold: true })];
  });
  const widths = labels.flatMap((_, i) => (i === labels.length - 1 ? [boxW] : [boxW, arrowW]));
  return [
    new Table({
      width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      columnWidths: widths,
      alignment: AlignmentType.CENTER,
      rows: [new TableRow({ children: cells })],
    }),
    spacer(160),
  ];
}

/* ---------------------------------------------------------------- figures */

/** Gambar selebar area teks (atau `maxWidthPx`) dengan caption di bawah. */
export function figure(path, captionText, { pixelWidth, pixelHeight, maxWidthPx = 500, type = "png" }) {
  if (!existsSync(path)) throw new Error(`Gambar tidak ditemukan: ${path}`);
  const width = Math.min(maxWidthPx, Math.round(TEXT_WIDTH / 15)); // twip → px pada 96 dpi
  const height = Math.round((width * pixelHeight) / pixelWidth);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 120, after: 0 },
      children: [
        new ImageRun({
          type,
          data: readFileSync(path),
          transformation: { width, height },
          altText: { title: captionText, description: captionText, name: captionText },
        }),
      ],
    }),
    caption("Gambar", captionText),
  ];
}

/* ------------------------------------------------------------ front matter */

export function tableOfContents() {
  return [
    frontTitle("DAFTAR ISI"),
    new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-3" }),
  ];
}

export function listOfCaptions(title, label) {
  return [
    frontTitle(title),
    new TableOfContents(title, { hyperlink: true, captionLabelIncludingNumbers: label }),
  ];
}

/* ------------------------------------------------------------------ cover */

export function cover(docType) {
  const logo = existsSync(STMIK_LOGO)
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 600 },
        children: [
          new ImageRun({
            type: "jpg",
            data: readFileSync(STMIK_LOGO),
            transformation: { width: 227, height: 207 }, // 6 cm, rasio asli 431 × 393
            altText: { title: "Logo STMIK Lombok", description: "Logo STMIK Lombok", name: "logo" },
          }),
        ],
      })
    : spacer(480);

  const line = (text, o = {}) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: o.after ?? 0, line: 300 },
      frame: o.frame,
      children: [run(text, o)],
    });

  // Identitas institusi dikunci di dasar area teks lewat bingkai (frame) agar
  // posisinya tetap walau jumlah anggota atau panjang judul berubah.
  const footerFrame = {
    type: "alignment",
    alignment: { x: "center", y: "bottom" },
    anchor: { horizontal: "margin", vertical: "margin" },
    width: TEXT_WIDTH,
    height: 0,
  };
  const institution = (text, after = 0) =>
    line(text, { bold: true, size: 24, after, frame: footerFrame });

  return [
    line(docType, { bold: true, size: 28, after: 360 }),
    line(TITLE_FULL.toUpperCase(), { bold: true, size: 28 }),
    logo,
    line(`${GROUP_NAME}:`, { bold: true, after: 80 }),
    ...memberList().map((m) => line(`${m.name} (${m.nim})`)),
    institution("PROGRAM STUDI TEKNIK INFORMATIKA"),
    institution("SEKOLAH TINGGI MANAJEMEN INFORMATIKA DAN KOMPUTER"),
    institution("STMIK LOMBOK", 240),
    institution(YEAR),
  ];
}

/* --------------------------------------------------------- header/footer */

export function pageNumberFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 22, font: FONT })],
      }),
    ],
  });
}

export const emptyHeader = () => new Header({ children: [new Paragraph({ children: [] })] });
export const emptyFooter = () => new Footer({ children: [new Paragraph({ children: [] })] });

export const pageMargins = () => MARGIN;

/* ----------------------------------------------------------------- styles */

export const documentStyles = {
  default: {
    document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { line: LINE_15 } } },
    heading1: { run: { font: FONT, size: BODY_SIZE, bold: true, color: "000000" }, paragraph: { spacing: { before: 0, after: 360 }, keepNext: true } },
    heading2: { run: { font: FONT, size: BODY_SIZE, bold: true, color: "000000" }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true } },
    heading3: { run: { font: FONT, size: BODY_SIZE, bold: true, color: "000000" }, paragraph: { spacing: { before: 180, after: 100 }, keepNext: true } },
  },
};

/* ------------------------------------------------- signature/form blocks */

/** Baris "Nama : …  NIM : …" dengan kolom sejajar memakai tab stop. */
export function identityLine(name, nim) {
  const at = (mm) => ({ type: TabStopType.LEFT, position: convertMillimetersToTwip(mm) });
  return new Paragraph({
    spacing: { after: 0, line: 300 },
    tabStops: [at(15), at(85), at(100)],
    children: [run(`Nama	: ${name}	NIM	: ${nim}`)],
  });
}

/** Tabel tanpa garis untuk blok tanda tangan; `cells` = array baris berisi teks multi-baris. */
export function signatureGrid(rows, columns = 3) {
  const widths = columnWidths(Array(columns).fill(1));
  return new Table({
    width: { size: TEXT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      (r) =>
        new TableRow({
          cantSplit: true,
          children: widths.map(
            (w, i) =>
              new TableCell({
                borders: NO_BORDERS,
                width: { size: w, type: WidthType.DXA },
                children: String(r[i] ?? "")
                  .split("\n")
                  .map(
                    (line) =>
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0, line: 276 },
                        children: [run(line)],
                      })
                  ),
              })
          ),
        })
    ),
  });
}

/** Tabel formulir bergaris dengan lebar kolom bebas (untuk Berita Acara). */
export function formTable(rows, weights, o = {}) {
  const widths = columnWidths(weights);
  return new Table({
    width: { size: TEXT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) => {
      let column = 0;
      return new TableRow({
          cantSplit: true,
          height: o.rowHeight?.[ri] ? { value: o.rowHeight[ri], rule: "atLeast" } : undefined,
          children: r.map((c) => {
            const spec = typeof c === "object" ? c : { text: c };
            const span = spec.span ?? 1;
            const w = widths.slice(column, column + span).reduce((a, b) => a + b, 0);
            column += span;
            return new TableCell({
              borders: BORDERS,
              columnSpan: span > 1 ? span : undefined,
              width: { size: w, type: WidthType.DXA },
              verticalAlign: spec.valign ?? VerticalAlign.TOP,
              margins: { top: 40, bottom: 40, left: 100, right: 100 },
              children: String(spec.text ?? "")
                .split("\n")
                .map((line) => cellParagraph(line, { bold: spec.bold, align: spec.align })),
            });
          }),
        });
    }),
  });
}
