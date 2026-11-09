import { Link } from "react-router-dom";
import { ErrorState } from "../components/dashboard/ErrorState";
import { HeroInsight } from "../components/dashboard/HeroInsight";
import { IndicatorStatCard } from "../components/dashboard/IndicatorStatCard";
import { Icon } from "../components/ui/Icon";
import {
  getCategorySummaries,
  getFeaturedIndicators,
  getIndicators,
  getLatestAnnualPeriod,
  isDataReady,
} from "../services/indicatorService";

export function HomePage() {
  const ready = isDataReady();
  const featured = ready ? getFeaturedIndicators() : [];
  const summaries = ready ? getCategorySummaries() : [];
  const total = ready ? getIndicators().length : 0;
  const latestAnnual = ready ? getLatestAnnualPeriod() : null;

  const entries = [
    {
      to: "/dashboard-indikator",
      kicker: "Analisis",
      title: "Dashboard indikator",
      body: "Tren, perbandingan antarperiode, dan eksplorasi interaktif seluruh indikator.",
      action: "Buka dashboard",
    },
    {
      to: "/data-strategis",
      kicker: "Katalog",
      title: "Data strategis",
      body: `${summaries.map((s) => `${s.count} indikator ${s.category.toLowerCase()}`).join(" dan ")}, lengkap dengan sumber dan periode.`,
      action: "Telusuri katalog",
    },
    {
      to: "/publikasi",
      kicker: "Dokumen",
      title: "Publikasi",
      body: "Rilis dan publikasi statistik resmi BPS Kabupaten Lombok Tengah.",
      action: "Lihat publikasi",
    },
  ];

  return (
    <main>
      <section className="home-hero" aria-labelledby="home-title">
        <img src="/landing/hero-lombok.png" alt="" className="home-hero-img" aria-hidden="true" />
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <p className="eyebrow eyebrow-on-dark">BPS Kabupaten Lombok Tengah</p>
            <h1 id="home-title">Indikator strategis untuk perencanaan pembangunan daerah</h1>
            <p className="home-lede">
              Angka resmi kependudukan, kesejahteraan, dan ekonomi Kabupaten Lombok Tengah,
              disajikan apa adanya tanpa estimasi atau interpolasi.
            </p>
            <div className="home-cta-row">
              <Link to="/dashboard-indikator" className="btn btn-on-dark">
                Buka dashboard
                <Icon name="arrow-right" />
              </Link>
              <Link to="/data-strategis" className="btn btn-ghost-on-dark">
                Katalog data strategis
              </Link>
            </div>
            {ready ? (
              <dl className="home-facts">
                <div>
                  <dt>Indikator terverifikasi</dt>
                  <dd>{total}</dd>
                </div>
                {latestAnnual ? (
                  <div>
                    <dt>Periode terbaru</dt>
                    <dd>{latestAnnual}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Kategori</dt>
                  <dd>{summaries.length}</dd>
                </div>
              </dl>
            ) : null}
          </div>
          {ready ? <HeroInsight /> : null}
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
                    Nilai terbaru dari dataset resmi. Warna perubahan menunjukkan membaik atau
                    memburuk, bukan naik atau turun.
                  </p>
                </div>
                <Link to="/dashboard-indikator" className="text-link">
                  Semua indikator
                  <Icon name="arrow-right" size={14} />
                </Link>
              </div>
              <div className="stat-grid">
                {featured.map((ind) => (
                  <IndicatorStatCard
                    key={ind.id}
                    indicator={ind}
                    period={null}
                    renderShell={(body) => (
                      <Link
                        to={`/dashboard-indikator?detail=${encodeURIComponent(ind.id)}`}
                        className="stat-card-hit"
                      >
                        {body}
                      </Link>
                    )}
                  />
                ))}
              </div>
            </section>

            <nav className="home-entries" aria-label="Layanan data">
              {entries.map((entry) => (
                <Link key={entry.to} to={entry.to} className="home-entry">
                  <span className="home-entry-kicker">{entry.kicker}</span>
                  <h2>{entry.title}</h2>
                  <p>{entry.body}</p>
                  <span className="home-entry-action">
                    {entry.action}
                    <Icon name="arrow-right" size={14} />
                  </span>
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </main>
  );
}
