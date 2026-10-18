import { Link } from "react-router-dom";
import { getFeaturedShortLabel } from "../config/featuredIndicators";
import { ErrorState } from "../components/dashboard/ErrorState";
import {
  getCategorySummaries,
  getFeaturedIndicators,
  getIndicatorTrend,
  getIndicatorValueAtPeriod,
  getIndicators,
  getLatestAnnualPeriod,
  isDataReady,
} from "../services/indicatorService";
import { formatIndicatorValue, resolveDisplayUnit } from "../utils/format";

export function HomePage() {
  const ready = isDataReady();
  const featured = ready ? getFeaturedIndicators() : [];
  const summaries = ready ? getCategorySummaries() : [];
  const total = ready ? getIndicators().length : 0;
  const latestAnnual = ready ? getLatestAnnualPeriod() : null;

  return (
    <main>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-media" aria-hidden="true">
          <img src="/landing/hero-lombok.png" alt="" className="home-hero-img" />
          <div className="home-hero-scrim" />
        </div>
        <div className="home-hero-inner">
          <p className="eyebrow">BPS Kabupaten Lombok Tengah</p>
          <h1 id="home-title">
            Data untuk pembangunan daerah
            <span className="hero-title-break">yang lebih baik.</span>
          </h1>
          <p className="lede home-lede">
            Platform indikator strategis resmi Kabupaten Lombok Tengah. Telusuri
            inventaris data, analisis tren, dan akses katalog indikator dari satu
            pintu.
          </p>
          <div className="home-cta-row">
            <Link to="/dashboard-indikator" className="btn btn-primary">
              Jelajahi Dashboard →
            </Link>
            <Link to="/data-strategis" className="btn btn-secondary">
              Lihat Data Strategis →
            </Link>
          </div>
          {ready ? (
            <ul className="home-meta-row" aria-label="Ringkasan data">
              <li>
                <strong>{total}</strong>
                <span>indikator terverifikasi</span>
              </li>
              {latestAnnual ? (
                <li>
                  <strong>{latestAnnual}</strong>
                  <span>periode tahunan tersedia</span>
                </li>
              ) : null}
              <li>
                <strong>Resmi</strong>
                <span>data BPS Loteng</span>
              </li>
            </ul>
          ) : null}
        </div>
      </section>

      <div className="page-body">
        {!ready ? (
          <section className="section">
            <ErrorState onRetry={() => window.location.reload()} />
          </section>
        ) : (
          <>
            <section className="section" aria-labelledby="home-overview">
              <div className="section-head row-head">
                <div>
                  <h2 id="home-overview">Ringkasan indikator utama</h2>
                  <p className="section-desc">
                    Nilai terbaru dari dataset resmi, tanpa estimasi atau interpolasi.
                  </p>
                </div>
                <Link to="/dashboard-indikator" className="text-link">
                  Buka Dashboard →
                </Link>
              </div>
              <div className="home-stat-grid">
                {featured.map((ind) => {
                  const point = getIndicatorValueAtPeriod(ind, null);
                  const unit = resolveDisplayUnit(ind);
                  const trend = getIndicatorTrend(ind.id, null);
                  const title = getFeaturedShortLabel(ind.id) ?? ind.name;
                  return (
                    <Link
                      key={ind.id}
                      to={`/dashboard-indikator?detail=${encodeURIComponent(ind.id)}`}
                      className="home-stat-card"
                    >
                      <h3>{title}</h3>
                      <p className="home-stat-value">
                        {point ? (
                          <>
                            <span className="kpi-number">
                              {formatIndicatorValue(ind, point)}
                            </span>
                            {unit ? <span className="kpi-unit">{unit}</span> : null}
                          </>
                        ) : (
                          <span className="muted">Data belum tersedia</span>
                        )}
                      </p>
                      <p className="home-stat-period">
                        {point?.period ? `Periode ${point.period}` : ""}
                      </p>
                      {trend ? (
                        <p className={`home-stat-trend trend-${trend.direction}`}>
                          {trend.label}
                        </p>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="section home-entry-grid" aria-label="Pintu masuk layanan">
              <Link to="/dashboard-indikator" className="home-entry-card">
                <span className="home-entry-kicker">Analisis</span>
                <h2>Dashboard</h2>
                <p>
                  Visualisasi tren, KPI, dan eksplorasi interaktif indikator strategis.
                </p>
                <span className="text-link">Masuk Dashboard →</span>
              </Link>
              <Link to="/data-strategis" className="home-entry-card">
                <span className="home-entry-kicker">Katalog</span>
                <h2>Data Strategis</h2>
                <p>
                  {summaries.map((s) => `${s.count} ${s.category}`).join(", ")}.
                  Jelajahi inventaris lengkap.
                </p>
                <span className="text-link">Buka katalog →</span>
              </Link>
              <Link to="/publikasi" className="home-entry-card">
                <span className="home-entry-kicker">Dokumen</span>
                <h2>Publikasi</h2>
                <p>Publikasi statistik resmi akan tersedia pada halaman ini.</p>
                <span className="text-link">Lihat Publikasi →</span>
              </Link>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
