import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const dataset = JSON.parse(readFileSync("./src/data/indicators.json", "utf8"));

// --- Population 2020 Google-authoritative ---
const penduduk = dataset.indicators.find((i) => i.id === "sosial__jumlah-penduduk-ribu-jiwa");
const v2020 = penduduk.values.find((v) => v.period === "2020");
assert.equal(v2020.value, 1029.03);

// --- Null stays null (never 0) ---
const inflasi = dataset.indicators.find((i) => i.id === "ekonomi__inflasi-y-o-y");
assert.ok(inflasi.values.every((v) => v.value === null));
assert.ok(!inflasi.values.some((v) => v.value === 0));

// --- Special periods distinct ---
const periods = new Set();
for (const ind of dataset.indicators) for (const v of ind.values) periods.add(v.period);
for (const h of dataset.highlights) for (const v of h.values) periods.add(v.period);
assert.ok(periods.has("2025"));
assert.ok(periods.has("Maret 2025"));
assert.ok(periods.has("Agustus 2025"));

// --- Featured IDs exist ---
const featured = [
  "sosial__jumlah-penduduk-ribu-jiwa",
  "ekonomi__laju-pdrb-atas-dasar-harga-konstan-2010-laju-pertumbuhan-ekonomi",
  "sosial__persentase-penduduk-miskin-p0",
  "sosial__tingkat-penganguran-terbuka-tpt",
  "sosial__ipm",
  "sosial__tingkat-partisipasi-angkatan-kerja-tpak",
];
for (const id of featured) {
  assert.ok(dataset.indicators.some((i) => i.id === id), `missing featured ${id}`);
}

// --- Category counts derived ---
assert.deepEqual(
  Object.fromEntries(
    dataset.categories.map((c) => [
      c,
      dataset.indicators.filter((i) => i.category === c).length,
    ])
  ),
  { Sosial: 51, Ekonomi: 7 }
);

// --- Poverty trend magnitude ---
const p0 = dataset.indicators.find((i) => i.id === "sosial__persentase-penduduk-miskin-p0");
const cur = p0.values.find((v) => v.period === "2025");
const prev = p0.values.find((v) => v.period === "2024");
assert.equal(Number((cur.value - prev.value).toFixed(2)), -1.39);

// --- Export filter combinations (null stays empty) ---
function buildRows(indicators, period) {
  const rows = [];
  for (const ind of indicators) {
    const values =
      period && period !== "semua"
        ? ind.values.filter((v) => v.period === period)
        : ind.values;
    for (const v of values) {
      rows.push({
        Indikator: ind.name,
        Periode: v.period,
        Nilai: v.value === null ? "" : v.value,
      });
    }
  }
  return rows;
}

const all = buildRows(dataset.indicators, null);
assert.ok(all.length > 100);
assert.ok(all.some((r) => r.Nilai === ""));

const sosial = buildRows(
  dataset.indicators.filter((i) => i.category === "Sosial"),
  null
);
assert.ok(sosial.every((r) => dataset.indicators.find((i) => i.name === r.Indikator).category === "Sosial"));

const only2025 = buildRows(dataset.indicators, "2025");
assert.ok(only2025.every((r) => r.periode === undefined || r.Periode === "2025"));
assert.ok(only2025.every((r) => r.Periode === "2025"));

const searchKemiskinan = buildRows(
  dataset.indicators.filter((i) => i.name.toLowerCase().includes("miskin")),
  "2025"
);
assert.ok(searchKemiskinan.length >= 1);
assert.ok(searchKemiskinan.every((r) => r.Indikator.toLowerCase().includes("miskin")));

const combo = buildRows(
  dataset.indicators.filter((i) => i.category === "Ekonomi"),
  "2024"
);
assert.ok(combo.every((r) => r.Periode === "2024"));

// Excel write smoke
const sheet = XLSX.utils.json_to_sheet(only2025.slice(0, 5));
assert.ok(sheet);

console.log("data-integrity + export audit checks passed");
