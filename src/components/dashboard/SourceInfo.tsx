import { getDataset, getLatestAnnualPeriod } from "../../services/indicatorService";

export function SourceInfo() {
  const dataset = getDataset();
  const latestAnnual = getLatestAnnualPeriod();

  return (
    <section className="source-bar" id="sumber" aria-labelledby="source-heading">
      <div className="source-bar-inner">
        <span className="source-glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              fill="currentColor"
              d="M5 3h10l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm9 1.5V8h3.5L14 4.5ZM7 11h10v1.5H7V11Zm0 3.5h10V16H7v-1.5Zm0 3.5h7V19.5H7V18Z"
            />
          </svg>
        </span>
        <div>
          <h2 id="source-heading">Sumber Data: {dataset.meta.provider}</h2>
          <p>
            Dataset indikator strategis bersumber dari lembar {dataset.meta.primarySheet} pada{" "}
            {dataset.meta.title}. Nilai kosong dibiarkan kosong dan tidak diisi nol atau estimasi.
            {latestAnnual ? ` Periode tahunan tersedia hingga ${latestAnnual}.` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
