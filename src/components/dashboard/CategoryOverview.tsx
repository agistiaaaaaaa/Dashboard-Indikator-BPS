import { getCategorySummaries } from "../../services/indicatorService";

interface CategoryOverviewProps {
  activeCategory: string;
  onSelect: (category: string) => void;
}

const CATEGORY_BLURB: Record<string, string> = {
  Sosial:
    "Kependudukan, ketenagakerjaan, pendidikan, kesehatan, kemiskinan, dan indikator sosial lainnya.",
  Ekonomi:
    "Pertumbuhan ekonomi, PDRB, inflasi, dan indikator ekonomi utama lainnya.",
};

export function CategoryOverview({ activeCategory, onSelect }: CategoryOverviewProps) {
  const summaries = getCategorySummaries();

  return (
    <section className="section category-section" aria-labelledby="category-heading">
      <div className="section-head">
        <h2 id="category-heading">Ringkasan Kategori</h2>
        <p className="section-desc">Jumlah dihitung dari dataset terverifikasi.</p>
      </div>
      <div className="category-stack">
        {summaries.map((s) => (
          <button
            key={s.category}
            type="button"
            className={
              activeCategory === s.category ? "category-card active" : "category-card"
            }
            onClick={() => onSelect(s.category)}
          >
            <span className="category-icon" aria-hidden="true">
              {s.category === "Ekonomi" ? (
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M4 19h16v2H4v-2Zm1-2 4-6 3 4 4-7 4 5v-2.5l-4-5-4.2 7.4L9 9.5 5 15.5V17Z"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 9a7 7 0 0 1 14 0v1H5v-1Z"
                  />
                </svg>
              )}
            </span>
            <span className="category-body">
              <span className="category-name">{s.category}</span>
              <span className="category-count">{s.count} indikator</span>
              <span className="category-blurb">
                {CATEGORY_BLURB[s.category] ?? "Indikator strategis pada kategori ini."}
              </span>
            </span>
            <span className="category-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
