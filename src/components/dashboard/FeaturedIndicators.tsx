import { useMemo } from "react";
import { getFeaturedIndicators } from "../../services/indicatorService";
import { Icon } from "../ui/Icon";
import { EmptyState } from "./EmptyState";
import { IndicatorStatCard } from "./IndicatorStatCard";

interface FeaturedIndicatorsProps {
  category: string;
  period: string;
  onSelect: (id: string) => void;
  onBrowseAll?: () => void;
}

export function FeaturedIndicators({
  category,
  period,
  onSelect,
  onBrowseAll,
}: FeaturedIndicatorsProps) {
  const cards = useMemo(() => {
    const list = getFeaturedIndicators();
    return category === "semua" ? list : list.filter((i) => i.category === category);
  }, [category]);

  if (!cards.length) {
    return (
      <EmptyState
        title="Indikator utama tidak tersedia untuk filter ini."
        description="Ubah kategori atau lihat Eksplorasi Indikator."
      />
    );
  }

  return (
    <section className="section" aria-labelledby="featured-heading">
      <div className="section-head row-head">
        <div>
          <h2 id="featured-heading">Indikator Utama</h2>
          <p className="section-desc">Ringkasan indikator strategis pilihan.</p>
        </div>
        {onBrowseAll ? (
          <button type="button" className="text-link" onClick={onBrowseAll}>
            Lihat semua indikator
            <Icon name="arrow-right" size={14} />
          </button>
        ) : null}
      </div>
      <div className="stat-grid">
        {cards.map((ind) => (
          <IndicatorStatCard
            key={ind.id}
            indicator={ind}
            period={period === "semua" ? null : period}
            renderShell={(body) => (
              <button
                type="button"
                className="stat-card-hit"
                onClick={() => onSelect(ind.id)}
                aria-label={`Detail ${ind.name}`}
              >
                {body}
              </button>
            )}
          />
        ))}
      </div>
    </section>
  );
}
