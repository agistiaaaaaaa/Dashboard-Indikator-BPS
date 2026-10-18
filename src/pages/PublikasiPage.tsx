import { Link } from "react-router-dom";

export function PublikasiPage() {
  return (
    <main>
      <header className="page-intro">
        <div className="page-intro-inner">
          <p className="eyebrow">Dokumen resmi</p>
          <h1>Publikasi Statistik</h1>
          <p className="lede">
            Temukan publikasi statistik resmi BPS Kabupaten Lombok Tengah.
          </p>
        </div>
      </header>

      <div className="page-body">
        <section className="panel publikasi-empty" aria-labelledby="publikasi-empty-title">
          <div className="publikasi-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                fill="currentColor"
                d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12h8v1.5H8V12Zm0 4h8v1.5H8V16Z"
              />
            </svg>
          </div>
          <h2 id="publikasi-empty-title">Publikasi segera tersedia</h2>
          <p>
            Katalog publikasi belum terhubung ke sumber data terverifikasi. Halaman ini
            disiapkan sebagai pintu akses resmi, tanpa daftar fiktif.
          </p>
          <p className="muted">
            Sementara itu, indikator strategis dapat dijelajahi melalui Dashboard dan Data
            Strategis.
          </p>
          <div className="home-cta-row">
            <Link to="/dashboard-indikator" className="btn btn-primary">
              Jelajahi Dashboard →
            </Link>
            <Link to="/data-strategis" className="btn btn-secondary">
              Lihat Data Strategis →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
