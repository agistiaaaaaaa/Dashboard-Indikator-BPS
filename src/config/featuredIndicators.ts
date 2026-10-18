/**
 * Featured indicator IDs for KPI section.
 * Values come from the verified dataset — this file only selects which IDs to feature.
 * shortLabel is presentation-only and does not alter source names in explorer/export.
 */
export const FEATURED_INDICATORS = [
  {
    id: "sosial__jumlah-penduduk-ribu-jiwa",
    shortLabel: "Jumlah Penduduk",
  },
  {
    id: "ekonomi__laju-pdrb-atas-dasar-harga-konstan-2010-laju-pertumbuhan-ekonomi",
    shortLabel: "Pertumbuhan Ekonomi",
  },
  {
    id: "sosial__persentase-penduduk-miskin-p0",
    shortLabel: "Tingkat Kemiskinan (P0)",
  },
  {
    id: "sosial__tingkat-penganguran-terbuka-tpt",
    shortLabel: "Pengangguran Terbuka (TPT)",
  },
  {
    id: "sosial__ipm",
    shortLabel: "IPM",
  },
  {
    id: "sosial__tingkat-partisipasi-angkatan-kerja-tpak",
    shortLabel: "TPAK",
  },
] as const;

export const FEATURED_INDICATOR_IDS = FEATURED_INDICATORS.map((f) => f.id);

export type FeaturedIndicatorId = (typeof FEATURED_INDICATOR_IDS)[number];

export function getFeaturedShortLabel(id: string): string | null {
  return FEATURED_INDICATORS.find((f) => f.id === id)?.shortLabel ?? null;
}
