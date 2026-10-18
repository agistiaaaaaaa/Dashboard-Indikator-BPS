import { useEffect, useMemo, useState } from "react";
import type { Indicator } from "../../services/indicatorService";
import {
  getIndicatorTrend,
  getIndicatorValueAtPeriod,
} from "../../services/indicatorService";
import {
  formatIndicatorValue,
  getDisplayName,
  resolveDisplayUnit,
} from "../../utils/format";
import { EmptyState } from "./EmptyState";

interface IndicatorExplorerProps {
  indicators: Indicator[];
  period: string;
  onOpenDetail: (id: string) => void;
  onSelectChart: (id: string) => void;
  title?: string;
  description?: string;
}

export function IndicatorExplorer({
  indicators,
  period,
  onOpenDetail,
  onSelectChart,
  title = "Eksplorasi Indikator",
  description,
}: IndicatorExplorerProps) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<"name" | "category">("name");

  useEffect(() => {
    setPage(0);
  }, [indicators, period, sort, pageSize]);

  const sorted = useMemo(() => {
    const list = [...indicators];
    list.sort((a, b) => {
      if (sort === "category") {
        const c = a.category.localeCompare(b.category, "id");
        return c !== 0 ? c : a.name.localeCompare(b.name, "id");
      }
      return a.name.localeCompare(b.name, "id");
    });
    return list;
  }, [indicators, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const slice = sorted.slice(start, start + pageSize);
  const end = Math.min(sorted.length, start + slice.length);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (pageCount <= maxButtons) {
      return Array.from({ length: pageCount }, (_, i) => i);
    }
    const startIdx = Math.max(0, Math.min(safePage - 2, pageCount - maxButtons));
    return Array.from({ length: maxButtons }, (_, i) => startIdx + i);
  }, [pageCount, safePage]);

  if (!indicators.length) {
    return (
      <section className="section panel" id="explorer" aria-labelledby="explorer-heading">
        <h2 id="explorer-heading">{title}</h2>
        <EmptyState
          title="Tidak ada indikator yang sesuai"
          description="Coba ubah kategori, periode, atau kata pencarian."
        />
      </section>
    );
  }

  return (
    <section className="section panel explorer-panel" id="explorer" aria-labelledby="explorer-heading">
      <div className="section-head row-head">
        <div>
          <h2 id="explorer-heading">{title}</h2>
          <p className="section-desc">
            {description ?? `Menampilkan ${start + 1} sampai ${end} dari ${indicators.length} indikator`}
          </p>
        </div>
        <div className="explorer-controls">
          <label className="field compact">
            <span className="field-label">Urutkan</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "name" | "category")}
              aria-label="Urutkan indikator"
            >
              <option value="name">Nama (A ke Z)</option>
              <option value="category">Kategori</option>
            </select>
          </label>
          <label className="field compact">
            <span className="field-label">Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Jumlah baris per halaman"
            >
              <option value={10}>10 data</option>
              <option value={12}>12 data</option>
              <option value={20}>20 data</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-wrap" role="region" aria-label="Tabel indikator" tabIndex={0}>
        <table className="data-table premium-table">
          <thead>
            <tr>
              <th scope="col">Indikator</th>
              <th scope="col">Kategori</th>
              <th scope="col" className="num">
                Nilai
              </th>
              <th scope="col">Satuan</th>
              <th scope="col" className="center">
                Periode
              </th>
              <th scope="col">Perubahan</th>
              <th scope="col" className="actions-col">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {slice.map((ind) => {
              const point = getIndicatorValueAtPeriod(
                ind,
                period === "semua" ? null : period
              );
              const trend = getIndicatorTrend(ind.id, period === "semua" ? null : period);
              const unit = resolveDisplayUnit(ind);
              return (
                <tr key={ind.id}>
                  <td>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => onOpenDetail(ind.id)}
                      title={ind.name}
                    >
                      {getDisplayName(ind, unit)}
                    </button>
                  </td>
                  <td>
                    <span className="chip">{ind.category}</span>
                  </td>
                  <td className="num">
                    {point ? formatIndicatorValue(ind, point) : ""}
                  </td>
                  <td>{unit ?? ""}</td>
                  <td className="center">
                    {point?.period ?? (period !== "semua" ? period : "")}
                  </td>
                  <td>
                    {trend ? (
                      <span className={`trend-${trend.direction}`}>{trend.label}</span>
                    ) : (
                      <span className="muted" />
                    )}
                  </td>
                  <td className="actions-col">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={() => onOpenDetail(ind.id)}
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={() => onSelectChart(ind.id)}
                      >
                        Grafik
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Sebelumnya
          </button>
          <div className="page-numbers" role="navigation" aria-label="Halaman">
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                className={n === safePage ? "page-num active" : "page-num"}
                onClick={() => setPage(n)}
                aria-current={n === safePage ? "page" : undefined}
              >
                {n + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Berikutnya
          </button>
        </div>
      ) : null}
    </section>
  );
}
