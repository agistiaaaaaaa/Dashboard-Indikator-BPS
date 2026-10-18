import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { getFeaturedIndicators, isDataReady } from "../services/indicatorService";
import { CategoryOverview } from "../components/dashboard/CategoryOverview";
import { DashboardFilters } from "../components/dashboard/DashboardFilters";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { ErrorState } from "../components/dashboard/ErrorState";
import { ExportButton } from "../components/dashboard/ExportButton";
import { FeaturedIndicators } from "../components/dashboard/FeaturedIndicators";
import { IndicatorDetailDrawer } from "../components/dashboard/IndicatorDetailDrawer";
import { IndicatorExplorer } from "../components/dashboard/IndicatorExplorer";
import { LoadingSkeleton } from "../components/dashboard/LoadingSkeleton";
import { SourceInfo } from "../components/dashboard/SourceInfo";

const TrendChart = lazy(async () => {
  const mod = await import("../components/dashboard/TrendChart");
  return { default: mod.TrendChart };
});

export function DashboardIndikatorPage() {
  const [boot, setBoot] = useState<"loading" | "ready" | "error">("loading");
  const {
    state,
    filters,
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
    }, 120);
    return () => window.clearTimeout(t);
  }, []);

  const chartPool = filteredIndicators.length
    ? filteredIndicators
    : getFeaturedIndicators();

  const chartId = useMemo(() => {
    if (state.chartIndicatorId && chartPool.some((i) => i.id === state.chartIndicatorId)) {
      return state.chartIndicatorId;
    }
    return chartPool[0]?.id ?? null;
  }, [state.chartIndicatorId, chartPool]);

  if (boot === "loading") {
    return (
      <main>
        <DashboardHeader />
        <div className="page-body">
          <LoadingSkeleton />
        </div>
      </main>
    );
  }

  if (boot === "error") {
    return (
      <main>
        <DashboardHeader />
        <div className="page-body">
          <ErrorState onRetry={() => window.location.reload()} />
        </div>
      </main>
    );
  }

  return (
    <main>
      <DashboardHeader />

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
          exportSlot={
            <ExportButton filters={filters} disabled={!filteredIndicators.length} />
          }
        />

        <FeaturedIndicators
          category={state.category}
          period={state.period}
          onSelect={(id) => setFilter({ detailIndicatorId: id, chartIndicatorId: id })}
          onBrowseAll={() =>
            document.getElementById("explorer")?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <div className="mid-grid">
          <Suspense
            fallback={
              <div className="panel section" style={{ padding: "1.25rem 1.5rem" }}>
                <LoadingSkeleton />
              </div>
            }
          >
            <TrendChart
              indicators={chartPool}
              selectedId={chartId}
              onSelect={(id) => setFilter({ chartIndicatorId: id })}
            />
          </Suspense>

          <CategoryOverview
            activeCategory={state.category}
            onSelect={(category) => setFilter({ category })}
          />
        </div>

        <IndicatorExplorer
          indicators={filteredIndicators}
          period={state.period}
          onOpenDetail={(id) => setFilter({ detailIndicatorId: id })}
          onSelectChart={(id) => {
            setFilter({ chartIndicatorId: id });
            document.getElementById("trend-heading")?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <SourceInfo />
      </div>

      <IndicatorDetailDrawer
        indicatorId={state.detailIndicatorId}
        period={state.period}
        onClose={() => setFilter({ detailIndicatorId: null })}
        onShowChart={(id) => {
          setFilter({ chartIndicatorId: id });
          document.getElementById("trend-heading")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </main>
  );
}
