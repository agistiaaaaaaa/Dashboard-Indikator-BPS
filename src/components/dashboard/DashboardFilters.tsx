import type { ReactNode } from "react";

interface DashboardFiltersProps {
  categories: string[];
  periods: string[];
  category: string;
  period: string;
  query: string;
  onCategoryChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  exportSlot?: ReactNode;
}

export function DashboardFilters({
  categories,
  periods,
  category,
  period,
  query,
  onCategoryChange,
  onPeriodChange,
  onQueryChange,
  exportSlot,
}: DashboardFiltersProps) {
  return (
    <section className="filter-bar" aria-label="Filter dashboard">
      <div className="filter-bar-grid">
        <label className="field">
          <span className="field-label">Kategori</span>
          <div className="field-control">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter kategori"
            >
              <option value="semua">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="field">
          <span className="field-label">Periode</span>
          <div className="field-control">
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              aria-label="Filter periode"
            >
              <option value="semua">Semua Periode</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="field field-grow">
          <span className="field-label">Cari indikator</span>
          <div className="field-control with-icon">
            <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4 4a1 1 0 0 1-1.4 1.4l-4-4A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Ketik nama indikator…"
              aria-label="Cari indikator"
              autoComplete="off"
            />
          </div>
        </label>

        {exportSlot ? <div className="filter-export">{exportSlot}</div> : null}
      </div>
    </section>
  );
}
