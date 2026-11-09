/**
 * Data identitas Capstone. Ini satu-satunya tempat yang perlu diedit sebelum
 * pengumpulan; ketiga dokumen (Proposal, Laporan Kemajuan, Laporan Akhir)
 * membaca nilai dari sini. Isian kosong dicetak sebagai placeholder bertanda
 * kurung siku, sesuai contoh pada Panduan Capstone Project.
 */

export const MEMBERS = [
  { name: "Baiq Agestia Cahya Ilami", nim: "TI21240005" },
  { name: "Agus Muliadi", nim: "" },
  { name: "M. Fahrurrozi", nim: "" },
  { name: "Jizia Farhani Fikri", nim: "" },
];

/** Dosen pengampu mata kuliah Capstone Project. */
export const LECTURER = "Sofiansyah Fadli, S.Kom., M.Kom.";

/** Kota penandatanganan, misalnya "Praya". */
export const PLACE = "Praya";

/** Tanggal penandatanganan per dokumen, misalnya "12 Oktober 2026". */
export const SIGN_DATES = {
  proposal: "1 November 2026",
  kemajuan: "1 November 2026",
  akhir: "1 November 2026",
};

/** Tautan luaran Tugas 3 (Laporan Akhir, Lampiran C). */
export const LINKS = {
  repository: "",
  video: "",
  presentation: "",
  poster: "",
  usageLetter: "",
};

/** Hasil uji terakhir yang benar-benar dijalankan (npm run test / test:browser). */
export const TEST_RESULTS = {
  ranOn: "10 November 2026",
  api: { passed: 47, total: 47 },
  browser: { passed: 64, total: 64 },
};

export const YEAR = "2026";

export const TITLE_FULL =
  "Dashboard Indikator Strategis Badan Pusat Statistik Kabupaten Lombok Tengah";
export const TITLE_SHORT = "Dashboard Indikator Strategis BPS Kabupaten Lombok Tengah";

const orPlaceholder = (value, placeholder) => (value?.trim() ? value.trim() : `[${placeholder}]`);

export function memberList() {
  return MEMBERS.map((m, i) => ({
    name: orPlaceholder(m.name, `Nama Anggota ${i + 1}`),
    nim: orPlaceholder(m.nim, "NIM"),
  }));
}

export const lecturer = () => orPlaceholder(LECTURER, "Nama Dosen Pengampu");
export const place = () => orPlaceholder(PLACE, "Tempat");
export const signDate = (kind) => orPlaceholder(SIGN_DATES[kind], "Tanggal");
export const link = (key, label) => orPlaceholder(LINKS[key], `Tautan ${label}`);
