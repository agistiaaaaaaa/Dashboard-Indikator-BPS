import { useNavigate } from "react-router-dom";
import { DashboardFilters } from "../components/dashboard/DashboardFilters";
import { EmptyState } from "../components/dashboard/EmptyState";
import { ErrorState } from "../components/dashboard/ErrorState";
import { IndicatorDetailDrawer } from "../components/dashboard/IndicatorDetailDrawer";
import { IndicatorExplorer } from "../components/dashboard/IndicatorExplorer";
import { LoadingSkeleton } from "../components/dashboard/LoadingSkeleton";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { getIndicators, isDataReady } from "../services/indicatorService";
import { useEffect, useState } from "react";

export function DataStrategisPage() {
  const navigate = useNavigate();
  const [boot, setBoot] = useState<"loading" | "ready" | "error">("loading");
  const {
    state,
    categories,
    periods,
    filteredIndicators,
    setFilter,
  } = useDashboardFilters();

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        if (!isDataReady()) setBoot("error");
        else setBoot("ready");
      } catch {
        setBoot("error");
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  if (boot === "loading") {
    return (
      <main className="page-body">
        <LoadingSkeleton />
      </main>
    );
  }

  if (boot === "error") {
    return (
      <main className="page-body">
        <ErrorState onRetry={() => window.location.reload()} />
      </main>
    );
  }

  const total = getIndicators().length;

  return (
    <main>
      <header className="page-intro">
        <div className="page-intro-inner">
          <p className="eyebrow">Inventaris data</p>
          <h1>Data Strategis</h1>
          <p className="lede">
            Katalog {total} indikator strategis terverifikasi. Cari, saring, dan buka detail
            tanpa meninggalkan direktori data.
          </p>
        </div>
      </header>

      <div className="page-body">
        <DashboardFilters
          categories={categories}
          periods={periods}
          category={state.category}
          period={state.period}
          query={state.query}
          onCategoryChange={(category) => setFilter({ category })}
          onPeriodChange={(period) => setFilter({ period })}
          onQueryChange={(query) => setFilter({ query })}
        />

        {!filteredIndicators.length ? (
          <EmptyState
            title="Tidak ada indikator yang sesuai"
            description="Coba ubah kategori, periode, atau kata pencarian."
          />
        ) : (
          <IndicatorExplorer
            indicators={filteredIndicators}
            period={state.period}
            title="Direktori Indikator"
            onOpenDetail={(id) => setFilter({ detailIndicatorId: id })}
            onSelectChart={(id) => {
              navigate(`/dashboard-indikator?chart=${encodeURIComponent(id)}`);
            }}
          />
        )}
      </div>

      <IndicatorDetailDrawer
        indicatorId={state.detailIndicatorId}
        period={state.period}
        onClose={() => setFilter({ detailIndicatorId: null })}
        onShowChart={(id) => {
          setFilter({ detailIndicatorId: null });
          navigate(`/dashboard-indikator?chart=${encodeURIComponent(id)}`);
        }}
      />
    </main>
  );
}
