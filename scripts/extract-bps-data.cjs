/**
 * Systematic BPS data extraction & reconciliation.
 *
 * PRIMARY: Google Spreadsheet sheet "Rekap" (gid=1403889517)
 * SECONDARY: local Excel (same workbook structure)
 * SUPPLEMENTARY sheets extracted separately (not silently merged into primary).
 *
 * Rules: no invented values; null stays null; prefer Google on conflict.
 */
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GOOGLE_XLSX = path.join(ROOT, "_source_google_sheet.xlsx");
const LOCAL_XLSX = path.join(ROOT, "_source_local_excel.xlsx");
const REKAP_CSV = path.join(ROOT, "_source_rekap.csv");
const OUT_DIR = path.join(ROOT, "src", "data");
const DOCS = path.join(ROOT, "docs");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function slugify(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function cleanText(v) {
  if (v === null || v === undefined) return null;
  return String(v).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Parse BPS cell without inventing values.
 * Preserves original display string.
 * @param {unknown} raw
 * @param {{ unit?: string|null, name?: string|null }} [hint]
 */
function parseCell(raw, hint = {}) {
  if (raw === null || raw === undefined) {
    return { value: null, status: "unavailable", display: null };
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { value: raw, status: "ok", display: String(raw) };
  }

  let s = cleanText(raw);
  if (!s || s === "-" || s === "—" || s === "–") {
    return { value: null, status: "unavailable", display: null };
  }

  const lower = s.toLowerCase();
  if (lower.includes("tidak ada survei") || lower.includes("tidak tersedia")) {
    return { value: null, status: "not_surveyed", display: s };
  }

  const display = s;
  let neg = false;
  let body = s;
  if (/^\(.*\)$/.test(body)) {
    neg = true;
    body = body.slice(1, -1).trim();
  }
  if (body.startsWith("-") || body.startsWith("−")) {
    neg = true;
    body = body.slice(1).trim();
  }

  const ctx = `${hint.unit || ""} ${hint.name || ""}`.toLowerCase();
  const isRibuScale = /ribu jiwa|\(ribu|ribu\)/i.test(ctx);
  const isRupiah = /rupiah|garis kemiskinan|\(rp/i.test(ctx);
  const isIndexLike = /gini|ikg|indeks|tfr|imr|cbr|ipm/i.test(ctx);

  let normalized = body;
  if (body.includes(",") && body.includes(".")) {
    const lastComma = body.lastIndexOf(",");
    const lastDot = body.lastIndexOf(".");
    if (lastComma > lastDot) normalized = body.replace(/\./g, "").replace(",", ".");
    else normalized = body.replace(/,/g, "");
  } else if (body.includes(",")) {
    const parts = body.split(",");
    if (parts.length === 2 && /^\d+$/.test(parts[0].replace(/\./g, "")) && /^\d+$/.test(parts[1])) {
      if (parts[1].length <= 2) {
        normalized = parts[0].replace(/\./g, "") + "." + parts[1];
      } else if (parts[0] === "0") {
        normalized = "0." + parts[1];
      } else if (isRupiah && parts[1].length === 3) {
        normalized = parts[0].replace(/\./g, "") + parts[1];
      } else if ((isRibuScale || isIndexLike) && parts[1].length === 3) {
        normalized = parts[0].replace(/\./g, "") + "." + parts[1];
      } else if (parts[1].length === 3) {
        normalized = parts[0].replace(/\./g, "") + "." + parts[1];
      } else {
        normalized = body.replace(/,/g, "");
      }
    } else if (parts.length > 2) {
      normalized = body.replace(/,/g, "");
    } else {
      normalized = body.replace(",", ".");
    }
  } else if (/^\d{1,3}(\.\d{3})+$/.test(body)) {
    const parts = body.split(".");
    if (isRupiah) {
      normalized = body.replace(/\./g, "");
    } else if (isRibuScale || parts.length === 2) {
      normalized = parts.length === 2 ? parts[0] + "." + parts[1] : body.replace(/\./g, "");
    } else {
      normalized = body.replace(/\./g, "");
    }
  } else if (/^\d+\.\d+$/.test(body)) {
    normalized = body;
  }

  const num = Number(normalized);
  if (!Number.isFinite(num)) {
    return { value: null, status: "non_numeric", display };
  }
  return { value: neg ? -Math.abs(num) : num, status: "ok", display };
}


function extractUnit(name) {
  if (!name) return null;
  const matches = [...String(name).matchAll(/\(([^)]+)\)/g)];
  if (!matches.length) {
    if (/%/.test(name)) return "%";
    return null;
  }
  const candidates = matches.map((m) => m[1].trim());
  const unitLike = candidates.find((c) =>
    /persen|jiwa|rupiah|km|%|miliar|ribu|tahun|orang|y o y|m o m|kalender|kuintal|hektar/i.test(c)
  );
  return unitLike || null;
}

function isYearLike(h) {
  const s = cleanText(h);
  if (!s) return false;
  return /^(19|20)\d{2}(\*+)?$/.test(s);
}

function sheetMatrix(wb, name, raw = false) {
  return XLSX.utils.sheet_to_json(wb.Sheets[name], {
    header: 1,
    defval: null,
    raw,
    blankrows: true,
  });
}

/** Parse CSV text into matrix (handles quoted multiline). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
      if (ch === "\r") i++;
    } else if (ch === "\r") {
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function extractRekapFromMatrix(matrix, sourceLabel) {
  const header = (matrix[0] || []).map(cleanText);
  const periodCols = [];
  const extraCols = [];
  let kategoriCol = -1;
  let indikatorCol = -1;

  header.forEach((h, idx) => {
    if (!h) return;
    const lower = h.toLowerCase();
    if (lower === "kategori") kategoriCol = idx;
    else if (lower === "indikator") indikatorCol = idx;
    else if (isYearLike(h)) periodCols.push({ idx, period: h.replace(/\*+$/, "") , periodRaw: h });
    else extraCols.push({ idx, label: h || `col_${idx}` });
  });

  // Trailing unnamed columns after years
  const lastPeriodIdx = periodCols.length ? periodCols[periodCols.length - 1].idx : -1;
  for (let idx = lastPeriodIdx + 1; idx < header.length; idx++) {
    if (!extraCols.some((e) => e.idx === idx)) {
      extraCols.push({ idx, label: header[idx] || `col_${idx}` });
    }
  }

  const indicators = [];
  const notes = [];
  const orphans = [];
  let currentCategory = null;

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const cells = row.map((c) => (c === null || c === undefined ? null : c));
    const texts = cells.map(cleanText);
    const nonEmpty = texts.filter((t) => t);
    if (!nonEmpty.length) continue;

    const first = texts[0] || "";
    if (/^keterangan/i.test(first) || /^hasil proyeksi/i.test(first) || /^catatan/i.test(first) || /^sumber/i.test(first)) {
      notes.push({ row: r + 1, text: nonEmpty.join(" | ") });
      continue;
    }

    const name = indikatorCol >= 0 ? texts[indikatorCol] : null;
    let category = kategoriCol >= 0 ? texts[kategoriCol] : null;
    if (category) currentCategory = category;

    if (!name) {
      orphans.push({ row: r + 1, text: nonEmpty.join(" | ") });
      continue;
    }

    // Skip if kategori cell is actually a note leaking into kategori
    if (category && /^keterangan/i.test(category)) {
      notes.push({ row: r + 1, text: nonEmpty.join(" | ") });
      continue;
    }

    category = category || currentCategory || "Tidak Berkategori";
    const unit = extractUnit(name);

    const values = periodCols.map(({ idx, period, periodRaw }) => {
      const parsed = parseCell(cells[idx], { name, unit });
      return {
        period,
        periodRaw: periodRaw !== period ? periodRaw : undefined,
        value: parsed.value,
        display: parsed.display,
        status: parsed.status,
      };
    });

    const extras = {};
    for (const { idx, label } of extraCols) {
      const v = cleanText(cells[idx]);
      if (v) extras[label] = v;
    }

    indicators.push({
      id: `${slugify(category)}__${slugify(name)}`,
      name,
      category,
      unit,
      source: "BPS Kabupaten Lombok Tengah",
      description: null,
      sheet: "Rekap",
      sourceFile: sourceLabel,
      values,
      extras: Object.keys(extras).length ? extras : undefined,
      rowNumber: r + 1,
    });
  }

  return {
    sheetName: "Rekap",
    headers: header,
    periods: periodCols.map((p) => p.period),
    indicators,
    notes,
    orphans,
  };
}

function extractWebpst(matrix) {
  const header = (matrix[0] || []).map(cleanText);
  const rows = [];
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const label = cleanText(row[0]);
    if (!label) continue;
    const unit = cleanText(row[2]);
    const parsed = parseCell(row[1], { name: label, unit });
    rows.push({
      id: `highlight__${slugify(label)}`,
      name: label,
      category: "Highlight",
      unit,
      source: "BPS Kabupaten Lombok Tengah",
      description: null,
      values: [
        {
          period: cleanText(row[3]), // preserve "Maret 2025", "Agustus 2025"
          value: parsed.value,
          display: parsed.display,
          status: parsed.status === "ok" ? "available" : parsed.status,
          trend: cleanText(row[4]) || undefined,
        },
      ],
    });
  }
  return { sheetName: "webpst", headers: header, indicators: rows };
}

function extractSimpleYearSheet(matrix, sheetName, opts = {}) {
  // Find header row containing "Indikator" or year columns
  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, matrix.length); i++) {
    const row = (matrix[i] || []).map(cleanText);
    const years = row.filter(isYearLike);
    if (years.length >= 2 || row.some((c) => c && /^(indikator|uraian|tahun)$/i.test(c))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return { sheetName, indicators: [], notes: [], title: null };

  const title = cleanText((matrix[0] || [])[0]);
  const header = (matrix[headerIdx] || []).map(cleanText);
  const nameCol = header.findIndex((h) => h && /^(indikator|uraian|tahun)$/i.test(h));
  const nCol = nameCol >= 0 ? nameCol : 0;
  const periodCols = [];
  header.forEach((h, idx) => {
    if (idx === nCol) return;
    if (isYearLike(h)) periodCols.push({ idx, period: h.replace(/\*+$/, ""), periodRaw: h });
  });

  const indicators = [];
  const notes = [];
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const name = cleanText(row[nCol]);
    if (!name) continue;
    if (/^sumber/i.test(name)) {
      notes.push({ row: r + 1, text: name });
      continue;
    }
    // Distribusi uses month names as "indicator" with years as columns
    const unit = opts.unit || extractUnit(title) || extractUnit(name);
    const values = periodCols.map(({ idx, period, periodRaw }) => {
      const parsed = parseCell(row[idx], { name, unit });
      return {
        period,
        periodRaw: periodRaw !== period ? periodRaw : undefined,
        value: parsed.value,
        display: parsed.display,
        status: parsed.status,
      };
    });
    indicators.push({
      id: `${slugify(sheetName)}__${slugify(name)}`,
      name,
      category: opts.category || sheetName,
      unit,
      source: notes[0]?.text || "BPS Kabupaten Lombok Tengah",
      description: title,
      sheet: sheetName,
      values,
      rowNumber: r + 1,
    });
  }
  return { sheetName, title, indicators, notes, periods: periodCols.map((p) => p.period) };
}

function isBlockTitleRow(row) {
  const first = cleanText(row[0]);
  if (!first) return false;
  if (/^(uraian|indikator|kabupaten\/kota)$/i.test(first)) return false;
  if (/^sumber/i.test(first)) return false;
  const years = row.map(cleanText).filter(isYearLike).length;
  const nonEmpty = row.map(cleanText).filter(Boolean).length;
  return years === 0 && nonEmpty <= 2;
}

function isSectionBreakName(name, peekNext) {
  if (!name) return false;
  if (/^(uraian|indikator|kabupaten\/kota)$/i.test(name)) return true;
  if (/^sumber/i.test(name)) return true;
  const peekIsHeader =
    peekNext && /^(uraian|indikator|kabupaten\/kota)$/i.test(cleanText(peekNext[0]));
  if (peekIsHeader) return true;
  return (
    /^(indikator |jumlah penduduk miskin dan|perbandingan |5 lapangan|indeks pembangunan)/i.test(
      name
    ) || /menurut kabupaten/i.test(name)
  );
}

/**
 * Extract multi-block "update maret 2025" sheet.
 * Title row → header (Uraian/years) → data rows until next title/header.
 */
function extractUpdateMaret(matrix) {
  const blocks = [];
  let i = 0;
  while (i < matrix.length) {
    const row = matrix[i] || [];
    if (!isBlockTitleRow(row)) {
      i++;
      continue;
    }
    const title = cleanText(row[0]);
    let j = i + 1;
    while (j < matrix.length && !(matrix[j] || []).map(cleanText).filter(Boolean).length) j++;
    const hdr = (matrix[j] || []).map(cleanText);
    if (!(hdr[0] && /^(uraian|indikator|kabupaten\/kota)$/i.test(hdr[0]))) {
      i++;
      continue;
    }

    const periodCols = [];
    hdr.forEach((h, idx) => {
      if (idx === 0 || !h) return;
      if (isYearLike(h) || /^(19|20)\d{2}/.test(h)) {
        periodCols.push({ idx, period: h, crossSection: false });
      } else {
        periodCols.push({ idx, period: h, crossSection: true });
      }
    });

    const indicators = [];
    let source = null;
    let r = j + 1;
    for (; r < matrix.length; r++) {
      const dataRow = matrix[r] || [];
      const name = cleanText(dataRow[0]);
      const peek = matrix[r + 1] || [];
      if (!name) continue;
      if (/^sumber/i.test(name)) {
        source = name;
        continue;
      }
      if (isSectionBreakName(name, peek) && !periodCols.some((p) => cleanText(dataRow[p.idx]))) {
        break;
      }
      if (isBlockTitleRow(dataRow)) break;

      const values = [];
      const attributes = {};
      const unit = extractUnit(name);
      for (const p of periodCols) {
        const parsed = parseCell(dataRow[p.idx], { name, unit });
        if (p.crossSection) {
          if (parsed.display != null) {
            attributes[p.period] = {
              value: parsed.value,
              display: parsed.display,
              status: parsed.status,
            };
          }
        } else {
          values.push({
            period: String(p.period),
            value: parsed.value,
            display: parsed.display,
            status: parsed.status,
          });
        }
      }

      indicators.push({
        id: `update-maret-2025__${slugify(title)}__${slugify(name)}`,
        name,
        category: title,
        unit,
        source: "BPS Kabupaten Lombok Tengah",
        description: title,
        sheet: "update maret 2025",
        values,
        attributes: Object.keys(attributes).length ? attributes : undefined,
        rowNumber: r + 1,
      });
    }

    if (source) {
      for (const ind of indicators) ind.source = source;
    }

    blocks.push({
      title,
      headerRow: j + 1,
      periods: periodCols.filter((p) => !p.crossSection).map((p) => p.period),
      crossSectionColumns: periodCols.filter((p) => p.crossSection).map((p) => p.period),
      indicators,
      source,
    });
    i = r;
  }
  return { sheetName: "update maret 2025", blocks };
}

function indexByKey(indicators) {
  const map = new Map();
  for (const ind of indicators) {
    const key = `${ind.category}||${ind.name}`;
    if (!map.has(key)) map.set(key, ind);
    else {
      if (!ind._dupHint) ind._dupHint = true;
      const ex = map.get(key);
      ex._duplicates = (ex._duplicates || 0) + 1;
    }
  }
  return map;
}

function compareRekap(google, local) {
  const gMap = indexByKey(google.indicators);
  const lMap = indexByKey(local.indicators);
  const onlyGoogle = [];
  const onlyLocal = [];
  const conflicts = [];
  let matched = 0;

  for (const [key, g] of gMap) {
    if (!lMap.has(key)) {
      onlyGoogle.push({ category: g.category, name: g.name });
      continue;
    }
    const l = lMap.get(key);
    const cfs = [];
    const periods = new Set([...g.values.map((v) => v.period), ...l.values.map((v) => v.period)]);
    for (const period of periods) {
      const gv = g.values.find((v) => v.period === period);
      const lv = l.values.find((v) => v.period === period);
      const gDisp = gv?.display ?? null;
      const lDisp = lv?.display ?? null;
      const gVal = gv?.value ?? null;
      const lVal = lv?.value ?? null;

      // Consider equal if displays equal after clean, or numeric nearly equal
      const statusEqual =
        (gv?.status || "unavailable") === (lv?.status || "unavailable");
      const bothNull = gVal === null && lVal === null && statusEqual;
      const numEqual =
        gVal !== null && lVal !== null && Math.abs(gVal - lVal) < 1e-6;
      const dispEqual = cleanText(gDisp) === cleanText(lDisp);
      const scaleMismatch =
        gVal !== null &&
        lVal !== null &&
        Math.abs(gVal) > 0 &&
        Math.abs(lVal) > 0 &&
        (Math.abs(gVal / lVal - 1000) < 0.01 || Math.abs(lVal / gVal - 1000) < 0.01);

      // Format-only differences (89,8 vs 89.8) are not statistical conflicts
      if (bothNull || numEqual) continue;

      if (!dispEqual || scaleMismatch) {
        cfs.push({
          period,
          google: { value: gVal, display: gDisp, status: gv?.status },
          local: { value: lVal, display: lDisp, status: lv?.status },
          scaleMismatch: !!scaleMismatch,
          kind: scaleMismatch ? "scale_mismatch" : "value_mismatch",
          resolution: "prefer_google",
        });
      }
    }
    if (cfs.length) conflicts.push({ key, name: g.name, category: g.category, conflicts: cfs });
    else matched++;
  }
  for (const [key, l] of lMap) {
    if (!gMap.has(key)) onlyLocal.push({ category: l.category, name: l.name });
  }
  return { matched, onlyGoogle, onlyLocal, conflicts };
}

function summarize(indicators) {
  const byCategory = {};
  let missing = 0;
  let present = 0;
  const periods = new Set();
  const nameCounts = new Map();
  for (const ind of indicators) {
    byCategory[ind.category] = (byCategory[ind.category] || 0) + 1;
    const k = `${ind.category}||${ind.name}`;
    nameCounts.set(k, (nameCounts.get(k) || 0) + 1);
    for (const v of ind.values) {
      periods.add(v.period);
      if (v.value === null) missing++;
      else present++;
    }
  }
  const sortedPeriods = [...periods].sort((a, b) => {
    const ya = parseInt(String(a).match(/(19|20)\d{2}/)?.[0] || "0", 10);
    const yb = parseInt(String(b).match(/(19|20)\d{2}/)?.[0] || "0", 10);
    if (ya !== yb) return ya - yb;
    return String(a).localeCompare(String(b));
  });
  return {
    totalIndicators: indicators.length,
    byCategory,
    periods: sortedPeriods,
    earliestPeriod: sortedPeriods[0] || null,
    latestPeriod: sortedPeriods[sortedPeriods.length - 1] || null,
    missingCells: missing,
    presentCells: present,
    duplicates: [...nameCounts.entries()].filter(([, n]) => n > 1).map(([k, n]) => ({ key: k, count: n })),
    emptyIndicators: indicators
      .filter((i) => i.values.every((v) => v.value === null))
      .map((i) => ({ category: i.category, name: i.name })),
  };
}

function toRuntime(ind) {
  return {
    id: ind.id,
    name: ind.name,
    category: ind.category,
    unit: ind.unit,
    source: ind.source,
    description: ind.description,
    values: ind.values.map((v) => ({
      period: v.period,
      value: v.value,
      display: v.display,
      status: v.status === "ok" ? "available" : v.status,
      ...(v.trend ? { trend: v.trend } : {}),
      ...(v.periodRaw ? { periodRaw: v.periodRaw } : {}),
    })),
  };
}

function findCrossSheetConflicts(rekap, updateBlocks, webpst) {
  const conflicts = [];
  // Map rekap by simplified name
  const rekapByName = new Map();
  for (const ind of rekap.indicators) {
    rekapByName.set(ind.name.toLowerCase(), ind);
    // also stripped variants
    rekapByName.set(ind.name.toLowerCase().replace(/\s+/g, " "), ind);
  }

  const aliases = [
    ["pertumbuhan ekonomi (persen)", "Laju PDRB Atas Dasar Harga Konstan 2010 (Laju Pertumbuhan Ekonomi)"],
    ["pdrb adhb (miliar rupiah)", "PDRB ADHB (miliar Rupiah)"],
    ["pdrb adhk (miliar rupiah)", "PDRB ADHK (miliar Rupiah)"],
    ["jumlah penduduk miskin (ribu)", "Jumlah Penduduk Miskin (Ribu Jiwa)"],
    ["persentase penduduk miskin (p0)", "Persentase Penduduk Miskin (P0)"],
    ["garis kemiskinan (rp)", "Garis Kemiskinan (Rupiah)"],
    ["indeks kedalaman kemiskinan (p1)", "Indeks Kedalaman Kemiskinan (P1)"],
    ["indeks keparahan kemiskinan (p2)", "Indeks Keparahan Kemiskinan (P2)"],
    ["indeks pembangunan manusia", "IPM"],
    ["total penduduk", "Jumlah Penduduk (ribu Jiwa)"],
  ];

  for (const block of updateBlocks) {
    for (const ind of block.indicators) {
      const alias = aliases.find(([a]) => a === ind.name.toLowerCase());
      const rekapName = alias ? alias[1] : ind.name;
      const r = rekap.indicators.find((x) => x.name.toLowerCase() === rekapName.toLowerCase());
      if (!r) continue;
      for (const uv of ind.values) {
        const period = String(uv.period).replace(/\*+$/, "");
        const rv = r.values.find((x) => x.period === period);
        if (!rv) continue;
        if (uv.value !== null && rv.value !== null && Math.abs(uv.value - rv.value) > 0.011) {
          conflicts.push({
            indicator: r.name,
            period,
            rekap: { value: rv.value, display: rv.display },
            updateMaret2025: { value: uv.value, display: uv.display, block: block.title },
            resolution: "prefer_rekap_as_linked_primary_gid",
          });
        }
      }
    }
  }

  // webpst vs rekap for overlapping annual values
  for (const h of webpst.indicators) {
    const period = h.values[0]?.period;
    const year = period && String(period).match(/(19|20)\d{2}/)?.[0];
    if (!year) continue;
    let rekapInd = null;
    if (/pertumbuhan ekonomi/i.test(h.name)) {
      rekapInd = rekap.indicators.find((x) => /laju pertumbuhan ekonomi/i.test(x.name));
    } else if (/tingkat kemiskinan/i.test(h.name)) {
      rekapInd = rekap.indicators.find((x) => /persentase penduduk miskin/i.test(x.name));
    } else if (/pengangguran/i.test(h.name)) {
      rekapInd = rekap.indicators.find((x) => /penganguran terbuka|pengangguran terbuka/i.test(x.name));
    } else if (/jumlah penduduk/i.test(h.name)) {
      rekapInd = rekap.indicators.find((x) => /jumlah penduduk \(ribu/i.test(x.name));
    }
    if (!rekapInd) continue;
    const rv = rekapInd.values.find((v) => v.period === year);
    const hv = h.values[0];
    if (rv && hv && rv.value !== null && hv.value !== null && Math.abs(rv.value - hv.value) > 0.011) {
      conflicts.push({
        indicator: `${h.name} (webpst) vs ${rekapInd.name} (Rekap)`,
        period: `${period} vs ${year}`,
        rekap: { value: rv.value, display: rv.display },
        webpst: { value: hv.value, display: hv.display, period },
        note: "webpst may use sub-annual period labels; do not overwrite Rekap annual series",
        resolution: "keep_both_separate",
      });
    } else if (rv && hv && rv.value !== null && hv.value !== null) {
      // aligned — no conflict
    }
  }

  return conflicts;
}

function main() {
  ensureDir(OUT_DIR);
  ensureDir(DOCS);

  const googleWb = XLSX.readFile(GOOGLE_XLSX, { cellDates: true });
  const localWb = XLSX.readFile(LOCAL_XLSX, { cellDates: true });

  const googleSheets = googleWb.SheetNames.map((name) => {
    const m = sheetMatrix(googleWb, name, false);
    const nonEmpty = m.filter((r) => (r || []).some((c) => c !== null && cleanText(c))).length;
    return { name, totalRows: m.length, nonEmptyRows: nonEmpty, state: null };
  });

  // Prefer CSV for Rekap (matches gid export / decimal fidelity from Google)
  const csvText = fs.readFileSync(REKAP_CSV, "utf8");
  const csvMatrix = parseCsv(csvText);
  const googleRekapCsv = extractRekapFromMatrix(csvMatrix, "google_sheet_csv_gid_1403889517");

  // Also extract from xlsx formatted values for comparison
  const googleRekapXlsx = extractRekapFromMatrix(
    sheetMatrix(googleWb, "Rekap", false),
    "google_sheet_xlsx"
  );
  const localRekap = extractRekapFromMatrix(sheetMatrix(localWb, "Rekap", false), "local_excel");

  // Prefer CSV as primary Rekap representation
  const primaryRekap = googleRekapCsv;

  const webpst = extractWebpst(sheetMatrix(googleWb, "webpst", false));
  const produksi = extractSimpleYearSheet(sheetMatrix(googleWb, "Produksi", false), "Produksi", {
    category: "Produksi",
    unit: "Kuintal per Hektar",
  });
  const distribusi = extractSimpleYearSheet(sheetMatrix(googleWb, "Distribusi", false), "Distribusi", {
    category: "Distribusi",
    unit: "Rupiah",
  });
  // Sosial is multi-table; store raw structured extract lightly
  const sosialMatrix = sheetMatrix(googleWb, "Sosial", false);
  const sosialAps = extractSimpleYearSheet(sosialMatrix, "Sosial", { category: "Sosial" });

  const updateMaret = extractUpdateMaret(sheetMatrix(googleWb, "update maret 2025", false));

  const comparisonCsvVsLocal = compareRekap(primaryRekap, localRekap);
  const comparisonCsvVsXlsx = compareRekap(primaryRekap, googleRekapXlsx);
  const crossConflicts = findCrossSheetConflicts(
    primaryRekap,
    updateMaret.blocks,
    webpst
  );

  const summary = summarize(primaryRekap.indicators);

  const dataset = {
    meta: {
      title: "Indikator Strategis Lombok Tengah",
      primarySource: "google_spreadsheet",
      primarySourceUrl:
        "https://docs.google.com/spreadsheets/d/1VSnGyxhs4toTqY_hdiKt29m_Ke6R3wRmrFa7P4UAAwI/edit?gid=1403889517#gid=1403889517",
      primarySheet: "Rekap",
      primarySheetGid: "1403889517",
      primaryExtract: "google_csv_export",
      extractedAt: new Date().toISOString(),
      lastUpdatedFromSource: null,
      provider: "BPS Kabupaten Lombok Tengah",
      notes: primaryRekap.notes.map((n) => n.text),
      localFallbackUsed: false,
      sheetsDiscovered: googleWb.SheetNames,
      relevantSheets: [
        "Rekap",
        "webpst",
        "update maret 2025",
        "Sosial",
        "Produksi",
        "Distribusi",
      ],
      reconciliation: {
        localFile: "_source_local_excel.xlsx",
        googleCsvVsLocalConflicts: comparisonCsvVsLocal.conflicts.length,
        googleCsvVsGoogleXlsxConflicts: comparisonCsvVsXlsx.conflicts.length,
        crossSheetConflicts: crossConflicts.length,
        onlyInGoogle: comparisonCsvVsLocal.onlyGoogle.length,
        onlyInLocal: comparisonCsvVsLocal.onlyLocal.length,
      },
    },
    categories: [...new Set(primaryRekap.indicators.map((i) => i.category))],
    indicators: primaryRekap.indicators.map(toRuntime),
    highlights: webpst.indicators.map(toRuntime),
    supplementary: {
      produksi: produksi.indicators.map(toRuntime),
      distribusi: distribusi.indicators.map(toRuntime),
      updateMaret2025Blocks: updateMaret.blocks.map((b) => ({
        title: b.title,
        periods: b.periods,
        source: b.source,
        indicators: b.indicators.map(toRuntime),
      })),
    },
  };

  fs.writeFileSync(path.join(OUT_DIR, "indicators.json"), JSON.stringify(dataset, null, 2), "utf8");

  const ts = `/**
 * Normalized Indikator Strategis dataset (BPS Lombok Tengah).
 * Primary: Google Spreadsheet → sheet "Rekap" (gid 1403889517).
 * Generated by scripts/extract-bps-data.js — do not hand-edit values.
 */
import raw from "./indicators.json";

export type ValueStatus =
  | "available"
  | "unavailable"
  | "not_surveyed"
  | "non_numeric";

export interface IndicatorValue {
  period: string;
  value: number | null;
  display: string | null;
  status: ValueStatus;
  trend?: string;
  periodRaw?: string;
}

export interface Indicator {
  id: string;
  name: string;
  category: string;
  unit: string | null;
  source: string;
  description: string | null;
  values: IndicatorValue[];
}

export interface IndicatorDataset {
  meta: typeof raw.meta;
  categories: string[];
  indicators: Indicator[];
  highlights: Indicator[];
  supplementary: typeof raw.supplementary;
}

export const indicatorDataset = raw as unknown as IndicatorDataset;
export const indicators: Indicator[] = indicatorDataset.indicators;
export const categories: string[] = indicatorDataset.categories;
export const highlights: Indicator[] = indicatorDataset.highlights;

/** Indicator service seam — swap this for BPS API later. */
export function getIndicators(): Indicator[] {
  return indicators;
}

export function getIndicatorsByCategory(category: string): Indicator[] {
  return indicators.filter((i) => i.category === category);
}

export function getIndicatorById(id: string): Indicator | undefined {
  return indicators.find((i) => i.id === id);
}

export function getHighlights(): Indicator[] {
  return highlights;
}
`;
  fs.writeFileSync(path.join(OUT_DIR, "indicators.ts"), ts, "utf8");

  const rawOut = {
    googleSheetNames: googleWb.SheetNames,
    localSheetNames: localWb.SheetNames,
    googleSheets,
    primaryRekap: {
      source: "csv",
      headers: primaryRekap.headers,
      periods: primaryRekap.periods,
      notes: primaryRekap.notes,
      orphans: primaryRekap.orphans,
      indicators: primaryRekap.indicators,
    },
    googleRekapXlsx: {
      periods: googleRekapXlsx.periods,
      indicatorCount: googleRekapXlsx.indicators.length,
    },
    localRekap: {
      periods: localRekap.periods,
      indicatorCount: localRekap.indicators.length,
    },
    comparisonCsvVsLocal,
    comparisonCsvVsXlsx,
    crossSheetConflicts: crossConflicts,
    webpst,
    produksi,
    distribusi,
    sosialPreview: {
      note: "Sosial sheet is multi-table (APS/APM/APK, angkatan kerja, status pekerjaan, melek huruf). Not fully flattened into primary Rekap model.",
      titleRow: cleanText((sosialMatrix[0] || [])[0]),
      apsExtractCount: sosialAps.indicators.length,
    },
    updateMaret: {
      blockCount: updateMaret.blocks.length,
      blocks: updateMaret.blocks.map((b) => ({
        title: b.title,
        periods: b.periods,
        indicatorCount: b.indicators.length,
        source: b.source,
        names: b.indicators.map((i) => i.name),
      })),
    },
    summary,
  };
  fs.writeFileSync(path.join(OUT_DIR, "inspection-raw.json"), JSON.stringify(rawOut, null, 2), "utf8");

  const conflictLines = (list, limit = 30) => {
    if (!list.length) return "- (none)";
    return list
      .slice(0, limit)
      .map((c) => {
        const samples = (c.conflicts || [])
          .slice(0, 5)
          .map(
            (x) =>
              `  - ${x.period}: google=${JSON.stringify(x.google?.display)} local=${JSON.stringify(x.local?.display)}${x.scaleMismatch ? " [~1000x scale]" : ""} → prefer_google`
          )
          .join("\n");
        return `- **${c.category || ""} / ${c.name || c.indicator}**\n${samples || JSON.stringify(c)}`;
      })
      .join("\n");
  };

  const audit = `# Data Audit — Indikator Strategis Lombok Tengah

Generated: ${new Date().toISOString()}

## Access status

| Source | Status |
|--------|--------|
| Google Spreadsheet | **ACCESSIBLE** |
| Local Excel \`Indikator Strategis Lombok Tengah.xlsx\` | **FOUND** (Downloads → \`_source_local_excel.xlsx\`) |

**Primary source used:** Google Spreadsheet CSV export of sheet **Rekap** (\`gid=1403889517\`)  
**Local fallback used:** No

URL: https://docs.google.com/spreadsheets/d/1VSnGyxhs4toTqY_hdiKt29m_Ke6R3wRmrFa7P4UAAwI/edit?gid=1403889517#gid=1403889517

## Sheets discovered

- **Total sheets:** ${googleWb.SheetNames.length}
- **Names:** ${googleWb.SheetNames.map((n) => `\`${n}\``).join(", ")}
- **Local sheets:** identical set (${localWb.SheetNames.length})

| Sheet | Role | Non-empty rows (xlsx) |
|-------|------|------------------------|
${googleSheets.map((s) => `| \`${s.name}\` | ${s.name === "Rekap" ? "**PRIMARY strategic inventory**" : s.name === "Neraca" ? "Empty" : s.name === "update maret 2025" ? "Supplementary latest thematic blocks (hidden)" : s.name === "webpst" ? "Dashboard highlight KPIs (special periods)" : "Domain detail"} | ${s.nonEmptyRows} |`).join("\n")}

## Primary sheet structure (Rekap)

- Columns: ${primaryRekap.headers.filter(Boolean).join(" | ")}
- Periods: ${primaryRekap.periods.join(", ")}
- Notes preserved:
${primaryRekap.notes.length ? primaryRekap.notes.map((n) => `  - Row ${n.row}: ${n.text}`).join("\n") : "  - (none)"}
- Orphan value rows (excluded from inventory):
${primaryRekap.orphans.length ? primaryRekap.orphans.map((n) => `  - Row ${n.row}: ${n.text}`).join("\n") : "  - (none)"}

## Indicator inventory (Rekap / Google CSV)

- **Total indicators:** ${summary.totalIndicators}
- **Per category:**
${Object.entries(summary.byCategory).map(([k, v]) => `  - ${k}: ${v}`).join("\n")}
- **Earliest period:** ${summary.earliestPeriod}
- **Latest period:** ${summary.latestPeriod}
- **Present value cells:** ${summary.presentCells}
- **Missing / null cells:** ${summary.missingCells}
- **Empty indicators (all periods null):** ${summary.emptyIndicators.length}
${summary.emptyIndicators.map((i) => `  - [${i.category}] ${i.name}`).join("\n")}
- **Duplicate category+name:** ${summary.duplicates.length ? summary.duplicates.map((d) => `${d.key} ×${d.count}`).join("; ") : "none"}

## Highlights (webpst) — special periods preserved

${webpst.indicators
  .map(
    (h) =>
      `- ${h.name}: ${h.values[0].display} ${h.unit || ""} (${h.values[0].period})${h.values[0].trend ? ` tren=${h.values[0].trend}` : ""}`
  )
  .join("\n")}

## Reconciliation

### Google CSV (Rekap) vs Local Excel (Rekap)

- Matched (no value conflicts): ${comparisonCsvVsLocal.matched}
- Only in Google: ${comparisonCsvVsLocal.onlyGoogle.length}
- Only in Local: ${comparisonCsvVsLocal.onlyLocal.length}
- Conflicts: ${comparisonCsvVsLocal.conflicts.length}
${conflictLines(comparisonCsvVsLocal.conflicts)}

### Google CSV vs Google XLSX formatted export (same Rekap)

- Conflicts: ${comparisonCsvVsXlsx.conflicts.length}
${conflictLines(comparisonCsvVsXlsx.conflicts, 15)}

> Note: XLSX \`raw\` numbers for some early *Jumlah Penduduk* cells appear as integers (e.g. \`912879\`) while Google CSV shows \`912.879\` (ribu jiwa). **CSV is preferred** to preserve the ribu-jiwa scale implied by the indicator label.

### Cross-sheet conflicts (Rekap vs update maret 2025 / webpst)

- Count: ${crossConflicts.length}
${
  crossConflicts.length
    ? crossConflicts
        .slice(0, 40)
        .map(
          (c) =>
            `- **${c.indicator}** @ ${c.period}: Rekap=${JSON.stringify(c.rekap)} vs other=${JSON.stringify(c.updateMaret2025 || c.webpst)} → ${c.resolution}${c.note ? ` (${c.note})` : ""}`
        )
        .join("\n")
    : "- (none detected by alias matcher)"
}

## Assumptions (explicit)

1. Linked \`gid=1403889517\` maps to sheet **Rekap** (header \`Kategori, INDIKATOR, 2014…2025\`) — treated as official strategic inventory.
2. Units taken only from parenthetical text in names (or explicit satuan column in webpst); otherwise \`null\`.
3. Empty cells → \`null\` / \`unavailable\`; "Tidak ada survei" → \`not_surveyed\`; never coerced to 0.
4. Original \`display\` strings preserved alongside parsed numbers.
5. \`lastUpdatedFromSource\` is \`null\` (no authoritative timestamp in sheet).
6. Trailing unnamed columns after years stored only in raw extract extras — not treated as periods.
7. On Google vs Local conflict → Google CSV value used in \`indicators.json\`.
8. \`update maret 2025\`, \`Sosial\`, \`Produksi\`, \`Distribusi\` stored as supplementary — **not silently merged** into Rekap series.
9. Special periods in webpst (\`Maret 2025\`, \`Agustus 2025\`) preserved as-is.
10. Period markers like \`2023*\` / \`2024**\` in update sheet preserved in period labels where extracted.
11. No fabricated demo statistics.

## Outputs

- \`src/data/indicators.json\` — normalized runtime dataset
- \`src/data/indicators.ts\` — types + Indicator Service seam
- \`src/data/inspection-raw.json\` — full verification dump
- \`docs/DATA_AUDIT.md\` — this report
`;

  fs.writeFileSync(path.join(DOCS, "DATA_AUDIT.md"), audit, "utf8");

  console.log(
    JSON.stringify(
      {
        sheets: googleWb.SheetNames,
        primary: "Rekap",
        indicators: summary.totalIndicators,
        byCategory: summary.byCategory,
        periods: summary.periods,
        emptyIndicators: summary.emptyIndicators.length,
        csvVsLocalConflicts: comparisonCsvVsLocal.conflicts.length,
        csvVsXlsxConflicts: comparisonCsvVsXlsx.conflicts.length,
        crossSheetConflicts: crossConflicts.length,
        webpst: webpst.indicators.length,
        updateBlocks: updateMaret.blocks.length,
        produksi: produksi.indicators.length,
        distribusi: distribusi.indicators.length,
      },
      null,
      2
    )
  );
}

main();
