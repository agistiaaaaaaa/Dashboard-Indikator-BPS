import { Link } from "react-router-dom";

/** Explicit denial UI when an authenticated user lacks role/permission. */
export function AccessDeniedPanel({
  title = "Akses ditolak",
  description = "Anda tidak memiliki izin untuk membuka halaman ini.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="workspace-panel" role="alert">
      <p className="eyebrow">Otorisasi</p>
      <h1>{title}</h1>
      <p className="workspace-lede">{description}</p>
      <p>
        <Link to="/workspace" className="btn btn-secondary">
          Kembali ke ringkasan
        </Link>
      </p>
    </section>
  );
}
