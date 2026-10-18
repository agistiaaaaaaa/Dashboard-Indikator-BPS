import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page-body">
      <section className="panel not-found" aria-labelledby="not-found-title">
        <p className="eyebrow">404</p>
        <h1 id="not-found-title">Halaman tidak ditemukan</h1>
        <p className="lede">
          Alamat yang Anda buka tidak tersedia. Periksa URL atau kembali ke beranda.
        </p>
        <div className="home-cta-row">
          <Link to="/" className="btn btn-primary">
            Kembali ke Beranda →
          </Link>
          <Link to="/dashboard-indikator" className="btn btn-secondary">
            Buka Dashboard →
          </Link>
        </div>
      </section>
    </main>
  );
}
