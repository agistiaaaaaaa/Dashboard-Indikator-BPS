import { Link } from "react-router-dom";

const LINKS = [
  { to: "/dashboard-indikator", label: "Dashboard" },
  { to: "/data-strategis", label: "Data Strategis" },
  { to: "/publikasi", label: "Publikasi" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img src="/branding/bps-logo.svg" alt="" width={32} height={32} />
          <div>
            <p className="site-footer-name">Badan Pusat Statistik</p>
            <p className="site-footer-unit">Kabupaten Lombok Tengah</p>
          </div>
        </div>

        <nav className="site-footer-nav" aria-label="Tautan footer">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
          <Link to="/login" className="site-footer-login">
            Ruang Kerja
          </Link>
        </nav>
      </div>
      <p className="site-footer-legal">
        © {year} BPS Kabupaten Lombok Tengah. Data bersumber dari rilis resmi BPS.
      </p>
    </footer>
  );
}
