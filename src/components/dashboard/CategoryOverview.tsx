import { getCategorySummaries } from "../../services/indicatorService";
import { Icon } from "../ui/Icon";

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
  const total = summaries.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <section className="section category-section" aria-labelledby="category-heading">
      <div className="section-head">
        <h2 id="category-heading">Ringkasan Kategori</h2>
        <p className="section-desc">
          Pilih kategori untuk menyaring seluruh halaman. Jumlah dihitung dari dataset
          terverifikasi.
        </p>
      </div>
      <div className="category-stack">
        {summaries.map((s) => {
          const share = Math.round((s.count / total) * 100);
          const active = activeCategory === s.category;
          return (
            <button
              key={s.category}
              type="button"
              className={active ? "category-card active" : "category-card"}
              aria-pressed={active}
              onClick={() => onSelect(s.category)}
            >
              <span className="category-top">
                <span className="category-name">{s.category}</span>
                <Icon name="chevron-right" size={18} className="category-arrow" />
              </span>
              <span className="category-count">
                <strong>{s.count}</strong> indikator · {share}% dari total
              </span>
              <span className="category-meter" aria-hidden="true">
                <span style={{ width: `${share}%` }} />
              </span>
              <span className="category-blurb">
                {CATEGORY_BLURB[s.category] ?? "Indikator strategis pada kategori ini."}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
