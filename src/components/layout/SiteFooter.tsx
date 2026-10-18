import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>BPS Kabupaten Lombok Tengah, Dashboard Indikator Strategis</p>
      <p className="site-footer-access">
        <Link to="/login" className="site-footer-login">
          Akses Ruang Kerja
        </Link>
      </p>
    </footer>
  );
}
