import { useEffect, useId, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../auth";
import { useSearchUi } from "./SiteLayout";

const NAV_ITEMS = [
  { to: "/", label: "Beranda", end: true },
  { to: "/dashboard-indikator", label: "Dashboard", end: true },
  { to: "/data-strategis", label: "Data Strategis", end: true },
  { to: "/publikasi", label: "Publikasi", end: true },
] as const;

export function SiteNav() {
  const { openSearch } = useSearchUi();
  const { ready, authenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const workspaceHref =
    ready && authenticated ? "/workspace" : "/login";

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link to="/" className="site-brand" onClick={() => setMenuOpen(false)}>
          <img
            src="/branding/bps-logo.svg"
            alt="Logo Badan Pusat Statistik"
            className="site-logo"
            width={40}
            height={40}
          />
          <div className="site-brand-text">
            <span className="site-brand-title">Badan Pusat Statistik</span>
            <span className="site-brand-sub">Kabupaten Lombok Tengah</span>
          </div>
        </Link>

        <nav className="site-links site-links-desktop" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "site-link active" : "site-link")}
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={workspaceHref}
            className="site-link site-link-workspace"
            title="Masuk ke ruang kerja internal BPS"
          >
            Akses Ruang Kerja
          </Link>
        </nav>

        <div className="site-nav-actions">
          <button
            type="button"
            className="site-search"
            aria-label="Buka pencarian indikator"
            onClick={openSearch}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4 4a1 1 0 0 1-1.4 1.4l-4-4A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
              />
            </svg>
          </button>

          <button
            type="button"
            className="site-menu-toggle"
            aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="site-menu-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="site-mobile-menu" id={menuId}>
          <nav className="site-links site-links-mobile" aria-label="Navigasi mobile">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? "site-link active" : "site-link")}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to={workspaceHref}
              className="site-link site-link-workspace"
              onClick={() => setMenuOpen(false)}
              title="Masuk ke ruang kerja internal BPS"
            >
              Akses Ruang Kerja
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
