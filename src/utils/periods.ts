export type PeriodType = "annual" | "month_year" | "other";

export interface PeriodInfo {
  label: string;
  year: number | null;
  type: PeriodType;
  sortOrder: number;
}

const MONTHS: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

export function parsePeriod(label: string): PeriodInfo {
  const trimmed = label.trim();
  const yearOnly = /^(19|20)\d{2}$/.exec(trimmed);
  if (yearOnly) {
    const year = Number(trimmed);
    return { label: trimmed, year, type: "annual", sortOrder: year * 100 };
  }

  const monthYear = /^([A-Za-zÀ-ÿ]+)\s+((?:19|20)\d{2})$/.exec(trimmed);
  if (monthYear) {
    const monthName = monthYear[1].toLowerCase();
    const year = Number(monthYear[2]);
    const month = MONTHS[monthName] ?? 0;
    return {
      label: trimmed,
      year,
      type: month ? "month_year" : "other",
      sortOrder: year * 100 + month,
    };
  }

  const yearMatch = trimmed.match(/(19|20)\d{2}/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  return {
    label: trimmed,
    year,
    type: "other",
    sortOrder: year ? year * 100 : 0,
  };
}

export function comparePeriods(a: string, b: string): number {
  return parsePeriod(a).sortOrder - parsePeriod(b).sortOrder;
}

export function uniqueSortedPeriods(labels: string[]): string[] {
  return [...new Set(labels)].sort(comparePeriods);
}
