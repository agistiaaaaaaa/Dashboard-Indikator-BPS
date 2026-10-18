import { getDataset, getLatestAnnualPeriod } from "../../services/indicatorService";

export function DashboardHeader() {
  const dataset = getDataset();
  const latestAnnual = getLatestAnnualPeriod();

  return (
    <section className="hero" id="top" aria-labelledby="page-title">
      <div className="hero-media" aria-hidden="true">
        <img src="/landing/hero-lombok.png" alt="" className="hero-img" />
        <div className="hero-scrim" />
      </div>

      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">BPS Kabupaten Lombok Tengah</p>
          <h1 id="page-title">
            Dashboard Indikator
            <span className="hero-title-break">Strategis</span>
          </h1>
          <p className="lede">
            Indikator strategis Kabupaten Lombok Tengah berdasarkan data resmi BPS.
            Gunakan filter kategori, periode, dan pencarian untuk menelusuri seluruh inventaris.
          </p>

          <ul className="hero-meta" aria-label="Informasi ketersediaan data">
            <li>
              <MetaIcon type="source" />
              <span>
                <strong>Sumber</strong>
                <em>{dataset.meta.provider}</em>
              </span>
            </li>
            <li>
              <MetaIcon type="period" />
              <span>
                <strong>Data tersedia hingga</strong>
                <em>{latestAnnual ?? "bervariasi per indikator"}</em>
              </span>
            </li>
            <li>
              <MetaIcon type="note" />
              <span>
                <strong>Nilai kosong</strong>
                <em>dibiarkan kosong, bukan nol</em>
              </span>
            </li>
          </ul>
        </div>

        <p className="hero-quote" aria-hidden="true">
          Data untuk Pembangunan Daerah yang Lebih Baik
        </p>
      </div>
    </section>
  );
}

function MetaIcon({ type }: { type: "source" | "period" | "note" }) {
  if (type === "source") {
    return (
      <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12h8v1.5H8V12Zm0 4h8v1.5H8V16Z"
        />
      </svg>
    );
  }
  if (type === "period") {
    return (
      <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 3h1.5v2H15V3H16.5v2H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V3Zm12 7.5H5V19h14V10.5Z"
        />
      </svg>
    );
  }
  return (
    <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-.75 5.5h1.5v1.5h-1.5V7.5Zm0 3h1.5V17h-1.5v-6.5Z"
      />
    </svg>
  );
}
