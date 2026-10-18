import * as XLSX from "xlsx";
import type { Indicator } from "../../data/indicators";
import { formatIndicatorValue, resolveDisplayUnit } from "../../utils/format";

export interface ExportRow {
  Indikator: string;
  Kategori: string;
  Periode: string;
  Nilai: number | "";
  Tampilan: string;
  Satuan: string;
  Sumber: string;
  Status: string;
}

export interface ExportOptions {
  indicators: Indicator[];
  /** If set (and not "semua"), only export that period column set */
  period?: string | null;
  filename?: string;
}

/**
 * Build export rows from raw indicator values (precision preserved in Nilai).
 * Null → empty cell — never coerced to 0.
 * Indikator column keeps the official source name.
 */
export function buildExportRows(options: ExportOptions): ExportRow[] {
  const { indicators, period } = options;
  const rows: ExportRow[] = [];

  for (const ind of indicators) {
    const values =
      period && period !== "semua"
        ? ind.values.filter((v) => v.period === period)
        : ind.values;

    for (const v of values) {
      rows.push({
        Indikator: ind.name,
        Kategori: ind.category,
        Periode: v.period,
        Nilai: v.value === null ? "" : v.value,
        Tampilan:
          v.value === null || v.status !== "available"
            ? ""
            : formatIndicatorValue(ind, v),
        Satuan: resolveDisplayUnit(ind) ?? ind.unit ?? "",
        Sumber: ind.source,
        Status: v.status,
      });
    }
  }

  return rows;
}

export function downloadIndicatorsExcel(options: ExportOptions): void {
  const rows = buildExportRows(options);
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Indikator");

  const stamp = new Date().toISOString().slice(0, 10);
  const filename =
    options.filename ?? `indikator-strategis-lombok-tengah-${stamp}.xlsx`;

  XLSX.writeFile(book, filename);
}
