import type { Indicator } from "../data/indicators";

/**
 * Presentation-only unit overrides for indicators whose BPS semantics are
 * established but whose normalized `unit` field is empty.
 * Does NOT invent units for ambiguous indicators.
 */
const DISPLAY_UNIT_BY_ID: Record<string, string> = {
  "ekonomi__laju-pdrb-atas-dasar-harga-konstan-2010-laju-pertumbuhan-ekonomi": "%",
  "sosial__persentase-penduduk-miskin-p0": "%",
  "sosial__tingkat-penganguran-terbuka-tpt": "%",
  "sosial__tingkat-partisipasi-angkatan-kerja-tpak": "%",
  "sosial__pertumbuhan-penduduk-persen": "%",
  "sosial__persentase-ruta-yang-mengakses-sumber-air-minum-layak": "%",
  "sosial__persentase-ruta-dengan-status-kepemilikan-rumah-milik-sendiri": "%",
  "sosial__persentase-rumah-tangga-dengan-sumber-penerangan-listrik": "%",
  "sosial__idg-keterlibatan-perempuan-di-parlemen": "%",
  "sosial__idg-perempuan-sebagai-tenaga-profesional": "%",
  "sosial__idg-sumbangan-pendapatan-perempuan": "%",
  "sosial__angka-melek-huruf-amh-penduduk-15-tahun-ke-atas-persen": "%",
};

function normalizeUnitToken(raw: string): string {
  const t = raw.trim();
  if (/^persen$/i.test(t) || t === "%") return "%";
  return t;
}

/**
 * Resolve a display unit from metadata or reliably encoded name semantics.
 * Returns null when the unit is not reliably established.
 */
export function resolveDisplayUnit(indicator: Indicator): string | null {
  const byId = DISPLAY_UNIT_BY_ID[indicator.id];
  if (byId) return byId;

  if (indicator.unit && indicator.unit.trim() !== "") {
    return normalizeUnitToken(indicator.unit);
  }

  const name = indicator.name.trim();

  // Explicit % / Persen encoded in the official name
  if (/\s%$/u.test(name) || /\(\s*%\s*\)/u.test(name)) return "%";
  if (/\(\s*Persen\s*\)/iu.test(name) || /\(Persen\)/iu.test(name)) return "%";
  if (/^Persentase\b/iu.test(name) || /\bPersentase\b/iu.test(name)) return "%";

  // Parenthetical unit already captured into indicator.unit by extraction for many rows;
  // remaining common BPS rate labels without metadata:
  if (/\bTPT\b/u.test(name) && /penganguran|pengangguran/iu.test(name)) return "%";
  if (/\bTPAK\b/u.test(name)) return "%";

  return null;
}

/**
 * Presentation label: strip a trailing unit token from the official name when
 * that unit is shown separately. Official source name remains unchanged in data/export.
 */
export function getDisplayName(indicator: Indicator, unit = resolveDisplayUnit(indicator)): string {
  let name = indicator.name.trim();
  if (unit === "%") {
    name = name.replace(/\s*%\s*$/u, "").trim();
  }
  return name;
}

export function unitAlreadyInText(text: string, unit: string | null): boolean {
  if (!unit) return false;
  const t = text.toLowerCase();
  const u = unit.toLowerCase();
  if (u === "%") return /%|persen/.test(t);
  return t.includes(u.toLowerCase());
}
