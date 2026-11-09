import { getDataset, getLatestAnnualPeriod } from "../../services/indicatorService";

export function DashboardHeader() {
  const dataset = getDataset();
  const latestAnnual = getLatestAnnualPeriod();

  return (
    <section className="hero" id="top" aria-labelledby="page-title">
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">BPS Kabupaten Lombok Tengah</p>
          <h1 id="page-title">Dashboard Indikator Strategis</h1>
          <p className="lede">
            Telusuri seluruh indikator berdasarkan kategori, periode, atau nama.
            Pilih indikator untuk melihat deret waktu dan rincian sumbernya.
          </p>
        </div>

        <dl className="hero-meta" aria-label="Informasi ketersediaan data">
          <div>
            <dt>Sumber</dt>
            <dd>{dataset.meta.provider}</dd>
          </div>
          <div>
            <dt>Data hingga</dt>
            <dd>{latestAnnual ?? "Bervariasi"}</dd>
          </div>
          <div>
            <dt>Nilai kosong</dt>
            <dd>Tidak diisi nol</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
